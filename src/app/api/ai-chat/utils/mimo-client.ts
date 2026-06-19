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

// ── MiMo client factory with web_search injection ──
export function createMimoWithWebSearch(userId: string, streamData?: StreamData, webSearchEnabled: boolean = true) {
  return createOpenAI({
    baseURL: 'https://api.xiaomimimo.com/v1',
    apiKey: process.env.MIMO_API_KEY,
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
      const res = await fetch(url, options);

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
