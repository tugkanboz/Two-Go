// Unit tests for src/utils/collection.js
// Uses node:test + node:assert/strict only (not the library under test).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  forEach,
  map,
  filter,
  reject,
  reduce,
  reduceRight,
  find,
  findLast,
  some,
  every,
  includes,
  groupBy,
  keyBy,
  countBy,
  orderBy,
  sortBy,
  partition,
  flatMap,
  size,
  sample,
  sampleSize,
  shuffle
} from "../../src/utils/collection.js";

test("forEach iterates arrays and returns the collection", () => {
  const arr = [10, 20, 30];
  const seen = [];
  const result = forEach(arr, (value, index, coll) => {
    seen.push([value, index, coll]);
  });
  assert.equal(result, arr);
  assert.deepEqual(seen.map((entry) => entry[0]), [10, 20, 30]);
  assert.deepEqual(seen.map((entry) => entry[1]), [0, 1, 2]);
  assert.equal(seen[0][2], arr);
});

test("forEach iterates object values with their keys", () => {
  const obj = { a: 1, b: 2 };
  const collected = {};
  forEach(obj, (value, key) => {
    collected[key] = value;
  });
  assert.deepEqual(collected, { a: 1, b: 2 });
});

test("map with a function returns a flat array", () => {
  assert.deepEqual(map([1, 2, 3], (n) => n * 2), [2, 4, 6]);
});

test("map with a string path iteratee resolves nested values", () => {
  const data = [{ user: { id: 1 } }, { user: { id: 2 } }];
  assert.deepEqual(map(data, "user.id"), [1, 2]);
});

test("map with a bracket path iteratee resolves array indices", () => {
  const data = [{ items: [{ name: "x" }] }, { items: [{ name: "y" }] }];
  assert.deepEqual(map(data, "items[0].name"), ["x", "y"]);
});

test("map over an object returns values in key order", () => {
  assert.deepEqual(map({ a: 1, b: 2 }, (v) => v + 1), [2, 3]);
});

test("map with nil iteratee acts as identity", () => {
  assert.deepEqual(map([1, 2], null), [1, 2]);
});

test("resolvePath via map returns undefined for missing segments", () => {
  const data = [{ a: { b: 1 } }, { a: null }, {}];
  assert.deepEqual(map(data, "a.b"), [1, undefined, undefined]);
});

test("filter keeps truthy values", () => {
  assert.deepEqual(filter([1, 2, 3, 4], (n) => n % 2 === 0), [2, 4]);
});

test("reject keeps falsy values (inverse of filter)", () => {
  assert.deepEqual(reject([1, 2, 3, 4], (n) => n % 2 === 0), [1, 3]);
});

test("reduce with an initial accumulator", () => {
  assert.equal(reduce([1, 2, 3], (acc, n) => acc + n, 10), 16);
});

test("reduce without an accumulator uses the first value", () => {
  assert.equal(reduce([1, 2, 3], (acc, n) => acc + n), 6);
});

test("reduce over an empty collection without accumulator returns undefined", () => {
  assert.equal(reduce([], (acc, n) => acc + n), undefined);
});

test("reduce over an empty collection with accumulator returns the accumulator", () => {
  assert.equal(reduce([], (acc, n) => acc + n, 5), 5);
});

test("reduceRight processes values right-to-left", () => {
  assert.equal(reduceRight(["a", "b", "c"], (acc, ch) => acc + ch, ""), "cba");
});

test("reduceRight without an accumulator uses the last value", () => {
  assert.deepEqual(reduceRight([1, 2, 3], (acc, n) => acc - n), 0);
});

test("reduceRight over an empty collection without accumulator returns undefined", () => {
  assert.equal(reduceRight([], (acc, n) => acc + n), undefined);
});

test("find returns the first matching value or undefined", () => {
  assert.equal(find([1, 2, 3, 4], (n) => n > 2), 3);
  assert.equal(find([1, 2], (n) => n > 9), undefined);
});

test("findLast returns the last matching value or undefined", () => {
  assert.equal(findLast([1, 2, 3, 4], (n) => n < 3), 2);
  assert.equal(findLast([1, 2], (n) => n > 9), undefined);
});

test("some returns true when at least one matches", () => {
  assert.equal(some([1, 2, 3], (n) => n === 2), true);
  assert.equal(some([1, 2, 3], (n) => n === 9), false);
});

test("every returns true only when all match and true for empty", () => {
  assert.equal(every([2, 4, 6], (n) => n % 2 === 0), true);
  assert.equal(every([2, 3], (n) => n % 2 === 0), false);
  assert.equal(every([], (n) => n > 0), true);
});

test("includes uses deep equality for values", () => {
  assert.equal(includes([{ a: 1 }, { b: 2 }], { a: 1 }), true);
  assert.equal(includes([{ a: 1 }], { a: 2 }), false);
  assert.equal(includes([1, 2, 3], 2), true);
});

