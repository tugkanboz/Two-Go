// Type declarations for the Postman -> two-go importer.

export interface PostmanImportOptions {
  baseUrl?: string;
}

/** Convert a parsed Postman v2.1 collection into a two-go suite source string. */
export declare function fromPostman(collection: unknown, options?: PostmanImportOptions): string;
