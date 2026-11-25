// Content script: on a pull request's Files changed page, marks every test file
// (see test-file.js) as Viewed, when the "Mark test files as viewed" setting is on.
//
// Each file is handled once per tab session: if you uncheck a test file, or it
// was already viewed when it first appeared, Ultra PR leaves it alone after that.
(() => {
  const isTestFile = globalThis.ultraPrIsTestFile;

  // Must match DEFAULT_SETTINGS.autoViewTests in settings.js.
  const DEFAULT_ENABLED = false;

  const FILES_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/(?:files|changes)\/?$/;
  const HANDLED_KEY = "ultraPr.autoViewed";
  const CLICK_GAP_MS = 150;

  let enabled = false;
  let scanQueued = false;
  let clicking = false;

  function prKey() {
    const match = location.pathname.match(FILES_PATH);
    return match ? `${match[1]}/${match[2]}#${match[3]}`.toLowerCase() : null;
  }

  function loadHandled() {
    try {
      return JSON.parse(sessionStorage.getItem(HANDLED_KEY)) ?? {};
    } catch {
      return {};
    }
  }

  function saveHandled(handled) {
    try {
      sessionStorage.setItem(HANDLED_KEY, JSON.stringify(handled));
    } catch {
      // Storage full or blocked: worst case a file gets re-checked after a reload.
    }
  }

  // GitHub wraps file paths in invisible direction marks.
  function cleanPath(text) {
    return (text ?? "").replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim();
  }

  // Every file on the page as { path, viewed, toggle }.
  function findFiles() {
    const files = [];

    // Current review UI (served at /changes).
    for (const toggle of document.querySelectorAll('button[data-telemetry-action="pull_requests.diff.toggle_viewed"]')) {
      const header = toggle.closest('[class*="diff-file-header"]') ?? toggle.closest('[id^="diff-"]');
      const path = cleanPath(header?.querySelector("h3")?.textContent ?? header?.querySelector("code")?.textContent);
      if (path) files.push({ path, viewed: toggle.getAttribute("aria-pressed") === "true", toggle });
    }

    // Classic UI (served at /files).
    for (const toggle of document.querySelectorAll("input.js-reviewed-checkbox")) {
      const path = cleanPath(toggle.closest(".file-header")?.dataset.path ?? toggle.closest(".file")?.querySelector(".file-header")?.dataset.path);
      if (path) files.push({ path, viewed: toggle.checked, toggle });
    }

    return files;
  }

  async function scan() {
    scanQueued = false;
    const key = prKey();
    if (!enabled || !key || clicking) return;

    const fresh = findFiles().filter((file) => !(loadHandled()[key] ?? []).includes(file.path));
    if (fresh.length === 0) return;

    // Record a file only once it's dealt with, so one that re-renders before
    // its turn is picked up on the next scan.
    const markHandled = (path) => {
      const handled = loadHandled();
      handled[key] = [...new Set([...(handled[key] ?? []), path])];
      saveHandled(handled);
    };

    // One at a time, so GitHub gets one request per file rather than a burst.
    clicking = true;
    try {
      for (const file of fresh) {
        if (prKey() !== key) break;
        if (file.viewed || !isTestFile(file.path)) {
          markHandled(file.path);
          continue;
        }
        if (!file.toggle.isConnected) continue;
        file.toggle.click();
        markHandled(file.path);
        await new Promise((resolve) => setTimeout(resolve, CLICK_GAP_MS));
      }
    } finally {
      clicking = false;
    }
    queueScan(); // Files may have rendered while we were clicking.
  }

  // GitHub renders files as you scroll and navigates without reloading, so
  // rescan whenever the page changes, at most a few times a second.
  function queueScan() {
    if (scanQueued || !enabled) return;
    scanQueued = true;
    setTimeout(() => scan().catch((error) => console.warn("Ultra PR: could not mark test files viewed", error)), 300);
  }

  const observer = new MutationObserver(() => {
    if (prKey()) queueScan();
  });

  function setEnabled(value) {
    enabled = value;
    if (enabled) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
      queueScan();
    } else {
      observer.disconnect();
    }
  }

  chrome.storage.sync.get({ autoViewTests: DEFAULT_ENABLED }).then(({ autoViewTests }) => setEnabled(autoViewTests));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && "autoViewTests" in changes) setEnabled(changes.autoViewTests.newValue ?? DEFAULT_ENABLED);
  });
})();
