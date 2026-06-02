// A tiny, provider-agnostic LLM client built on the native fetch. No SDK, no
// dependency. Bring your own API key. Supports OpenAI-compatible chat APIs and
// the Anthropic messages API, plus any custom baseURL (e.g. a local model).
//
// The fetch implementation is injectable so it can be stubbed in tests.

const DEFAULTS = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-5.3",
    env: "OPENAI_API_KEY",
  },
  anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    model: "claude-opus-4-8",
    env: "ANTHROPIC_API_KEY",
  },
};

// Create a provider with a single complete() method.
// options: { provider, apiKey, model, baseURL, fetch, temperature }
export function createProvider(options = {}) {
  const provider = options.provider || "openai";
  const cfg = DEFAULTS[provider] || DEFAULTS.openai;

  const usingCustomBase = Boolean(options.baseURL);
  const baseURL = (options.baseURL || cfg.baseURL).replace(/\/+$/, "");
  const model = options.model || cfg.model;
  const apiKey = options.apiKey || (cfg.env ? process.env[cfg.env] : undefined);
  const doFetch = options.fetch || globalThis.fetch;
  const temperature = options.temperature != null ? options.temperature : 0;

  if (typeof doFetch !== "function") {
    throw new Error("two-go ai: no fetch available; pass options.fetch or run on Node 18+");
  }
  if (!apiKey && !usingCustomBase) {
    throw new Error(
      `two-go ai: missing API key; set ${cfg.env} or pass { apiKey } (custom baseURL keys are optional)`
    );
  }

  // Send a prompt (string or messages array) and return the text reply.
  // opts: { system, maxTokens }
  async function complete(prompt, opts = {}) {
    const userMessages =
      typeof prompt === "string" ? [{ role: "user", content: prompt }] : prompt.slice();

    if (provider === "anthropic") {
      const res = await doFetch(`${baseURL}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: opts.maxTokens || 2048,
          temperature,
          ...(opts.system ? { system: opts.system } : {}),
          messages: userMessages.filter((m) => m.role !== "system"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`two-go ai: ${res.status} ${JSON.stringify(data)}`);
      return (data.content || []).map((part) => part.text || "").join("");
    }

    // OpenAI-compatible chat completions.
    const messages = opts.system
      ? [{ role: "system", content: opts.system }, ...userMessages]
      : userMessages;
    const res = await doFetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature,
        messages,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`two-go ai: ${res.status} ${JSON.stringify(data)}`);
    return (data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content) || "";
  }

  return { complete, provider, model, baseURL };
}