test("groupBy groups by iteratee result", () => {
  const result = groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? "even" : "odd"));
  assert.deepEqual(result, { odd: [1, 3], even: [2, 4] });
});

test("groupBy supports a string path iteratee", () => {
  const data = [
    { type: "a", id: 1 },
    { type: "b", id: 2 },
    { type: "a", id: 3 }
  ];
  const result = groupBy(data, "type");
  assert.deepEqual(result, {
    a: [{ type: "a", id: 1 }, { type: "a", id: 3 }],
    b: [{ type: "b", id: 2 }]
  });
});

test("keyBy keeps the last value per key", () => {
  const data = [
    { id: "x", v: 1 },
    { id: "y", v: 2 },
    { id: "x", v: 3 }
  ];
  const result = keyBy(data, "id");
  assert.deepEqual(result, { x: { id: "x", v: 3 }, y: { id: "y", v: 2 } });
});

test("countBy counts occurrences per iteratee result", () => {
  const result = countBy(["one", "two", "three"], (s) => s.length);
  assert.deepEqual(result, { 3: 2, 5: 1 });
});

test("sortBy sorts ascending by a single iteratee", () => {
  assert.deepEqual(sortBy([3, 1, 2], (n) => n), [1, 2, 3]);
});

test("sortBy with a string path iteratee", () => {
  const data = [{ age: 30 }, { age: 10 }, { age: 20 }];
  assert.deepEqual(sortBy(data, "age"), [{ age: 10 }, { age: 20 }, { age: 30 }]);
});

test("orderBy supports multiple iteratees with parallel orders", () => {
  const data = [
    { name: "a", age: 30 },
    { name: "b", age: 20 },
    { name: "a", age: 10 }
  ];
  const result = orderBy(data, ["name", "age"], ["asc", "desc"]);
  assert.deepEqual(result, [
    { name: "a", age: 30 },
    { name: "a", age: 10 },
    { name: "b", age: 20 }
  ]);
});

test("orderBy is stable for equal entries", () => {
  const data = [
    { k: 1, tag: "first" },
    { k: 1, tag: "second" },
    { k: 1, tag: "third" }
  ];
  const result = orderBy(data, ["k"], ["asc"]);
  assert.deepEqual(result.map((item) => item.tag), ["first", "second", "third"]);
});

test("orderBy places undefined and null criteria after defined values", () => {
  const data = [{ v: 2 }, { v: undefined }, { v: 1 }, { v: null }];
  const result = orderBy(data, ["v"], ["asc"]);
  assert.deepEqual(result.map((item) => item.v), [1, 2, null, undefined]);
});

test("partition splits into pass and fail arrays", () => {
  const [pass, fail] = partition([1, 2, 3, 4], (n) => n > 2);
  assert.deepEqual(pass, [3, 4]);
  assert.deepEqual(fail, [1, 2]);
});

test("flatMap flattens one level", () => {
  assert.deepEqual(flatMap([1, 2, 3], (n) => [n, n * 10]), [1, 10, 2, 20, 3, 30]);
});

test("flatMap keeps non-array results as single items", () => {
  assert.deepEqual(flatMap([1, 2], (n) => n * 2), [2, 4]);
});

test("size handles arrays, objects, strings and nil", () => {
  assert.equal(size([1, 2, 3]), 3);
  assert.equal(size({ a: 1, b: 2 }), 2);
  assert.equal(size("hello"), 5);
  assert.equal(size(null), 0);
  assert.equal(size(undefined), 0);
});

test("sample returns a member of the collection", () => {
  const arr = [1, 2, 3, 4, 5];
  for (let i = 0; i < 20; i += 1) {
    assert.ok(arr.includes(sample(arr)));
  }
});

test("sample returns undefined for an empty collection", () => {
  assert.equal(sample([]), undefined);
});

test("sampleSize returns the requested count of distinct members", () => {
  const arr = [1, 2, 3, 4, 5];
  const result = sampleSize(arr, 3);
  assert.equal(result.length, 3);
  for (const value of result) {
    assert.ok(arr.includes(value));
  }
  assert.equal(new Set(result).size, 3);
});

test("sampleSize clamps to the collection length and handles bad n", () => {
  assert.equal(sampleSize([1, 2], 10).length, 2);
  assert.equal(sampleSize([1, 2, 3], 0).length, 0);
  assert.equal(sampleSize([1, 2, 3], -5).length, 0);
  assert.equal(sampleSize([1, 2, 3], "bad").length, 0);
});

test("shuffle returns a new array containing the same members", () => {
  const arr = [1, 2, 3, 4, 5];
  const result = shuffle(arr);
  assert.notEqual(result, arr);
  assert.equal(result.length, arr.length);
  assert.deepEqual([...result].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});
