import { parsePrUrl } from "./pr-url.js";

// tabId -> PR key we've already paired for that tab. Kept in session storage
// so a service worker restart doesn't re-open splits the user already dismissed.
const HANDLED_KEY = "handledTabs";

// Guards the check-then-set above against back-to-back URL updates
// (e.g. GitHub redirecting /files to /changes).
const pending = new Set();

async function getHandled() {
  const { [HANDLED_KEY]: handled = {} } = await chrome.storage.session.get(HANDLED_KEY);
  return handled;
}

async function setHandled(tabId, prKey) {
  const handled = await getHandled();
  if (prKey === undefined) delete handled[tabId];
  else handled[tabId] = prKey;
  await chrome.storage.session.set({ [HANDLED_KEY]: handled });
}

async function pairPrTab(tab) {
  const pr = parsePrUrl(tab.url);
  if (!pr) return;

  // Pinned tabs can't share a split with the unpinned tab we'd create.
  if (tab.pinned) return;
  if (tab.splitViewId !== undefined && tab.splitViewId !== chrome.tabs.SPLIT_VIEW_ID_NONE) return;

  // Only pair once per PR per tab: if the user separates the split and keeps
  // browsing the same PR, leave them alone.
  const pendingKey = `${tab.id}:${pr.key}`;
  if (pending.has(pendingKey)) return;
  pending.add(pendingKey);
  try {
    const handled = await getHandled();
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
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  pairPrTab(tab).catch((error) => console.warn("Ultra PR: could not open split view", error));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  setHandled(tabId, undefined);
});
