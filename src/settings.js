// User settings, kept in chrome.storage.sync so they follow the user's Chrome
// profile across devices. The content script reads autoViewTests directly
// (it can't import modules), so keep its default in step with the one there.
export const DEFAULT_SETTINGS = Object.freeze({
  // Open a PR's Conversation and Files changed side by side, keep the two in
  // sync when following links, and close one when the other closes.
  splitView: true,
  // On Files changed, mark every *.test.ts file as Viewed.
  autoViewTests: false,
});

export async function getSettings() {
  return chrome.storage.sync.get({ ...DEFAULT_SETTINGS });
}
