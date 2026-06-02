// Eager chaining wrapper for the data utilities.
//
// `chain(value)` returns a small immutable wrapper. Every chainable method
// applies the matching util to the current value and returns a NEW wrapper
// holding the result, so chains read top-to-bottom and never mutate the
// original input. Computation is eager: each step runs immediately rather
// than building a lazy pipeline.
//
// Some methods produce scalars (reduce, find, sum, min, max, size, get,
// head, last). They still return a wrapper so the API stays uniform; call
// `.value()` (or `.valueOf()`) at the end to unwrap whatever the chain holds.

import {
  uniq,
  uniqBy,
  flatten,
  flattenDeep,
  chunk,
  compact,
  take,
  takeRight,
  drop,
  dropRight,
  head,
  last,
  reverse,
} from "./array.js";

import {
  map,
  filter,
  reject,
  reduce,
  forEach,
  find,
  some,
  every,
  groupBy,
  keyBy,
  countBy,
  orderBy,
  sortBy,
  partition,
  size,
} from "./collection.js";

import {
  pick,
  omit,
  get,
  set,
  keys,
  values,
  entries,
  mapValues,
  mapKeys,
} from "./object.js";

import {
  sum,
  mean,
  min,
  max,
} from "./number.js";

// Wrap a raw value in a chain. Use the returned object's methods to transform
// the value step by step, then call `.value()` to read the final result.
export function chain(value) {
  return createWrapper(value);
}

// Build a fresh wrapper around `value`. Internal: callers use `chain()`.
function createWrapper(value) {
  // Apply `fn` to the current value (plus extra args) and wrap the result.
  const step = (fn, ...args) => createWrapper(fn(value, ...args));

  return {
    // --- collection / array transforms (return a new wrapper) ---

    map(iteratee) {
      return step(map, iteratee);
    },
    filter(predicate) {
      return step(filter, predicate);
    },
    reject(predicate) {
      return step(reject, predicate);
    },
    forEach(iteratee) {
      forEach(value, iteratee);
      return this;
    },
    some(predicate) {
      return step(some, predicate);
    },
    every(predicate) {
      return step(every, predicate);
    },
    uniq() {
      return step(uniq);
    },
    uniqBy(iteratee) {
      return step(uniqBy, iteratee);
    },
    flatten() {
      return step(flatten);
    },
    flattenDeep() {
      return step(flattenDeep);
    },
    chunk(chunkSize) {
      return step(chunk, chunkSize);
    },
    compact() {
      return step(compact);
    },
    groupBy(iteratee) {
      return step(groupBy, iteratee);
    },
    keyBy(iteratee) {
      return step(keyBy, iteratee);
    },
    countBy(iteratee) {
      return step(countBy, iteratee);
    },
    orderBy(iteratees, orders) {
      return step(orderBy, iteratees, orders);
    },
    sortBy(iteratees) {
      return step(sortBy, iteratees);
    },
    partition(predicate) {
      return step(partition, predicate);
    },
    take(count) {
      return step(take, count);
    },
    takeRight(count) {
      return step(takeRight, count);
    },
    drop(count) {
      return step(drop, count);
    },
    dropRight(count) {
      return step(dropRight, count);
    },
    reverse() {
      return step(reverse);
    },

    // --- object transforms (return a new wrapper) ---

    pick(paths) {
      return step(pick, paths);
    },
    omit(paths) {
      return step(omit, paths);
    },
    keys() {
      return step(keys);
    },
    values() {
      return step(values);
    },
    entries() {
      return step(entries);
    },
    mapValues(iteratee) {
      return step(mapValues, iteratee);
    },
    mapKeys(iteratee) {
      return step(mapKeys, iteratee);
    },
    set(path, newValue) {
      return step(set, path, newValue);
    },

    // --- scalar-producing steps (wrapped; unwrap with .value()) ---

    reduce(iteratee, accumulator) {
      // arguments.length lets us distinguish "no seed" from "seed === undefined".
      if (arguments.length < 2) {
        return step(reduce, iteratee);
      }
      return step(reduce, iteratee, accumulator);
    },
    find(predicate) {
      return step(find, predicate);
    },
    get(path, defaultValue) {
      return step(get, path, defaultValue);
    },
    head() {
      return step(head);
    },
    last() {
      return step(last);
    },
    sum() {
      return step(sum);
    },
    mean() {
      return step(mean);
    },
    min() {
      return step(min);
    },
    max() {
      return step(max);
    },
    size() {
      return step(size);
    },

    // --- generic helpers ---

    // Run `fn(value)` for its side effects, then return the same wrapper.
    tap(fn) {
      fn(value);
      return this;
    },

    // Replace the wrapped value with `fn(value)` and return a new wrapper.
    thru(fn) {
      return createWrapper(fn(value));
    },

    // Unwrap and return the current value.
    value() {
      return value;
    },

    // Alias of `value()`; lets the wrapper coerce naturally where a primitive
    // is expected.
    valueOf() {
      return value;
    },
  };
}
