// Type declarations for the built-in runner reporters.

export interface TestResult {
  suite: string;
  name: string;
  status: "passed" | "failed";
  durationMs: number;
  error: string | null;
}

export interface RunResult {
  passed: number;
  failed: number;
  tests: TestResult[];
}

/** Render a run() result as JUnit XML. */
export declare function toJUnit(result: RunResult): string;

/** Render a run() result as JSON. */
export declare function toJSON(result: RunResult): string;
