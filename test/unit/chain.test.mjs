import { test } from "node:test";
import assert from "node:assert/strict";

import { chain } from "../../src/utils/chain.js";

// --- basic unwrapping ---

test("chain wraps a value and value() returns it unchanged", () => {
  const input = [1, 2, 3];
  const wrapped = chain(input);
  assert.equal(wrapped.value(), input);
});

test("valueOf is an alias of value()", () => {
  const wrapped = chain(42);
  assert.equal(wrapped.valueOf(), 42);
  assert.equal(wrapped.value(), wrapped.valueOf());
});

test("chain does not mutate the original input", () => {
  const input = [3, 1, 2];
  const result = chain(input).sortBy().reverse().value();
  assert.deepEqual(input, [3, 1, 2]);
  assert.notEqual(result, input);
});

// --- collection / array transforms ---

test("map applies the iteratee to each element", () => {
  const result = chain([1, 2, 3]).map((n) => n * 2).value();
  assert.deepEqual(result, [2, 4, 6]);
});

test("filter keeps only matching elements", () => {
  const result = chain([1, 2, 3, 4]).filter((n) => n % 2 === 0).value();
  assert.deepEqual(result, [2, 4]);
});

test("reject removes matching elements", () => {
  const result = chain([1, 2, 3, 4]).reject((n) => n % 2 === 0).value();
  assert.deepEqual(result, [1, 3]);
});

test("forEach runs side effects and returns the same wrapper holding the original value", () => {
  const seen = [];
  const wrapped = chain([1, 2, 3]);
  const returned = wrapped.forEach((n) => seen.push(n));
  assert.deepEqual(seen, [1, 2, 3]);
  assert.equal(returned, wrapped);
  assert.deepEqual(returned.value(), [1, 2, 3]);
});

test("some reports whether any element matches", () => {
  assert.equal(chain([1, 2, 3]).some((n) => n > 2).value(), true);
  assert.equal(chain([1, 2, 3]).some((n) => n > 5).value(), false);
});

test("every reports whether all elements match", () => {
  assert.equal(chain([2, 4, 6]).every((n) => n % 2 === 0).value(), true);
  assert.equal(chain([2, 4, 5]).every((n) => n % 2 === 0).value(), false);
});

test("uniq removes duplicate values", () => {
  const result = chain([1, 1, 2, 2, 3]).uniq().value();
  assert.deepEqual(result, [1, 2, 3]);
});

test("uniqBy removes duplicates by iteratee", () => {
  const result = chain([{ id: 1 }, { id: 1 }, { id: 2 }]).uniqBy("id").value();
  assert.deepEqual(result, [{ id: 1 }, { id: 2 }]);
});

test("flatten flattens a single level deep", () => {
  const result = chain([1, [2, [3]]]).flatten().value();
  assert.deepEqual(result, [1, 2, [3]]);
});

test("flattenDeep flattens recursively", () => {
  const result = chain([1, [2, [3, [4]]]]).flattenDeep().value();
  assert.deepEqual(result, [1, 2, 3, 4]);
});

test("chunk splits into groups of given size", () => {
  const result = chain([1, 2, 3, 4, 5]).chunk(2).value();
  assert.deepEqual(result, [[1, 2], [3, 4], [5]]);
});

test("compact removes falsy values", () => {
  const result = chain([0, 1, false, 2, "", 3, null, undefined, NaN]).compact().value();
  assert.deepEqual(result, [1, 2, 3]);
});

test("take returns the first n elements", () => {
  assert.deepEqual(chain([1, 2, 3, 4]).take(2).value(), [1, 2]);
});

test("takeRight returns the last n elements", () => {
  assert.deepEqual(chain([1, 2, 3, 4]).takeRight(2).value(), [3, 4]);
});

test("drop removes the first n elements", () => {
  assert.deepEqual(chain([1, 2, 3, 4]).drop(2).value(), [3, 4]);
});

test("dropRight removes the last n elements", () => {
  assert.deepEqual(chain([1, 2, 3, 4]).dropRight(2).value(), [1, 2]);
});

test("reverse returns a reversed array without mutating the input", () => {
  const input = [1, 2, 3];
  const result = chain(input).reverse().value();
  assert.deepEqual(result, [3, 2, 1]);
  assert.deepEqual(input, [1, 2, 3]);
});

// --- collection grouping / ordering ---

test("groupBy groups elements by iteratee result", () => {
  const result = chain([1, 2, 3, 4]).groupBy((n) => (n % 2 === 0 ? "even" : "odd")).value();
  assert.deepEqual(result, { odd: [1, 3], even: [2, 4] });
});

test("keyBy builds an object keyed by iteratee result", () => {
  const result = chain([{ id: "a" }, { id: "b" }]).keyBy("id").value();
  assert.deepEqual(result, { a: { id: "a" }, b: { id: "b" } });
});

test("countBy counts elements by iteratee result", () => {
  const result = chain([1, 2, 3, 4]).countBy((n) => (n % 2 === 0 ? "even" : "odd")).value();
  assert.deepEqual(result, { odd: 2, even: 2 });
});

test("sortBy sorts ascending by iteratee", () => {
  const result = chain([{ n: 3 }, { n: 1 }, { n: 2 }]).sortBy("n").value();
  assert.deepEqual(result, [{ n: 1 }, { n: 2 }, { n: 3 }]);
});

