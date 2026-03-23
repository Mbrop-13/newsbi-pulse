import { callOpenRouter } from '../openrouter';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Helper to log AI steps to Supabase for observability
async function logAiStep(data: {
  traceId: string;
  step: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsed: number;
}) {
  console.log(`[AI-LOG] Attempting to log step: ${data.step} (${data.model}) - Tokens: ${data.tokensUsed}`);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[AI-LOG] Missing Supabase credentials for logging.");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('ai_pipeline_logs').insert({
      trace_id: data.traceId,
      step: data.step,
      model: data.model,
      prompt: data.prompt,
      response: data.response,
      tokens_used: data.tokensUsed,
    });

    if (error) {
      if (error.code === 'PGRST205') {
        console.error("[AI-LOG] ERROR CRÍTICO: La tabla 'ai_pipeline_logs' no existe o no es visible en Supabase.");
        console.error("[AI-LOG] Por favor, ejecuta el SQL en Supabase para crear la tabla.");
      } else {
        console.error("[AI-LOG] Supabase insert error:", error);
      }
    } else {
      console.log(`[AI-LOG] Successfully logged step: ${data.step}`);
    }
  } catch (err) {
    console.error("[AI-LOG] unexpected error:", err);
  }
}

export interface RawArticle {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  imageUrl?: string | null;
  feed_tag?: string;
  country_code?: string;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ClusteredEvent {
  event_id: string;
  main_topic: string;
  category: 'tech_global' | 'finanzas' | 'inversiones' | 'economia' | 'impacto_global' | 'chile' | 'general';
  relevance_score: number; // 0-100
  articles: RawArticle[];
  feed_tag?: string;
  country_code?: string;
  tags?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_live?: boolean;
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

/**
 * Find the best image for a cluster by searching rawArticles.
 * Hunter Alpha strips imageUrl, so we match by keywords.
 */
function findBestImage(cluster: ClusteredEvent, rawArticles?: RawArticle[]): string | null {
  // 1. Try cluster.articles first
  for (const art of cluster.articles) {
    if (art.imageUrl) return art.imageUrl;
    if ((art as any).image_url) return (art as any).image_url;
  }
  if (!rawArticles?.length) return null;

  // 2. Match by URL
  const clusterUrls = new Set(cluster.articles.map(a => a.url));
  for (const raw of rawArticles) {
    if (raw.imageUrl && clusterUrls.has(raw.url)) return raw.imageUrl;
  }

  // 3. Match by title keywords
  const topicWords = cluster.main_topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let best: RawArticle | null = null;
  let bestScore = 0;
  for (const raw of rawArticles) {
    if (!raw.imageUrl) continue;
    const t = raw.title.toLowerCase();
    const score = topicWords.filter(w => t.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = raw; }
  }
  if (best) return best.imageUrl!;

  // 4. Fallback: any image
  return rawArticles.find(r => r.imageUrl)?.imageUrl || null;
}

/**
 * Helper: fetch from NewsData.io with given params
 */
async function fetchFromNewsData(params: string, countryCode: string): Promise<RawArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) { console.error("NEWSDATA_API_KEY missing"); return []; }

  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&${params}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`NewsData API error: ${res.statusText}`);
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      title: item.title || '',
      summary: item.description || item.content || '',
      url: item.link || '',
      sourceName: item.source_id || item.source_url || 'NewsData.io',
      publishedAt: item.pubDate || new Date().toISOString(),
      imageUrl: item.image_url || null,
      country_code: countryCode,
    })).filter((a: RawArticle) => a.title && a.summary);
  } catch (err) {
    console.error(`Error fetching ${countryCode} from NewsData.io:`, err);
    return [];
  }
}

/**
 * Phase 1: 1 BROAD fetch per country (6 countries in parallel)
 * Grok will classify the topic later via 2-digit code.
 */
