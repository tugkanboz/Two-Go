// Type declarations for lang.js - type guards, deep equality, and deep clone primitives.

/** Returns Object.prototype.toString tag for a value, e.g. "[object Date]". */
export declare function getTag(value: unknown): string;

/** Returns true when the value is a string primitive. */
export declare function isString(value: unknown): value is string;

/** Returns true when the value is a number primitive. */
export declare function isNumber(value: unknown): value is number;

/** Returns true when the value is an integer number. */
export declare function isInteger(value: unknown): value is number;

/** Returns true when the value is a boolean primitive. */
export declare function isBoolean(value: unknown): value is boolean;

/** Returns true when the value is null or undefined. */
export declare function isNil(value: unknown): value is null | undefined;

/** Returns true when the value is exactly null. */
export declare function isNull(value: unknown): value is null;

/** Returns true when the value is exactly undefined. */
export declare function isUndefined(value: unknown): value is undefined;

/** Returns true when the value is an array. */
export declare function isArray(value: unknown): value is unknown[];

/** Returns true for any non-null object or function. */
export declare function isObject(value: unknown): value is object;

/** Returns true only for plain objects ({} or Object.create(null)). */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;

/** Returns true when the value is callable. */
export declare function isFunction(value: unknown): value is (...args: unknown[]) => unknown;

/** Returns true when the value is a Date instance. */
export declare function isDate(value: unknown): value is Date;

/** Returns true when the value is a RegExp instance. */
export declare function isRegExp(value: unknown): value is RegExp;

/** Returns true when the value is an Error instance. */
export declare function isError(value: unknown): value is Error;

/** Returns true when the value is a Map instance. */
export declare function isMap(value: unknown): value is Map<unknown, unknown>;

/** Returns true when the value is a Set instance. */
export declare function isSet(value: unknown): value is Set<unknown>;

/** Returns true when the value is a symbol primitive. */
export declare function isSymbol(value: unknown): value is symbol;

/** Returns true when the value is a number and finite (no string coercion). */
export declare function isFinite(value: unknown): value is number;

/** Returns true when the value is a number and NaN (no string coercion). */
export declare function isNaN(value: unknown): value is number;

/** Returns true for nil, empty string/array/object, and empty Map/Set. */
export declare function isEmpty(value: unknown): boolean;

/** Deep equality with Object.is semantics for primitives; handles collections, Date, and RegExp. */
export declare function isEqual(a: unknown, b: unknown): boolean;

/** Deep clones arrays, plain objects, Date, RegExp, Map, and Set; primitives and functions are returned as-is. */
export declare function cloneDeep<T>(value: T): T;
