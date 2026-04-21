import { callOpenRouter } from '../openrouter';
import { createClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────

export interface RawArticle {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  imageUrl?: string | null;
  sourceUrl?: string;
  feed_tag?: string;
  country_code?: string;
  language?: string;
}

export interface FinalNewsArticle {
  title: string;
  content: string;
  summary: string;
  category: string;
  sources: { name: string; url: string }[];
  ai_model: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance_score: number;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  imageUrl?: string | null;
  slug: string;
  feed_tag?: string;
  country_code?: string;
  tags: string[];
  views?: number;
  is_live?: boolean;
}

// ─── Helpers ─────────────────────────────────────

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// ─── AI Pipeline Logging ─────────────────────────

async function logAiStep(data: {
  traceId: string;
  step: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsed: number;
}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('ai_pipeline_logs').insert({
      trace_id: data.traceId,
      step: data.step,
      model: data.model,
      prompt: data.prompt.substring(0, 5000), // Limit stored prompt size
      response: data.response.substring(0, 5000),
      tokens_used: data.tokensUsed,
    });
  } catch (err) {
    console.warn("[AI-LOG] Log failed (non-critical):", err);
  }
}

// ─── Phase 1: Google News RSS Fetch ──────────────
// FREE · Real-time · Unlimited
// Returns ~10-15 articles per feed

interface RSSFeed {
  url: string;
  country_code: string;
  feed_tag: string;
  language: string;
}

const RSS_FEEDS: RSSFeed[] = [
  // Chile (4 feeds)
  {
    url: 'https://news.google.com/rss/search?q=economia+finanzas+chile&hl=es-419&gl=CL&ceid=CL:es-419',
    country_code: 'cl', feed_tag: 'economia', language: 'es'
  },
  {
    url: 'https://news.google.com/rss/search?q=inversiones+bolsa+mercado+chile&hl=es-419&gl=CL&ceid=CL:es-419',
    country_code: 'cl', feed_tag: 'inversiones', language: 'es'
  },
  {
    url: 'https://news.google.com/rss/search?q=tecnologia+innovacion+startups+chile&hl=es-419&gl=CL&ceid=CL:es-419',
    country_code: 'cl', feed_tag: 'tech_global', language: 'es'
  },
  {
    url: 'https://news.google.com/rss/search?q=banco+central+politica+economica+chile&hl=es-419&gl=CL&ceid=CL:es-419',
    country_code: 'cl', feed_tag: 'chile', language: 'es'
  },
  // USA / Global (4 feeds)
  {
    url: 'https://news.google.com/rss/search?q=finance+wall+street+markets+stocks&hl=en-US&gl=US&ceid=US:en',
    country_code: 'us', feed_tag: 'finanzas', language: 'en'
  },
  {
    url: 'https://news.google.com/rss/search?q=economy+federal+reserve+inflation+GDP&hl=en-US&gl=US&ceid=US:en',
    country_code: 'us', feed_tag: 'economia', language: 'en'
  },
  {
    url: 'https://news.google.com/rss/search?q=artificial+intelligence+big+tech+startups&hl=en-US&gl=US&ceid=US:en',
    country_code: 'us', feed_tag: 'tech_global', language: 'en'
  },
  {
    url: 'https://news.google.com/rss/search?q=investments+cryptocurrency+IPO+venture+capital&hl=en-US&gl=US&ceid=US:en',
    country_code: 'us', feed_tag: 'inversiones', language: 'en'
  },
];

/**
 * Parse Google News RSS XML into RawArticle[]
 * Google News RSS uses standard RSS 2.0 format
 */
function parseRSSXml(xml: string, feed: RSSFeed): RawArticle[] {
  const articles: RawArticle[] = [];
  
  // Extract <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || itemXml.match(/<title>(.*?)<\/title>/)?.[1]
      || '';
    
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1]
      || itemXml.match(/<link[^>]*href=["']([^"']+)["']/)?.[1]
      || '';

    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      || itemXml.match(/<description>(.*?)<\/description>/)?.[1]
      || '';
    
    // Extract source from Google News format
    const sourceMatch = itemXml.match(/<source[^>]*url=["']([^"']+)["'][^>]*>(.*?)<\/source>/);
    const sourceName = sourceMatch?.[2] || 'Google News';
    const sourceUrl = sourceMatch?.[1] || '';
    
    // Try to get media:content image
    const mediaUrl = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/)?.[1] || null;

    // Clean HTML from description
    const cleanDesc = description
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (title && link) {
      articles.push({
        title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        summary: cleanDesc || title,
        url: link,
        sourceName,
        sourceUrl,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        imageUrl: mediaUrl,
        feed_tag: feed.feed_tag,
        country_code: feed.country_code,
        language: feed.language,
      });
    }
  }
  
  return articles;
}

