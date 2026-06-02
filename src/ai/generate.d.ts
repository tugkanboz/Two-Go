// Type declarations for AI test generation.
import type { Provider, ProviderOptions } from "./provider.js";

export interface GenerateOptions extends Omit<ProviderOptions, "provider"> {
  endpoint?: string;
  method?: string;
  baseUrl?: string;
  description?: string;
  sample?: unknown;
  instructions?: string;
  maxTokens?: number;
  // Either a ready Provider (e.g. for tests) or a provider name.
  provider?: Provider | ProviderOptions["provider"];
}

/** Generate a two-go *.twogo.mjs suite source from an endpoint or sample response. */
export declare function aiGenerateTests(options?: GenerateOptions): Promise<string>;
