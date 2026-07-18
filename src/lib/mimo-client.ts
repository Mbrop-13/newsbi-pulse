/**
 * Shared Xiaomi MiMo (Maverlang v2.5) chat completions helper.
 * Used by multi-agent brand analysis and other non-streaming batch calls.
 */

export interface MimoMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MimoOptions {
  model: string;
  messages: MimoMessage[];
  temperature?: number;
  max_tokens?: number;
  search?: boolean;
  user?: string;
}

export interface MimoResult {
  content: string;
  citations?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callMimo(options: MimoOptions): Promise<MimoResult> {
  const baseURL = process.env.LLM_BASE_URL || "https://api.xiaomimimo.com/v1";
  const apiKey = process.env.LLM_API_KEY || process.env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "API key is not defined in environment variables (LLM_API_KEY or MIMO_API_KEY)."
    );
  }

  const payload: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2500,
    user: options.user,
  };

  if (options.search) {
    payload.tools = [
      {
        type: "web_search",
        max_keyword: 3,
        force_search: false,
        limit: 2,
      },
    ];
  }

  const fetchUrl = `${baseURL.replace(/\/+$/, "")}/chat/completions`;
  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(300000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[Mimo API] ERROR ${response.status} for model "${options.model}":`,
      errorText.slice(0, 500)
    );
    throw new Error(
      `Mimo API error: ${response.status} ${response.statusText} (model: ${options.model})`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  const citations: string[] = [];
  const message = data.choices?.[0]?.message;
  if (message?.annotations) {
    for (const ann of message.annotations) {
      if (ann.type === "url_citation" && ann.url) {
        citations.push(ann.url);
      }
    }
  }

  return {
    content,
    citations: citations.length > 0 ? [...new Set(citations)] : undefined,
    usage: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens || 0,
          completion_tokens: data.usage.completion_tokens || 0,
          total_tokens: data.usage.total_tokens || 0,
        }
      : undefined,
  };
}

export function extractJsonObject(str: string): string {
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  return str;
}
