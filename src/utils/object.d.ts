// Type declarations for object utilities: deep path access, pick/omit, merge, and transforms.

export type PropertyPath = string | number | ReadonlyArray<string | number>;

export declare function get(obj: unknown, path: PropertyPath, defaultValue?: unknown): unknown;

export declare function set<T>(obj: T, path: PropertyPath, value: unknown): T;

export declare function has(obj: unknown, path: PropertyPath): boolean;

export declare function unset(obj: unknown, path: PropertyPath): boolean;

export declare function keys(obj: unknown): string[];

export declare function values(obj: unknown): unknown[];

export declare function entries(obj: unknown): Array<[string, unknown]>;

export declare function toPairs(obj: unknown): Array<[string, unknown]>;

export declare function fromEntries(
  pairs: Iterable<readonly [PropertyKey, unknown]> | null | undefined
): Record<string, unknown>;

export declare function pick(obj: unknown, ...paths: Array<PropertyPath>): Record<string, unknown>;

export declare function pickBy(
  obj: unknown,
  predicate: (value: unknown, key: string) => unknown
): Record<string, unknown>;

export declare function omit(obj: unknown, ...paths: Array<PropertyPath>): Record<string, unknown>;

export declare function omitBy(
  obj: unknown,
  predicate: (value: unknown, key: string) => unknown
): Record<string, unknown>;

export declare function merge(target: unknown, ...sources: unknown[]): Record<string, unknown>;

export declare function mergeDeep(...objects: unknown[]): Record<string, unknown>;

export declare function defaults(obj: unknown, ...sources: unknown[]): Record<string, unknown>;

export declare function mapValues<U>(
  obj: unknown,
  fn: (value: unknown, key: string) => U
): Record<string, U>;

export declare function mapKeys(
  obj: unknown,
  fn: (value: unknown, key: string) => PropertyKey
): Record<string, unknown>;

export declare function invert(obj: unknown): Record<string, string>;

export declare function assign(target: unknown, ...sources: unknown[]): Record<string, unknown>;

export declare function clone<T>(obj: T): T;

export declare function findKey(
  obj: unknown,
  predicate: (value: unknown, key: string) => unknown
): string | undefined;

export declare function forOwn<T>(
  obj: T,
  fn: (value: unknown, key: string, obj: T) => unknown
): T;
