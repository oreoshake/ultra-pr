import { parsePrUrl } from "./pr-url.js";
import { syncPartner } from "./sync.js";

// tabId -> PR key we've already paired for that tab. Kept in session storage
// so a service worker restart doesn't re-open splits the user already dismissed.
const HANDLED_KEY = "handledTabs";

// tabId -> tabId of the split partner Ultra PR opened with it, in both
// directions. Only these splits are kept in sync; splits the user made
// themselves are left alone.
const PAIRS_KEY = "pairedTabs";

// Guards the check-then-set above against back-to-back URL updates
// (e.g. GitHub redirecting /files to /changes).
const pending = new Set();

async function getMap(key) {
  const { [key]: map = {} } = await chrome.storage.session.get(key);
  return map;
}

async function setHandled(tabId, prKey) {
  const handled = await getMap(HANDLED_KEY);
  if (prKey === undefined) delete handled[tabId];
  else handled[tabId] = prKey;
  await chrome.storage.session.set({ [HANDLED_KEY]: handled });
}

async function setPair(a, b) {
  const pairs = await getMap(PAIRS_KEY);
  pairs[a] = b;
  pairs[b] = a;
  await chrome.storage.session.set({ [PAIRS_KEY]: pairs });
}

async function forgetPair(tabId) {
  const pairs = await getMap(PAIRS_KEY);
  const partnerId = pairs[tabId];
  if (partnerId === undefined) return;
  delete pairs[tabId];
  if (pairs[partnerId] === tabId) delete pairs[partnerId];
  await chrome.storage.session.set({ [PAIRS_KEY]: pairs });
}

function inSplit(tab) {
  return tab.splitViewId !== undefined && tab.splitViewId !== chrome.tabs.SPLIT_VIEW_ID_NONE;
}

// Where the tab is (or is about to be). pendingUrl covers a tab we just created
// or navigated that hasn't committed yet. Both are undefined once the tab is on
// a site outside our host permissions.
function tabUrl(tab) {
  return tab.pendingUrl ?? tab.url;
}

async function pairPrTab(tab) {
  const pr = parsePrUrl(tab.url);
  if (!pr) return;

  // Pinned tabs can't share a split with the unpinned tab we'd create.
  if (tab.pinned) return;
  if (inSplit(tab)) return;

  // Only pair once per PR per tab: if the user separates the split and keeps
  // browsing the same PR, leave them alone.
  const pendingKey = `${tab.id}:${pr.key}`;
  if (pending.has(pendingKey)) return;
  pending.add(pendingKey);
  try {
    const handled = await getMap(HANDLED_KEY);
    if (handled[tab.id] === pr.key) return;
    await setHandled(tab.id, pr.key);
  } finally {
    pending.delete(pendingKey);
  }

  // Conversation always goes on the left, Files changed on the right.
  const viewingFiles = pr.view === "files";
  const partner = await chrome.tabs.create({
    url: viewingFiles ? pr.conversationUrl : pr.filesUrl,
    index: viewingFiles ? tab.index : tab.index + 1,
    windowId: tab.windowId,
    splitWithTabId: tab.id,
    active: false,
  });
  await setHandled(partner.id, pr.key);
  await setPair(tab.id, partner.id);
}

// One side of an Ultra PR split navigated: follow it to the same PR in the
// other pane, or close the other pane if it left the PR.
async function syncSplit(tab) {
  const pairs = await getMap(PAIRS_KEY);
  const partnerId = pairs[tab.id];
  if (partnerId === undefined) return false;

  let partner;
  try {
    partner = await chrome.tabs.get(partnerId);
  } catch {
    await forgetPair(tab.id);
    return false;
  }
  // The user separated the split (or moved one side into another): stop syncing.
  if (!inSplit(tab) || partner.splitViewId !== tab.splitViewId) {
    await forgetPair(tab.id);
    return false;
  }

  const result = syncPartner(tabUrl(tab), tabUrl(partner));
  if (result.action === "navigate") {
    await chrome.tabs.update(partnerId, { url: result.url });
    await setHandled(tab.id, result.pr.key);
    await setHandled(partnerId, result.pr.key);
  } else if (result.action === "close") {
    await forgetPair(tab.id);
    // We closed the split, the user didn't dismiss it, so coming back to the
    // PR in this tab should pair it again.
    await setHandled(tab.id, undefined);
    await chrome.tabs.remove(partnerId);
  }
  return true;
}

