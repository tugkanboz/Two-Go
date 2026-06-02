// Type declarations for the two-go AI provider layer.

export interface ProviderOptions {
  provider?: "openai" | "anthropic" | string;
  apiKey?: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
  fetch?: typeof fetch;
}

export interface CompleteOptions {
  system?: string;
  maxTokens?: number;
}

export type ChatMessage = { role: string; content: string };

export interface Provider {
  complete(prompt: string | ChatMessage[], opts?: CompleteOptions): Promise<string>;
  provider: string;
  model: string;
  baseURL: string;
}

/** Create a fetch-based, provider-agnostic LLM client. */
export declare function createProvider(options?: ProviderOptions): Provider;
