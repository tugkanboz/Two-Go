// Array utilities for two-go: chunking, set-like operations, flattening,
// slicing, uniqueness, and small helpers. Pure functions return new arrays
// unless the name implies mutation (e.g. "pull"). Deep comparisons for the
// *By/uniq family are delegated to isEqual from lang.js.

import { isEqual } from "./lang.js";

// Resolve an iteratee: a function is used as-is, a string becomes a simple
// property accessor.
function toIteratee(fn) {
  if (typeof fn === "function") return fn;
  if (fn == null) return (o) => o;
  return (o) => (o == null ? undefined : o[fn]);
}

// Split an array into groups of at most "size" elements.
export function chunk(arr, size = 1) {
  if (!Array.isArray(arr) || size < 1) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Return a new array with all falsy values removed.
export function compact(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean);
}

// Return values of the first array not present in any of the other arrays.
export function difference(arr, ...others) {
  if (!Array.isArray(arr)) return [];
  const exclude = others.flat();
  return arr.filter((item) => !exclude.some((other) => isEqual(item, other)));
}

// Like difference, but comparison is done on the result of running each
// element through the iteratee.
export function differenceBy(arr, values = [], iteratee) {
  if (!Array.isArray(arr)) return [];
  const fn = toIteratee(iteratee);
  const excluded = (Array.isArray(values) ? values : []).map(fn);
  return arr.filter((item) => {
    const computed = fn(item);
    return !excluded.some((other) => isEqual(computed, other));
  });
}

// Return a new array with the first n elements dropped.
export function drop(arr, n = 1) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(Math.max(n, 0));
}

// Return a new array with the last n elements dropped.
export function dropRight(arr, n = 1) {
  if (!Array.isArray(arr)) return [];
  const end = arr.length - Math.max(n, 0);
  return arr.slice(0, Math.max(end, 0));
}

// Return a new array with the first n elements taken.
export function take(arr, n = 1) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, Math.max(n, 0));
}

// Return a new array with the last n elements taken.
export function takeRight(arr, n = 1) {
  if (!Array.isArray(arr)) return [];
  const count = Math.max(n, 0);
  if (count === 0) return [];
  return arr.slice(Math.max(arr.length - count, 0));
}

// Flatten the array a single level deep.
export function flatten(arr) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      for (const inner of item) result.push(inner);
    } else {
      result.push(item);
    }
  }
  return result;
}

// Flatten the array recursively until no nested arrays remain.
export function flattenDeep(arr) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

// Return the first element of the array.
export function head(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[0];
}

// Return the last element of the array.
export function last(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[arr.length - 1];
}

// Return a new array containing all elements except the last.
export function initial(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, -1);
}

// Return a new array containing all elements except the first.
export function tail(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(1);
}

// Return a new array with duplicate values removed (deep equality).
export function uniq(arr) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (const item of arr) {
    if (!result.some((seen) => isEqual(seen, item))) result.push(item);
  }
  return result;
}

// Like uniq, but uniqueness is based on the result of the iteratee.
export function uniqBy(arr, iteratee) {
  if (!Array.isArray(arr)) return [];
  const fn = toIteratee(iteratee);
  const computedSeen = [];
  const result = [];
  for (const item of arr) {
    const computed = fn(item);
    if (!computedSeen.some((seen) => isEqual(seen, computed))) {
      computedSeen.push(computed);
      result.push(item);
    }
  }
  return result;
}

// Return the unique union of all provided arrays (deep equality).
export function union(...arrays) {
  return uniq(arrays.flat());
}

// Return the unique union of arrays where the last argument is the iteratee.
export function unionBy(...args) {
  if (args.length === 0) return [];
  const maybeIteratee = args[args.length - 1];
  let arrays = args;
  let iteratee;
  if (typeof maybeIteratee === "function" || typeof maybeIteratee === "string") {
    iteratee = maybeIteratee;
    arrays = args.slice(0, -1);
  }
  return uniqBy(arrays.flat(), iteratee);
}

// Return values present in every provided array (deep equality).
export function intersection(...arrays) {
  const lists = arrays.filter(Array.isArray);
  if (lists.length === 0) return [];
  const [first, ...rest] = lists;
  const result = [];
  for (const item of first) {
    const inAll = rest.every((other) => other.some((o) => isEqual(o, item)));
    if (inAll && !result.some((seen) => isEqual(seen, item))) result.push(item);
  }
  return result;
}

// Like intersection, but matching is based on the iteratee (last argument).
export function intersectionBy(...args) {
  if (args.length === 0) return [];
  const maybeIteratee = args[args.length - 1];
  let arrays = args;
  let iteratee;
  if (typeof maybeIteratee === "function" || typeof maybeIteratee === "string") {
    iteratee = maybeIteratee;
    arrays = args.slice(0, -1);
  }
  const fn = toIteratee(iteratee);
  const lists = arrays.filter(Array.isArray);
  if (lists.length === 0) return [];
  const [first, ...rest] = lists;
  const restComputed = rest.map((other) => other.map(fn));
  const result = [];
  const seenComputed = [];
  for (const item of first) {
    const computed = fn(item);
    const inAll = restComputed.every((vals) =>
      vals.some((v) => isEqual(v, computed))
    );
    if (inAll && !seenComputed.some((seen) => isEqual(seen, computed))) {
      seenComputed.push(computed);
      result.push(item);
    }
  }
  return result;
}

// Return a new array excluding the given values (deep equality).
export function without(arr, ...values) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => !values.some((value) => isEqual(item, value)));
}

// Group elements of the provided arrays by index.
export function zip(...arrays) {
  const lists = arrays.filter(Array.isArray);
  if (lists.length === 0) return [];
  const length = Math.max(...lists.map((list) => list.length));
  const result = [];
  for (let i = 0; i < length; i += 1) {
    result.push(lists.map((list) => list[i]));
  }
  return result;
}

// Inverse of zip: regroup zipped tuples back into per-position arrays.
export function unzip(arrays) {
  if (!Array.isArray(arrays) || arrays.length === 0) return [];
  const groups = arrays.filter(Array.isArray);
  if (groups.length === 0) return [];
  const length = Math.max(...groups.map((group) => group.length));
  const result = [];
  for (let i = 0; i < length; i += 1) {
    result.push(groups.map((group) => group[i]));
  }
  return result;
}

// Build an object from an array of [key, value] pairs.
export function fromPairs(pairs) {
  const result = {};
  if (!Array.isArray(pairs)) return result;
  for (const pair of pairs) {
    if (Array.isArray(pair)) result[pair[0]] = pair[1];
  }
  return result;
}

// Remove all given values from the array in place (deep equality). Mutates.
export function pull(arr, ...values) {
  if (!Array.isArray(arr)) return arr;
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    if (values.some((value) => isEqual(arr[i], value))) arr.splice(i, 1);
  }
  return arr;
}

// Return the element at index n, supporting negative indices from the end.
export function nth(arr, n = 0) {
  if (!Array.isArray(arr)) return undefined;
  const index = n < 0 ? arr.length + n : n;
  return arr[index];
}

// Return a new array with the elements in reverse order (input untouched).
export function reverse(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice().reverse();
}

// Return all indices at which value occurs (deep equality).
export function indexOfAll(arr, value) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (isEqual(arr[i], value)) result.push(i);
  }
  return result;
}
