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

// Handle updates one at a time so a navigation and the partner updates it
// causes can't interleave and send the two tabs chasing each other.
let queue = Promise.resolve();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only react to the tab itself navigating. Leaving github.com hides the new
  // URL from us, so there the navigation shows up as a status change with no
  // URL on the tab. A tab that hasn't committed its first URL yet has url "".
  const navigated = changeInfo.url !== undefined || (changeInfo.status !== undefined && tab.url === undefined);
  if (!navigated || tab.url === "") return;

  queue = queue
    .then(() => onTabNavigated(tab))
    .catch((error) => console.warn("Ultra PR: could not update split view", error));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  queue = queue
    .then(async () => {
      await setHandled(tabId, undefined);
      await forgetPair(tabId);
    })
    .catch((error) => console.warn("Ultra PR: could not clean up closed tab", error));
});
