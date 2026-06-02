// Type declarations for AI bug catching: response review and fuzz payloads.
import type { Provider, ProviderOptions } from "./provider.js";

export interface Finding {
  severity: "low" | "medium" | "high";
  field: string | null;
  message: string;
}

export interface ReviewOptions extends Omit<ProviderOptions, "provider"> {
  context?: string;
  maxTokens?: number;
  provider?: Provider | ProviderOptions["provider"];
}

export interface FuzzOptions extends Omit<ProviderOptions, "provider"> {
  endpoint?: string;
  method?: string;
  schema?: unknown;
  sample?: unknown;
  count?: number;
  instructions?: string;
  maxTokens?: number;
  provider?: Provider | ProviderOptions["provider"];
}

/** Review a response with an LLM and return a list of likely problems. */
export declare function aiReview(response: unknown, options?: ReviewOptions): Promise<Finding[]>;

/** Generate adversarial request payloads to probe an endpoint. */
export declare function aiFuzz(options?: FuzzOptions): Promise<unknown[]>;
