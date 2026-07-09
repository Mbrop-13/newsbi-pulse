import { createOpenAI } from '@ai-sdk/openai';
import { StreamData } from 'ai';

// Helper to safely decode escaped characters in JSON string slices
export function decodeJsonString(escapedStr: string): string {
  try {
    return JSON.parse('"' + escapedStr + '"');
  } catch {
    // Basic fallback if JSON parsing fails
    return escapedStr
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

// ── LLM client factory with web_search injection ──
export function createLlmWithWebSearch(userId: string, streamData?: StreamData, webSearchEnabled: boolean = true) {
  return createOpenAI({
    baseURL: process.env.LLM_BASE_URL || 'https://api.xiaomimimo.com/v1',
    apiKey: process.env.LLM_API_KEY || process.env.MIMO_API_KEY,
    fetch: async (url, options) => {
      // Intercept the request to inject the native web_search tool and user context
      if (options?.body && typeof options.body === 'string') {
        try {
          const body = JSON.parse(options.body);
          if (webSearchEnabled) {
            // Ensure tools array exists
            if (!body.tools) body.tools = [];
            // Inject the native web_search tool if not already present
            const hasWebSearch = body.tools.some((t: any) => t.type === 'web_search');
            if (!hasWebSearch) {
              body.tools.push({
                type: 'web_search',
                max_keyword: 3,
                force_search: false,
                limit: 1,
              });
            }
          } else {
            // Remove web_search tool if disabled
            if (body.tools) {
              body.tools = body.tools.filter((t: any) => t.type !== 'web_search');
            }
          }
          // Inject user identity for Xiaomi native edge rate-limiting and audit tracking
          body.user = userId;
          
          options.body = JSON.stringify(body);
        } catch {
          // If parsing fails, proceed with original request
        }
      }
      let res = await fetch(url, options);

      // If MiMo fails with payment/balance/server error, fall back to OpenRouter!
      if (!res.ok) {
        const clone = res.clone();
        try {
          const errText = await clone.text();
          let errBody = null;
          try { errBody = JSON.parse(errText); } catch {}
          const errMsg = errBody?.error?.message || errBody?.message || errText || "";
          
          if (res.status === 402 || errMsg.toLowerCase().includes("balance") || errMsg.toLowerCase().includes("insufficient")) {
            console.warn("[LLM-CLIENT] Insufficient balance or error from primary provider. Falling back to OpenRouter...");
            
            const urlString = typeof url === 'string' ? url : 'href' in url ? url.href : String(url);
            const currentBaseUrl = process.env.LLM_BASE_URL || 'https://api.xiaomimimo.com/v1';
            const openRouterUrl = urlString.replace(currentBaseUrl.replace(/\/+$/, ''), 'https://openrouter.ai/api/v1');
            const openRouterHeaders = new Headers(options?.headers);
            openRouterHeaders.set('Authorization', `Bearer ${process.env.OPENROUTER_API_KEY}`);
            openRouterHeaders.set('HTTP-Referer', 'https://maverlang.cl');
            openRouterHeaders.set('X-Title', 'Maverlang');
            
            let newBody = options?.body;
            if (options?.body && typeof options.body === 'string') {
              try {
                const body = JSON.parse(options.body);
                // Map models to OpenRouter fallback models
                if (body.model && body.model.includes("pro")) {
                  body.model = "google/gemini-2.5-pro";
                } else {
                  body.model = "google/gemini-2.5-flash";
                }
                newBody = JSON.stringify(body);
              } catch {}
            }
            
            res = await fetch(openRouterUrl, {
              ...options,
              headers: openRouterHeaders,
              body: newBody
            });
          }
        } catch (e) {
          console.error("[LLM-CLIENT] Failed to fall back to OpenRouter:", e);
        }
      }

      // If it's a stream, intercept chunks to extract MiMo's native web search annotations
      if (res.body && streamData) {
        const collectedUrls = new Set<string>();
        let buffer = "";
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            buffer += new TextDecoder().decode(chunk);
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              // Match any url_citation block and extract its url field
              const urlMatches = Array.from(line.matchAll(/"type"\s*:\s*"url_citation"[^}]*"url"\s*:\s*"([^"]+)"/g));
              for (const m of urlMatches) collectedUrls.add(m[1]);
              // Also try reversed key order (url before type)
              const urlMatchesRev = Array.from(line.matchAll(/"url"\s*:\s*"([^"]+)"[^}]*"type"\s*:\s*"url_citation"/g));
              for (const m of urlMatchesRev) collectedUrls.add(m[1]);

              // Match reasoning_content tokens and stream them to client
              const reasoningMatches = Array.from(line.matchAll(/"reasoning_content"\s*:\s*"((?:[^"\\]|\\.)*)"/g));
              for (const m of reasoningMatches) {
                const text = decodeJsonString(m[1]);
                if (text && text !== 'null') {
                  try {
                    streamData.append({ type: 'reasoning', text });
                  } catch {
                    // StreamData may already be closed/flushed
                  }
                }
              }
            }

            controller.enqueue(chunk);
          },
          flush() {
            // Process any remaining text in buffer
            if (buffer) {
              const urlMatches = Array.from(buffer.matchAll(/"type"\s*:\s*"url_citation"[^}]*"url"\s*:\s*"([^"]+)"/g));
              for (const m of urlMatches) collectedUrls.add(m[1]);
              const urlMatchesRev = Array.from(buffer.matchAll(/"url"\s*:\s*"([^"]+)"[^}]*"type"\s*:\s*"url_citation"/g));
              for (const m of urlMatchesRev) collectedUrls.add(m[1]);

              const reasoningMatches = Array.from(buffer.matchAll(/"reasoning_content"\s*:\s*"((?:[^"\\]|\\.)*)"/g));
              for (const m of reasoningMatches) {
                const text = decodeJsonString(m[1]);
                if (text && text !== 'null') {
                  try {
                    streamData.append({ type: 'reasoning', text });
                  } catch {}
                }
              }
            }

            try {
              if (collectedUrls.size > 0) {
                streamData.append({ type: 'citations', urls: Array.from(collectedUrls) });
              }
            } catch {
              // StreamData may already be closed by toDataStreamResponse
            }
          }
        });
        return new Response(res.body.pipeThrough(transformStream), {
          headers: res.headers,
          status: res.status,
          statusText: res.statusText
        });
      }

      return res;
    },
  });
}
