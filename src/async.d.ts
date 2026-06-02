// Ambient declarations for async control-flow helpers in two-go (ESM, Node >= 18).
// Thunks/promises may be any PromiseLike (including the thenable RequestBuilder).

/** Runs all thunks concurrently and resolves to an ordered array; rejects on the first error. */
export declare function parallel<T>(tasks: Array<() => T | PromiseLike<T>>): Promise<Awaited<T>[]>;

/** Runs thunks with bounded concurrency, never exceeding "limit" at once, preserving result order. */
export declare function parallelLimit<T>(tasks: Array<() => T | PromiseLike<T>>, limit: number): Promise<Awaited<T>[]>;

/** Runs thunks sequentially and resolves to an ordered array of their results. */
export declare function series<T>(tasks: Array<() => T | PromiseLike<T>>): Promise<Awaited<T>[]>;

/** Runs thunks sequentially, passing each result to the next; resolves to the last result. */
export declare function waterfall(tasks: Array<(prev?: unknown) => unknown>): Promise<unknown>;

/** Concurrent map; calls fn(item, index) for each item, preserving order. */
export declare function mapAsync<T, U>(items: T[], fn: (item: T, index: number) => U | PromiseLike<U>): Promise<Awaited<U>[]>;

/** Bounded-concurrency map; never runs more than "limit" calls of fn(item, index) at once, preserving order. */
export declare function mapLimit<T, U>(items: T[], limit: number, fn: (item: T, index: number) => U | PromiseLike<U>): Promise<Awaited<U>[]>;

/** Rejects with Error(message) if the promise does not settle within ms; otherwise mirrors the promise. */
export declare function withTimeout<T>(promise: T | PromiseLike<T>, ms: number, message?: string): Promise<Awaited<T>>;

/** Runs fn over every item and resolves to an array of settled results, never rejecting. */
export declare function allSettledMap<T, U>(
  items: T[],
  fn: (item: T, index: number) => U | PromiseLike<U>
): Promise<Array<{ status: string; value?: Awaited<U>; reason?: unknown }>>;
