// Unit tests for src/utils/lang.js
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getTag,
  isString,
  isNumber,
  isInteger,
  isBoolean,
  isNil,
  isNull,
  isUndefined,
  isArray,
  isObject,
  isPlainObject,
  isFunction,
  isDate,
  isRegExp,
  isError,
  isMap,
  isSet,
  isSymbol,
  isFinite,
  isNaN,
  isEmpty,
  isEqual,
  cloneDeep
} from "../../src/utils/lang.js";

test("getTag returns the Object.prototype.toString tag", () => {
  assert.equal(getTag(new Date()), "[object Date]");
  assert.equal(getTag([]), "[object Array]");
  assert.equal(getTag({}), "[object Object]");
  assert.equal(getTag(null), "[object Null]");
  assert.equal(getTag(undefined), "[object Undefined]");
  assert.equal(getTag(/x/), "[object RegExp]");
});

test("isString identifies string primitives", () => {
  assert.equal(isString(""), true);
  assert.equal(isString("hello"), true);
  assert.equal(isString(123), false);
  assert.equal(isString(new String("x")), false);
});

test("isNumber identifies number primitives including NaN", () => {
  assert.equal(isNumber(0), true);
  assert.equal(isNumber(-1.5), true);
  assert.equal(isNumber(Number.NaN), true);
  assert.equal(isNumber("1"), false);
  assert.equal(isNumber(null), false);
});

test("isInteger identifies integers", () => {
  assert.equal(isInteger(0), true);
  assert.equal(isInteger(-42), true);
  assert.equal(isInteger(3.14), false);
  assert.equal(isInteger(Number.NaN), false);
  assert.equal(isInteger("5"), false);
});

test("isBoolean identifies boolean primitives", () => {
  assert.equal(isBoolean(true), true);
  assert.equal(isBoolean(false), true);
  assert.equal(isBoolean(0), false);
  assert.equal(isBoolean("true"), false);
});

test("isNil is true for null and undefined only", () => {
  assert.equal(isNil(null), true);
  assert.equal(isNil(undefined), true);
  assert.equal(isNil(0), false);
  assert.equal(isNil(""), false);
  assert.equal(isNil(false), false);
});

test("isNull and isUndefined are exact", () => {
  assert.equal(isNull(null), true);
  assert.equal(isNull(undefined), false);
  assert.equal(isUndefined(undefined), true);
  assert.equal(isUndefined(null), false);
});

test("isArray identifies arrays", () => {
  assert.equal(isArray([]), true);
  assert.equal(isArray([1, 2]), true);
  assert.equal(isArray({}), false);
  assert.equal(isArray("abc"), false);
});

test("isObject is true for objects, arrays, and functions but not null", () => {
  assert.equal(isObject({}), true);
  assert.equal(isObject([]), true);
  assert.equal(isObject(() => {}), true);
  assert.equal(isObject(new Date()), true);
  assert.equal(isObject(null), false);
  assert.equal(isObject(42), false);
  assert.equal(isObject("x"), false);
});

test("isPlainObject is true only for plain objects", () => {
  assert.equal(isPlainObject({}), true);
  assert.equal(isPlainObject({ a: 1 }), true);
  assert.equal(isPlainObject(Object.create(null)), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(new Date()), false);
  assert.equal(isPlainObject(() => {}), false);
  assert.equal(isPlainObject(null), false);

  class Foo {}
  assert.equal(isPlainObject(new Foo()), false);
});

test("isFunction identifies callables", () => {
  assert.equal(isFunction(() => {}), true);
  assert.equal(isFunction(function named() {}), true);
  assert.equal(isFunction(class {}), true);
  assert.equal(isFunction({}), false);
  assert.equal(isFunction(null), false);
});

test("isDate identifies Date instances", () => {
  assert.equal(isDate(new Date()), true);
  assert.equal(isDate(Date.now()), false);
  assert.equal(isDate("2020-01-01"), false);
});

test("isRegExp identifies RegExp instances", () => {
  assert.equal(isRegExp(/x/), true);
  assert.equal(isRegExp(new RegExp("y")), true);
  assert.equal(isRegExp("x"), false);
});

test("isError identifies Error instances", () => {
  assert.equal(isError(new Error("boom")), true);
  assert.equal(isError(new TypeError("t")), true);
  assert.equal(isError({ message: "x" }), false);
});

test("isMap and isSet identify their collections", () => {
  assert.equal(isMap(new Map()), true);
  assert.equal(isMap(new Set()), false);
  assert.equal(isSet(new Set()), true);
  assert.equal(isSet(new Map()), false);
  assert.equal(isMap({}), false);
});

test("isSymbol identifies symbols", () => {
  assert.equal(isSymbol(Symbol("s")), true);
  assert.equal(isSymbol(Symbol.iterator), true);
  assert.equal(isSymbol("s"), false);
});

test("isFinite only accepts finite number primitives (no string coercion)", () => {
  assert.equal(isFinite(0), true);
  assert.equal(isFinite(1e10), true);
  assert.equal(isFinite(Infinity), false);
  assert.equal(isFinite(Number.NaN), false);
  assert.equal(isFinite("5"), false);
});

test("isNaN only accepts NaN number primitives (no string coercion)", () => {
  assert.equal(isNaN(Number.NaN), true);
  assert.equal(isNaN(0 / 0), true);
  assert.equal(isNaN(5), false);
  assert.equal(isNaN("not a number"), false);
  assert.equal(isNaN(undefined), false);
});

