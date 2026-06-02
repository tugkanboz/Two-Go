// Unit tests for src/utils/object.js
// Uses node:test and node:assert/strict. Does not use the library under test to assert.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  get,
  set,
  has,
  unset,
  keys,
  values,
  entries,
  toPairs,
  fromEntries,
  pick,
  pickBy,
  omit,
  omitBy,
  merge,
  mergeDeep,
  defaults,
  mapValues,
  mapKeys,
  invert,
  assign,
  clone,
  findKey,
  forOwn,
} from "../../src/utils/object.js";

test("get reads nested values via dot and bracket paths", () => {
  const obj = { a: { b: [{ c: 42 }] } };
  assert.equal(get(obj, "a.b[0].c"), 42);
  assert.equal(get(obj, "a.b.0.c"), 42);
  assert.equal(get(obj, ["a", "b", "0", "c"]), 42);
});

test("get returns defaultValue when a segment is missing", () => {
  const obj = { a: { b: 1 } };
  assert.equal(get(obj, "a.x.y", "fallback"), "fallback");
  assert.equal(get(obj, "missing", 7), 7);
  assert.equal(get(undefined, "a", "def"), "def");
});

test("get with empty path returns obj or default", () => {
  assert.deepEqual(get({ a: 1 }, ""), { a: 1 });
  assert.equal(get(undefined, "", "d"), "d");
});

test("set creates intermediate objects and arrays, mutates and returns obj", () => {
  const obj = {};
  const result = set(obj, "a.b[0].c", 99);
  assert.equal(result, obj);
  assert.deepEqual(obj, { a: { b: [{ c: 99 }] } });
  assert.ok(Array.isArray(obj.a.b));
});

test("set on empty path returns obj unchanged", () => {
  const obj = { a: 1 };
  assert.equal(set(obj, "", 5), obj);
  assert.deepEqual(obj, { a: 1 });
});

test("has returns true only for existing own paths", () => {
  const obj = { a: { b: { c: undefined } } };
  assert.equal(has(obj, "a.b.c"), true);
  assert.equal(has(obj, "a.b.d"), false);
  assert.equal(has(obj, "a.x.y"), false);
  assert.equal(has(obj, ""), false);
});

test("unset removes a value and returns true; false when absent", () => {
  const obj = { a: { b: 1, c: 2 } };
  assert.equal(unset(obj, "a.b"), true);
  assert.deepEqual(obj, { a: { c: 2 } });
  assert.equal(unset(obj, "a.b"), false);
  assert.equal(unset(obj, "x.y"), false);
  assert.equal(unset(obj, ""), false);
});

test("keys, values, entries on plain object", () => {
  const obj = { a: 1, b: 2 };
  assert.deepEqual(keys(obj), ["a", "b"]);
  assert.deepEqual(values(obj), [1, 2]);
  assert.deepEqual(entries(obj), [["a", 1], ["b", 2]]);
});

test("keys, values, entries on non-object return empty arrays", () => {
  assert.deepEqual(keys(null), []);
  assert.deepEqual(values(42), []);
  assert.deepEqual(entries("str"), []);
});

test("toPairs is an alias of entries", () => {
  const obj = { x: 10 };
  assert.deepEqual(toPairs(obj), entries(obj));
});

test("fromEntries builds an object and tolerates nil/empty pairs", () => {
  assert.deepEqual(fromEntries([["a", 1], ["b", 2]]), { a: 1, b: 2 });
  assert.deepEqual(fromEntries(null), {});
  assert.deepEqual(fromEntries([null, ["c", 3]]), { c: 3 });
});

test("pick selects given paths (rest and array forms)", () => {
  const obj = { a: 1, b: 2, c: 3, nested: { x: 9 } };
  assert.deepEqual(pick(obj, "a", "c"), { a: 1, c: 3 });
  assert.deepEqual(pick(obj, ["a", "b"]), { a: 1, b: 2 });
  assert.deepEqual(pick(obj, "nested.x"), { nested: { x: 9 } });
});

test("pick ignores missing paths and non-object input", () => {
  assert.deepEqual(pick({ a: 1 }, "missing"), {});
  assert.deepEqual(pick(null, "a"), {});
});

test("pickBy keeps properties where predicate is truthy", () => {
  const obj = { a: 1, b: 2, c: 3 };
  assert.deepEqual(pickBy(obj, (v) => v > 1), { b: 2, c: 3 });
  assert.deepEqual(pickBy(null, () => true), {});
});

