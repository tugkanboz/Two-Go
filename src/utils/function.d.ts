// Ambient declarations for two-go function utilities (control flow & timing).

export type AnyFunction = (...args: any[]) => any;

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface DebouncedFunction<T extends AnyFunction> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
}

export interface ThrottledFunction<T extends AnyFunction> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
}

export interface MemoizedFunction<T extends AnyFunction> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
  cache: Map<unknown, ReturnType<T>>;
}

export interface RetryOptions {
  retries?: number;
  delay?: number;
  factor?: number;
  onError?: (error: unknown, attempt: number) => void;
}

export declare function debounce<T extends AnyFunction>(
  fn: T,
  wait: number,
  options?: DebounceOptions
): DebouncedFunction<T>;

export declare function throttle<T extends AnyFunction>(
  fn: T,
  wait: number,
  options?: ThrottleOptions
): ThrottledFunction<T>;

export declare function once<T extends AnyFunction>(
  fn: T
): (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T>;

export declare function memoize<T extends AnyFunction>(
  fn: T,
  resolver?: (this: ThisParameterType<T>, ...args: Parameters<T>) => unknown
): MemoizedFunction<T>;

export declare function curry<T extends AnyFunction>(
  fn: T,
  arity?: number
): (...args: any[]) => any;

export declare function partial<T extends AnyFunction>(
  fn: T,
  ...args: any[]
): (...rest: any[]) => ReturnType<T>;

export declare function partialRight<T extends AnyFunction>(
  fn: T,
  ...args: any[]
): (...rest: any[]) => ReturnType<T>;

export declare function delay<A extends any[]>(
  fn: (...args: A) => unknown,
  ms: number,
  ...args: A
): ReturnType<typeof setTimeout>;

export declare function defer<A extends any[]>(
  fn: (...args: A) => unknown,
  ...args: A
): ReturnType<typeof setTimeout>;

export declare function sleep(ms: number): Promise<void>;

export declare function retry<T>(
  fn: (attempt: number) => T | Promise<T>,
  options?: RetryOptions
): Promise<T>;

export declare function flip<T extends AnyFunction>(
  fn: T
): (this: ThisParameterType<T>, ...args: any[]) => ReturnType<T>;

export declare function negate<T extends (...args: any[]) => unknown>(
  predicate: T
): (this: ThisParameterType<T>, ...args: Parameters<T>) => boolean;

export declare function wrap<V, A extends any[], R>(
  value: V,
  wrapper: (value: V, ...args: A) => R
): (...args: A) => R;

export declare function after<T extends AnyFunction>(
  n: number,
  fn: T
): (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T> | undefined;

export declare function before<T extends AnyFunction>(
  n: number,
  fn: T
): (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T> | undefined;
