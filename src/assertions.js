// Core assertion primitives shared by GoResponse and RequestBuilder.
// These have no dependencies and are safe to use standalone.

// Error thrown by every failing assertion. Carries the expected/actual values
// so test runners (and humans) can inspect the mismatch.
export class AssertionError extends Error {
  constructor(message, { expected, actual } = {}) {
    super(message);
    this.name = "AssertionError";
    this.expected = expected;
    this.actual = actual;
  }
}

// Resolve a dot + bracket path against an object.
// Supports "data[0].user.name" and "items.2.id" styles.
// Returns undefined for any missing segment instead of throwing.
export function resolvePath(obj, path) {
  if (path === undefined || path === null || path === "") return obj;

  // Normalize bracket notation into dot notation: a[0].b -> a.0.b
  const normalized = String(path)
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/^\./, "");

  const segments = normalized.split(".");
  let current = obj;

  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    current = current[segment];
  }

  return current;
}

// Flexible value matcher used by expectJson / expectHeader / expectBody.
// - RegExp:   test against String(actual)
// - function: treat as predicate, truthy return means match
// - object/array: structural deepEqual
// - primitive: strict ===
export function matches(actual, expected) {
  if (expected instanceof RegExp) {
    return expected.test(String(actual));
  }
  if (typeof expected === "function") {
    return Boolean(expected(actual));
  }
  if (expected !== null && typeof expected === "object") {
    return deepEqual(actual, expected);
  }
  return actual === expected;
}

// Recursive structural equality. Compares own enumerable keys.
export function deepEqual(a, b) {
  if (a === b) return true;

  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
