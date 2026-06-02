// lang.js - Shared language helpers: type guards, deep equality, and deep clone.
// This module is the single source of truth for these primitives and imports nothing.

/** Returns Object.prototype.toString tag for a value, e.g. "[object Date]". */
export function getTag(value) {
  return Object.prototype.toString.call(value);
}

/** Returns true when the value is a string primitive. */
export function isString(value) {
  return typeof value === "string";
}

/** Returns true when the value is a number primitive. */
export function isNumber(value) {
  return typeof value === "number";
}

/** Returns true when the value is an integer number. */
export function isInteger(value) {
  return Number.isInteger(value);
}

/** Returns true when the value is a boolean primitive. */
export function isBoolean(value) {
  return typeof value === "boolean";
}

/** Returns true when the value is null or undefined. */
export function isNil(value) {
  return value === null || value === undefined;
}

/** Returns true when the value is exactly null. */
export function isNull(value) {
  return value === null;
}

/** Returns true when the value is exactly undefined. */
export function isUndefined(value) {
  return value === undefined;
}

/** Returns true when the value is an array. */
export function isArray(value) {
  return Array.isArray(value);
}

/** Returns true for any non-null object or function. */
export function isObject(value) {
  if (value === null) {
    return false;
  }
  const type = typeof value;
  return type === "object" || type === "function";
}

/** Returns true only for plain objects ({} or Object.create(null)). */
export function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (getTag(value) !== "[object Object]") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  return proto === Object.prototype;
}

/** Returns true when the value is callable. */
export function isFunction(value) {
  return typeof value === "function";
}

/** Returns true when the value is a Date instance. */
export function isDate(value) {
  return getTag(value) === "[object Date]";
}

/** Returns true when the value is a RegExp instance. */
export function isRegExp(value) {
  return getTag(value) === "[object RegExp]";
}

/** Returns true when the value is an Error instance. */
export function isError(value) {
  return getTag(value) === "[object Error]";
}

/** Returns true when the value is a Map instance. */
export function isMap(value) {
  return getTag(value) === "[object Map]";
}

/** Returns true when the value is a Set instance. */
export function isSet(value) {
  return getTag(value) === "[object Set]";
}

/** Returns true when the value is a symbol primitive. */
export function isSymbol(value) {
  return typeof value === "symbol";
}

/** Returns true when the value is a number and finite (no string coercion). */
export function isFinite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** Returns true when the value is a number and NaN (no string coercion). */
export function isNaN(value) {
  return typeof value === "number" && Number.isNaN(value);
}

/** Returns true for nil, empty string/array/object, and empty Map/Set. */
export function isEmpty(value) {
  if (isNil(value)) {
    return true;
  }
  if (isString(value) || isArray(value)) {
    return value.length === 0;
  }
  if (isMap(value) || isSet(value)) {
    return value.size === 0;
  }
  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }
  return false;
}

/** Deep equality with Object.is semantics for primitives; handles collections, Date, and RegExp. */
export function isEqual(a, b) {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  const tag = getTag(a);
  if (tag !== getTag(b)) {
    return false;
  }

  if (tag === "[object Date]") {
    return a.getTime() === b.getTime();
  }

  if (tag === "[object RegExp]") {
    return a.source === b.source && a.flags === b.flags;
  }

  if (isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!isEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (tag === "[object Map]") {
    if (a.size !== b.size) {
      return false;
    }
    for (const [key, value] of a) {
      if (!b.has(key) || !isEqual(value, b.get(key))) {
        return false;
      }
    }
    return true;
  }

  if (tag === "[object Set]") {
    if (a.size !== b.size) {
      return false;
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
    if (!isEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/** Deep clones arrays, plain objects, Date, RegExp, Map, and Set; primitives and functions are returned as-is. */
export function cloneDeep(value) {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const tag = getTag(value);

  if (tag === "[object Date]") {
    return new Date(value.getTime());
  }

  if (tag === "[object RegExp]") {
    return new RegExp(value.source, value.flags);
  }

  if (isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }

  if (tag === "[object Map]") {
    const result = new Map();
    for (const [key, item] of value) {
      result.set(cloneDeep(key), cloneDeep(item));
    }
    return result;
  }

  if (tag === "[object Set]") {
    const result = new Set();
    for (const item of value) {
      result.add(cloneDeep(item));
    }
    return result;
  }

  const result = {};
  for (const key of Object.keys(value)) {
    result[key] = cloneDeep(value[key]);
  }
  return result;
}
