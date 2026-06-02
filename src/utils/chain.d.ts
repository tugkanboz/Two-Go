// Ambient declarations for the eager chaining wrapper (chain.js).

export type Iteratee<T, U> = ((value: T, index: number, coll: any) => U) | string;
export type Predicate<T> = ((value: T, index: number, coll: any) => unknown) | string;

export interface Wrapper {
  // --- collection / array transforms (return a new wrapper) ---
  map(iteratee: Iteratee<any, unknown>): Wrapper;
  filter(predicate: Predicate<any>): Wrapper;
  reject(predicate: Predicate<any>): Wrapper;
  forEach(iteratee: Iteratee<any, unknown>): this;
  some(predicate: Predicate<any>): Wrapper;
  every(predicate: Predicate<any>): Wrapper;
  uniq(): Wrapper;
  uniqBy(iteratee: Iteratee<any, unknown>): Wrapper;
  flatten(): Wrapper;
  flattenDeep(): Wrapper;
  chunk(chunkSize: number): Wrapper;
  compact(): Wrapper;
  groupBy(iteratee: Iteratee<any, unknown>): Wrapper;
  keyBy(iteratee: Iteratee<any, unknown>): Wrapper;
  countBy(iteratee: Iteratee<any, unknown>): Wrapper;
  orderBy(iteratees: unknown, orders?: unknown): Wrapper;
  sortBy(iteratees: unknown): Wrapper;
  partition(predicate: Predicate<any>): Wrapper;
  take(count: number): Wrapper;
  takeRight(count: number): Wrapper;
  drop(count: number): Wrapper;
  dropRight(count: number): Wrapper;
  reverse(): Wrapper;

  // --- object transforms (return a new wrapper) ---
  pick(paths: unknown): Wrapper;
  omit(paths: unknown): Wrapper;
  keys(): Wrapper;
  values(): Wrapper;
  entries(): Wrapper;
  mapValues(iteratee: Iteratee<any, unknown>): Wrapper;
  mapKeys(iteratee: Iteratee<any, unknown>): Wrapper;
  set(path: unknown, newValue: unknown): Wrapper;

  // --- scalar-producing steps (wrapped; unwrap with .value()) ---
  reduce(iteratee: Iteratee<any, unknown>, accumulator?: unknown): Wrapper;
  find(predicate: Predicate<any>): Wrapper;
  get(path: unknown, defaultValue?: unknown): Wrapper;
  head(): Wrapper;
  last(): Wrapper;
  sum(): Wrapper;
  mean(): Wrapper;
  min(): Wrapper;
  max(): Wrapper;
  size(): Wrapper;

  // --- generic helpers ---
  tap(fn: (value: unknown) => void): this;
  thru(fn: (value: unknown) => unknown): this;
  value(): unknown;
  valueOf(): unknown;
}

export declare function chain(value: unknown): Wrapper;
