/**
 * Flow image generation helpers — OpenRouter Image API + agent planning.
 */

import { callOpenRouter } from "@/lib/openrouter";

export type FlowAspectRatio = "16:9" | "4:3" | "1:1" | "3:4" | "9:16";

export interface PlannedImage {
  prompt: string;
  label: string;
}

export interface AgentPlan {
  imageCount: number;
  aspectRatio: FlowAspectRatio;
  userMessage: string;
  images: PlannedImage[];
  /** Estimated credits (filled by caller after cost calc) */
  credits?: number;
}

export interface GeneratedImage {
  dataUrl: string;
  prompt: string;
  label?: string;
}

const VALID_RATIOS: FlowAspectRatio[] = ["16:9", "4:3", "1:1", "3:4", "9:16"];

const PLANNER_MODEL =
  process.env.LLM_MODEL_FAST || "google/gemini-2.5-flash";

export function getImageBaseCost(modelId: string): number {
  return modelId === "google/gemini-3.1-flash-lite-image" ? 15 : 55;
}

export function clampImageCount(n: number, max = 4): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(max, Math.floor(n));
}

/**
 * Fast heuristic when the planner LLM is unavailable.
 * Detects "3 imágenes", "carrusel", "instagram", "x2", etc.
 */
export function heuristicImagePlan(
  prompt: string,
  fallbackCount: number,
  fallbackRatio: FlowAspectRatio
): AgentPlan {
  const lower = prompt.toLowerCase();

  let count = fallbackCount;

  // Explicit number patterns
  const numMatch =
    lower.match(
      /(\d+)\s*(im[aá]genes?|imgs?|fotos?|slides?|paneles?|piezas?|posts?|variantes?)/i
    ) ||
    lower.match(
      /(im[aá]genes?|imgs?|fotos?|slides?|paneles?|piezas?)\s*(de|:)?\s*(\d+)/i
    ) ||
    lower.match(/\bx\s*([2-4])\b/) ||
    lower.match(/\b([2-4])x\b/);

  if (numMatch) {
    const raw = parseInt(numMatch[1] || numMatch[3], 10);
    if (raw >= 1 && raw <= 10) count = clampImageCount(raw);
  }

  // Carousel / series intent without explicit number → default 3
  const seriesIntent =
    /carrusel|carousel|serie de|set de|pack de|secuencia|storyboard|feed de instagram|posts? para instagram|stories|reels cover/i.test(
      lower
    );
  if (seriesIntent && count === fallbackCount && !numMatch) {
    count = 3;
  }

  // Aspect ratio hints
  let aspectRatio = fallbackRatio;
  if (/instagram|carrusel|carousel|feed|posts?\b/i.test(lower)) {
    aspectRatio = /story|stories|9:16|vertical/i.test(lower) ? "9:16" : "1:1";
  } else if (/story|stories|tiktok|reels?|9:16/i.test(lower)) {
    aspectRatio = "9:16";
  } else if (/banner|youtube|thumbnail|16:9|landscape|horizontal/i.test(lower)) {
    aspectRatio = "16:9";
  } else if (/portrait|retrato|3:4/i.test(lower)) {
    aspectRatio = "3:4";
  }

  const images: PlannedImage[] = [];
  if (count === 1) {
    images.push({ prompt: prompt.trim(), label: "Imagen 1" });
  } else if (seriesIntent) {
    const roles = [
      "Hook / portada impactante que detiene el scroll",
      "Desarrollo / valor principal del mensaje",
      "Detalle o prueba social",
      "Cierre con CTA claro",
    ];
    for (let i = 0; i < count; i++) {
      const role = roles[Math.min(i, roles.length - 1)];
      images.push({
        label: `Slide ${i + 1}`,
        prompt: `${prompt.trim()}\n\nEsta es la imagen ${i + 1} de ${count} para un carrusel cohesivo. Rol: ${role}. Mantén estilo visual, paleta y tipografía consistentes entre slides. Diferencia claramente el contenido de este slide respecto a los demás.`,
      });
    }
  } else {
    for (let i = 0; i < count; i++) {
      images.push({
        label: `Variante ${i + 1}`,
        prompt: `${prompt.trim()}\n\nVariante creativa ${i + 1} de ${count}: misma idea central, composición y encuadre distintos, sin repetir la misma escena exacta.`,
      });
    }
  }

  return {
    imageCount: count,
    aspectRatio,
    userMessage: `Generaré ${count} imagen${count > 1 ? "es" : ""}.`,
    images,
  };
}

