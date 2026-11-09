import { test } from "node:test";
import assert from "node:assert/strict";
import { syncPartner } from "../src/sync.js";

const A = "https://github.com/acme/widgets/pull/42";
const B = "https://github.com/acme/widgets/pull/7";

test("partner already shows the other view of the same PR", () => {
  assert.deepEqual(syncPartner(A, `${A}/files`), { action: "none" });
  assert.deepEqual(syncPartner(`${A}/files`, A), { action: "none" });
  assert.deepEqual(syncPartner(`${A}#issuecomment-1`, `${A}/changes?diff=split`), { action: "none" });
});

test("clicking to another PR's conversation moves the partner to its files", () => {
  const result = syncPartner(B, `${A}/files`);
  assert.equal(result.action, "navigate");
  assert.equal(result.url, `${B}/files`);
  assert.equal(result.pr.key, "acme/widgets#7");
});

test("clicking to another PR's files moves the partner to its conversation", () => {
  const result = syncPartner(`${B}/files`, A);
  assert.equal(result.action, "navigate");
  assert.equal(result.url, B);
});

test("switching views within the same PR flips the partner", () => {
  assert.equal(syncPartner(`${A}/files`, `${A}/files`).url, A);
  assert.equal(syncPartner(A, A).url, `${A}/files`);
});

test("a partner that isn't on a PR is brought back", () => {
  assert.equal(syncPartner(A, undefined).url, `${A}/files`);
  assert.equal(syncPartner(A, "https://github.com/acme/widgets").url, `${A}/files`);
});

test("leaving the PR closes the partner", () => {
  assert.deepEqual(syncPartner("https://github.com/acme/widgets/issues/3", `${A}/files`), { action: "close" });
  assert.deepEqual(syncPartner(`${A}/commits`, `${A}/files`), { action: "close" });
  // Off github.com the extension can't see the URL at all.
  assert.deepEqual(syncPartner(undefined, `${A}/files`), { action: "close" });
});
