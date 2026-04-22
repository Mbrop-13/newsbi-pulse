export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  search?: boolean;
}

export async function callOpenRouter(options: OpenRouterOptions): Promise<{ 
  content: string, 
  usage?: { prompt_tokens: number, completion_tokens: number, total_tokens: number },
  citations?: string[]
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables.');
  }

  const payload: any = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
  };

  // Cost optimization for Grok models
  if (options.model.toLowerCase().includes('grok')) {
    payload.reasoning = { effort: 'none' }; // No chain-of-thought = fewer output tokens
    payload.provider = {
      order: ['xai'],           // Prefer direct XAI provider (cheapest)
      allow_fallbacks: true,
    };
  }

  if (options.search) {
    payload.plugins = [{ id: 'web' }];
  }

  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://reclu.com',
        'X-Title': 'Reclu',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000) // 120 second timeout
    });
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error(`OpenRouter API Timeout: The AI model (${options.model}) took too long to respond (>120s).`);
    }
    throw error;
  }

  // Retry on rate limit (429) or server errors (502/503) with exponential backoff
  if (response.status === 429 || response.status === 502 || response.status === 503) {
    const retryDelays = [5000, 10000, 20000]; // 5s, 10s, 20s
    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      console.warn(`[OpenRouter] ${response.status} — retrying in ${retryDelays[attempt] / 1000}s (attempt ${attempt + 2}/4)...`);
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      
      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://reclu.com',
            'X-Title': 'Reclu',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(120000)
        });
        if (response.ok) break;
        if (response.status !== 429 && response.status !== 502 && response.status !== 503) break;
      } catch (err: any) {
        if (attempt === retryDelays.length - 1) {
          throw new Error(`OpenRouter API Timeout on retry: The AI model (${options.model}) took too long to respond.`);
        }
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter Error:', errorText);
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Extract web search citations from the response (returned by :online models)
  const citations: string[] = [];
  if (Array.isArray(data.citations)) {
    citations.push(...data.citations);
  }
  // Also check message-level annotations
  const message = data.choices?.[0]?.message;
  if (message?.annotations) {
    for (const ann of message.annotations) {
      if (ann.type === 'url_citation' && ann.url_citation?.url) {
        citations.push(ann.url_citation.url);
      }
    }
  }
  
  if (citations.length > 0) {
    console.log(`[OpenRouter] Extracted ${citations.length} web search citations`);
  }

  return {
    content: message?.content || '',
    usage: data.usage,
    citations: citations.length > 0 ? [...new Set(citations)] : undefined
  };
}

