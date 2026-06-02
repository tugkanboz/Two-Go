// Object utilities: deep path access (get/set/has/unset), key/value helpers,
// pick/omit, deep and shallow merging, and small functional transforms.
// All type guards and deep clone come from lang.js (single source of truth).

import { isObject, isPlainObject, cloneDeep, isArray } from "./lang.js";

// Parse a dot/bracket path into an array of string segments.
// Accepts "a.b[0].c", "a.0.c", an already-split array, or a single key.
function parsePath(path) {
  if (isArray(path)) return path.map(String);
  if (path === undefined || path === null || path === "") return [];

  const normalized = String(path)
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/^\./, "");

  if (normalized === "") return [];
  return normalized.split(".");
}

// Decide whether a path segment should create an array (numeric) or object.
function shouldBeArrayKey(segment) {
  return /^\d+$/.test(segment);
}

// Read the value at a dot/bracket path; return defaultValue if any segment is missing.
export function get(obj, path, defaultValue) {
  const segments = parsePath(path);
  if (segments.length === 0) return obj === undefined ? defaultValue : obj;

  let current = obj;
  for (const segment of segments) {
    if (current === undefined || current === null) return defaultValue;
    current = current[segment];
  }

  return current === undefined ? defaultValue : current;
}

// Set the value at a dot/bracket path, creating intermediate objects/arrays.
// Mutates and returns obj.
export function set(obj, path, value) {
  const segments = parsePath(path);
  if (segments.length === 0) return obj;

  let current = obj;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const next = current[segment];

    if (next === undefined || next === null || typeof next !== "object") {
      current[segment] = shouldBeArrayKey(segments[i + 1]) ? [] : {};
    }
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
  return obj;
}

// Return true if a value exists at the given dot/bracket path.
export function has(obj, path) {
  const segments = parsePath(path);
  if (segments.length === 0) return false;

  let current = obj;
  for (const segment of segments) {
    if (current === undefined || current === null) return false;
    if (!Object.prototype.hasOwnProperty.call(current, segment)) return false;
    current = current[segment];
  }

  return true;
}

// Remove the value at the given dot/bracket path. Mutates obj; returns true if removed.
export function unset(obj, path) {
  const segments = parsePath(path);
  if (segments.length === 0) return false;

  let current = obj;
  for (let i = 0; i < segments.length - 1; i += 1) {
    if (current === undefined || current === null) return false;
    current = current[segments[i]];
  }

  if (current === undefined || current === null) return false;

  const last = segments[segments.length - 1];
  if (!Object.prototype.hasOwnProperty.call(current, last)) return false;

  delete current[last];
  return true;
}

// Return an array of the object's own enumerable keys.
export function keys(obj) {
  if (!isObject(obj)) return [];
  return Object.keys(obj);
}

// Return an array of the object's own enumerable values.
export function values(obj) {
  if (!isObject(obj)) return [];
  return Object.keys(obj).map((key) => obj[key]);
}

// Return an array of [key, value] pairs for the object's own enumerable properties.
export function entries(obj) {
  if (!isObject(obj)) return [];
  return Object.keys(obj).map((key) => [key, obj[key]]);
}

// Alias of entries: return [key, value] pairs.
export function toPairs(obj) {
  return entries(obj);
}

// Build an object from an iterable of [key, value] pairs.
export function fromEntries(pairs) {
  const result = {};
  if (pairs === undefined || pairs === null) return result;

  for (const pair of pairs) {
    if (!pair) continue;
    result[pair[0]] = pair[1];
  }

  return result;
}

// Normalize pick/omit arguments into a flat array of path strings.
function normalizePaths(paths) {
  if (paths.length === 1 && isArray(paths[0])) return paths[0];
  return paths;
}

// Return a new object containing only the given paths (array or rest of keys).
export function pick(obj, ...paths) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const path of normalizePaths(paths)) {
    if (has(obj, path)) {
      set(result, path, get(obj, path));
    }
  }

  return result;
}

// Return a new object with the own properties for which predicate(value, key) is truthy.
export function pickBy(obj, predicate) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const key of Object.keys(obj)) {
    if (predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

// Return a new object without the given paths (array or rest of keys).
export function omit(obj, ...paths) {
  if (!isObject(obj)) return {};

  const result = cloneDeep(obj);
  for (const path of normalizePaths(paths)) {
    unset(result, path);
  }

  return result;
}

// Return a new object with the own properties for which predicate(value, key) is falsy.
export function omitBy(obj, predicate) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const key of Object.keys(obj)) {
    if (!predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

// Recursively merge a single source's own enumerable properties into target.
function mergeInto(target, source) {
  if (!isObject(source)) return target;

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      mergeInto(targetValue, sourceValue);
    } else if (isArray(sourceValue) && isArray(targetValue)) {
      target[key] = mergeInto(targetValue, sourceValue);
    } else if (isPlainObject(sourceValue) || isArray(sourceValue)) {
      target[key] = mergeInto(isArray(sourceValue) ? [] : {}, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
}

// Deep-merge each source into target in order. Mutates and returns target.
export function merge(target, ...sources) {
  const base = isObject(target) ? target : {};
  for (const source of sources) {
    mergeInto(base, source);
  }
  return base;
}

// Deep-merge all objects into a brand new object without mutating any input.
export function mergeDeep(...objects) {
  const result = {};
  for (const object of objects) {
    mergeInto(result, object);
  }
  return result;
}

// Fill in missing (undefined) own properties of obj from the sources. Mutates and returns obj.
export function defaults(obj, ...sources) {
  const base = isObject(obj) ? obj : {};

  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (base[key] === undefined) {
        base[key] = source[key];
      }
    }
  }

  return base;
}

// Return a new object with the same keys, mapping each value through fn(value, key).
export function mapValues(obj, fn) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const key of Object.keys(obj)) {
    result[key] = fn(obj[key], key);
  }

  return result;
}

// Return a new object with the same values, mapping each key through fn(value, key).
export function mapKeys(obj, fn) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const key of Object.keys(obj)) {
    result[fn(obj[key], key)] = obj[key];
  }

  return result;
}

// Return a new object with keys and values swapped (values become string keys).
export function invert(obj) {
  const result = {};
  if (!isObject(obj)) return result;

  for (const key of Object.keys(obj)) {
    result[obj[key]] = key;
  }

  return result;
}

// Shallow-copy each source's own enumerable properties into target. Mutates and returns target.
export function assign(target, ...sources) {
  const base = isObject(target) ? target : {};

  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      base[key] = source[key];
    }
  }

  return base;
}

// Return a shallow copy of an object or array.
export function clone(obj) {
  if (isArray(obj)) return obj.slice();
  if (isObject(obj)) return { ...obj };
  return obj;
}

// Return the first key whose value satisfies predicate(value, key), or undefined.
export function findKey(obj, predicate) {
  if (!isObject(obj)) return undefined;

  for (const key of Object.keys(obj)) {
    if (predicate(obj[key], key)) return key;
  }

  return undefined;
}

// Iterate over an object's own enumerable properties, calling fn(value, key, obj).
// Returns obj. Stops early if fn returns false.
export function forOwn(obj, fn) {
  if (!isObject(obj)) return obj;

  for (const key of Object.keys(obj)) {
    if (fn(obj[key], key, obj) === false) break;
  }

  return obj;
}