async function onTabNavigated(tab) {
  if (await syncSplit(tab)) return;
  await pairPrTab(tab);
}

// Handle events one at a time so a navigation and the partner updates it
// causes can't interleave and send the two tabs chasing each other.
let queue = Promise.resolve();

function enqueue(label, task) {
  queue = queue.then(task).catch((error) => console.warn(`Ultra PR: could not ${label}`, error));
}

// How long to wait after a split dissolves before deciding the user separated
// it. Closing one side of a split also dissolves it, and Chrome may report that
// before it reports the tab closing; by then onRemoved has handled the pair.
const SEPARATE_DELAY_MS = 500;

// If the user separated the split (or moved one side out of the window), the
// two tabs are independent again: stop syncing them and stop closing one when
// the other closes.
async function forgetIfSeparated(tabId) {
  const pairs = await getMap(PAIRS_KEY);
  const partnerId = pairs[tabId];
  if (partnerId === undefined) return;

  let tab, partner;
  try {
    [tab, partner] = await Promise.all([chrome.tabs.get(tabId), chrome.tabs.get(partnerId)]);
  } catch {
    return; // One side closed; onRemoved takes care of the pair.
  }
  if (!inSplit(tab) || partner.splitViewId !== tab.splitViewId) await forgetPair(tabId);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.splitViewId === chrome.tabs.SPLIT_VIEW_ID_NONE) {
    setTimeout(() => enqueue("check split", () => forgetIfSeparated(tabId)), SEPARATE_DELAY_MS);
  }

  // Only react to the tab itself navigating. Leaving github.com hides the new
  // URL from us, so there the navigation shows up as a status change with no
  // URL on the tab. A tab that hasn't committed its first URL yet has url "".
  const navigated = changeInfo.url !== undefined || (changeInfo.status !== undefined && tab.url === undefined);
  if (!navigated || tab.url === "") return;

  enqueue("update split view", () => onTabNavigated(tab));
});

// Closing one side of an Ultra PR split closes the other.
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  enqueue("clean up closed tab", async () => {
    const partnerId = (await getMap(PAIRS_KEY))[tabId];
    // Forget the pair first so the partner's own onRemoved doesn't come back here.
    await forgetPair(tabId);
    await setHandled(tabId, undefined);
    // When the whole window closes, the partner is going with it.
    if (partnerId === undefined || removeInfo.isWindowClosing) return;
    try {
      await chrome.tabs.remove(partnerId);
    } catch {
      // Already gone (for example, both tabs were closed together).
    }
  });
});

// Chrome can swap a tab for a new one with a different ID (e.g. prerendering).
// Carry the pairing over so the split keeps working.
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  enqueue("track replaced tab", async () => {
    const pairs = await getMap(PAIRS_KEY);
    const partnerId = pairs[removedTabId];
    if (partnerId !== undefined) {
      delete pairs[removedTabId];
      pairs[addedTabId] = partnerId;
      pairs[partnerId] = addedTabId;
      await chrome.storage.session.set({ [PAIRS_KEY]: pairs });
    }
    const handled = await getMap(HANDLED_KEY);
    if (handled[removedTabId] !== undefined) {
      handled[addedTabId] = handled[removedTabId];
      delete handled[removedTabId];
      await chrome.storage.session.set({ [HANDLED_KEY]: handled });
    }
  });
});
