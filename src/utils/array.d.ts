// Type declarations for two-go array utilities (src/utils/array.js).

type ArrayIteratee<T> = ((value: T) => unknown) | string;

export declare function chunk<T>(arr: T[], size?: number): T[][];

export declare function compact<T>(arr: T[]): Array<NonNullable<T>>;

export declare function difference<T>(arr: T[], ...others: Array<T[] | T>): T[];

export declare function differenceBy<T>(arr: T[], values?: T[], iteratee?: ArrayIteratee<T>): T[];

export declare function drop<T>(arr: T[], n?: number): T[];

export declare function dropRight<T>(arr: T[], n?: number): T[];

export declare function take<T>(arr: T[], n?: number): T[];

export declare function takeRight<T>(arr: T[], n?: number): T[];

export declare function flatten<T>(arr: Array<T | T[]>): T[];

export declare function flattenDeep<T>(arr: ReadonlyArray<unknown>): T[];

export declare function head<T>(arr: T[]): T | undefined;

export declare function last<T>(arr: T[]): T | undefined;

export declare function initial<T>(arr: T[]): T[];

export declare function tail<T>(arr: T[]): T[];

export declare function uniq<T>(arr: T[]): T[];

export declare function uniqBy<T>(arr: T[], iteratee?: ArrayIteratee<T>): T[];

export declare function union<T>(...arrays: T[][]): T[];

export declare function unionBy<T>(...args: Array<T[] | ArrayIteratee<T>>): T[];

export declare function intersection<T>(...arrays: T[][]): T[];

export declare function intersectionBy<T>(...args: Array<T[] | ArrayIteratee<T>>): T[];

export declare function without<T>(arr: T[], ...values: T[]): T[];

export declare function zip<T>(...arrays: T[][]): Array<Array<T | undefined>>;

export declare function unzip<T>(arrays: T[][]): Array<Array<T | undefined>>;

export declare function fromPairs<V = unknown>(pairs: Array<[PropertyKey, V]>): Record<string, V>;

export declare function pull<T>(arr: T[], ...values: T[]): T[];

export declare function nth<T>(arr: T[], n?: number): T | undefined;

export declare function reverse<T>(arr: T[]): T[];

export declare function indexOfAll<T>(arr: T[], value: T): number[];