/**
 * Fetch all RSS feeds in parallel
 */
export async function fetchFromGoogleNewsRSS(): Promise<RawArticle[]> {
  console.log(`[PIPELINE] Fetching ${RSS_FEEDS.length} Google News RSS feeds...`);
  
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecluBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
        const xml = await res.text();
        return parseRSSXml(xml, feed);
      } catch (err) {
        console.error(`[PIPELINE] RSS error for ${feed.feed_tag}/${feed.country_code}:`, err);
        return [];
      }
    })
  );
  
  const allArticles = results
    .filter((r): r is PromiseFulfilledResult<RawArticle[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
  
  console.log(`[PIPELINE] Fetched ${allArticles.length} articles from ${RSS_FEEDS.length} feeds`);
  return allArticles;
}

// ─── Image Extraction (og:image) ─────────────────
// Only called for articles that PASS the filter (≥65)

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
];

import { GoogleDecoder } from 'google-news-url-decoder';

/**
 * Resolve Google News redirect URLs to get the actual article URL.
 * Uses the community google-news-url-decoder package to natively parse the encoded CBMi URL.
 */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!url.includes('news.google.com')) return url;
  try {
    const decoder = new GoogleDecoder();
    const result = await decoder.decode(url);
    if (result && result.status && result.decoded_url) {
      return result.decoded_url;
    }
  } catch (err) {
    console.warn(`[PIPELINE] Failed to decode Google News URL: ${url.substring(0, 50)}...`);
  }
  return url;
}

