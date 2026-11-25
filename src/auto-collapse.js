// Content script: on a pull request's Files changed page, collapses every test
// file and every image file (see file-kinds.js), per the "Collapse test files"
// and "Collapse image files" settings. Collapsing only changes what the page
// shows; nothing is saved to GitHub.
//
// GitHub can re-open files after they're collapsed (for example while a large
// PR is still loading), so a file seen open again is collapsed again, up to
// MAX_COLLAPSES times per file per tab session. Files you open yourself, by
// expanding them or by going to them from the file tree or a link, stay open.
(() => {
  const isTestFile = globalThis.ultraPrIsTestFile;
  const isImageFile = globalThis.ultraPrIsImageFile;

  // Must match DEFAULT_SETTINGS in settings.js.
  const DEFAULTS = { collapseTests: true, collapseImages: true };
  let settings = { ...DEFAULTS };

  function shouldCollapse(path) {
    return (settings.collapseTests && isTestFile(path)) || (settings.collapseImages && isImageFile(path));
  }

  const FILES_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/(?:files|changes)\/?$/;
  const STATE_KEY = "ultraPr.collapsed";
  const MAX_COLLAPSES = 5;
  const COLLAPSE = 'button[data-telemetry-action="shared.file_header.collapse"]';
  const EXPAND = 'button[data-telemetry-action="shared.file_header.expand"]';

  let enabled = false;
  let scanQueued = false;

  function prKey() {
    const match = location.pathname.match(FILES_PATH);
    return match ? `${match[1]}/${match[2]}#${match[3]}`.toLowerCase() : null;
  }

  // { [prKey]: { counts: { [path]: n }, userOpened: [path, ...] } }
  function loadState() {
    try {
      return JSON.parse(sessionStorage.getItem(STATE_KEY)) ?? {};
    } catch {
      return {};
    }
  }

  function updateState(key, change) {
    const state = loadState();
    const pr = (state[key] ??= { counts: {}, userOpened: [] });
    change(pr);
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: worst case a file is collapsed again after a reload.
    }
  }

  // GitHub wraps file paths in invisible direction marks.
  function cleanPath(text) {
    return (text ?? "").replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim();
  }

  // The file a header element belongs to, as { path, header, entry }.
  function fileFor(element) {
    const header = element.closest('[class*="diff-file-header"]');
    const entry = element.closest('[id^="diff-"]');
    const path = cleanPath(header?.querySelector("h3")?.textContent ?? header?.querySelector("code")?.textContent);
    return path ? { path, header, entry } : null;
  }

  function scan() {
    scanQueued = false;
    const key = prKey();
    if (!enabled || !key) return;

    const pr = loadState()[key] ?? { counts: {}, userOpened: [] };
    const target = decodeURIComponent(location.hash.slice(1));

    for (const button of document.querySelectorAll(COLLAPSE)) {
      const file = fileFor(button);
      if (!file || !shouldCollapse(file.path)) continue;
      if (pr.userOpened.includes(file.path)) continue;
      // The file you navigated to (file tree or #diff- link) stays open.
      if (target && file.entry?.id === target) continue;
      if ((pr.counts[file.path] ?? 0) >= MAX_COLLAPSES) continue;

      button.click();
      updateState(key, (state) => {
        state.counts[file.path] = (state.counts[file.path] ?? 0) + 1;
      });
    }
  }

  // GitHub renders files as you scroll and navigates without reloading, so
  // rescan whenever the page changes, at most a few times a second.
  function queueScan() {
    if (scanQueued || !enabled) return;
    scanQueued = true;
    setTimeout(() => {
      try {
        scan();
      } catch (error) {
        console.warn("Ultra PR: could not collapse files", error);
      }
    }, 200);
  }

  const observer = new MutationObserver(() => {
    if (prKey()) queueScan();
  });

  // Remember files you expand yourself, so they aren't collapsed again.
  // Only real clicks count (isTrusted), not ours.
  document.addEventListener(
    "click",
    (event) => {
      const key = prKey();
      const button = event.isTrusted && key && event.target instanceof Element && event.target.closest(EXPAND);
      const file = button && fileFor(button);
      if (!file || !shouldCollapse(file.path)) return;
      updateState(key, (state) => {
        if (!state.userOpened.includes(file.path)) state.userOpened.push(file.path);
      });
    },
    true,
  );

  function applySettings(next) {
    settings = next;
    enabled = settings.collapseTests || settings.collapseImages;
    if (enabled) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
      queueScan();
    } else {
      observer.disconnect();
    }
  }

  chrome.storage.sync.get({ ...DEFAULTS }).then(applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const next = { ...settings };
    for (const name of Object.keys(DEFAULTS)) {
      if (name in changes) next[name] = changes[name].newValue ?? DEFAULTS[name];
    }
    applySettings(next);
  });
})();
