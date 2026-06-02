// Type declarations for two-go numeric helpers.

export declare function toNumber(value: unknown): number;

export declare function toFinite(value: unknown): number;

export declare function clampToInt(value: unknown): number;

export declare function clamp(n: number, lower: number, upper: number): number;

export declare function inRange(n: number, start: number, end?: number): boolean;

export declare function random(lower?: number | boolean, upper?: number | boolean, floating?: boolean): number;

export declare function round(n: unknown, precision?: number): number;

export declare function floor(n: unknown, precision?: number): number;

export declare function ceil(n: unknown, precision?: number): number;

export declare function sum(array: readonly number[]): number;

export declare function sumBy<T>(array: readonly T[], iteratee: ((value: T, index: number, coll: any) => unknown) | string): number;

export declare function mean(array: readonly number[]): number;

export declare function meanBy<T>(array: readonly T[], iteratee: ((value: T, index: number, coll: any) => unknown) | string): number;

export declare function min<T>(array: readonly T[]): T | undefined;

export declare function minBy<T>(array: readonly T[], iteratee: ((value: T, index: number, coll: any) => unknown) | string): T | undefined;

export declare function max<T>(array: readonly T[]): T | undefined;

export declare function maxBy<T>(array: readonly T[], iteratee: ((value: T, index: number, coll: any) => unknown) | string): T | undefined;

export declare function range(start: number, end?: number, step?: number): number[];

export declare function rangeRight(start: number, end?: number, step?: number): number[];
