// Type declarations for snapshot.js - JSON snapshot testing for responses and arbitrary values.

export interface SnapshotOptions {
  dir?: string;
  update?: boolean;
}

export declare function readSnapshot(name: string, options?: SnapshotOptions): unknown;

export declare function toMatchSnapshot(value: unknown, name: string, options?: SnapshotOptions): unknown;

export declare const matchSnapshot: typeof toMatchSnapshot;