test("isEmpty handles nil, strings, arrays, objects, and collections", () => {
  assert.equal(isEmpty(null), true);
  assert.equal(isEmpty(undefined), true);
  assert.equal(isEmpty(""), true);
  assert.equal(isEmpty([]), true);
  assert.equal(isEmpty({}), true);
  assert.equal(isEmpty(new Map()), true);
  assert.equal(isEmpty(new Set()), true);

  assert.equal(isEmpty("a"), false);
  assert.equal(isEmpty([1]), false);
  assert.equal(isEmpty({ a: 1 }), false);
  assert.equal(isEmpty(new Map([["k", "v"]])), false);
  assert.equal(isEmpty(new Set([1])), false);
});

test("isEmpty returns false for non-nil numbers and booleans", () => {
  assert.equal(isEmpty(0), false);
  assert.equal(isEmpty(42), false);
  assert.equal(isEmpty(false), false);
  assert.equal(isEmpty(true), false);
});

test("isEqual handles primitives with Object.is semantics", () => {
  assert.equal(isEqual(1, 1), true);
  assert.equal(isEqual("a", "a"), true);
  assert.equal(isEqual(Number.NaN, Number.NaN), true);
  assert.equal(isEqual(0, -0), false);
  assert.equal(isEqual(1, 2), false);
  assert.equal(isEqual(null, undefined), false);
});

test("isEqual deep compares arrays and plain objects", () => {
  assert.equal(isEqual([1, 2, 3], [1, 2, 3]), true);
  assert.equal(isEqual([1, [2, 3]], [1, [2, 3]]), true);
  assert.equal(isEqual([1, 2], [1, 2, 3]), false);

  assert.equal(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }), true);
  assert.equal(isEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(isEqual({ a: 1 }, { b: 1 }), false);
});

test("isEqual distinguishes mismatched tags", () => {
  assert.equal(isEqual([], {}), false);
  assert.equal(isEqual(new Date(0), {}), false);
});

test("isEqual compares Date and RegExp by value", () => {
  assert.equal(isEqual(new Date(1000), new Date(1000)), true);
  assert.equal(isEqual(new Date(1000), new Date(2000)), false);
  assert.equal(isEqual(/abc/gi, /abc/gi), true);
  assert.equal(isEqual(/abc/g, /abc/i), false);
  assert.equal(isEqual(/abc/, /xyz/), false);
});

test("isEqual compares Map and Set by content", () => {
  assert.equal(
    isEqual(new Map([["a", 1]]), new Map([["a", 1]])),
    true
  );
  assert.equal(
    isEqual(new Map([["a", 1]]), new Map([["a", 2]])),
    false
  );
  assert.equal(
    isEqual(new Map([["a", 1]]), new Map([["b", 1]])),
    false
  );
  assert.equal(isEqual(new Set([1, 2, 3]), new Set([3, 2, 1])), true);
  assert.equal(isEqual(new Set([1, 2]), new Set([1, 2, 3])), false);
});

test("cloneDeep returns primitives and functions as-is", () => {
  const fn = () => {};
  assert.equal(cloneDeep(42), 42);
  assert.equal(cloneDeep("s"), "s");
  assert.equal(cloneDeep(null), null);
  assert.equal(cloneDeep(undefined), undefined);
  assert.equal(cloneDeep(fn), fn);
});

test("cloneDeep deep clones arrays and plain objects", () => {
  const source = { a: 1, b: [2, 3], c: { d: 4 } };
  const clone = cloneDeep(source);

  assert.deepEqual(clone, source);
  assert.notEqual(clone, source);
  assert.notEqual(clone.b, source.b);
  assert.notEqual(clone.c, source.c);

  clone.c.d = 99;
  clone.b.push(5);
  assert.equal(source.c.d, 4);
  assert.deepEqual(source.b, [2, 3]);
});

test("cloneDeep clones Date and RegExp into new instances", () => {
  const date = new Date(12345);
  const clonedDate = cloneDeep(date);
  assert.equal(clonedDate.getTime(), date.getTime());
  assert.notEqual(clonedDate, date);

  const re = /pattern/gi;
  const clonedRe = cloneDeep(re);
  assert.equal(clonedRe.source, re.source);
  assert.equal(clonedRe.flags, re.flags);
  assert.notEqual(clonedRe, re);
});

test("cloneDeep clones Map and Set deeply", () => {
  const map = new Map([["k", { v: 1 }]]);
  const clonedMap = cloneDeep(map);
  assert.notEqual(clonedMap, map);
  assert.notEqual(clonedMap.get("k"), map.get("k"));
  assert.deepEqual(clonedMap.get("k"), { v: 1 });

  const set = new Set([{ a: 1 }]);
  const clonedSet = cloneDeep(set);
  assert.notEqual(clonedSet, set);
  assert.equal(clonedSet.size, 1);
  assert.deepEqual([...clonedSet], [{ a: 1 }]);
});

test("cloneDeep result is independent and isEqual to source", () => {
  const source = {
    when: new Date(5000),
    re: /a/g,
    list: [1, { nested: true }],
    map: new Map([["x", 1]])
  };
  const clone = cloneDeep(source);
  assert.equal(isEqual(clone, source), true);

  clone.list[1].nested = false;
  assert.equal(source.list[1].nested, true);
});
