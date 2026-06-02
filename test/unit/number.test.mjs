// Unit tests for src/utils/number.js
// Uses node:test and node:assert/strict only. No two-go internals used to assert.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  toNumber,
  toFinite,
  clampToInt,
  clamp,
  inRange,
  random,
  round,
  floor,
  ceil,
  sum,
  sumBy,
  mean,
  meanBy,
  min,
  minBy,
  max,
  maxBy,
  range,
  rangeRight,
} from "../../src/utils/number.js";

test("toNumber: returns numbers as-is including NaN", () => {
  assert.equal(toNumber(42), 42);
  assert.equal(toNumber(-3.5), -3.5);
  assert.ok(Number.isNaN(toNumber(NaN)));
});

test("toNumber: parses numeric strings and handles non-numeric inputs", () => {
  assert.equal(toNumber("10"), 10);
  assert.equal(toNumber("  3.25  "), 3.25);
  assert.ok(Number.isNaN(toNumber("abc")));
});

test("toNumber: symbol, null and undefined map to NaN", () => {
  assert.ok(Number.isNaN(toNumber(Symbol("x"))));
  assert.ok(Number.isNaN(toNumber(null)));
  assert.ok(Number.isNaN(toNumber(undefined)));
});

test("toNumber: objects use valueOf", () => {
  const boxed = { valueOf: () => 7 };
  assert.equal(toNumber(boxed), 7);
  // Plain object without numeric valueOf falls back to String(...) -> NaN.
  assert.ok(Number.isNaN(toNumber({})));
});

test("toFinite: maps NaN to 0 and infinities to safe bounds", () => {
  assert.equal(toFinite("abc"), 0);
  assert.equal(toFinite(Infinity), Number.MAX_VALUE);
  assert.equal(toFinite(-Infinity), -Number.MAX_VALUE);
  assert.equal(toFinite(5.5), 5.5);
});

test("clampToInt: truncates toward zero after coercion", () => {
  assert.equal(clampToInt(4.9), 4);
  assert.equal(clampToInt(-4.9), -4);
  assert.equal(clampToInt("abc"), 0);
  assert.equal(clampToInt(Infinity), Math.trunc(Number.MAX_VALUE));
});

test("clamp: keeps values inside inclusive bounds", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(99, 0, 10), 10);
});

test("clamp: normalizes reversed bounds", () => {
  assert.equal(clamp(5, 10, 0), 5);
  assert.equal(clamp(-1, 10, 0), 0);
  assert.equal(clamp(50, 10, 0), 10);
});

test("inRange: two-arg form treats end as exclusive from 0", () => {
  assert.equal(inRange(3, 5), true);
  assert.equal(inRange(5, 5), false);
  assert.equal(inRange(-1, 5), false);
});

test("inRange: three-arg form uses [start, end)", () => {
  assert.equal(inRange(4, 2, 6), true);
  assert.equal(inRange(2, 2, 6), true);
  assert.equal(inRange(6, 2, 6), false);
});

test("inRange: normalizes reversed bounds", () => {
  assert.equal(inRange(3, 6, 2), true);
  assert.equal(inRange(6, 6, 2), false);
});

test("random: integer result stays within inclusive bounds", () => {
  for (let i = 0; i < 50; i += 1) {
    const value = random(1, 5);
    assert.ok(Number.isInteger(value));
    assert.ok(value >= 1 && value <= 5);
  }
});

test("random: equal bounds return that exact value", () => {
  assert.equal(random(3, 3), 3);
});

test("random: floating flag yields a value within bounds", () => {
  for (let i = 0; i < 50; i += 1) {
    const value = random(0, 1, true);
    assert.ok(value >= 0 && value < 1);
  }
});

test("random: random(true) returns a float in [0, 1)", () => {
  for (let i = 0; i < 50; i += 1) {
    const value = random(true);
    assert.ok(value >= 0 && value < 1);
  }
});

test("round: rounds to given precision", () => {
  assert.equal(round(4.006), 4);
  assert.equal(round(4.006, 2), 4.01);
  assert.equal(round(4060, -2), 4100);
});

test("floor: floors to given precision", () => {
  assert.equal(floor(4.006), 4);
  assert.equal(floor(0.046, 2), 0.04);
  assert.equal(floor(4060, -2), 4000);
});

test("ceil: ceils to given precision", () => {
  assert.equal(ceil(4.006), 5);
  assert.equal(ceil(6.004, 2), 6.01);
  assert.equal(ceil(6040, -2), 6100);
});

test("round: NaN input with precision propagates NaN", () => {
  assert.ok(Number.isNaN(round("abc", 2)));
});

test("sum: adds numeric entries", () => {
  assert.equal(sum([1, 2, 3, 4]), 10);
  assert.equal(sum([]), 0);
});

test("sum: non-array returns 0", () => {
  assert.equal(sum(null), 0);
  assert.equal(sum(undefined), 0);
});

test("sumBy: function iteratee", () => {
  const objects = [{ n: 4 }, { n: 6 }];
  assert.equal(sumBy(objects, (o) => o.n), 10);
});

test("sumBy: string path iteratee with bracket notation", () => {
  const data = [{ a: { b: 2 } }, { a: { b: 3 } }];
  assert.equal(sumBy(data, "a.b"), 5);
  const nested = [{ items: [{ id: 10 }] }, { items: [{ id: 20 }] }];
  assert.equal(sumBy(nested, "items[0].id"), 30);
});

test("mean: average of values, NaN for empty", () => {
  assert.equal(mean([2, 4, 6]), 4);
  assert.ok(Number.isNaN(mean([])));
});

test("meanBy: average via iteratee", () => {
  const objects = [{ n: 4 }, { n: 6 }, { n: 8 }];
  assert.equal(meanBy(objects, "n"), 6);
});

test("min/max: basic numeric arrays", () => {
  assert.equal(min([4, 2, 8, 6]), 2);
  assert.equal(max([4, 2, 8, 6]), 8);
});

test("min/max: undefined for empty arrays", () => {
  assert.equal(min([]), undefined);
  assert.equal(max([]), undefined);
});

test("minBy/maxBy: return the item with the smallest/largest mapped value", () => {
  const objects = [{ n: 1 }, { n: 2 }, { n: 3 }];
  assert.deepEqual(minBy(objects, "n"), { n: 1 });
  assert.deepEqual(maxBy(objects, "n"), { n: 3 });
});

test("minBy/maxBy: undefined for empty arrays", () => {
  assert.equal(minBy([], "n"), undefined);
  assert.equal(maxBy([], "n"), undefined);
});

test("range: ascending sequence excluding end", () => {
  assert.deepEqual(range(0, 4), [0, 1, 2, 3]);
  assert.deepEqual(range(1, 5), [1, 2, 3, 4]);
});

test("range: single argument starts from 0", () => {
  assert.deepEqual(range(4), [0, 1, 2, 3]);
});

test("range: custom step", () => {
  assert.deepEqual(range(0, 10, 2), [0, 2, 4, 6, 8]);
});

test("range: descending when end is below start", () => {
  assert.deepEqual(range(4, 0), [4, 3, 2, 1]);
});

test("rangeRight: same values populated from the end backwards", () => {
  assert.deepEqual(rangeRight(0, 4), [3, 2, 1, 0]);
});

test("rangeRight: with step", () => {
  assert.deepEqual(rangeRight(0, 10, 2), [8, 6, 4, 2, 0]);
});
