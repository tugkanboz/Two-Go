// Type declarations for the two-go core assertion primitives.

export declare class AssertionError extends Error {
  name: "AssertionError";
  expected: unknown;
  actual: unknown;
  constructor(message: string, options?: { expected?: unknown; actual?: unknown });
}

export declare function resolvePath(obj: unknown, path?: string | null): unknown;

export declare function matches(actual: unknown, expected: unknown): boolean;

export declare function deepEqual(a: unknown, b: unknown): boolean;
