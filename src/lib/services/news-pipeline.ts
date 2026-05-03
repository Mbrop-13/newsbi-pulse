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
  published_at?: string;
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

// ─── Phase 1: GNews API Fetch ─────────────────
// Real-time news · Returns structured JSON with images

interface NewsFeed {
  keywords: string;
  language: string;
  country: string;
  feed_tag: string;
  country_code: string;
}

const GNEWS_FEEDS: NewsFeed[] = [
  {
    keywords: 'Chile AND (economía OR finanzas OR empresas OR inversiones OR bolsa OR mercado OR tecnología OR innovación OR startups OR política OR "banco central" OR minería OR cobre OR litio)',
    language: 'es', country: 'cl', country_code: 'cl',
    feed_tag: 'chile',
  },
  {
    keywords: '(finance OR markets OR stocks OR economy OR "fed reserve" OR inflation OR "AI tech" OR startups OR investments OR crypto OR commodities OR gold OR geopolitics)',
    language: 'en', country: 'us', country_code: 'us',
    feed_tag: 'finanzas',
  },
];

/**
 * Fetch news from GNews API
 * Docs: https://gnews.io/docs/v4
 */
export async function fetchFromGNewsAPI(): Promise<RawArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    console.error('[PIPELINE] GNEWS_API_KEY not set!');
    return [];
  }

  console.log(`[PIPELINE] Fetching ${GNEWS_FEEDS.length} GNews API feeds sequentially (rate-limit friendly)...`);

  const allArticles: RawArticle[] = [];
  
  for (const feed of GNEWS_FEEDS) {
    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        q: feed.keywords,
        lang: feed.language,
        country: feed.country,
        max: '50',
      });

      const res = await fetch(
        `https://gnews.io/api/v4/search?${params.toString()}`,
        { signal: AbortSignal.timeout(15000) }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`GNews API error ${res.status}: ${errText.substring(0, 200)}`);
      }

      const data = await res.json();

      if (Array.isArray(data.articles)) {
        const mapped = data.articles.map((item: any): RawArticle => ({
          title: item.title || '',
          summary: item.description || item.title || '',
          url: item.url || '',
          sourceName: item.source?.name || 'GNews',
          sourceUrl: item.source?.url || item.url || '',
          publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
          imageUrl: item.image && item.image !== 'None' ? item.image : null,
          feed_tag: feed.feed_tag,
          country_code: feed.country_code,
          language: feed.language,
        }));
        allArticles.push(...mapped);
      }

      // Small delay to avoid 429 rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        console.error(`[PIPELINE] GNews API Timeout (15s) for ${feed.feed_tag}/${feed.country_code}`);
      } else {
        console.error(`[PIPELINE] GNews error for ${feed.feed_tag}/${feed.country_code}:`, err.message || err);
      }
    }
  }

  console.log(`[PIPELINE] Fetched ${allArticles.length} articles from ${GNEWS_FEEDS.length} GNews feeds`);
  return allArticles;
}

// ─── Auto-cleanup: Delete articles older than 30 days ─────────

export async function cleanupOldArticles(): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('news_articles')
      .delete()
      .lt('published_at', thirtyDaysAgo)
      .select('id');

    if (error) {
      console.error('[CLEANUP] Error deleting old articles:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[CLEANUP] 🗑️ Deleted ${count} articles older than 30 days`);
    }
    return count;
  } catch (err) {
    console.error('[CLEANUP] Crash:', err);
    return 0;
  }
}

// ─── Image Extraction (og:image) ─────────────────
// Only called for articles that PASS the filter (≥65)

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
];

