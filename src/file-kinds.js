// Decides which changed files Ultra PR collapses. Loaded as a classic content
// script ahead of auto-collapse.js, so it shares globals instead of exporting;
// the unit tests import it the same way.
(() => {
  const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "tif", "tiff", "svg"];

  // A renamed file can show as "old/path → new/path"; judge the new name.
  function fileName(path) {
    return typeof path === "string" ? path.split(/\s+(?:→|->)\s+/).pop().trim() : "";
  }

  globalThis.ultraPrIsTestFile = function isTestFile(path) {
    const name = fileName(path);
    return name.endsWith(".test.ts") || name.endsWith(".test.tsx");
  };

  globalThis.ultraPrIsImageFile = function isImageFile(path) {
    const match = fileName(path).match(/\.([a-z0-9]+)$/i);
    return match !== null && IMAGE_EXTENSIONS.includes(match[1].toLowerCase());
  };
})();
