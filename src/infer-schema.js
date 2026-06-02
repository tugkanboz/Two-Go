// Infer a JSON Schema from an example value (a contract-testing helper).
// The produced schema only uses keywords understood by src/schema.js, so any
// inferred schema can be fed straight into validate() to lock down a contract.

import { GoResponse } from "./response.js";
import { resolvePath } from "./assertions.js";

// Infer a schema object from a single example value.
export function inferSchema(value) {
  if (value === null) return { type: "null" };

  const type = typeOf(value);

  if (type === "object") {
    const keys = Object.keys(value);
    const properties = {};
    for (const key of keys) {
      properties[key] = inferSchema(value[key]);
    }
    return { type: "object", properties, required: keys };
  }

  if (type === "array") {
    if (value.length === 0) return { type: "array" };
    const merged = mergeSchemas(value.map((item) => inferSchema(item)));
    return { type: "array", items: merged };
  }

  return { type };
}

// Resolve the schema "type" keyword for a non-null, non-undefined value.
function typeOf(value) {
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "number") return Number.isInteger(value) ? "integer" : "number";
  if (t === "boolean") return "boolean";
  if (t === "string") return "string";
  if (t === "object") return "object";
  // Fall back to string for anything else (e.g. bigint, symbol, function).
  return "string";
}

// Merge a list of element schemas into a single items schema.
// If the elements disagree, fall back to the first element schema.
function mergeSchemas(schemas) {
  const first = schemas[0];
  const allSame = schemas.every((schema) => sameSchema(schema, first));
  return allSame ? first : first;
}

// Structural equality check for two inferred schemas.
function sameSchema(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!sameSchema(a[key], b[key])) return false;
  }

  return true;
}

// Plugin-style extension: infer a schema directly from a GoResponse body,
// optionally narrowed to a dot/bracket path within the parsed body.
GoResponse.prototype.toSchema = function (path) {
  return inferSchema(path == null ? this.body : resolvePath(this.body, path));
};