// Type declarations for eventual-consistency retry/poll helpers (two-go).

export interface EventuallyOptions {
  timeout?: number;
  interval?: number;
  message?: string;
}

export declare function eventually<T>(
  fn: () => T,
  options?: EventuallyOptions
): Promise<Awaited<T>>;

export declare const retryUntil: typeof eventually;

export declare function pollUntil<T>(
  fn: () => T,
  predicate: (result: Awaited<T>) => boolean,
  options?: EventuallyOptions
): Promise<Awaited<T>>;
