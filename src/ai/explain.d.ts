// Type declarations for AI failure explanation.
import type { Provider, ProviderOptions } from "./provider.js";

export interface ExplainOptions extends Omit<ProviderOptions, "provider"> {
  response?: unknown;
  request?: unknown;
  maxTokens?: number;
  provider?: Provider | ProviderOptions["provider"];
}

/** Ask an LLM for the likely cause of a failed assertion and a suggested fix. */
export declare function explainFailure(error: unknown, options?: ExplainOptions): Promise<string>;
