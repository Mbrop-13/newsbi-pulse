import { createOpenAI } from '@ai-sdk/openai';
import { StreamData } from 'ai';
import { apiKeyRotator } from '@/lib/services/api-key-rotator';

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

// ── LLM client factory with web_search injection and Silent Multi-Account Key Failover ──
export function createLlmWithWebSearch(userId: string, streamData?: StreamData, webSearchEnabled: boolean = true) {
  // Obtain initial active key from the rotator pool
  const initialKeyInfo = apiKeyRotator.getActiveKey();
  const initialApiKey = initialKeyInfo.key || process.env.LLM_API_KEY || process.env.MIMO_API_KEY || '';

  return createOpenAI({
    baseURL: process.env.LLM_BASE_URL || 'https://api.xiaomimimo.com/v1',
    apiKey: initialApiKey,
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
          // Inject user identity for Xiaomi/OpenCode native edge rate-limiting and audit tracking
          body.user = userId;
          
          options.body = JSON.stringify(body);
        } catch {
          // If parsing fails, proceed with original request
        }
      }

      // Ensure headers have active API Key dynamically from rotator
      let currentKeyInfo = apiKeyRotator.getActiveKey();
      let currentKey = currentKeyInfo.key || initialApiKey;
      const headers = new Headers(options?.headers);
      if (currentKey) {
        headers.set('Authorization', `Bearer ${currentKey}`);
      }

      let res = await fetch(url, { ...options, headers });

      // ── Key Pool Failover Loop: Retry transparently across available keys if rate-limited ──
      const totalKeysInPool = apiKeyRotator.getKeyCount();
      let attempt = 0;

      while (!res.ok && attempt < totalKeysInPool) {
        const clone = res.clone();
        let errMsg = '';
        try {
          const errText = await clone.text();
          try {
            const errBody = JSON.parse(errText);
            errMsg = errBody?.error?.message || errBody?.message || errText;
          } catch {
            errMsg = errText;
          }
        } catch {
          errMsg = '';
        }

        // Check if error is rate limit, quota, balance or 429/402/403
        if (apiKeyRotator.isRateLimitOrQuotaError(res.status, errMsg)) {
          attempt++;
          if (attempt < totalKeysInPool) {
            console.warn(
              `[LLM-CLIENT] Rate limit/quota error on key attempt #${attempt} (Status: ${res.status}). Performing silent failover to next key...`
            );
            // Mark key as exhausted and get next key
            const nextKeyInfo = apiKeyRotator.markKeyExhausted(currentKey);
            currentKey = nextKeyInfo.nextKey;

            if (currentKey) {
              const retryHeaders = new Headers(options?.headers);
              retryHeaders.set('Authorization', `Bearer ${currentKey}`);
              res = await fetch(url, { ...options, headers: retryHeaders });
              continue;
            }
          }
        }

        // Break if error is not rate-limit related or no more keys in pool to retry
        break;
      }

      // ── Secondary Fallback Provider: OpenRouter ──
      // If all primary pool keys fail or respond with insufficient balance, fall back to OpenRouter
      if (!res.ok) {
        const clone = res.clone();
        try {
          const errText = await clone.text();
          let errBody = null;
          try { errBody = JSON.parse(errText); } catch {}
          const errMsg = errBody?.error?.message || errBody?.message || errText || "";
          
          if (res.status === 402 || res.status === 429 || apiKeyRotator.isRateLimitOrQuotaError(res.status, errMsg)) {
            console.warn("[LLM-CLIENT] All primary OpenCode/LLM keys exhausted or rate-limited. Falling back silently to OpenRouter...");
            
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

      // If it's a stream, intercept chunks to extract native web search annotations and reasoning
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
