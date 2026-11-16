// Tells the background when this page was loaded by a reload, so it can reload
// the other side of an Ultra PR split too.
const [navigation] = performance.getEntriesByType("navigation");
if (navigation?.type === "reload") {
  chrome.runtime.sendMessage({ type: "reloaded" });
}