test("omit returns a deep clone without given paths and does not mutate input", () => {
  const obj = { a: 1, b: { c: 2, d: 3 } };
  const result = omit(obj, "b.c");
  assert.deepEqual(result, { a: 1, b: { d: 3 } });
  assert.deepEqual(obj, { a: 1, b: { c: 2, d: 3 } });
});

test("omit accepts array form and handles non-object", () => {
  assert.deepEqual(omit({ a: 1, b: 2 }, ["a"]), { b: 2 });
  assert.deepEqual(omit(null, "a"), {});
});

test("omitBy drops properties where predicate is truthy", () => {
  const obj = { a: 1, b: 2, c: 3 };
  assert.deepEqual(omitBy(obj, (v) => v > 1), { a: 1 });
  assert.deepEqual(omitBy(null, () => true), {});
});

test("merge deep-merges sources, mutates and returns target", () => {
  const target = { a: { x: 1 }, list: [1] };
  const result = merge(target, { a: { y: 2 }, list: [9] });
  assert.equal(result, target);
  assert.deepEqual(target.a, { x: 1, y: 2 });
  assert.deepEqual(target.list, [9]);
});

test("merge with non-object target uses a fresh base", () => {
  const result = merge(null, { a: 1 });
  assert.deepEqual(result, { a: 1 });
});

test("mergeDeep merges into a new object without mutating inputs", () => {
  const a = { x: { p: 1 } };
  const b = { x: { q: 2 } };
  const result = mergeDeep(a, b);
  assert.deepEqual(result, { x: { p: 1, q: 2 } });
  assert.deepEqual(a, { x: { p: 1 } });
  assert.deepEqual(b, { x: { q: 2 } });
  assert.notEqual(result.x, a.x);
});

test("defaults fills only missing (undefined) keys, mutates and returns obj", () => {
  const obj = { a: 1, b: undefined };
  const result = defaults(obj, { a: 99, b: 2, c: 3 });
  assert.equal(result, obj);
  assert.deepEqual(obj, { a: 1, b: 2, c: 3 });
});

test("defaults ignores non-object sources", () => {
  assert.deepEqual(defaults({ a: 1 }, null, 5, { b: 2 }), { a: 1, b: 2 });
});

test("mapValues maps each value with key, returns new object", () => {
  const obj = { a: 1, b: 2 };
  const result = mapValues(obj, (v, k) => `${k}:${v}`);
  assert.deepEqual(result, { a: "a:1", b: "b:2" });
  assert.deepEqual(mapValues(null, (v) => v), {});
});

test("mapKeys transforms keys keeping values", () => {
  const obj = { a: 1, b: 2 };
  const result = mapKeys(obj, (v, k) => k.toUpperCase());
  assert.deepEqual(result, { A: 1, B: 2 });
});

test("invert swaps keys and values", () => {
  assert.deepEqual(invert({ a: "x", b: "y" }), { x: "a", y: "b" });
  assert.deepEqual(invert(null), {});
});

test("assign shallow-copies sources into target, mutates and returns target", () => {
  const target = { a: 1 };
  const result = assign(target, { b: 2 }, null, { c: 3 });
  assert.equal(result, target);
  assert.deepEqual(target, { a: 1, b: 2, c: 3 });
});

test("clone makes a shallow copy of arrays and objects, passes primitives through", () => {
  const arr = [1, 2, 3];
  const arrCopy = clone(arr);
  assert.deepEqual(arrCopy, arr);
  assert.notEqual(arrCopy, arr);

  const obj = { a: 1, nested: { b: 2 } };
  const objCopy = clone(obj);
  assert.deepEqual(objCopy, obj);
  assert.notEqual(objCopy, obj);
  assert.equal(objCopy.nested, obj.nested);

  assert.equal(clone(5), 5);
});

test("findKey returns first matching key or undefined", () => {
  const obj = { a: 1, b: 2, c: 3 };
  assert.equal(findKey(obj, (v) => v === 2), "b");
  assert.equal(findKey(obj, (v) => v > 99), undefined);
  assert.equal(findKey(null, () => true), undefined);
});

test("forOwn iterates all keys and stops early on false; returns obj", () => {
  const obj = { a: 1, b: 2, c: 3 };
  const seen = [];
  const result = forOwn(obj, (v, k) => {
    seen.push(k);
  });
  assert.equal(result, obj);
  assert.deepEqual(seen, ["a", "b", "c"]);

  const visited = [];
  forOwn(obj, (v, k) => {
    visited.push(k);
    if (k === "b") return false;
  });
  assert.deepEqual(visited, ["a", "b"]);

  assert.equal(forOwn(null, () => {}), null);
});
