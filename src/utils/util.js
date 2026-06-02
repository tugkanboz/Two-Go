// General-purpose functional utilities for two-go.
// Provides function helpers (identity, noop, flow, iteratee), value defaults,
// property accessors, and partial-match predicates. Shares deep equality with
// lang.js and path resolution with object.js so behavior stays consistent.

import { isEqual } from "./lang.js";
import { get } from "./object.js";

// Returns its first argument unchanged.
export function identity(x) {
  return x;
}

// Does nothing and returns undefined. Useful as a default callback.
export function noop() {}

// Returns a function that always returns the given value.
export function constant(x) {
  return () => x;
}

// Invokes fn n times, collecting each return value into an array.
export function times(n, fn) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(fn(i));
  }
  return result;
}

let idCounter = 0;

// Returns a unique string id, optionally prefixed, backed by a module counter.
export function uniqueId(prefix = "") {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

// Invokes fn with the given args, returning its result or the caught Error.
export function attempt(fn, ...args) {
  try {
    return fn(...args);
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

// Returns value unless it is null, undefined, or NaN, in which case returns fallback.
export function defaultTo(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" && Number.isNaN(value)) return fallback;
  return value;
}

// Returns a function that resolves the given path against its argument.
export function property(path) {
  return (o) => get(o, path);
}

// Returns a function that resolves a given path against the captured object.
export function propertyOf(obj) {
  return (path) => get(obj, path);
}

// Returns a predicate that deep partial-matches source against its argument.
// Every key in source must deep-equal the corresponding key in the target.
export function matches(source) {
  return (o) => {
    if (source === null || typeof source !== "object") {
      return isEqual(source, o);
    }
    if (o === null || typeof o !== "object") {
      return false;
    }
    for (const key of Object.keys(source)) {
      if (!isEqual(source[key], o[key])) {
        return false;
      }
    }
    return true;
  };
}

// Returns a predicate that deep-equals value against the path of its argument.
export function matchesProperty(path, value) {
  return (o) => isEqual(get(o, path), value);
}

// Coerces a value into a function: functions pass through, strings become
// property accessors, objects become partial-match predicates.
export function iteratee(value) {
  if (value === null || value === undefined) {
    return identity;
  }
  if (typeof value === "function") {
    return value;
  }
  if (typeof value === "string") {
    return property(value);
  }
  if (typeof value === "object") {
    return matches(value);
  }
  return property(value);
}

// Composes functions left-to-right: flow(f, g)(x) === g(f(x)).
export function flow(...fns) {
  return (...args) => {
    if (fns.length === 0) return args[0];
    let result = fns[0](...args);
    for (let i = 1; i < fns.length; i += 1) {
      result = fns[i](result);
    }
    return result;
  };
}

// Composes functions right-to-left: flowRight(f, g)(x) === f(g(x)).
export function flowRight(...fns) {
  return flow(...fns.slice().reverse());
}

// Builds a function from [predicate, transform] pairs, returning the first
// matching transform's result, or undefined if none match.
export function cond(pairs) {
  return (...args) => {
    for (const [predicate, transform] of pairs) {
      if (predicate(...args)) {
        return transform(...args);
      }
    }
    return undefined;
  };
}

// Returns a function that runs each function over the arguments, collecting
// every result into an array.
export function over(...fns) {
  return (...args) => fns.map((fn) => fn(...args));
}

// Returns a predicate that is true only when every predicate passes.
export function overEvery(...predicates) {
  return (...args) => predicates.every((predicate) => predicate(...args));
}

// Returns a predicate that is true when at least one predicate passes.
export function overSome(...predicates) {
  return (...args) => predicates.some((predicate) => predicate(...args));
}

// Always returns true.
export function stubTrue() {
  return true;
}

// Always returns false.
export function stubFalse() {
  return false;
}

// Always returns a new empty array.
export function stubArray() {
  return [];
}

// Always returns a new empty object.
export function stubObject() {
  return {};
}

// Always returns an empty string.
export function stubString() {
  return "";
}
