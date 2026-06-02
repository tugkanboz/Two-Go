// Ambient declarations for two-go general-purpose functional utilities.

type UtilIteratee<T = unknown, U = unknown> =
  | ((value: T, index: number, coll: any) => U)
  | string
  | object;

export declare function identity<T>(x: T): T;

export declare function noop(): void;

export declare function constant<T>(x: T): () => T;

export declare function times<T>(n: number, fn: (i: number) => T): T[];

export declare function uniqueId(prefix?: string): string;

export declare function attempt<T>(fn: (...args: any[]) => T, ...args: any[]): T | Error;

export declare function defaultTo<T, U>(value: T, fallback: U): NonNullable<T> | U;

export declare function property<T = unknown>(path: string | ReadonlyArray<string | number>): (o: unknown) => T;

export declare function propertyOf<T = unknown>(obj: unknown): (path: string | ReadonlyArray<string | number>) => T;

export declare function matches(source: unknown): (o: unknown) => boolean;

export declare function matchesProperty(path: string | ReadonlyArray<string | number>, value: unknown): (o: unknown) => boolean;

export declare function iteratee(value: unknown): (...args: any[]) => unknown;

export declare function flow(...fns: ReadonlyArray<(...args: any[]) => any>): (...args: any[]) => unknown;

export declare function flowRight(...fns: ReadonlyArray<(...args: any[]) => any>): (...args: any[]) => unknown;

export declare function cond<T = unknown>(
  pairs: ReadonlyArray<[(...args: any[]) => boolean, (...args: any[]) => T]>,
): (...args: any[]) => T | undefined;

export declare function over<T = unknown>(...fns: ReadonlyArray<(...args: any[]) => T>): (...args: any[]) => T[];

export declare function overEvery(...predicates: ReadonlyArray<(...args: any[]) => boolean>): (...args: any[]) => boolean;

export declare function overSome(...predicates: ReadonlyArray<(...args: any[]) => boolean>): (...args: any[]) => boolean;

export declare function stubTrue(): true;

export declare function stubFalse(): false;

export declare function stubArray(): never[];

export declare function stubObject(): {};

export declare function stubString(): string;
