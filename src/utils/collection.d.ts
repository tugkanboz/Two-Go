// Ambient declarations for two-go collection helpers over arrays and plain objects.

export type Collection<T> = T[] | Record<string, T> | null | undefined;

type CollIteratee<T, R> = ((value: T, key: any, coll: any) => R) | string;

export declare function forEach<T extends Collection<any>>(
  coll: T,
  fn: (value: any, key: any, coll: any) => void
): T;

export declare function map<T, R>(
  coll: Collection<T>,
  fn: CollIteratee<T, R>
): R[];

export declare function filter<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): T[];

export declare function reject<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): T[];

export declare function reduce<T, A>(
  coll: Collection<T>,
  fn: (accumulator: A, value: T, key: any, coll: any) => A,
  acc: A
): A;
export declare function reduce<T>(
  coll: Collection<T>,
  fn: (accumulator: T, value: T, key: any, coll: any) => T
): T | undefined;

export declare function reduceRight<T, A>(
  coll: Collection<T>,
  fn: (accumulator: A, value: T, key: any, coll: any) => A,
  acc: A
): A;
export declare function reduceRight<T>(
  coll: Collection<T>,
  fn: (accumulator: T, value: T, key: any, coll: any) => T
): T | undefined;

export declare function find<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): T | undefined;

export declare function findLast<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): T | undefined;

export declare function some<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): boolean;

export declare function every<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): boolean;

export declare function includes<T>(coll: Collection<T>, value: unknown): boolean;

export declare function groupBy<T>(
  coll: Collection<T>,
  iteratee?: CollIteratee<T, unknown>
): Record<string, T[]>;

export declare function keyBy<T>(
  coll: Collection<T>,
  iteratee?: CollIteratee<T, unknown>
): Record<string, T>;

export declare function countBy<T>(
  coll: Collection<T>,
  iteratee?: CollIteratee<T, unknown>
): Record<string, number>;

export declare function orderBy<T>(
  coll: Collection<T>,
  iteratees: CollIteratee<T, unknown> | Array<CollIteratee<T, unknown>>,
  orders?: Array<"asc" | "desc">
): T[];

export declare function sortBy<T>(
  coll: Collection<T>,
  iteratees: CollIteratee<T, unknown> | Array<CollIteratee<T, unknown>>
): T[];

export declare function partition<T>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => unknown
): [T[], T[]];

export declare function flatMap<T, R>(
  coll: Collection<T>,
  fn: (value: T, key: any, coll: any) => R | R[]
): R[];

export declare function size(coll: Collection<unknown> | string | null | undefined): number;

export declare function sample<T>(coll: Collection<T>): T | undefined;

export declare function sampleSize<T>(coll: Collection<T>, n: number): T[];

export declare function shuffle<T>(coll: Collection<T>): T[];
