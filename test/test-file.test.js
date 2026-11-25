import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/test-file.js";

const isTestFile = globalThis.ultraPrIsTestFile;

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
