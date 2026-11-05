import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrUrl } from "../src/pr-url.js";

test("conversation view", () => {
  assert.deepEqual(parsePrUrl("https://github.com/Acme/Widgets/pull/42"), {
    key: "acme/widgets#42",
    view: "conversation",
    conversationUrl: "https://github.com/Acme/Widgets/pull/42",
    filesUrl: "https://github.com/Acme/Widgets/pull/42/files",
  });
});

test("files view, old and new paths", () => {
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42/files").view, "files");
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42/changes").view, "files");
});

test("ignores query, hash and trailing slash", () => {
  const pr = parsePrUrl("https://github.com/acme/widgets/pull/42/files/?diff=split#r123");
  assert.equal(pr.view, "files");
  assert.equal(pr.key, "acme/widgets#42");
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42#issuecomment-1").view, "conversation");
});

test("other PR subpages are ignored", () => {
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42/commits"), null);
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42/checks"), null);
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pull/42/files/abc123"), null);
});

test("non-PR and non-github URLs are ignored", () => {
  assert.equal(parsePrUrl("https://github.com/acme/widgets/pulls"), null);
  assert.equal(parsePrUrl("https://github.com/acme/widgets/issues/42"), null);
  assert.equal(parsePrUrl("https://gist.github.com/acme/widgets/pull/42"), null);
  assert.equal(parsePrUrl("chrome://extensions"), null);
  assert.equal(parsePrUrl("not a url"), null);
});
