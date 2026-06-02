// Type declarations for the minimal standalone test runner module.

export interface SuiteApi {
  test(name: string, fn: () => unknown | Promise<unknown>): void;
  before(fn: () => unknown): void;
  after(fn: () => unknown): void;
}

export interface SuiteEntry {
  name: string;
  tests: Array<{ name: string; fn: () => unknown | Promise<unknown> }>;
  beforeHooks: Array<() => unknown>;
  afterHooks: Array<() => unknown>;
}

export interface RunResult {
  passed: number;
  failed: number;
}

export declare function suite(name: string, fn: (api: SuiteApi) => void): SuiteEntry;

export declare function run(): Promise<RunResult>;

export declare function reset(): void;
