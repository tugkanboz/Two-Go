// Unit tests for src/utils/array.js using node:test and node:assert/strict.
// These tests assert against the real implementation and must remain
// deterministic. The library under test is not used to assert.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  chunk,
  compact,
  difference,
  differenceBy,
  drop,
  dropRight,
  take,
  takeRight,
  flatten,
  flattenDeep,
  head,
  last,
  initial,
  tail,
  uniq,
  uniqBy,
  union,
  unionBy,
  intersection,
  intersectionBy,
  without,
  zip,
  unzip,
  fromPairs,
  pull,
  nth,
  reverse,
  indexOfAll,
} from "../../src/utils/array.js";

test("chunk splits into groups of size", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([1, 2, 3], 3), [[1, 2, 3]]);
});

test("chunk defaults to size 1", () => {
  assert.deepEqual(chunk([1, 2, 3]), [[1], [2], [3]]);
});

test("chunk edge cases: non-array and invalid size", () => {
  assert.deepEqual(chunk("nope", 2), []);
  assert.deepEqual(chunk([1, 2, 3], 0), []);
  assert.deepEqual(chunk([1, 2, 3], -1), []);
});

test("compact removes falsy values", () => {
  assert.deepEqual(compact([0, 1, false, 2, "", 3, null, undefined, NaN]), [1, 2, 3]);
});

test("compact edge case: non-array", () => {
  assert.deepEqual(compact(null), []);
});

test("difference uses deep equality and flattens others", () => {
  assert.deepEqual(difference([1, 2, 3, 4], [2, 4]), [1, 3]);
  assert.deepEqual(difference([{ a: 1 }, { b: 2 }], [{ a: 1 }]), [{ b: 2 }]);
  assert.deepEqual(difference([1, 2, 3, 4], [2], [3]), [1, 4]);
});

test("difference edge case: non-array input", () => {
  assert.deepEqual(difference(null, [1]), []);
});

test("differenceBy compares on iteratee result", () => {
  assert.deepEqual(differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor), [1.2]);
  assert.deepEqual(
    differenceBy([{ x: 1 }, { x: 2 }], [{ x: 1 }], "x"),
    [{ x: 2 }]
  );
});

test("differenceBy edge case: non-array input", () => {
  assert.deepEqual(differenceBy("no", [1], (x) => x), []);
});

test("drop removes first n elements", () => {
  assert.deepEqual(drop([1, 2, 3, 4]), [2, 3, 4]);
  assert.deepEqual(drop([1, 2, 3, 4], 2), [3, 4]);
  assert.deepEqual(drop([1, 2, 3, 4], 10), []);
});

test("drop edge case: negative n treated as 0", () => {
  assert.deepEqual(drop([1, 2, 3], -5), [1, 2, 3]);
});

test("dropRight removes last n elements", () => {
  assert.deepEqual(dropRight([1, 2, 3, 4]), [1, 2, 3]);
  assert.deepEqual(dropRight([1, 2, 3, 4], 2), [1, 2]);
  assert.deepEqual(dropRight([1, 2, 3, 4], 10), []);
});

test("take takes first n elements", () => {
  assert.deepEqual(take([1, 2, 3, 4]), [1]);
  assert.deepEqual(take([1, 2, 3, 4], 2), [1, 2]);
  assert.deepEqual(take([1, 2, 3, 4], 10), [1, 2, 3, 4]);
});

test("takeRight takes last n elements", () => {
  assert.deepEqual(takeRight([1, 2, 3, 4]), [4]);
  assert.deepEqual(takeRight([1, 2, 3, 4], 2), [3, 4]);
  assert.deepEqual(takeRight([1, 2, 3, 4], 10), [1, 2, 3, 4]);
});

test("takeRight edge case: zero count returns empty", () => {
  assert.deepEqual(takeRight([1, 2, 3], 0), []);
});

test("flatten flattens a single level", () => {
  assert.deepEqual(flatten([1, [2, 3], [4, [5]]]), [1, 2, 3, 4, [5]]);
});

test("flatten edge case: non-array", () => {
  assert.deepEqual(flatten(5), []);
});

test("flattenDeep flattens recursively", () => {
  assert.deepEqual(flattenDeep([1, [2, [3, [4]]]]), [1, 2, 3, 4]);
});

test("head returns first element or undefined", () => {
  assert.equal(head([1, 2, 3]), 1);
  assert.equal(head([]), undefined);
  assert.equal(head("not array"), undefined);
});

test("last returns last element or undefined", () => {
  assert.equal(last([1, 2, 3]), 3);
  assert.equal(last([]), undefined);
});

test("initial returns all but last", () => {
  assert.deepEqual(initial([1, 2, 3]), [1, 2]);
  assert.deepEqual(initial([]), []);
});

test("tail returns all but first", () => {
  assert.deepEqual(tail([1, 2, 3]), [2, 3]);
  assert.deepEqual(tail([]), []);
});

test("uniq removes duplicates by deep equality", () => {
  assert.deepEqual(uniq([1, 2, 1, 3, 2]), [1, 2, 3]);
  assert.deepEqual(uniq([{ a: 1 }, { a: 1 }, { b: 2 }]), [{ a: 1 }, { b: 2 }]);
});

test("uniq treats NaN as equal via isEqual", () => {
  assert.deepEqual(uniq([NaN, NaN, 1]), [NaN, 1]);
});

