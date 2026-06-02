// Type declarations for the Jest-style standalone assertion API in expect.js.

/** Async view of the matchers: each runs after awaiting the wrapped promise. */
export interface AsyncMatchers {
  toBe(expected: unknown): Promise<void>;
  toEqual(expected: unknown): Promise<void>;
  toStrictEqual(expected: unknown): Promise<void>;
  toBeTruthy(): Promise<void>;
  toBeFalsy(): Promise<void>;
  toBeNull(): Promise<void>;
  toBeUndefined(): Promise<void>;
  toBeDefined(): Promise<void>;
  toBeNaN(): Promise<void>;
  toBeGreaterThan(n: number | bigint): Promise<void>;
  toBeGreaterThanOrEqual(n: number | bigint): Promise<void>;
  toBeLessThan(n: number | bigint): Promise<void>;
  toBeLessThanOrEqual(n: number | bigint): Promise<void>;
  toBeCloseTo(n: number, digits?: number): Promise<void>;
  toContain(item: unknown): Promise<void>;
  toContainEqual(item: unknown): Promise<void>;
  toMatch(regexpOrString: RegExp | string): Promise<void>;
  toMatchObject(obj: object): Promise<void>;
  toHaveLength(n: number): Promise<void>;
  toHaveProperty(path: string | Array<string | number>, ...rest: [value?: unknown]): Promise<void>;
  toBeInstanceOf(cls: Function): Promise<void>;
  toBeType(typeName: string): Promise<void>;
  toBeOneOf(arr: readonly unknown[]): Promise<void>;
  toThrow(expected?: string | RegExp | Function | unknown): Promise<void>;
  toSatisfy(predicate: (value: unknown) => unknown): Promise<void>;
  toBeEmpty(): Promise<void>;
  /** Inverts pass/fail for the async matchers. */
  readonly not: AsyncMatchers;
}

export declare class Expectation {
  value: unknown;
  negated: boolean;
  constructor(value: unknown, negated?: boolean);

  /** Returns an Expectation whose matchers invert pass/fail. */
  get not(): Expectation;

  /** Async view: awaits the promise, then runs matchers against the resolved value. */
  get resolves(): AsyncMatchers;

  /** Async view: awaits the promise expecting rejection, then runs matchers against the reason. */
  get rejects(): AsyncMatchers;

  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeNaN(): void;
  toBeGreaterThan(n: number | bigint): void;
  toBeGreaterThanOrEqual(n: number | bigint): void;
  toBeLessThan(n: number | bigint): void;
  toBeLessThanOrEqual(n: number | bigint): void;
  toBeCloseTo(n: number, digits?: number): void;
  toContain(item: unknown): void;
  toContainEqual(item: unknown): void;
  toMatch(regexpOrString: RegExp | string): void;
  toMatchObject(obj: object): void;
  toHaveLength(n: number): void;
  toHaveProperty(path: string | Array<string | number>, ...rest: [value?: unknown]): void;
  toBeInstanceOf(cls: Function): void;
  toBeType(typeName: string): void;
  toBeOneOf(arr: readonly unknown[]): void;
  toThrow(expected?: string | RegExp | Function | unknown): void;
  toSatisfy(predicate: (value: unknown) => unknown): void;
  toBeEmpty(): void;
}

/** Entry point: wrap a value in an Expectation. */
export declare function expect(value: unknown): Expectation;