export async function extractOgImage(articleUrl: string): Promise<string | null> {
  try {
    // Step 1: Resolve Google News redirects
    const realUrl = await resolveGoogleNewsUrl(articleUrl);
    
    // Step 2: Fetch the page with a browser-like User-Agent
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = await fetch(realUrl, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    
    if (!res.ok) return null;
    
    // Only read first 60KB to save bandwidth (og:image is always in <head>)
    const reader = res.body?.getReader();
    if (!reader) return null;
    
    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 60000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    // Priority 1: og:image (both attribute orderings)
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch?.[1] && ogMatch[1].startsWith('http')) return ogMatch[1];
    
    // Priority 2: twitter:image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twMatch?.[1] && twMatch[1].startsWith('http')) return twMatch[1];

    // Priority 3: twitter:image:src
    const twSrc = html.match(/<meta[^>]*name=["']twitter:image:src["'][^>]*content=["']([^"']+)["']/i);
    if (twSrc?.[1] && twSrc[1].startsWith('http')) return twSrc[1];

    return null;
  } catch {
    return null;
  }
}

// ─── Phase 2: Step 3.5 Flash — Filter + Classify + Rewrite Minor ───

interface StepFilterResult {
  index: number;
  title_original: string;
  importance: number;
  route: 'GROK' | 'SELF' | 'DISCARD';
  section?: string;
  reason: string;
  rewritten?: {
    title: string;
    summary: string;
    content: string;
    tags: string[];
    category: string;
    sentiment: string;
    city: string | null;
    f: number;
  };
}

export async function filterWithStep(articles: RawArticle[], traceId?: string): Promise<StepFilterResult[]> {
  const articleList = articles.map((a, i) => 
    `${i}. "${a.title}" — ${a.sourceName} [${a.country_code?.toUpperCase()}/${a.language}]\n   ${a.summary.substring(0, 150)}`
  ).join('\n\n');

  const prompt = `Eres el editor de "Reclu", portal PREMIUM de noticias económicas y financieras en ESPAÑOL.

ENFOQUE: Economía, finanzas, inversiones, mercados, tech con impacto financiero, política económica Chile/EEUU.
EXCLUIR: Deportes, fútbol, entretenimiento, farándula, crimen, sucesos policiales.

CLASIFICAR importancia financiera (0-100):
- 90-100: BREAKING — Crisis, tasas de interés, crash mercados, quiebra empresa grande
- 85-89: MUY IMPORTANTE — Resultados corporativos grandes, IPOs, fusiones, datos macro clave
- 65-84: INTERESANTE — Noticias corporativas, tech relevante, política económica
- 0-64: DESCARTAR — Menor, irrelevante, deportes, entretenimiento

RUTAS:
- importance ≥ 85 → route: "GROK" (sin rewritten)
- importance 65-84 → route: "SELF" (incluir rewritten completo EN ESPAÑOL)
- importance < 65 → route: "DISCARD" (sin rewritten)

SECCIONES: chile, finanzas, inversiones, economia, impacto_global, tech_global

Si el artículo original es en INGLÉS, SIEMPRE traducir y reescribir en ESPAÑOL.

ARTÍCULOS:
${articleList}

IMPORTANTE: Responde ÚNICAMENTE con JSON puro. Sin explicaciones, sin markdown, sin texto antes o después del JSON:
{"articles":[{"index":0,"title_original":"...","importance":85,"route":"GROK","section":"finanzas","reason":"..."},{"index":1,"title_original":"...","importance":70,"route":"SELF","section":"economia","reason":"...","rewritten":{"title":"Título SEO español max 90 chars","summary":"1 oración","content":"2-3 párrafos con **negritas** en datos clave","tags":["Tag1","Tag2","Tag3"],"category":"economia","sentiment":"neutral","city":null,"f":14}}]}

f = 2 dígitos: país(1=CL,2=US) + tema(1=General,2=Tech,3=Impacto,4=Finanzas,5=Inversiones,6=Economía)`;

  const model = process.env.OPENROUTER_FILTER_MODEL || 'stepfun/step-3.5-flash:free';
  console.log(`[PIPELINE] Step filter: ${articles.length} articles → ${model}`);
  
  const { content, usage } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 6000,
  });

  if (traceId) {
    await logAiStep({ traceId, step: 'filter_step', model, prompt, response: content, tokensUsed: usage?.total_tokens || 0 });
  }

  try {
    const rawJson = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(rawJson);
    const results: StepFilterResult[] = parsed.articles || parsed;
    
    const grokCount = results.filter(r => r.route === 'GROK').length;
    const selfCount = results.filter(r => r.route === 'SELF').length;
    const discardCount = results.filter(r => r.route === 'DISCARD' || r.importance < 60).length;
    console.log(`[PIPELINE] Step: ${grokCount} GROK, ${selfCount} SELF, ${discardCount} DISCARD`);
    
    return results;
  } catch (err) {
    console.error("[PIPELINE] Step parse failed:", content.substring(0, 500));
    // Fallback: send top articles to GROK
    return articles.slice(0, 3).map((a, i) => ({
      index: i, title_original: a.title, importance: 80, route: 'GROK' as const, reason: 'Step parse fallback',
    }));
  }
}

// ─── Phase 3: Grok 4.1 Fast :online — Premium Research ──────────
// 
// COST OPTIMIZATIONS applied:
// 1. reasoning: 'none' — no chain-of-thought (already set in openrouter.ts)
// 2. max_tokens: 1500 — hard cap on output (article doesn't need more)
// 3. Compact prompt — minimal instructions, max info density
// 4. Only 1-2 source URLs — less web search tokens
// 5. temperature: 0.2 — less creative = fewer tokens

export async function rewriteNewsWithGrok(
  article: RawArticle,
  section: string,
  traceId?: string
): Promise<FinalNewsArticle> {
  const prompt = `Periodista de "Reclu". Investiga en la web y escribe noticia profesional EN ESPAÑOL.

FUENTE: "${article.title}" — ${article.sourceName}
URL: ${article.url}

INSTRUCCIONES:
- Busca la URL y más fuentes sobre el mismo tema
- Artículo de 3-4 párrafos, tono periodístico premium
- Usa **negritas** en nombres, cifras y datos clave
- Sin etiquetas XML, sin citas numéricas
- IMPORTANTE: Busca la imagen principal (og:image) del artículo original e inclúyela en image_url

JSON (sin markdown):
{"title":"Título SEO max 90 chars","summary":"1 oración","content":"Artículo completo","tags":["T1","T2","T3","T4"],"relevance_score":85,"category":"${section}","sentiment":"neutral","city":null,"image_url":"https://...","f":${article.country_code === 'cl' ? '1' : '2'}4}`;

  const model = process.env.OPENROUTER_ENRICH_MODEL || 'x-ai/grok-4.1-fast:online';
  
  const { content, usage, citations } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,    // Low = more deterministic, fewer tokens
    max_tokens: 1500,     // Hard cap — 3-4 paragraphs fit in ~800-1200 tokens
    search: true,         // Enable web search
  });

  if (traceId) {
    await logAiStep({
      traceId,
      step: `grok:${article.title.substring(0, 30)}`,
      model, prompt, response: content,
      tokensUsed: usage?.total_tokens || 0,
    });
  }

  // Parse response
  let cleaned = content
    .replace(/```json\n?|```/g, '')
    .replace(/<grok:render[^>]*>[\s\S]*?<\/grok:render>/g, '')
    .replace(/<grok:[^>]*\/>/g, '')
    .replace(/\[\d+\]/g, '')
    .trim();
  
  const data = JSON.parse(cleaned);
  
  // Clean content field
  if (data.content) {
    data.content = data.content
      .replace(/<grok:render[^>]*>[\s\S]*?<\/grok:render>/g, '')
      .replace(/<grok:[^>]*\/>/g, '')
      .replace(/\[\d+\]/g, '')
      .trim();
  }

  // Decode country/topic from f value
  const COUNTRY_DECODE: Record<number, string> = { 1: 'cl', 2: 'us' };
  const TOPIC_DECODE: Record<number, string> = { 1: 'chile', 2: 'tech_global', 3: 'impacto_global', 4: 'finanzas', 5: 'inversiones', 6: 'economia' };
  
  const fVal = Number(data.f) || 0;
  const countryNum = Math.floor(fVal / 10);
  const topicNum = fVal % 10;

  return {
    title: data.title,
    content: data.content,
    summary: data.summary,
    sentiment: data.sentiment || 'neutral',
    category: data.category || section,
    relevance_score: Number(data.relevance_score) || 80,
    city: data.city === 'null' || data.city === null ? undefined : data.city,
    imageUrl: data.image_url || article.imageUrl || null,
    slug: generateSlug(data.title),
    ai_model: model,
    is_live: false,
    sources: [
      { name: article.sourceName, url: article.url },
      ...(citations || []).map((url: string) => {
        try { return { name: new URL(url).hostname.replace('www.', ''), url }; }
        catch { return { name: 'Web', url }; }
      })
    ].filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i),
    feed_tag: TOPIC_DECODE[topicNum] || section,
    country_code: COUNTRY_DECODE[countryNum] || article.country_code || 'cl',
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
    views: 0,
  };
}

