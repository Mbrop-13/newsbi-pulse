import { requireUser } from "@/lib/auth-helpers";
import { checkTokenLimit, incrementTokenUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, AI_CHAT_LIMIT } from "@/lib/rate-limit";
import { assertSafeFetchUrl } from "@/lib/url-guard";
import { createServiceClient } from "@/lib/supabase";
import { callMimo, extractJsonObject } from "@/lib/mimo-client";

export const maxDuration = 300;

const CONCURRENCY = 3;
const HTML_CAP = 14000;
const MODEL = () => process.env.LLM_MODEL_FAST || "xiaomi/mimo-v2.5";

function sseEncode(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const safe = await assertSafeFetchUrl(url);
    if (!safe.ok) return null;

    const res = await fetch(safe.url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "MaverlangBrandBot/1.0 (+https://maverlang.cl; brand-analysis)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text") && !ct.includes("html") && !ct.includes("xml")) {
      return null;
    }
    const html = await res.text();
    const text = stripHtml(html).slice(0, HTML_CAP);
    return text.length > 40 ? text : null;
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

function parseAgentJson(content: string): Record<string, unknown> {
  try {
    const json = extractJsonObject(content.trim());
    return JSON.parse(json);
  } catch {
    return {
      summary: content.slice(0, 600),
      tone: null,
      colors: [],
      audience: null,
      claims: [],
      cta: null,
      products_detected: [],
    };
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = auth.data.user.id;

  const rl = await rateLimit(`flow-brand-analyze:${userId}`, {
    maxRequests: 3,
    windowSeconds: 120,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  // also soft AI chat limit
  const rl2 = await rateLimit(`ai-chat:${userId}`, AI_CHAT_LIMIT);
  if (!rl2.allowed) return rateLimitResponse(rl2.retryAfterSeconds);

  const tokenLimit = await checkTokenLimit(userId);
  if (!tokenLimit.allowed) {
    return Response.json(
      {
        error:
          "Has alcanzado el límite de tokens de tu plan. Actualiza tu suscripción para analizar tu marca.",
        code: "TOKEN_LIMIT_REACHED",
        upgradeRequired:
          tokenLimit.tier === "free"
            ? "pro"
            : tokenLimit.tier === "pro"
              ? "max"
              : "ultra",
      },
      { status: 403 }
    );
  }

  let body: { brandId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: brand, error: brandErr } = await service
    .from("flow_brands")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (brandErr || !brand) {
    return Response.json({ error: "Marca no encontrada" }, { status: 404 });
  }

  if (body.brandId && body.brandId !== brand.id) {
    return Response.json({ error: "Marca no autorizada" }, { status: 403 });
  }

  const { data: allItems } = await service
    .from("flow_brand_items")
    .select("*")
    .eq("brand_id", brand.id)
    .order("sort_order", { ascending: true });

  type BrandItemRow = {
    id: string;
    name: string;
    kind: string;
    url: string | null;
    description?: string | null;
  };

  const items = ((allItems || []) as BrandItemRow[]).filter(
    (it) => typeof it.url === "string" && it.url.trim().length > 0
  );

  if (items.length === 0) {
    return Response.json(
      { error: "Agrega al menos una URL (web o producto) para analizar." },
      { status: 400 }
    );
  }

  // Early token budget estimate: ~1500 tokens per URL + 2000 synthesizer
  const estimated = items.length * 1500 + 2000;
  if (tokenLimit.remaining >= 0 && tokenLimit.remaining < Math.min(estimated, 3000)) {
    return Response.json(
      {
        error:
          "No tienes tokens suficientes para analizar todas las URLs de tu marca.",
        code: "TOKEN_LIMIT_REACHED",
        upgradeRequired: tokenLimit.tier === "free" ? "pro" : "max",
      },
      { status: 403 }
    );
  }

  await service
    .from("flow_brands")
    .update({
      analysis_status: "analyzing",
      analysis_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", brand.id);

  await service
    .from("flow_brand_items")
    .update({ analysis_status: "pending" })
    .eq("brand_id", brand.id)
    .not("url", "is", null);

  const encoder = new TextEncoder();
  let totalTokens = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseEncode(payload)));
        } catch {
          /* stream closed */
        }
      };

      try {
        const analyses: Array<{
          itemId: string;
          name: string;
          kind: string;
          url: string;
          analysis: Record<string, unknown>;
        }> = [];

        await mapPool(items, CONCURRENCY, async (item) => {
          send({
            type: "agent_start",
            itemId: item.id,
            name: item.name,
            kind: item.kind,
          });

          await service
            .from("flow_brand_items")
            .update({
              analysis_status: "running",
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          try {
            const itemUrl = item.url as string;
            // Re-validate SSRF at analyze time
            const safe = await assertSafeFetchUrl(itemUrl);
            if (!safe.ok) {
              throw new Error(`URL no permitida: ${safe.reason}`);
            }

            const pageText = await fetchPageText(itemUrl);
            const useSearch = !pageText;

            const system = `Eres un agente de branding de Maverlang. Analizas una página web de una marca y devuelves SOLO JSON válido (sin markdown).
Campos obligatorios:
{
  "title": "título detectado o nombre del recurso",
  "summary": "resumen en español, 2-4 oraciones",
  "tone": "tono de voz",
  "colors": ["#hex o nombres de color"],
  "audience": "audiencia objetivo",
  "claims": ["propuesta de valor 1", "..."],
  "cta": "llamado a la acción principal si existe",
  "products_detected": ["productos o servicios mencionados"],
  "visual_style": "estilo visual aparente",
  "keywords": ["palabra1", "palabra2"]
}`;

            const userContent = pageText
              ? `Marca: ${brand.name}
Tipo de marca: ${brand.brand_type}
Tipo de recurso: ${item.kind}
Nombre del recurso: ${item.name}
URL: ${itemUrl}
Descripción del usuario: ${item.description || "(sin descripción)"}

Contenido extraído de la página (puede estar incompleto):
"""
${pageText}
"""

Analiza la identidad de marca y el contenido de esta página.`
              : `Marca: ${brand.name}
Tipo de marca: ${brand.brand_type}
Tipo de recurso: ${item.kind}
Nombre del recurso: ${item.name}
URL: ${itemUrl}
Descripción del usuario: ${item.description || "(sin descripción)"}

No se pudo extraer HTML. Usa búsqueda web sobre esta URL y el nombre de la marca para inferir el contexto de branding.`;

            const result = await callMimo({
              model: MODEL(),
              messages: [
                { role: "system", content: system },
                { role: "user", content: userContent },
              ],
              temperature: 0.35,
              max_tokens: 1000,
              search: useSearch,
              user: userId,
            });

            if (result.usage?.total_tokens) {
              totalTokens += result.usage.total_tokens;
            }

            const analysis = parseAgentJson(result.content);
            const summary =
              typeof analysis.summary === "string"
                ? analysis.summary
                : "Análisis completado";
            const title =
              typeof analysis.title === "string" && analysis.title.trim()
                ? analysis.title.trim().slice(0, 120)
                : item.name;

            await service
              .from("flow_brand_items")
              .update({
                name: title,
                analysis,
                analysis_status: "done",
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            analyses.push({
              itemId: item.id,
              name: title,
              kind: item.kind,
              url: itemUrl,
              analysis,
            });

            send({
              type: "agent_done",
              itemId: item.id,
              name: title,
              kind: item.kind,
              summary,
              analysis,
            });

            send({
              type: "section",
              section: {
                id: item.id,
                name: title,
                kind: item.kind,
                summary,
              },
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al analizar";
            console.error(`[brand-analyze] item ${item.id}:`, msg);
            await service
              .from("flow_brand_items")
              .update({
                analysis_status: "failed",
                analysis: { error: msg },
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            send({
              type: "agent_fail",
              itemId: item.id,
              name: item.name,
              kind: item.kind,
              error: msg,
            });
          }
        });

        // Synthesizer
        let ai_profile: Record<string, unknown> = {
          generated_at: new Date().toISOString(),
          items_analyzed: analyses.length,
        };

        if (analyses.length > 0) {
          try {
            const synth = await callMimo({
              model: MODEL(),
              messages: [
                {
                  role: "system",
                  content: `Eres el sintetizador de marca de Maverlang. Unifica los análisis de varias páginas en un perfil de marca único. Devuelve SOLO JSON:
{
  "tagline": "frase corta de marca",
  "brand_voice": "descripción del tono",
  "visual_identity": "colores, estilo, tipografía aparente",
  "target_audience": "audiencia",
  "value_props": ["..."],
  "product_catalog_summary": "resumen de productos/servicios",
  "image_generation_guidelines": "instrucciones para generar imágenes de marketing coherentes con la marca",
  "do": ["recomendaciones"],
  "dont": ["evitar"]
}`,
                },
                {
                  role: "user",
                  content: `Marca: ${brand.name}
Tipo: ${brand.brand_type}
Descripción del usuario: ${brand.description || "(vacía)"}
Web: ${brand.website_url || "(no)"}

Análisis por página:
${JSON.stringify(
  analyses.map((a) => ({
    name: a.name,
    kind: a.kind,
    url: a.url,
    analysis: a.analysis,
  })),
  null,
  2
).slice(0, 12000)}`,
                },
              ],
              temperature: 0.4,
              max_tokens: 1200,
              user: userId,
            });

            if (synth.usage?.total_tokens) {
              totalTokens += synth.usage.total_tokens;
            }

            try {
              ai_profile = {
                ...parseAgentJson(synth.content),
                generated_at: new Date().toISOString(),
                items_analyzed: analyses.length,
              };
            } catch {
              ai_profile.summary = synth.content.slice(0, 800);
            }
          } catch (e: unknown) {
            console.error(
              "[brand-analyze] synthesizer:",
              e instanceof Error ? e.message : e
            );
            ai_profile.error = "No se pudo sintetizar el perfil completo";
          }
        }

        await service
          .from("flow_brands")
          .update({
            ai_profile,
            analysis_status: "completed",
            analysis_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", brand.id);

        if (totalTokens > 0) {
          await incrementTokenUsage(userId, totalTokens);
        }

        send({ type: "profile", ai_profile });
        send({ type: "usage", tokens: totalTokens });
        send({ type: "complete" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        console.error("[brand-analyze] fatal:", err);
        const fatalMsg = err instanceof Error ? err.message : "Error";
        await service
          .from("flow_brands")
          .update({
            analysis_status: "failed",
            analysis_error: fatalMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", brand.id);

        send({ type: "error", error: fatalMsg || "Error en el análisis" });
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
