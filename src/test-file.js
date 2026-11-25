// Decides which changed files Ultra PR marks as viewed. Loaded as a classic
// content script ahead of auto-view.js, so it shares a global instead of
// exporting; the unit tests import it the same way.
globalThis.ultraPrIsTestFile = function isTestFile(path) {
  if (typeof path !== "string") return false;
  // A renamed file can show as "old/path → new/path"; judge the new name.
  const name = path.split(/\s+(?:→|->)\s+/).pop().trim();
  return name.endsWith(".test.ts");
};