// ─── Pipeline Execution ──────────────────────────
// Config limits per execution (to control costs + volume)

const PIPELINE_CONFIG = {
  MAX_ARTICLES_TO_FILTER: 10,     // Max sent to filter per run
  MAX_STEP_WRITES_PER_RUN: 4,    // Max articles Step rewrites (free)
  MAX_GROK_CALLS_PER_RUN: 1,     // Max Grok enrichments per run (~$0.02 each)
  GROK_THRESHOLD: 85,            // Only the MOST important news go to Grok
  STEP_THRESHOLD: 65,            // Min importance for Step/publish
  IMAGE_EXTRACTION_CONCURRENCY: 5, // Parallel og:image fetches
};

export async function runNewsPipeline(): Promise<{
  success: boolean;
  articles: FinalNewsArticle[];
  error?: string;
  step?: string;
  stats?: { fetched: number; filtered: number; grokCalls: number; stepWrites: number; saved: number; durationMs: number };
}> {
  const startTime = Date.now();
  console.log("=== [PIPELINE v2] Starting Google News RSS Pipeline ===");
  
  const traceId = crypto.randomUUID?.() 
    || "00000000-0000-0000-0000-000000000000".replace(/0/g, () => (Math.random() * 16 | 0).toString(16));
  
  try {
    // ─── Step 1: Fetch from Google News RSS ───
    console.log("[PIPELINE] Step 1: Fetching Google News RSS...");
    const rawArticles = await fetchFromGoogleNewsRSS();
    
    if (rawArticles.length === 0) {
      console.warn("[PIPELINE] No articles from RSS. Exiting.");
      return { success: true, articles: [], stats: { fetched: 0, filtered: 0, grokCalls: 0, stepWrites: 0, saved: 0, durationMs: Date.now() - startTime } };
    }

    // ─── Step 2: Local deduplication (free, no API) ───
    const seenTitles = new Set<string>();
    const unique: RawArticle[] = [];
    for (const art of rawArticles) {
      // Normalize title for dedup (remove source suffix, lowercase)
      const key = art.title.toLowerCase().replace(/\s*[-–|].+$/, '').trim();
      if (!seenTitles.has(key) && key.length > 15) {
        seenTitles.add(key);
        unique.push(art);
      }
    }
    
    // Check against existing DB slugs
    const supabase = getSupabaseAdmin();
    const recentSlugs = new Set<string>();
    const { data: recentArticles } = await supabase
      .from('news_articles')
      .select('slug')
      .order('published_at', { ascending: false })
      .limit(200);
    
    if (recentArticles) {
      for (const a of recentArticles) recentSlugs.add(a.slug);
    }
    
    const fresh = unique.filter(a => !recentSlugs.has(generateSlug(a.title)));
    const toFilter = fresh.slice(0, PIPELINE_CONFIG.MAX_ARTICLES_TO_FILTER);
    
    console.log(`[PIPELINE] Step 2: ${rawArticles.length} raw → ${unique.length} unique → ${fresh.length} fresh → ${toFilter.length} to filter`);

    if (toFilter.length === 0) {
      console.log("[PIPELINE] No fresh articles to process.");
      return { success: true, articles: [], stats: { fetched: rawArticles.length, filtered: 0, grokCalls: 0, stepWrites: 0, saved: 0, durationMs: Date.now() - startTime } };
    }

    // ─── Step 3: Filter with Step 3.5 Flash (FREE) ───
    console.log("[PIPELINE] Step 3: Filtering with Step 3.5 Flash...");
    const filterResults = await filterWithStep(toFilter, traceId);
    
    const grokArticles = filterResults
      .filter(r => r.route === 'GROK' && r.importance >= PIPELINE_CONFIG.GROK_THRESHOLD)
      .slice(0, PIPELINE_CONFIG.MAX_GROK_CALLS_PER_RUN);
    
    const selfArticles = filterResults
      .filter(r => r.route === 'SELF' && r.rewritten && r.importance >= PIPELINE_CONFIG.STEP_THRESHOLD)
      .slice(0, PIPELINE_CONFIG.MAX_STEP_WRITES_PER_RUN);
    
    console.log(`[PIPELINE] Step 3: ${grokArticles.length} → Grok, ${selfArticles.length} → Step`);

    // ─── Country/Topic decode ───
    const COUNTRY_DECODE: Record<number, string> = { 1: 'cl', 2: 'us' };
    const TOPIC_DECODE: Record<number, string> = { 1: 'chile', 2: 'tech_global', 3: 'impacto_global', 4: 'finanzas', 5: 'inversiones', 6: 'economia' };
    const stepModel = process.env.OPENROUTER_FILTER_MODEL || 'stepfun/step-3.5-flash:free';

    // ─── Step 4a: Convert SELF articles ───
    const selfFinalArticles: FinalNewsArticle[] = [];
    
    for (const item of selfArticles) {
      const raw = toFilter[item.index];
      if (!raw || !item.rewritten) continue;
      
      const fVal = Number(item.rewritten.f) || 0;
      const countryNum = Math.floor(fVal / 10);
      const topicNum = fVal % 10;

      selfFinalArticles.push({
        title: item.rewritten.title,
        content: item.rewritten.content,
        summary: item.rewritten.summary,
        sentiment: (item.rewritten.sentiment as any) || 'neutral',
        category: item.rewritten.category || 'business',
        relevance_score: item.importance,
        city: item.rewritten.city === 'null' ? undefined : (item.rewritten.city || undefined),
        imageUrl: raw.imageUrl || null, // Will try og:image next
        slug: generateSlug(item.rewritten.title),
        ai_model: stepModel,
        sources: [{ name: raw.sourceName, url: raw.url }],
        feed_tag: (item as any).section || TOPIC_DECODE[topicNum] || 'chile',
        country_code: COUNTRY_DECODE[countryNum] || raw.country_code || 'cl',
        tags: Array.isArray(item.rewritten.tags) ? item.rewritten.tags.slice(0, 5) : [],
        views: 0,
      });
    }

    // ─── Step 4b: Grok enrichment (PREMIUM, costs ~$0.02/article) ───
    const grokFinalArticles: FinalNewsArticle[] = [];
    
    for (const item of grokArticles) {
      const raw = toFilter[item.index];
      if (!raw) continue;
      
      try {
        const enriched = await rewriteNewsWithGrok(raw, item.section || 'finanzas', traceId);
        grokFinalArticles.push(enriched);
        // Rate limit: 2s between Grok calls
        if (grokArticles.indexOf(item) < grokArticles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        console.error(`[PIPELINE] Grok error on '${raw.title.substring(0, 40)}':`, e);
      }
    }

    // ─── Step 5: Extract og:image for all publishable articles ───
    const allFinal = [...grokFinalArticles, ...selfFinalArticles];
    const articlesNeedingImages = allFinal.filter(a => !a.imageUrl);
    console.log(`[PIPELINE] Step 5: Extracting images for ${articlesNeedingImages.length}/${allFinal.length} articles...`);
    
    if (articlesNeedingImages.length > 0) {
      // Try og:image from source article URLs
      const imageResults = await Promise.allSettled(
        articlesNeedingImages.slice(0, PIPELINE_CONFIG.IMAGE_EXTRACTION_CONCURRENCY).map(a => 
          extractOgImage(a.sources[0]?.url || '')
        )
      );
      
      let imagesFound = 0;
      imageResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          articlesNeedingImages[idx].imageUrl = result.value;
          imagesFound++;
        }
      });
      
      console.log(`[PIPELINE] Step 5: Found ${imagesFound}/${articlesNeedingImages.length} images via og:image`);
      
      // Fallback: Generate AI images for those that still failed using Pollinations AI
      articlesNeedingImages.forEach((article) => {
        if (!article.imageUrl) {
          // Remove special characters for safety and generate an image URL
          const cleanTitle = article.title.replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g, '').trim();
          const prompt = `Professional high quality news photography about ${cleanTitle} economy finance`;
          article.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true`;
          console.log(`[PIPELINE] Step 5: Applied AI image fallback for: ${article.title.substring(0, 30)}`);
        }
      });
    }

    // ─── Step 6: Save to Supabase ───
    console.log(`[PIPELINE] Step 6: Saving ${allFinal.length} articles...`);
    let savedCount = 0;

    for (const a of allFinal) {
      // Final dedup check
      const { data: dup } = await supabase
        .from('news_articles')
        .select('id')
        .eq('slug', a.slug)
        .maybeSingle();
      
      if (dup) {
        console.log(`[PIPELINE] Skip duplicate: ${a.slug.substring(0, 40)}`);
        continue;
      }

      const fullRow: Record<string, any> = {
        title: a.title,
        content: a.content,
        summary: a.summary,
        category: a.category,
        sources: a.sources,
        ai_model: a.ai_model,
        sentiment: a.sentiment,
        relevance_score: a.relevance_score,
        city: a.city,
        image_url: a.imageUrl,
        slug: a.slug,
        feed_tag: a.feed_tag || null,
        country_code: a.country_code || null,
        is_live: a.is_live || false,
        published_at: new Date().toISOString(),
        tags: a.tags || [],
        views: a.views || 0,
      };

      let { error } = await supabase.from('news_articles').insert(fullRow);

      // Handle missing columns gracefully — retry up to 5 times removing unknown columns
      let retries = 0;
      while (error?.code === 'PGRST204' && retries < 5) {
        const missingCol = error.message.match(/'(\w+)' column/)?.[1];
        if (!missingCol) break;
        console.warn(`[PIPELINE] Removing unknown column '${missingCol}' and retrying...`);
        delete fullRow[missingCol];
        const retry = await supabase.from('news_articles').insert(fullRow);
        error = retry.error;
        retries++;
      }

      if (error) {
        console.error(`[PIPELINE] DB Error: "${a.title.substring(0, 30)}":`, JSON.stringify(error));
      } else {
        savedCount++;
        console.log(`[PIPELINE] ✅ [${a.ai_model.includes('grok') ? 'GROK' : 'STEP'}] ${a.title.substring(0, 50)}`);
      }
    }

    // ─── Step 7: Log pipeline run ───
    const durationMs = Date.now() - startTime;
    try {
      await supabase.from('pipeline_runs').insert({
        articles_fetched: rawArticles.length,
        articles_published: savedCount,
        grok_calls: grokFinalArticles.length,
        step_calls: 1,
        duration_ms: durationMs,
        status: 'success',
      });
    } catch { /* table might not exist yet */ }

    const stats = {
      fetched: rawArticles.length,
      filtered: toFilter.length,
      grokCalls: grokFinalArticles.length,
      stepWrites: selfFinalArticles.length,
      saved: savedCount,
      durationMs,
    };

    console.log(`=== [PIPELINE v2] Done in ${(durationMs / 1000).toFixed(1)}s — ${savedCount} articles saved ===`);
    return { success: true, articles: allFinal, stats };

  } catch (err: any) {
    console.error("[PIPELINE] CRASH:", err?.message, err?.stack);
    return {
      success: false,
      articles: [],
      error: `${err?.message || "Unknown"} | ${(err?.stack || '').substring(0, 300)}`,
      step: 'pipeline_crash',
    };
  }
}
