import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/file-kinds.js";

const isTestFile = globalThis.ultraPrIsTestFile;
const isImageFile = globalThis.ultraPrIsImageFile;

test("matches .test.ts and .test.tsx files at any depth", () => {
  assert.equal(isTestFile("foo.test.ts"), true);
  assert.equal(isTestFile("packages/core/src/utils/foo.test.ts"), true);
  assert.equal(isTestFile("Button.test.tsx"), true);
  assert.equal(isTestFile("src/components/Button.test.tsx"), true);
});

test("ignores other test and source files", () => {
  for (const path of ["foo.ts", "foo.tsx", "foo.spec.ts", "foo.spec.tsx", "foo.test.tsx.snap", "foo.test.js", "foo.test.ts.snap", "test.ts", "foo.test.d.ts.map"]) {
    assert.equal(isTestFile(path), false, path);
  }
});

test("uses the new name of a renamed file", () => {
  assert.equal(isTestFile("src/old.ts → src/new.test.ts"), true);
  assert.equal(isTestFile("src/old.test.ts → src/new.ts"), false);
});

test("ignores missing paths", () => {
  assert.equal(isTestFile(undefined), false);
  assert.equal(isTestFile(""), false);
});

test("matches image files by extension, any case", () => {
  for (const path of ["a.png", "docs/shot.PNG", "x/y.jpg", "y.jpeg", "anim.gif", "a.webp", "a.avif", "a.bmp", "favicon.ico", "scan.tif", "scan.tiff", "icons/logo.svg",
    "app/components/masthead/__screenshots__/components-masthead-signed-in-lg.png"]) {
    assert.equal(isImageFile(path), true, path);
  }
});

test("ignores non-image files", () => {
  for (const path of ["png", "image.png.ts", "foo.ts", "photo.pngx", "README.md", "logo.svg.map", "", undefined]) {
    assert.equal(isImageFile(path), false, String(path));
  }
});

test("uses the new name of a renamed image", () => {
  assert.equal(isImageFile("old.txt → new.png"), true);
  assert.equal(isImageFile("old.png → new.txt"), false);
});
