// User settings, kept in chrome.storage.sync so they follow the user's Chrome
// profile across devices. The content script reads collapseTests and
// collapseImages directly (it can't import modules), so keep its defaults in
// step with the ones there.
export const DEFAULT_SETTINGS = Object.freeze({
  // Open a PR's Conversation and Files changed side by side, keep the two in
  // sync when following links, and close one when the other closes.
  splitView: true,
  // On Files changed, collapse every *.test.ts and *.test.tsx file.
  collapseTests: true,
  // On Files changed, collapse every image file (see file-kinds.js).
  collapseImages: true,
});

export async function getSettings() {
  return chrome.storage.sync.get({ ...DEFAULT_SETTINGS });
}
