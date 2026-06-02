// Type declarations for soft assertions: collect failures, then verify() throws once.
import type { Expectation } from "./expect.js";

/**
 * A chainable soft wrapper exposing the same matcher names as Expectation.
 * Each matcher records failures instead of throwing and returns the wrapper
 * to allow continued chaining. The `not` accessor yields a negated wrapper
 * sharing the same failures array.
 */
export type SoftWrapper = {
  [K in Exclude<keyof Expectation, "not" | "resolves" | "rejects">]: Expectation[K] extends (
    ...args: infer A
  ) => unknown
    ? (...args: A) => SoftWrapper
    : (...args: unknown[]) => SoftWrapper;
} & {
  readonly not: SoftWrapper;
};

/** A soft assertion context returned by soft(). */
export interface SoftInstance {
  expect: (value: unknown) => SoftWrapper;
  verify: () => void;
  failures: string[];
}

/**
 * Create a soft assertion context. `expect(value)` yields a chainable soft
 * wrapper, `failures` holds recorded messages, and `verify()` throws a single
 * AssertionError if any failures were recorded.
 */
export declare function soft(): SoftInstance;

/**
 * Run `fn` with a soft context, passing the soft expect as the first argument
 * and the full soft instance as the second, then verify() so all failures
 * surface together.
 */
export declare function softly(
  fn: (expect: (value: unknown) => SoftWrapper, ctx: SoftInstance) => void
): void;