test("orderBy sorts by iteratees and orders", () => {
  const result = chain([{ n: 1 }, { n: 3 }, { n: 2 }]).orderBy(["n"], ["desc"]).value();
  assert.deepEqual(result, [{ n: 3 }, { n: 2 }, { n: 1 }]);
});

test("partition splits into matching and non-matching groups", () => {
  const result = chain([1, 2, 3, 4]).partition((n) => n % 2 === 0).value();
  assert.deepEqual(result, [[2, 4], [1, 3]]);
});

// --- object transforms ---

test("pick keeps only the requested paths", () => {
  const result = chain({ a: 1, b: 2, c: 3 }).pick(["a", "c"]).value();
  assert.deepEqual(result, { a: 1, c: 3 });
});

test("omit drops the requested paths", () => {
  const result = chain({ a: 1, b: 2, c: 3 }).omit(["b"]).value();
  assert.deepEqual(result, { a: 1, c: 3 });
});

test("keys returns own enumerable keys", () => {
  assert.deepEqual(chain({ a: 1, b: 2 }).keys().value(), ["a", "b"]);
});

test("values returns own enumerable values", () => {
  assert.deepEqual(chain({ a: 1, b: 2 }).values().value(), [1, 2]);
});

test("entries returns key/value pairs", () => {
  assert.deepEqual(chain({ a: 1, b: 2 }).entries().value(), [["a", 1], ["b", 2]]);
});

test("mapValues transforms each value", () => {
  const result = chain({ a: 1, b: 2 }).mapValues((v) => v * 10).value();
  assert.deepEqual(result, { a: 10, b: 20 });
});

test("mapKeys transforms each key", () => {
  const result = chain({ a: 1, b: 2 }).mapKeys((_v, k) => k.toUpperCase()).value();
  assert.deepEqual(result, { A: 1, B: 2 });
});

test("set assigns a value at a path and returns the mutated object via wrapper", () => {
  const result = chain({ a: { b: 1 } }).set("a.c", 2).value();
  assert.deepEqual(result, { a: { b: 1, c: 2 } });
});

// --- scalar-producing steps ---

test("reduce with a seed accumulates from the seed", () => {
  const result = chain([1, 2, 3, 4]).reduce((acc, n) => acc + n, 100).value();
  assert.equal(result, 110);
});

test("reduce without a seed uses the first element", () => {
  const result = chain([1, 2, 3, 4]).reduce((acc, n) => acc + n).value();
  assert.equal(result, 10);
});

test("reduce passing an explicit undefined seed still treats it as a seed", () => {
  // arguments.length is 2, so undefined is used as the accumulator.
  const result = chain([1, 2, 3]).reduce((acc) => acc, undefined).value();
  assert.equal(result, undefined);
});

test("find returns the first matching element", () => {
  const result = chain([1, 2, 3, 4]).find((n) => n > 2).value();
  assert.equal(result, 3);
});

test("find returns undefined when nothing matches", () => {
  const result = chain([1, 2, 3]).find((n) => n > 10).value();
  assert.equal(result, undefined);
});

test("get reads a nested path", () => {
  const result = chain({ a: { b: { c: 42 } } }).get("a.b.c").value();
  assert.equal(result, 42);
});

test("get returns the default value for a missing path", () => {
  const result = chain({ a: 1 }).get("x.y", "fallback").value();
  assert.equal(result, "fallback");
});

test("head returns the first element", () => {
  assert.equal(chain([10, 20, 30]).head().value(), 10);
});

test("head returns undefined for an empty array", () => {
  assert.equal(chain([]).head().value(), undefined);
});

test("last returns the last element", () => {
  assert.equal(chain([10, 20, 30]).last().value(), 30);
});

test("sum adds all numbers", () => {
  assert.equal(chain([1, 2, 3, 4]).sum().value(), 10);
});

test("mean averages all numbers", () => {
  assert.equal(chain([2, 4, 6]).mean().value(), 4);
});

test("mean of an empty array is NaN", () => {
  assert.ok(Number.isNaN(chain([]).mean().value()));
});

test("min returns the smallest number", () => {
  assert.equal(chain([3, 1, 2]).min().value(), 1);
});

test("max returns the largest number", () => {
  assert.equal(chain([3, 1, 2]).max().value(), 3);
});

test("size returns the count of elements", () => {
  assert.equal(chain([1, 2, 3]).size().value(), 3);
});

// --- generic helpers ---

test("tap runs a side effect and returns the same wrapper", () => {
  let captured;
  const wrapped = chain([1, 2, 3]);
  const returned = wrapped.tap((v) => {
    captured = v;
  });
  assert.deepEqual(captured, [1, 2, 3]);
  assert.equal(returned, wrapped);
});

test("thru replaces the wrapped value with fn(value)", () => {
  const result = chain([1, 2, 3]).thru((arr) => arr.length).value();
  assert.equal(result, 3);
});

// --- composition ---

test("methods compose left to right and each step returns a new wrapper", () => {
  const result = chain([1, 2, 3, 4, 5, 6])
    .filter((n) => n % 2 === 0)
    .map((n) => n * n)
    .sum()
    .value();
  assert.equal(result, 56);
});

test("each transform returns a distinct wrapper instance", () => {
  const a = chain([1, 2, 3]);
  const b = a.map((n) => n);
  assert.notEqual(a, b);
});
