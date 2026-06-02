// Type declarations for curl export and request/response logging helpers.

export declare function toCurl(request: any): string;

export declare function enableLogging(
  client: any,
  options?: { logger?: any; label?: string }
): () => void;
