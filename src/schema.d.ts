// Type declarations for the tiny JSON-schema-style validator in schema.js.

export type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export interface Schema {
  type?: SchemaType;
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  const?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  nullable?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export declare function validate(value: unknown, schema: Schema): ValidationResult;

export declare function isValid(value: unknown, schema: Schema): boolean;