export async function extractOgImage(articleUrl: string): Promise<string | null> {
  try {
    // Fetch the page with a browser-like User-Agent
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = await fetch(articleUrl, {
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

  const model = process.env.OPENROUTER_FILTER_MODEL || 'minimax/minimax-m2.5:free';
  console.log(`[PIPELINE] Step filter: ${articles.length} articles → ${model}`);
  
  const { content, usage } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 32000,
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
    console.error("[PIPELINE] Step parse failed, attempting to salvage articles...");
    
    // ─── JSON SALVAGE ALGORITHM ───
    // If Ling cuts off the response, we can still rescue the articles it DID finish.
    const salvagedResults: StepFilterResult[] = [];
    const blocks = content.split('{"index"');
    
    for (let i = 1; i < blocks.length; i++) {
      let block = '{"index"' + blocks[i];
      // Try to find the closing brace by attempting to parse progressively smaller substrings
      let parsedObj: any = null;
      for (let end = block.length; end > 10; end--) {
        if (block[end - 1] === '}') {
          try {
            parsedObj = JSON.parse(block.substring(0, end));
            break; // Success!
          } catch (e) {
            // keep shrinking
          }
        }
      }
      if (parsedObj && typeof parsedObj.index === 'number' && parsedObj.route) {
        salvagedResults.push(parsedObj);
      }
    }

    if (salvagedResults.length > 0) {
      console.log(`[PIPELINE] Salvaged ${salvagedResults.length} articles successfully!`);
      const grokCount = salvagedResults.filter(r => r.route === 'GROK').length;
      const selfCount = salvagedResults.filter(r => r.route === 'SELF').length;
      console.log(`[PIPELINE] Salvaged Step: ${grokCount} GROK, ${selfCount} SELF`);
      return salvagedResults;
    }

    console.error("[PIPELINE] Salvage failed entirely. Applying GROK fallback.");
    // Fallback: send top articles to GROK
    return articles.slice(0, 3).map((a, i) => ({
      index: i, title_original: a.title, importance: 90, route: 'GROK' as const, reason: 'Step parse fallback',
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

// ── Static system prompt for Grok (cacheable by OpenRouter) ──
// Placed outside the function so it's byte-identical across all calls.
// OpenRouter auto-caches stable system prefixes → 50-90% cheaper on input tokens.
const GROK_SYSTEM_PROMPT = `Eres un periodista senior de "Reclu", portal PREMIUM de noticias financieras en ESPAÑOL.

Tu trabajo: recibir una URL de noticia, investigarla en la web, y producir un artículo profesional.

REGLAS OBLIGATORIAS:
- Artículo de 3-4 párrafos, tono periodístico premium, 100% EN ESPAÑOL
- Usa **negritas** en nombres propios, cifras, porcentajes y datos clave
- Sin etiquetas XML, sin citas numéricas tipo [1][2], sin markdown de código
- Busca la imagen principal (og:image) del artículo original e inclúyela en image_url
- Si no encuentras imagen, devuelve image_url como null

RESPONDE ÚNICAMENTE con JSON puro (sin markdown):
{"title":"Título SEO max 90 chars","summary":"1 oración de resumen","content":"Artículo completo 3-4 párrafos","tags":["T1","T2","T3","T4"],"relevance_score":85,"category":"finanzas","sentiment":"neutral","city":null,"image_url":"https://...","f":14}

Campo f = 2 dígitos: país(1=CL,2=US) + tema(1=General,2=Tech,3=Impacto,4=Finanzas,5=Inversiones,6=Economía)`;

export async function rewriteNewsWithGrok(
  article: RawArticle,
  section: string,
  traceId?: string
): Promise<FinalNewsArticle> {
  // Dynamic user message — only the variable data, kept minimal for cost efficiency
  const userPrompt = `Investiga y escribe sobre esta noticia. Categoría: ${section}

Título: ${article.title}
Fuente: ${article.sourceName}
URL: ${article.url}
País: ${article.country_code === 'cl' ? 'Chile (f=1X)' : 'USA (f=2X)'}`;

  const model = process.env.OPENROUTER_ENRICH_MODEL || 'deepseek/deepseek-v4-flash';
  
  const { content, usage, citations } = await callOpenRouter({
    model,
    messages: [
      { role: 'system', content: GROK_SYSTEM_PROMPT },  // Static → cached
      { role: 'user', content: userPrompt },              // Dynamic → minimal
    ],
    temperature: 0.2,
    max_tokens: 1500,
    search: true,
  });

  if (traceId) {
    await logAiStep({
      traceId,
      step: `grok:${article.title.substring(0, 30)}`,
      model, prompt: userPrompt, response: content,
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
  console.log("=== [PIPELINE v3] Starting GNews API Pipeline ===");
  
  const traceId = crypto.randomUUID?.() 
    || "00000000-0000-0000-0000-000000000000".replace(/0/g, () => (Math.random() * 16 | 0).toString(16));
  
  try {
    // ─── Step 0: Auto-cleanup old articles (>30 days) ───
    await cleanupOldArticles();

    // ─── Step 1: Fetch from GNews API ───
    console.log("[PIPELINE] Step 1: Fetching from GNews API...");
    const rawArticles = await fetchFromGNewsAPI();
    
    if (rawArticles.length === 0) {
      console.warn("[PIPELINE] No articles from GNews API. Exiting.");
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
    
    // Check against existing DB slugs AND source URLs (prevents re-processing same Currents article)
    const supabase = getSupabaseAdmin();
    const recentSlugs = new Set<string>();
    const recentSourceUrls = new Set<string>();
    const { data: recentArticles } = await supabase
      .from('news_articles')
      .select('slug, sources')
      .order('published_at', { ascending: false })
      .limit(300);
    
    if (recentArticles) {
      for (const a of recentArticles) {
        recentSlugs.add(a.slug);
        // Extract all source URLs from the JSONB sources column
        if (Array.isArray(a.sources)) {
          for (const s of a.sources) {
            if (s.url) recentSourceUrls.add(s.url);
          }
        }
      }
    }
    
    const fresh = unique.filter(a => 
      !recentSlugs.has(generateSlug(a.title)) && 
      !recentSourceUrls.has(a.url)
    );
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
    const stepModel = process.env.OPENROUTER_FILTER_MODEL || 'inclusionai/ling-2.6-flash:free';

    // ─── Helper: Save a single article to Supabase ───
    async function saveArticle(a: FinalNewsArticle): Promise<boolean> {
      // Final dedup check
      const { data: dup } = await supabase
        .from('news_articles')
        .select('id')
        .eq('slug', a.slug)
        .maybeSingle();
      
      if (dup) {
        console.log(`[PIPELINE] Skip duplicate: ${a.slug.substring(0, 40)}`);
        return false;
      }

      // Apply image fallback if missing
      if (!a.imageUrl) {
        // Try og:image first
        try {
          const ogImg = await extractOgImage(a.sources[0]?.url || '');
          if (ogImg) { a.imageUrl = ogImg; }
        } catch { /* ignore */ }
      }
      if (!a.imageUrl) {
        const cleanTitle = a.title.replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g, '').trim();
        const prompt = `Professional high quality news photography about ${cleanTitle} economy finance`;
        a.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true`;
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

      // Handle missing columns gracefully
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
        return false;
      }
      console.log(`[PIPELINE] ✅ [${a.ai_model.includes('grok') ? 'GROK' : 'FILTER'}] ${a.title.substring(0, 50)}`);
      return true;
    }

    // ─── Step 4a: Convert SELF articles and SAVE IMMEDIATELY ───
    // We STAGGER the publication dates to ensure a continuous stream of content
    const selfFinalArticles: FinalNewsArticle[] = [];
    let savedCount = 0;
    
    // Calculate stagger interval based on current time
    // Default interval: 30 minutes. If we have 10 articles, we publish one every ~3 mins.
    // To be safe, we'll use a fixed 2-minute stagger for SELF articles.
    let staggerMinutes = 0;

    for (const item of selfArticles) {
      const raw = toFilter[item.index];
      if (!raw || !item.rewritten) continue;
      
      const fVal = Number(item.rewritten.f) || 0;
      const countryNum = Math.floor(fVal / 10);
      const topicNum = fVal % 10;

      // Stagger non-urgent news
      const pubDate = new Date();
      pubDate.setMinutes(pubDate.getMinutes() + staggerMinutes);
      staggerMinutes += 2; // Increment by 2 minutes for each "SELF" article

      const article: FinalNewsArticle = {
        title: item.rewritten.title,
        content: item.rewritten.content,
        summary: item.rewritten.summary,
        sentiment: (item.rewritten.sentiment as any) || 'neutral',
        category: item.rewritten.category || 'business',
        relevance_score: item.importance,
        city: item.rewritten.city === 'null' ? undefined : (item.rewritten.city || undefined),
        imageUrl: raw.imageUrl || null,
        slug: generateSlug(item.rewritten.title),
        ai_model: stepModel,
        sources: [{ name: raw.sourceName, url: raw.url }],
        feed_tag: (item as any).section || TOPIC_DECODE[topicNum] || 'chile',
        country_code: COUNTRY_DECODE[countryNum] || raw.country_code || 'cl',
        tags: Array.isArray(item.rewritten.tags) ? item.rewritten.tags.slice(0, 5) : [],
        views: 0,
        published_at: pubDate.toISOString(), // Use staggered date
      };

      selfFinalArticles.push(article);
      
      // Save immediately
      if (await saveArticle(article)) {
        savedCount++;
      }
    }

    console.log(`[PIPELINE] Step 4a: ${savedCount} SELF articles staggered and saved`);

    // ─── Step 4b: Grok enrichment (URGENT NEWS) ───
    const grokFinalArticles: FinalNewsArticle[] = [];
    
    for (const item of grokArticles) {
      const raw = toFilter[item.index];
      if (!raw) continue;
      
      try {
        const enriched = await rewriteNewsWithGrok(raw, item.section || 'finanzas', traceId);
        
        // Grok articles are URGENT (importance >= 85), so they publish NOW
        enriched.published_at = new Date().toISOString();
        
        grokFinalArticles.push(enriched);
        
        if (await saveArticle(enriched)) {
          savedCount++;
        }
        
        if (grokArticles.indexOf(item) < grokArticles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        console.error(`[PIPELINE] Grok error on '${raw.title.substring(0, 40)}':`, e);
      }
    }

    const allFinal = [...grokFinalArticles, ...selfFinalArticles];

    // ─── Step 5: Log pipeline run ───
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

    console.log(`=== [PIPELINE v3] Done in ${(durationMs / 1000).toFixed(1)}s — ${savedCount} articles saved ===`);
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
