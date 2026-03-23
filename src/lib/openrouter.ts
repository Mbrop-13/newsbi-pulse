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

  if (options.model.toLowerCase().includes('grok')) {
    payload.reasoning = { effort: 'none' };
  }

  if (options.search) {
    payload.plugins = [{ id: 'web' }];
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://programbi.com',
      'X-Title': 'NewsBI Pulse',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

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

