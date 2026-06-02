// Type declarations for the OpenAPI -> two-go importer.

export interface OpenapiImportOptions {
  baseUrl?: string;
}

/** Convert a parsed OpenAPI 3 document into a two-go suite source string. */
export declare function fromOpenapi(spec: unknown, options?: OpenapiImportOptions): string;
