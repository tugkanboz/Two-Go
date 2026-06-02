// Ambient declarations for two-go string utilities (case conversion, trimming, padding, escaping, templating).

export declare function deburr(s: unknown): string;
export declare function words(s: unknown): string[];
export declare function upperFirst(s: unknown): string;
export declare function lowerFirst(s: unknown): string;
export declare function capitalize(s: unknown): string;
export declare function camelCase(s: unknown): string;
export declare function kebabCase(s: unknown): string;
export declare function snakeCase(s: unknown): string;
export declare function startCase(s: unknown): string;
export declare function upperCase(s: unknown): string;
export declare function lowerCase(s: unknown): string;
export declare function trim(s: unknown, chars?: string): string;
export declare function trimStart(s: unknown, chars?: string): string;
export declare function trimEnd(s: unknown, chars?: string): string;

export interface TruncateOptions {
  length?: number;
  omission?: string;
  separator?: string | RegExp;
}

export declare function truncate(s: unknown, options?: TruncateOptions): string;
export declare function pad(s: unknown, length: number, chars?: string): string;
export declare function padStart(s: unknown, length: number, chars?: string): string;
export declare function padEnd(s: unknown, length: number, chars?: string): string;
export declare function repeat(s: unknown, n: number): string;
export declare function escape(s: unknown): string;
export declare function unescape(s: unknown): string;
export declare function escapeRegExp(s: unknown): string;
export declare function startsWith(s: unknown, target: unknown, pos?: number): boolean;
export declare function endsWith(s: unknown, target: unknown, pos?: number): boolean;
export declare function template(str: unknown, data?: Record<string, unknown>): string;
