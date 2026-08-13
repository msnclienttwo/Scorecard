export type AIProviderId = "openai" | "gemini" | "claude" | "ollama";

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;
  isConfigured(): boolean;
  complete(
    system: string,
    prompt: string,
    opts?: AIRequestOptions
  ): Promise<string>;
}

function readJson<T>(res: Response): Promise<T> {
  return res.json().catch(() => ({} as T));
}

async function assertOk(res: Response, label: string): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${label} request failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

const OpenAIProvider: AIProvider = {
  id: "openai",
  name: "OpenAI",
  isConfigured: () => !!process.env.OPENAI_API_KEY,
  async complete(system, prompt, opts) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 300,
      }),
    });
    await assertOk(res, "OpenAI");
    const data = await readJson<{
      choices?: { message?: { content?: string } }[];
    }>(res);
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("OpenAI returned an empty response.");
    return content.trim();
  },
};

const GeminiProvider: AIProvider = {
  id: "gemini",
  name: "Google Gemini",
  isConfigured: () => !!process.env.GEMINI_API_KEY,
  async complete(system, prompt, opts) {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts?.temperature ?? 0.7,
          maxOutputTokens: opts?.maxTokens ?? 300,
        },
      }),
    });
    await assertOk(res, "Gemini");
    const data = await readJson<{
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }>(res);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Gemini returned an empty response.");
    return text.trim();
  },
};

const ClaudeProvider: AIProvider = {
  id: "claude",
  name: "Anthropic Claude",
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  async complete(system, prompt, opts) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: opts?.maxTokens ?? 300,
        temperature: opts?.temperature ?? 0.7,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    await assertOk(res, "Claude");
    const data = await readJson<{ content?: { text?: string }[] }>(res);
    const text = data.content?.[0]?.text ?? "";
    if (!text) throw new Error("Claude returned an empty response.");
    return text.trim();
  },
};

const OllamaProvider: AIProvider = {
  id: "ollama",
  name: "Ollama (local)",
  isConfigured: () => true,
  async complete(system, prompt, opts) {
    const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3.2",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        stream: false,
        options: { temperature: opts?.temperature ?? 0.7 },
      }),
    });
    await assertOk(res, "Ollama");
    const data = await readJson<{ message?: { content?: string } }>(res);
    const text = data.message?.content ?? "";
    if (!text) throw new Error("Ollama returned an empty response.");
    return text.trim();
  },
};

export const AI_PROVIDERS: AIProvider[] = [
  OpenAIProvider,
  GeminiProvider,
  ClaudeProvider,
  OllamaProvider,
];

const PROVIDER_MAP = new Map(AI_PROVIDERS.map((p) => [p.id, p]));

export function getAIProvider(id?: string | null): AIProvider | undefined {
  if (id && PROVIDER_MAP.has(id as AIProviderId)) {
    return PROVIDER_MAP.get(id as AIProviderId);
  }
  return undefined;
}

export function getConfiguredProviders(): AIProvider[] {
  return AI_PROVIDERS.filter((p) => p.isConfigured());
}

export function isAnyAIProviderConfigured(): boolean {
  return getConfiguredProviders().length > 0;
}

export function isAIProviderConfigured(id?: string | null): boolean {
  const provider = getAIProvider(id);
  return provider ? provider.isConfigured() : false;
}

export function providerName(id?: string | null): string {
  return getAIProvider(id)?.name ?? "AI";
}

export function resolveProvider(id?: string | null): AIProvider | undefined {
  const provider = getAIProvider(id);
  if (provider && provider.isConfigured()) return provider;
  return undefined;
}