test("uniqBy removes duplicates by iteratee", () => {
  assert.deepEqual(uniqBy([2.1, 1.2, 2.3], Math.floor), [2.1, 1.2]);
  assert.deepEqual(uniqBy([{ x: 1 }, { x: 1 }, { x: 2 }], "x"), [{ x: 1 }, { x: 2 }]);
});

test("union merges and dedupes", () => {
  assert.deepEqual(union([1, 2], [2, 3], [3, 4]), [1, 2, 3, 4]);
});

test("unionBy uses last argument as iteratee", () => {
  assert.deepEqual(unionBy([2.1], [1.2, 2.3], Math.floor), [2.1, 1.2]);
  assert.deepEqual(unionBy([{ x: 1 }], [{ x: 2 }, { x: 1 }], "x"), [{ x: 1 }, { x: 2 }]);
});

test("unionBy without iteratee behaves like union", () => {
  assert.deepEqual(unionBy([1, 2], [2, 3]), [1, 2, 3]);
});

test("union edge case: empty input", () => {
  assert.deepEqual(union(), []);
  assert.deepEqual(unionBy(), []);
});

test("intersection returns common values", () => {
  assert.deepEqual(intersection([1, 2, 3], [2, 3, 4], [3, 2]), [2, 3]);
  assert.deepEqual(intersection([{ a: 1 }, { b: 2 }], [{ a: 1 }]), [{ a: 1 }]);
});

test("intersection edge case: no array arguments", () => {
  assert.deepEqual(intersection(), []);
  assert.deepEqual(intersection("x", 1), []);
});

test("intersectionBy matches on iteratee", () => {
  assert.deepEqual(intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor), [2.1]);
  assert.deepEqual(
    intersectionBy([{ x: 1 }, { x: 2 }], [{ x: 2 }], "x"),
    [{ x: 2 }]
  );
});

test("intersectionBy edge case: empty args", () => {
  assert.deepEqual(intersectionBy(), []);
});

test("without excludes given values by deep equality", () => {
  assert.deepEqual(without([1, 2, 3, 1, 2], 1, 2), [3]);
  assert.deepEqual(without([{ a: 1 }, { b: 2 }], { a: 1 }), [{ b: 2 }]);
});

test("without edge case: non-array", () => {
  assert.deepEqual(without(null, 1), []);
});

test("zip groups by index across arrays", () => {
  assert.deepEqual(zip([1, 2], ["a", "b"], [true, false]), [
    [1, "a", true],
    [2, "b", false],
  ]);
});

test("zip handles unequal lengths with undefined fillers", () => {
  assert.deepEqual(zip([1, 2, 3], ["a"]), [
    [1, "a"],
    [2, undefined],
    [3, undefined],
  ]);
});

test("zip edge case: no arrays", () => {
  assert.deepEqual(zip(), []);
});

test("unzip regroups zipped tuples", () => {
  assert.deepEqual(unzip([[1, "a", true], [2, "b", false]]), [
    [1, 2],
    ["a", "b"],
    [true, false],
  ]);
});

test("unzip edge case: empty or non-array", () => {
  assert.deepEqual(unzip([]), []);
  assert.deepEqual(unzip("nope"), []);
});

test("fromPairs builds an object from pairs", () => {
  assert.deepEqual(fromPairs([["a", 1], ["b", 2]]), { a: 1, b: 2 });
});

test("fromPairs edge case: non-array and bad pairs", () => {
  assert.deepEqual(fromPairs(null), {});
  assert.deepEqual(fromPairs([["a", 1], "skip"]), { a: 1 });
});

test("pull removes values in place and mutates", () => {
  const arr = [1, 2, 3, 1, 2, 4];
  const result = pull(arr, 1, 2);
  assert.equal(result, arr, "pull returns the same array reference");
  assert.deepEqual(arr, [3, 4]);
});

test("pull edge case: non-array returns input unchanged", () => {
  assert.equal(pull(null, 1), null);
});

test("nth returns element supporting negative indices", () => {
  assert.equal(nth([1, 2, 3], 0), 1);
  assert.equal(nth([1, 2, 3], 1), 2);
  assert.equal(nth([1, 2, 3], -1), 3);
  assert.equal(nth([1, 2, 3]), 1);
});

test("nth edge case: out of range and non-array", () => {
  assert.equal(nth([1, 2, 3], 10), undefined);
  assert.equal(nth(null, 0), undefined);
});

test("reverse returns reversed copy without mutating input", () => {
  const arr = [1, 2, 3];
  const result = reverse(arr);
  assert.deepEqual(result, [3, 2, 1]);
  assert.deepEqual(arr, [1, 2, 3], "input is untouched");
  assert.notEqual(result, arr);
});

test("reverse edge case: non-array", () => {
  assert.deepEqual(reverse(null), []);
});

test("indexOfAll returns all matching indices by deep equality", () => {
  assert.deepEqual(indexOfAll([1, 2, 1, 3, 1], 1), [0, 2, 4]);
  assert.deepEqual(indexOfAll([{ a: 1 }, { a: 2 }, { a: 1 }], { a: 1 }), [0, 2]);
});

test("indexOfAll edge cases: no match and non-array", () => {
  assert.deepEqual(indexOfAll([1, 2, 3], 9), []);
  assert.deepEqual(indexOfAll(null, 1), []);
});