/**
 * LLM agent: derive how many images, individual prompts, ratio, and user message.
 */
export async function planWithAgent(
  userPrompt: string,
  options: {
    fallbackCount: number;
    fallbackRatio: FlowAspectRatio;
    baseCostPerImage: number;
    brandBlock?: string;
  }
): Promise<AgentPlan> {
  const { fallbackCount, fallbackRatio, baseCostPerImage, brandBlock } =
    options;

  const system = `Eres el Agente Creativo de Maverlang Flow. Analizas prompts de usuarios y decides cuántas imágenes generar y con qué prompts individuales.

Reglas:
1. Si el usuario pide N imágenes, un carrusel, un set, slides, variantes, etc., genera exactamente esa cantidad (máximo 4).
2. Si menciona "carrusel de Instagram" sin número, usa 3 imágenes (hook, valor, CTA) con ratio 1:1 salvo que pida stories (9:16).
3. Cada prompt de imagen debe ser completo, cinemático y autocontenido (el modelo de imagen no ve los otros prompts).
4. Mantén coherencia de estilo/marca entre slides cuando sea una serie.
5. Responde SOLO con JSON válido, sin markdown ni texto extra.

Formato JSON exacto:
{
  "imageCount": number,
  "aspectRatio": "16:9" | "4:3" | "1:1" | "3:4" | "9:16",
  "userMessage": "mensaje breve en español al usuario explicando el plan y que se consumirán CREDITS créditos",
  "images": [
    { "prompt": "prompt detallado en el idioma del usuario", "label": "etiqueta corta" }
  ]
}

Importante: en userMessage usa la palabra CREDITS como placeholder del número de créditos (se reemplazará después).`;

  const user = [
    brandBlock ? `Contexto de marca:\n${brandBlock}\n` : "",
    `Prompt del usuario:\n${userPrompt}`,
    `\nFallback count del UI: ${fallbackCount}`,
    `Fallback aspect ratio: ${fallbackRatio}`,
    `Costo por imagen: ${baseCostPerImage} créditos`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callOpenRouter({
      model: PLANNER_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const parsed = extractJsonObject(result.content);
    if (!parsed) throw new Error("No JSON in planner response");

    const imageCount = clampImageCount(
      Number(parsed.imageCount) || fallbackCount
    );
    const aspectRatio = VALID_RATIOS.includes(parsed.aspectRatio as FlowAspectRatio)
      ? (parsed.aspectRatio as FlowAspectRatio)
      : fallbackRatio;

    let images: PlannedImage[] = Array.isArray(parsed.images)
      ? parsed.images
          .filter(
            (img: unknown) =>
              img &&
              typeof img === "object" &&
              typeof (img as PlannedImage).prompt === "string"
          )
          .map((img: PlannedImage, i: number) => ({
            prompt: String(img.prompt).trim(),
            label: String(img.label || `Imagen ${i + 1}`).slice(0, 60),
          }))
      : [];

    // Ensure we have exactly imageCount prompts
    if (images.length < imageCount) {
      const heuristic = heuristicImagePlan(
        userPrompt,
        imageCount,
        aspectRatio
      );
      while (images.length < imageCount) {
        images.push(
          heuristic.images[images.length] || {
            prompt: userPrompt,
            label: `Imagen ${images.length + 1}`,
          }
        );
      }
    }
    images = images.slice(0, imageCount);

    const credits = imageCount * baseCostPerImage;
    let userMessage =
      typeof parsed.userMessage === "string" && parsed.userMessage.trim()
        ? parsed.userMessage.trim()
        : `Voy a generar ${imageCount} imagen${imageCount > 1 ? "es" : ""}. Se consumirán CREDITS créditos.`;

    userMessage = userMessage
      .replace(/CREDITS/g, String(credits))
      .replace(/\b\d+\s*cr[eé]ditos?\b/gi, `${credits} créditos`);

    // Always ensure credits are mentioned
    if (!/\d+\s*cr[eé]dito/i.test(userMessage)) {
      userMessage += ` Se consumirán ${credits} créditos.`;
    }

    return {
      imageCount,
      aspectRatio,
      userMessage,
      images,
      credits,
    };
  } catch (err) {
    console.warn("[FLOW-AGENT] Planner failed, using heuristic:", err);
    const plan = heuristicImagePlan(
      userPrompt,
      fallbackCount,
      fallbackRatio
    );
    const credits = plan.imageCount * baseCostPerImage;
    plan.credits = credits;
    plan.userMessage = `Detecté que quieres ${plan.imageCount} imagen${plan.imageCount > 1 ? "es" : ""}. Se consumirán ${credits} créditos.`;
    return plan;
  }
}

function extractJsonObject(text: string): Record<string, any> | null {
  if (!text) return null;
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Generate a single image via OpenRouter Image API.
 */
export async function generateOpenRouterImage(options: {
  model: string;
  prompt: string;
  aspectRatio?: FlowAspectRatio;
  inputReferences?: { type: "image_url"; image_url: { url: string } }[];
}): Promise<GeneratedImage> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined.");
  }

  const payload: Record<string, unknown> = {
    model: options.model,
    prompt: options.prompt,
    n: 1,
  };

  if (options.aspectRatio) {
    payload.aspect_ratio = options.aspectRatio;
  }

  if (options.inputReferences?.length) {
    payload.input_references = options.inputReferences;
  }

  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://maverlang.cl",
      "X-Title": "Maverlang Flow",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(300000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[FLOW-IMAGE] OpenRouter images error ${response.status}:`,
      errorText.slice(0, 800)
    );
    throw new Error(
      `Error al generar imagen (${response.status}). Inténtalo de nuevo.`
    );
  }

  const result = await response.json();
  const first = result?.data?.[0];
  if (!first?.b64_json) {
    // Some providers return url instead of b64
    if (first?.url) {
      return {
        dataUrl: first.url as string,
        prompt: options.prompt,
      };
    }
    throw new Error("La API no devolvió una imagen válida.");
  }

  const mediaType = (first.media_type as string) || "image/png";
  return {
    dataUrl: `data:${mediaType};base64,${first.b64_json}`,
    prompt: options.prompt,
  };
}

/**
 * Generate multiple images sequentially (safer for rate limits).
 * Fails partially: returns successes + errors.
 */
export async function generateMultipleImages(options: {
  model: string;
  images: PlannedImage[];
  aspectRatio: FlowAspectRatio;
  inputReferences?: { type: "image_url"; image_url: { url: string } }[];
}): Promise<{
  images: GeneratedImage[];
  errors: string[];
}> {
  const out: GeneratedImage[] = [];
  const errors: string[] = [];

  for (const planned of options.images) {
    try {
      const img = await generateOpenRouterImage({
        model: options.model,
        prompt: planned.prompt,
        aspectRatio: options.aspectRatio,
        inputReferences: options.inputReferences,
      });
      out.push({
        ...img,
        label: planned.label,
        prompt: planned.prompt,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      errors.push(`${planned.label}: ${msg}`);
      console.error(`[FLOW-IMAGE] Failed ${planned.label}:`, err);
    }
  }

  return { images: out, errors };
}