export async function fetchRawNews(): Promise<RawArticle[]> {
  // Country configs: code -> NewsData params
  const countryFetches: { code: string; params: string }[] = [
    { code: 'cl', params: 'country=cl&language=es&category=business,technology,politics' },
    { code: 'ar', params: 'country=ar&language=es&category=business,technology,politics' },
    { code: 'co', params: 'country=co&language=es&category=business,technology,politics' },
    { code: 'br', params: 'country=br&language=pt&category=business,technology,politics' },
    { code: 'ec', params: 'country=ec&language=es&category=business,technology,politics' },
    { code: 'mx', params: 'country=mx&language=es&category=business,technology,politics' },
  ];

  console.log(`[PIPELINE] Fetching ${countryFetches.length} countries in parallel...`);

  const results = await Promise.all(
    countryFetches.map(cf => fetchFromNewsData(cf.params, cf.code))
  );

  const allArticles = results.flat();
  console.log(`[PIPELINE] Fetched ${allArticles.length} total articles across ${countryFetches.length} countries`);
  return allArticles;
}

/**
 * Phase 2: Hunter Alpha — Fast Deduplication & Relevance Filter
 * 
 * This model is cheap and fast. We use it ONLY to:
 *   1. Remove duplicate/near-duplicate articles about the same event.
 *   2. Assign a category and relevance score.
 *   3. Group source URLs for Grok to research later.
 * 
 * It does NOT rewrite anything. It's a sorting machine.
 */
