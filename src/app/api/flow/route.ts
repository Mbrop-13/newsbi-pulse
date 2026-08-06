import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, getClientIp } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  tryConsumeImageCredits,
  refundImageCredits,
  getImageCreditsUsage,
} from "@/lib/check-limits";
import {
  type FlowAspectRatio,
  type PlannedImage,
  clampImageCount,
  getImageBaseCost,
  heuristicImagePlan,
  planWithAgent,
  generateMultipleImages,
} from "@/lib/flow/image-generation";

export const maxDuration = 300;

const MAX_PROMPT_CHARS = 4000;
const MAX_REF_IMAGES = 4;
const MAX_DATA_URL_CHARS = 1_600_000; // ~1.2MB base64 budget per image
const ALLOWED_MODELS = new Set([
  "google/gemini-3.1-flash-lite-image",
  "google/gemini-3-pro-image",
]);

const flowBodySchema = z.object({
  prompt: z.string().min(1).max(MAX_PROMPT_CHARS),
  model: z.string().max(120).optional(),
  isAgentActive: z.boolean().optional().default(false),
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "3:4", "9:16"]).optional(),
  count: z.number().int().min(1).max(4).optional(),
  previewOnly: z.boolean().optional().default(false),
  referenceImages: z.array(z.string().max(MAX_DATA_URL_CHARS)).max(MAX_REF_IMAGES).optional(),
  brandContext: z
    .object({
      brandName: z.string().max(120).optional(),
      brandType: z.string().max(60).optional(),
      description: z.string().max(2000).optional(),
      logoMode: z
        .enum(["none", "bottom_right", "top_right", "bottom_left", "ai_decide"])
        .optional(),
      hasLogo: z.boolean().optional(),
      logoData: z.string().max(MAX_DATA_URL_CHARS).nullable().optional(),
      productName: z.string().max(200).optional(),
      productDescription: z.string().max(1000).optional(),
      productUrl: z.string().max(500).optional(),
      aiProfile: z.record(z.string(), z.any()).optional(),
      itemAnalysis: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

type LogoMode =
  | "none"
  | "bottom_right"
  | "top_right"
  | "bottom_left"
  | "ai_decide";

function logoInstruction(mode: LogoMode | undefined, hasLogo: boolean): string {
  if (!hasLogo || !mode || mode === "none") {
    return "No incluyas logo de marca en la imagen.";
  }
  switch (mode) {
    case "bottom_right":
      return "Incluye el logo de la marca de forma profesional y sutil en la esquina inferior derecha, con buen contraste y sin tapar el sujeto principal.";
    case "top_right":
      return "Incluye el logo de la marca de forma profesional y sutil en la esquina superior derecha.";
    case "bottom_left":
      return "Incluye el logo de la marca de forma profesional y sutil en la esquina inferior izquierda.";
    case "ai_decide":
      return "Decide de forma creativa y profesional la mejor ubicación y tamaño del logo de la marca para maximizar branding sin dañar la composición.";
    default:
      return "";
  }
}

type BrandContextPayload = z.infer<typeof flowBodySchema>["brandContext"];

function buildBrandBlock(
  brandContext: BrandContextPayload | null | undefined
): string {
  if (!brandContext || typeof brandContext !== "object") return "";

  const lines: string[] = ["### Contexto de marca (obligatorio respetar)"];
  if (brandContext.brandName) lines.push(`Marca: ${brandContext.brandName}`);
  if (brandContext.brandType) lines.push(`Tipo: ${brandContext.brandType}`);
  if (brandContext.description) {
    lines.push(
      `Notas del usuario: ${String(brandContext.description).slice(0, 800)}`
    );
  }

  const profile = brandContext.aiProfile;
  if (profile && typeof profile === "object") {
    if (profile.brand_voice)
      lines.push(`Voz de marca: ${String(profile.brand_voice)}`);
    if (profile.visual_identity)
      lines.push(`Identidad visual: ${String(profile.visual_identity)}`);
    if (profile.target_audience)
      lines.push(`Audiencia: ${String(profile.target_audience)}`);
    if (profile.image_generation_guidelines) {
      lines.push(
        `Guías de imagen: ${String(profile.image_generation_guidelines)}`
      );
    }
    if (Array.isArray(profile.value_props) && profile.value_props.length) {
      lines.push(
        `Propuestas de valor: ${profile.value_props
          .slice(0, 5)
          .map(String)
          .join("; ")}`
      );
    }
  }

  if (brandContext.productName) {
    lines.push(`Producto/recurso activo: ${brandContext.productName}`);
  }
  if (brandContext.productDescription) {
    lines.push(
      `Detalle del producto: ${String(brandContext.productDescription).slice(0, 500)}`
    );
  }
  if (brandContext.productUrl) {
    lines.push(`URL del producto: ${brandContext.productUrl}`);
  }

  const itemAnalysis = brandContext.itemAnalysis;
  if (itemAnalysis && typeof itemAnalysis === "object") {
    if (itemAnalysis.summary) {
      lines.push(
        `Resumen del recurso: ${String(itemAnalysis.summary).slice(0, 400)}`
      );
    }
    if (Array.isArray(itemAnalysis.colors) && itemAnalysis.colors.length) {
      lines.push(
        `Colores detectados: ${itemAnalysis.colors
          .slice(0, 6)
          .map(String)
          .join(", ")}`
      );
    }
    if (itemAnalysis.visual_style) {
      lines.push(`Estilo visual: ${String(itemAnalysis.visual_style)}`);
    }
  }

  lines.push(
    logoInstruction(brandContext.logoMode, Boolean(brandContext.hasLogo))
  );

  return lines.join("\n");
}

function withBrandOnPrompt(prompt: string, brandBlock: string): string {
  if (!brandBlock) return prompt;
  return `${brandBlock}\n\n### Prompt creativo\n${prompt}`;
}

function isSafeReferenceUrl(ref: string): boolean {
  if (ref.startsWith("data:image/")) {
    return ref.length <= MAX_DATA_URL_CHARS;
  }
  try {
    const u = new URL(ref);
    return u.protocol === "https:" && ref.length < 2048;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let reservedCredits = 0;
  let userIdForRefund: string | null = null;

  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const userId = auth.data.user.id;
    userIdForRefund = userId;

    // Rate limit: IP + user (expensive endpoint)
    const ip = getClientIp(req);
    const rlIp = await rateLimit(`flow-gen-ip:${ip}`, {
      maxRequests: 30,
      windowSeconds: 3600,
      failClosedInProd: true,
    });
    if (!rlIp.allowed) return rateLimitResponse(rlIp.retryAfterSeconds);

    const rl = await rateLimit(`flow-gen:${userId}`, {
      maxRequests: 20,
      windowSeconds: 3600,
      failClosedInProd: true,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const rawBody = await req.json().catch(() => null);
    const parsed = flowBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Solicitud inválida", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      prompt,
      model,
      isAgentActive,
      brandContext,
      aspectRatio: rawRatio,
      count: rawCount,
      previewOnly,
      referenceImages,
    } = parsed.data;

    const openRouterModel =
      model && ALLOWED_MODELS.has(model)
        ? model
        : "google/gemini-3.1-flash-lite-image";

    const fallbackRatio: FlowAspectRatio = rawRatio || "3:4";
    const fallbackCount = clampImageCount(rawCount ?? 1);
    const baseCost = getImageBaseCost(openRouterModel);
    const brandBlock = buildBrandBlock(brandContext);

    // ── Agent planning or simple multi-gen ──────────────────────────
    let imageCount = fallbackCount;
    let aspectRatio = fallbackRatio;
    let planned: PlannedImage[] = [];
    let agentMessage = "";
    let estimatedCredits = baseCost * fallbackCount;

    if (isAgentActive) {
      const plan = await planWithAgent(prompt.trim(), {
        fallbackCount,
        fallbackRatio,
        baseCostPerImage: baseCost,
        brandBlock: brandBlock || undefined,
      });
      imageCount = plan.imageCount;
      aspectRatio = plan.aspectRatio;
      planned = plan.images;
      estimatedCredits = plan.credits ?? baseCost * imageCount;
      agentMessage = plan.userMessage;
    } else {
      const heuristic = heuristicImagePlan(
        prompt.trim(),
        fallbackCount,
        fallbackRatio
      );
      const explicitMulti =
        heuristic.imageCount !== fallbackCount ||
        /carrusel|carousel|\d+\s*im[aá]genes?/i.test(prompt);
      if (explicitMulti && heuristic.imageCount > fallbackCount) {
        imageCount = heuristic.imageCount;
        planned = heuristic.images;
        aspectRatio = heuristic.aspectRatio;
      } else {
        imageCount = fallbackCount;
        planned =
          fallbackCount === 1
            ? [{ prompt: prompt.trim(), label: "Imagen 1" }]
            : Array.from({ length: fallbackCount }, (_, i) => ({
                prompt: `${prompt.trim()}\n\nVariante creativa ${i + 1} de ${fallbackCount}: misma idea, composición distinta.`,
                label: `Variante ${i + 1}`,
              }));
      }
      estimatedCredits = baseCost * imageCount;
      agentMessage = `Se generarán ${imageCount} imagen${imageCount > 1 ? "es" : ""}. Se consumirán ${estimatedCredits} créditos.`;
    }

    planned = planned.map((p) => ({
      ...p,
      prompt: withBrandOnPrompt(p.prompt, brandBlock),
    }));

    // ── Server-side credit check / reserve ───────────────────────────
    const reserve = await tryConsumeImageCredits(userId, estimatedCredits);
    if (!reserve.allowed) {
      const usage = await getImageCreditsUsage(userId);
      return NextResponse.json(
        {
          error:
            reserve.reason === "no_quota" || usage.limit <= 0
              ? "Tu plan no incluye créditos de imagen. Actualiza tu suscripción para usar Flow."
              : reserve.reason === "migration_required"
                ? "Cuotas de imagen no configuradas en el servidor. Contacta soporte."
                : `Créditos insuficientes. Necesitas ${estimatedCredits}, te quedan ${usage.remaining}.`,
          code: "IMAGE_CREDITS_EXCEEDED",
          creditsRequired: estimatedCredits,
          creditsRemaining: usage.remaining,
          creditsLimit: usage.limit,
          creditsUsed: usage.used,
          tier: usage.tier,
        },
        { status: 402 }
      );
    }
    reservedCredits = estimatedCredits;

    if (previewOnly) {
      // Preview no debe consumir: reembolsar reserva
      await refundImageCredits(userId, reservedCredits);
      reservedCredits = 0;
      return NextResponse.json({
        plan: {
          imageCount,
          aspectRatio,
          credits: estimatedCredits,
          agentMessage,
          labels: planned.map((p) => p.label),
          creditsRemaining: reserve.remaining + estimatedCredits,
        },
      });
    }

    // Optional logo + user reference images (validated)
    const inputReferences: {
      type: "image_url";
      image_url: { url: string };
    }[] = [];
    const logoData = brandContext?.logoData;
    if (
      logoData &&
      typeof logoData === "string" &&
      logoData.startsWith("data:image") &&
      brandContext?.logoMode &&
      brandContext.logoMode !== "none" &&
      isSafeReferenceUrl(logoData)
    ) {
      inputReferences.push({
        type: "image_url",
        image_url: { url: logoData },
      });
    }
    if (Array.isArray(referenceImages)) {
      for (const ref of referenceImages.slice(0, MAX_REF_IMAGES)) {
        if (typeof ref === "string" && isSafeReferenceUrl(ref)) {
          inputReferences.push({
            type: "image_url",
            image_url: { url: ref },
          });
        }
      }
    }

    const { images, errors } = await generateMultipleImages({
      model: openRouterModel,
      images: planned,
      aspectRatio,
      inputReferences:
        inputReferences.length > 0 ? inputReferences : undefined,
    });

    if (images.length === 0) {
      // Full refund — nothing generated
      await refundImageCredits(userId, reservedCredits);
      reservedCredits = 0;
      return NextResponse.json(
        {
          error:
            errors[0] ||
            "No se pudo generar ninguna imagen. Inténtalo de nuevo.",
        },
        { status: 502 }
      );
    }

    // Charge only successful images; refund the rest of the reservation
    const actualCredits = images.length * baseCost;
    if (actualCredits < reservedCredits) {
      await refundImageCredits(userId, reservedCredits - actualCredits);
    }
    reservedCredits = 0;

    const usageAfter = await getImageCreditsUsage(userId);

    return NextResponse.json({
      images: images.map((img) => ({
        url: img.dataUrl,
        prompt: img.prompt,
        label: img.label,
      })),
      imageCount: images.length,
      requestedCount: imageCount,
      aspectRatio,
      credits: actualCredits,
      creditsRemaining: usageAfter.remaining,
      creditsUsed: usageAfter.used,
      creditsLimit: usageAfter.limit,
      agentMessage:
        images.length < imageCount
          ? `${agentMessage} (Se generaron ${images.length}/${imageCount}; se cobran ${actualCredits} créditos).`
          : agentMessage,
      errors: errors.length ? errors : undefined,
      model: openRouterModel,
    });
  } catch (error: unknown) {
    if (reservedCredits > 0 && userIdForRefund) {
      try {
        await refundImageCredits(userIdForRefund, reservedCredits);
      } catch {
        /* ignore */
      }
    }
    console.error("[FLOW-API] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Lo sentimos, estamos teniendo dificultades en este momento.";
    return NextResponse.json(
      {
        error:
          message.includes("OPENROUTER") || message.includes("API")
            ? "El servicio de generación de imágenes no está disponible ahora. Inténtalo más tarde."
            : "Lo sentimos, estamos teniendo dificultades en este momento. Por favor, inténtelo de nuevo más tarde.",
      },
      { status: 500 }
    );
  }
}
