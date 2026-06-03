// Regression tests for the Tier 0 false-pass fixes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { matches, deepEqual } from "../../src/assertions.js";
import { validate } from "../../src/schema.js";

test("matches no longer treats different Dates as equal", () => {
  assert.equal(matches(new Date(0), new Date(1000)), false);
  assert.equal(matches(new Date(1000), new Date(1000)), true);
});

test("matches distinguishes Maps, Sets, and RegExps", () => {
  assert.equal(matches(new Map([["a", 1]]), new Map([["a", 2]])), false);
  assert.equal(matches(new Set([1, 2]), new Set([1, 3])), false);
  assert.equal(matches(/a/i, /b/i), false);
  assert.equal(deepEqual(new Set([1, 2]), new Set([1, 2])), true);
});

test("plain object deep equality still works", () => {
  assert.equal(matches({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }), true);
  assert.equal(matches({ a: 1 }, { a: 2 }), false);
});

test("schema validator rejects NaN for type number and range", () => {
  assert.equal(validate(NaN, { type: "number" }).valid, false);
  assert.equal(validate(NaN, { type: "number", minimum: 0, maximum: 10 }).valid, false);
  assert.equal(validate(5, { type: "number", minimum: 0, maximum: 10 }).valid, true);
});