export async function clusterNewsWithQwen(articles: RawArticle[], traceId?: string): Promise<ClusteredEvent[]> {
  const prompt = `Eres un motor de deduplicación de noticias. Tu ÚNICA tarea es agrupar artículos que hablan del MISMO evento y filtrar spam.

ENTRADA: ${articles.length} artículos raw en JSON.
SALIDA: Un JSON array donde cada objeto es un evento único.

REGLAS ESTRICTAS:
- Si 2+ artículos hablan del mismo hecho, agrúpalos en UN solo evento.
- Asigna una categoría EXACTA entre: "chile", "tech_global", "finanzas", "inversiones", "economia", "impacto_global", "general".
   - "chile": Todo lo que ocurre en Chile, política local o impacto directo en empresas e instituciones chilenas.
   - "tech_global": IA, startups, ciberseguridad, grandes tecnológicas (Big Tech), innovación y disrupción digital.
   - "finanzas": Mercados bursátiles, bancos, tasas de interés, monedas/divisas, resultados financieros, Wall Street.
   - "inversiones": Venture Capital, rondas de financiamiento, fusiones, adquisiciones, criptomonedas, bienes raíces.
   - "economia": Macroeconomía, inflación, PIB, empleo, políticas fiscales, comercio internacional, decisiones banco central.
   - "impacto_global": Geopolítica mundial, guerras, decisiones internacionales críticas, crisis mundiales.
- Asigna relevance_score (0-100): 90+ = breaking news global, 70-89 = importante, 50-69 = interesante, <50 = relleno.
- Asigna un sentimiento ("positive", "negative", "neutral") predominante.
- Genera un arreglo de 1 a 3 "tags" EXTREMADAMENTE específicos y cortos (ej. "IA", "Cobre", "Bolsa").
- Asigna "is_live": true SOLO si el evento está en desarrollo activo ("en vivo", "en seguimiento") o es un evento importante que ocurrirá muy pronto (ej. "Trump hablará en 5 horas"). En cualquier otro caso, asigna false.
- NO reescribas nada. Solo agrupa y clasifica.

ARTÍCULOS RAW:
${JSON.stringify(articles.map(a => ({ title: a.title, summary: a.summary.substring(0, 500), url: a.url, source: a.sourceName })), null, 2)}

Responde SOLO con JSON válido, sin markdown ni texto adicional:
[
  {
    "event_id": "slug-descriptivo",
    "main_topic": "Descripción corta del evento en español",
    "category": "tech_global",
    "relevance_score": 85,
    "sentiment": "neutral",
    "is_live": false,
    "tags": ["TagCorto1", "TagCorto2"],
    "articles": [/* objetos RawArticle originales completos que pertenecen a este evento */]
  }
]`;

  const model = process.env.OPENROUTER_FILTER_MODEL || 'openrouter/hunter-alpha';
  console.log(`[PIPELINE] Calling Hunter Alpha (${model}) with ${articles.length} articles...`);
  const { content, usage } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.05,
  });

  if (traceId) {
    await logAiStep({
      traceId,
      step: 'clustering',
      model,
      prompt,
      response: content,
      tokensUsed: usage?.total_tokens || 0,
    });
  }

  try {
    const rawJson = content.replace(/```json\n?|\`\`\`/g, '').trim();
    return JSON.parse(rawJson) as ClusteredEvent[];
  } catch (err) {
    console.error("Failed to parse Hunter Alpha response:", content.substring(0, 500));
    throw new Error("Hunter Alpha returned invalid JSON");
  }
}

/**
 * Phase 3: Grok 4.1 Fast (:online) — Deep Research & Professional Rewriting
 * 
 * This is the brain. Grok receives the SOURCE URLs and uses its web browsing
 * to read the original articles, cross-reference with other sources, and write
 * a completely original, professional news article in Spanish.
 */
export async function rewriteNewsWithGrok(cluster: ClusteredEvent, traceId?: string, rawArticles?: RawArticle[]): Promise<FinalNewsArticle> {
  // Only send URLs + titles (saves tokens, Grok searches the web for full content)
  const sourceList = cluster.articles.slice(0, 3).map((a, i) => 
    `${i+1}. "${a.title}" — ${a.sourceName}\n   URL: ${a.url}`
  ).join('\n');

  const prompt = `Eres el corresponsal principal de "NewsBI Pulse", un portal premium de noticias en ESPAÑOL.

MISIÓN: Investiga las siguientes fuentes, busca MÁS fuentes que hablen del MISMO tema en la web, y redacta una noticia profesional y original.

FUENTES INICIALES:
${sourceList}

INSTRUCCIONES:
1. USA tu capacidad de búsqueda web para leer las URLs, encontrar más fuentes sobre el mismo tema, y crear un artículo MULTI-FUENTE de 4-6 párrafos.
2. Tono periodístico premium, objetivo y elegante. EN ESPAÑOL.
3. Usa **negritas** para nombres propios, cifras clave y hechos impactantes.
4. NO incluyas etiquetas XML, citas inline, ni referencias numéricas en el texto. Solo texto limpio.
5. Genera tags ESPECÍFICOS y cortos (nombres propios, temas concretos). Ejemplo: "Irán", "Epstein", "Bitcoin", "Fed", "Litio".
6. Evalúa la importancia: 90-100 = crisis mundial/breaking news, 70-89 = noticia importante, 50-69 = interesante, 30-49 = menor.

RESPONDE SOLO con este JSON (sin markdown, sin backticks):
{
  "title": "Título SEO impactante (max 100 chars)",
  "summary": "Resumen de 1 oración",
  "content": "Artículo completo con párrafos separados por doble salto de línea. SIN etiquetas XML ni citas inline.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "relevance_score": 85,
  "category": "tech_global|finanzas|inversiones|economia|impacto_global|chile|general",
  "sentiment": "positive|negative|neutral",
  "city": "Ciudad principal del evento o null",
  "f": 14
}
f = código 2 dígitos: primer dígito=país (1=CL,2=AR,3=CO,4=BR,5=EC,6=MX) segundo dígito=tema (1=General,2=Tech,3=Impacto Global,4=Finanzas,5=Inversiones,6=Economía)`;

  const model = process.env.OPENROUTER_ENRICH_MODEL || 'x-ai/grok-4.1-fast:online';
  const { content, usage, citations } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    search: true,
  });

  if (traceId) {
    await logAiStep({
      traceId,
      step: `rewriting:${cluster.main_topic.substring(0, 30)}`,
      model,
      prompt,
      response: content,
      tokensUsed: usage?.total_tokens || 0,
    });
  }

  try {
    // Clean Grok citation artifacts before parsing
    let cleaned = content
      .replace(/```json\n?|```/g, '')
      .replace(/<grok:render[^>]*>[\s\S]*?<\/grok:render>/g, '')
      .replace(/<grok:[^>]*\/>/g, '')
      .replace(/\[\d+\]/g, '')
      .trim();
    
    const data = JSON.parse(cleaned);
    
    // Also clean the content field itself
    if (data.content) {
      data.content = data.content
        .replace(/<grok:render[^>]*>[\s\S]*?<\/grok:render>/g, '')
        .replace(/<grok:[^>]*\/>/g, '')
        .replace(/\[\d+\]/g, '')
        .trim();
    }

    // Decode Grok's 2-digit f value
    const COUNTRY_DECODE: Record<number, string> = { 1:'cl', 2:'ar', 3:'co', 4:'br', 5:'ec', 6:'mx' };
    const TOPIC_DECODE: Record<number, string> = { 1:'chile', 2:'tech_global', 3:'impacto_global', 4:'finanzas', 5:'inversiones', 6:'economia' };
    
    const fVal = Number(data.f) || 0;
    const countryNum = Math.floor(fVal / 10);
    const topicNum = fVal % 10;
    const grokCountry = COUNTRY_DECODE[countryNum] || cluster.country_code || 'cl';
    const grokFeedTag = TOPIC_DECODE[topicNum] || cluster.feed_tag || 'chile';

    return {
      title: data.title,
      content: data.content,
      summary: data.summary,
      sentiment: data.sentiment || 'neutral',
      category: data.category || cluster.category,
      relevance_score: Number(data.relevance_score) || 50,
      city: data.city === 'null' || data.city === null ? null : data.city,
      imageUrl: findBestImage(cluster, rawArticles),
      slug: generateSlug(data.title),
      ai_model: model,
      is_live: cluster.is_live || false,
      sources: [
        ...cluster.articles.map(a => ({ name: a.sourceName, url: a.url })),
        ...(citations || []).map((url: string) => {
          try {
            const hostname = new URL(url).hostname.replace('www.', '');
            return { name: hostname, url };
          } catch (_e) { return { name: 'Web', url }; }
        })
      ].filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i), // deduplicate
      feed_tag: grokFeedTag,
      country_code: grokCountry,
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
      views: 0,
    };
  } catch (err) {
    console.error("Failed to parse Grok response:", content.substring(0, 500));
    throw new Error("Grok returned invalid JSON");
  }
}

/**
 * Phase 2: Step 3.5 Flash — Filter + Rewrite Minor Articles
 * 
 * This free model receives ALL raw articles in a single batch.
 * It classifies each by importance (0-100):
 *   - importance >= 70 → route: "GROK" (sent to Grok for premium rewriting)
 *   - importance < 70  → route: "SELF" (Step rewrites it directly)
 */
interface StepFilterResult {
  index: number;
  title_original: string;
  importance: number;
  route: 'GROK' | 'SELF';
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
    `${i}. "${a.title}" — ${a.sourceName}\n   Resumen: ${a.summary.substring(0, 200)}\n   URL: ${a.url}`
  ).join('\n\n');

  const prompt = `Eres el editor jefe de "NewsBI Pulse", un portal premium de noticias FINANCIERAS Y ECONÓMICAS en ESPAÑOL.

ENFOQUE DEL PORTAL: Economía, finanzas, inversiones, mercados, política económica, tech con impacto financiero. 
NO NOS INTERESA: Deportes, fútbol, entretenimiento, farándula, crimen común, sucesos policiales.

Tu trabajo tiene 2 partes:
1. CLASIFICAR cada noticia por importancia FINANCIERA (0-100)
2. ASIGNAR la SECCIÓN correcta del portal
3. REESCRIBIR las noticias MENORES (importancia < 70) tú mismo

ESCALA DE IMPORTANCIA FINANCIERA:
- 90-100: Crisis económica, cambio de tasas de interés, caídas de mercados, quiebra de empresa grande, evento geopolítico con impacto económico directo
- 70-89: Resultados financieros de empresas grandes, acuerdos comerciales, cambios regulatorios, IPOs, fusiones, datos macroeconómicos
- 50-69: Noticias corporativas menores, startups, tech interesante, política local con impacto económico indirecto
- 30-49: Noticias muy locales sin impacto económico, política menor
- 0-29: Deportes, fútbol, entretenimiento, publicidad, spam, sucesos policiales → DESCARTAR

SECCIONES DEL PORTAL (campo "section"):
- "chile": Noticias de Chile (economía, empresas, política chilena, ex presidentes)
- "finanzas": Bancos, corporativos, fusiones, resultados financieros
- "inversiones": Bolsa, criptomonedas, mercados, trading, commodities
- "economia": Macroeconomía, inflación, PIB, tasas de interés, indicadores
- "impacto_global": SOLO guerras, pandemias, crisis mundiales, elecciones de potencias (EEUU, China). ¡Noticias políticas locales de Latinoamérica o Chile NUNCA son impacto global!
- "tech_global": IA, Big Tech, startups tech con valorización relevante

NOTICIAS A EVALUAR:
${articleList}

RESPONDE con este JSON exacto (sin markdown, sin backticks):
{
  "articles": [
    {
      "index": 0,
      "title_original": "Título original",
      "importance": 85,
      "route": "GROK",
      "section": "inversiones",
      "reason": "Caída de mercados asiáticos por tensiones comerciales"
    },
    {
      "index": 1,
      "title_original": "Otro título",
      "importance": 55,
      "route": "SELF",
      "section": "finanzas",
      "reason": "Noticia corporativa menor",
      "rewritten": {
        "title": "Título reescrito SEO en español (max 100)",
        "summary": "Resumen de 1 oración",
        "content": "Artículo de 2-3 párrafos. Tono periodístico. Usa **negritas** para datos clave.",
        "tags": ["Tag1", "Tag2", "Tag3"],
        "category": "business",
        "sentiment": "positive|negative|neutral",
        "city": "Ciudad o null",
        "f": 14
      }
    }
  ]
}

REGLAS ESTRICTAS:
- route="GROK" SOLO para importancia >= 70 (NO incluir "rewritten"). Estas son las que realmente merecen investigación profunda con web search.
- route="SELF" para importancia < 70 (INCLUIR "rewritten" completo)
- DESCARTAR (importance < 25, route SELF sin rewritten): deportes, fútbol, entretenimiento, publicidad
- section DEBE ser una de: chile, finanzas, inversiones, economia, impacto_global, tech_global
- f = código 2 dígitos: primer dígito=país (1=CL,2=AR,3=CO,4=BR,5=EC,6=MX) segundo=tema (1=General,2=Tech,3=Impacto Global,4=Finanzas,5=Inversiones,6=Economía)
- Escribe TODO en español
- Sé MUY estricto: una noticia de fútbol NUNCA es importante. Una caída de bolsa SÍ lo es.`;

  const model = process.env.OPENROUTER_FILTER_MODEL || 'stepfun/step-3.5-flash:free';
  console.log(`[PIPELINE] Calling Step 3.5 Flash (${model}) with ${articles.length} articles...`);
  const { content, usage } = await callOpenRouter({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 8000,
  });

  console.log(`[PIPELINE] Step raw response (first 300): ${content.substring(0, 300)}`);

  if (traceId) {
    await logAiStep({
      traceId,
      step: 'filter_step',
      model,
      prompt,
      response: content,
      tokensUsed: usage?.total_tokens || 0,
    });
  }

  try {
    const rawJson = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(rawJson);
    const results: StepFilterResult[] = parsed.articles || parsed;
    console.log(`[PIPELINE] Step classified ${results.length} articles: ${results.filter(r => r.route === 'GROK').length} GROK, ${results.filter(r => r.route === 'SELF').length} SELF`);
    return results;
  } catch (err) {
    console.error("Failed to parse Step response:", content.substring(0, 800));
    // Fallback: route all articles to GROK
    console.warn("[PIPELINE] Step parse failed — falling back: routing all articles to GROK");
    return articles.map((a, i) => ({
      index: i,
      title_original: a.title,
      importance: 75,
      route: 'GROK' as const,
      reason: 'Step fallback',
    }));
  }
}


/**
 * Full Pipeline Execution (Fetch → Step Filter → Grok/Self → DB)
 */
export async function runNewsPipeline(): Promise<{ success: boolean; articles: FinalNewsArticle[]; error?: string; step?: string }> {
  console.log("=== [PIPELINE] Starting Two-LLM Pipeline Run ===");
  
  let traceId: string;
  try {
    traceId = randomUUID();
  } catch (e) {
    traceId = "00000000-0000-0000-0000-000000000000".replace(/0/g, () => (Math.random() * 16 | 0).toString(16));
  }
  
  console.log(`=== [PIPELINE] Trace ID: ${traceId} ===`);
  
  try {
    // ─── Step 1: Fetch raw articles ───
    console.log("[PIPELINE] Step 1: Fetching raw articles from NewsData.io...");
    let rawArticles = await fetchRawNews();
    rawArticles = rawArticles.slice(0, 40);
    console.log(`[PIPELINE] Step 1 Complete: Fetched ${rawArticles.length} raw articles.`);
    
    if (rawArticles.length === 0) {
      console.warn("[PIPELINE] No raw articles found. Exiting pipeline.");
      return { success: true, articles: [] } as any; 
    }
    
    // Deduplicate by title
    const seenTitles = new Set<string>();
    const uniqueArticles: RawArticle[] = [];
    for (const art of rawArticles) {
      const key = art.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        uniqueArticles.push(art);
      }
    }
    // Take max 10 unique articles for Step to evaluate
    const toFilter = uniqueArticles.slice(0, 5);
    console.log(`[PIPELINE] Deduplicated to ${uniqueArticles.length}, sending ${toFilter.length} to Step.`);

    // ─── Step 2: Filter with Step 3.5 Flash ───
    console.log("[PIPELINE] Step 2: Filtering articles with Step 3.5 Flash...");
    const filterResults = await filterWithStep(toFilter, traceId);
    
    // Separate into GROK and SELF routes
    const grokArticles = filterResults.filter(r => r.route === 'GROK' && r.importance >= 70);
    const selfArticles = filterResults.filter(r => r.route === 'SELF' && r.rewritten && r.importance >= 25);
    
    console.log(`[PIPELINE] Step 2 Complete: ${grokArticles.length} → Grok, ${selfArticles.length} → Self-rewritten`);

    // ─── Country/Topic decode helper ───
    const COUNTRY_DECODE: Record<number, string> = { 1:'cl', 2:'ar', 3:'co', 4:'br', 5:'ec', 6:'mx' };
    const TOPIC_DECODE: Record<number, string> = { 1:'chile', 2:'tech_global', 3:'impacto_global', 4:'finanzas', 5:'inversiones', 6:'economia' };

    // ─── Step 3a: Convert SELF articles to FinalNewsArticle ───
    const selfFinalArticles: FinalNewsArticle[] = [];
    const stepModel = process.env.OPENROUTER_FILTER_MODEL || 'stepfun/step-3.5-flash:free';
    
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
        imageUrl: raw.imageUrl || null,
        slug: generateSlug(item.rewritten.title),
        ai_model: stepModel,
        sources: [{ name: raw.sourceName, url: raw.url }],
        feed_tag: (item as any).section || TOPIC_DECODE[topicNum] || 'chile',
        country_code: COUNTRY_DECODE[countryNum] || raw.country_code || 'cl',
        tags: Array.isArray(item.rewritten.tags) ? item.rewritten.tags.slice(0, 5) : [],
        views: 0,
      });
    }
    console.log(`[PIPELINE] Step 3a: ${selfFinalArticles.length} self-rewritten articles ready.`);

    // ─── Step 3b: Send GROK articles to Grok 4.1 Fast ───
    console.log(`[PIPELINE] Step 3b: Enriching ${grokArticles.length} important articles with Grok...`);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const grokFinalArticles: FinalNewsArticle[] = [];

    for (const item of grokArticles) {
      const raw = toFilter[item.index];
      if (!raw) continue;

      const potentialSlug = generateSlug(raw.title);
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('slug', potentialSlug)
        .maybeSingle();

      if (existing) {
        console.log(`[PIPELINE] Skipping '${raw.title.substring(0, 40)}' - duplicate in DB.`);
        continue;
      }
      
      try {
        const cluster: ClusteredEvent = {
          event_id: generateSlug(raw.title),
          main_topic: raw.title,
          category: 'tech_global',
          relevance_score: item.importance,
          articles: [raw],
          feed_tag: raw.feed_tag,
          country_code: raw.country_code,
          tags: [],
          sentiment: 'neutral',
        };
        
        const enriched = await rewriteNewsWithGrok(cluster, traceId, rawArticles);
        grokFinalArticles.push(enriched);
        // Delay to prevent 429 Too Many Requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error(`[PIPELINE] Grok error on '${raw.title.substring(0, 40)}':`, e);
      }
    }
    console.log(`[PIPELINE] Step 3b: ${grokFinalArticles.length} Grok-enriched articles ready.`);

    // ─── Step 4: Combine and save to DB ───
    const allFinalArticles = [...grokFinalArticles, ...selfFinalArticles];
    console.log(`[PIPELINE] Step 4: Saving ${allFinalArticles.length} articles (${grokFinalArticles.length} Grok + ${selfFinalArticles.length} Step)...`);
    
    if (allFinalArticles.length > 0) {
      let savedCount = 0;

      for (const a of allFinalArticles) {
        // Check for slug duplicates
        const { data: dup } = await supabase
          .from('news_articles')
          .select('id')
          .eq('slug', a.slug)
          .maybeSingle();
        
        if (dup) {
          console.log(`[PIPELINE] Skipping duplicate slug: ${a.slug.substring(0, 40)}`);
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
          lat: a.lat,
          lng: a.lng,
          image_url: a.imageUrl,
          slug: a.slug,
          feed_tag: a.feed_tag || null,
          country_code: a.country_code || null,
          is_live: a.is_live || false, 
          published_at: new Date().toISOString(),
          tags: a.tags || [],
          views: a.views || 0
        };

        let { error } = await supabase.from('news_articles').insert(fullRow);

        if (error && error.code === 'PGRST204') {
          const missingCol = error.message.match(/'(\w+)' column/)?.[1];
          if (missingCol) delete fullRow[missingCol];
          const retry = await supabase.from('news_articles').insert(fullRow);
          error = retry.error;
          
          if (error && error.code === 'PGRST204') {
            const missingCol2 = error.message.match(/'(\w+)' column/)?.[1];
            if (missingCol2) delete fullRow[missingCol2];
            const retry2 = await supabase.from('news_articles').insert(fullRow);
            error = retry2.error;
          }
        }

        if (error) {
          console.error(`[PIPELINE] DB Error for "${a.title.substring(0, 30)}":`, JSON.stringify(error));
        } else {
          savedCount++;
          console.log(`[PIPELINE] ✅ Saved [${a.ai_model.includes('grok') ? 'GROK' : 'STEP'}]: ${a.title.substring(0, 50)}`);
        }
      }
      
      console.log(`[PIPELINE] Step 4 Complete: ${savedCount}/${allFinalArticles.length} articles saved.`);
    }
    
    console.log("=== Pipeline finished successfully ===");
    return { success: true, articles: allFinalArticles };

  } catch (err: any) {
    console.error("Pipeline crashed:", err?.message, err?.stack);
    try {
      require('fs').writeFileSync('pipeline_error_debug.txt', `${err?.message}\n${err?.stack}`);
    } catch(e) {}
    return { 
      success: false, 
      articles: [], 
      error: `${err?.message || "Unknown error"} | Stack: ${(err?.stack || '').substring(0, 300)}`, 
      step: 'pipeline_crash' 
    };
  }
}
