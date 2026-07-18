import { NextResponse } from "next/server";
import { callOpenRouter, type OpenRouterMessage } from "@/lib/openrouter";

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

type BrandContextPayload = {
  brandName?: string;
  brandType?: string;
  description?: string;
  logoMode?: LogoMode;
  hasLogo?: boolean;
  productName?: string;
  productDescription?: string;
  productUrl?: string;
  aiProfile?: Record<string, unknown>;
  itemAnalysis?: Record<string, unknown>;
};

function buildBrandBlock(brandContext: BrandContextPayload | null | undefined): string {
  if (!brandContext || typeof brandContext !== "object") return "";

  const lines: string[] = ["### Contexto de marca (obligatorio respetar)"];
  if (brandContext.brandName) lines.push(`Marca: ${brandContext.brandName}`);
  if (brandContext.brandType) lines.push(`Tipo: ${brandContext.brandType}`);
  if (brandContext.description) lines.push(`Notas del usuario: ${String(brandContext.description).slice(0, 800)}`);

  const profile = brandContext.aiProfile;
  if (profile && typeof profile === "object") {
    if (profile.brand_voice) lines.push(`Voz de marca: ${String(profile.brand_voice)}`);
    if (profile.visual_identity) lines.push(`Identidad visual: ${String(profile.visual_identity)}`);
    if (profile.target_audience) lines.push(`Audiencia: ${String(profile.target_audience)}`);
    if (profile.image_generation_guidelines) {
      lines.push(`Guías de imagen: ${String(profile.image_generation_guidelines)}`);
    }
    if (Array.isArray(profile.value_props) && profile.value_props.length) {
      lines.push(`Propuestas de valor: ${profile.value_props.slice(0, 5).map(String).join("; ")}`);
    }
  }

  if (brandContext.productName) {
    lines.push(`Producto/recurso activo: ${brandContext.productName}`);
  }
  if (brandContext.productDescription) {
    lines.push(`Detalle del producto: ${String(brandContext.productDescription).slice(0, 500)}`);
  }
  if (brandContext.productUrl) {
    lines.push(`URL del producto: ${brandContext.productUrl}`);
  }

  const itemAnalysis = brandContext.itemAnalysis;
  if (itemAnalysis && typeof itemAnalysis === "object") {
    if (itemAnalysis.summary) lines.push(`Resumen del recurso: ${String(itemAnalysis.summary).slice(0, 400)}`);
    if (Array.isArray(itemAnalysis.colors) && itemAnalysis.colors.length) {
      lines.push(`Colores detectados: ${itemAnalysis.colors.slice(0, 6).map(String).join(", ")}`);
    }
    if (itemAnalysis.visual_style) lines.push(`Estilo visual: ${String(itemAnalysis.visual_style)}`);
  }

  lines.push(
    logoInstruction(
      brandContext.logoMode,
      Boolean(brandContext.hasLogo)
    )
  );

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, isAgentActive, brandContext } = body;

    if (!prompt) {
      return NextResponse.json({ error: "El prompt es obligatorio." }, { status: 400 });
    }

    const openRouterModel = model || "google/gemini-3.1-flash-lite-image";

    const brandBlock = buildBrandBlock(brandContext);

    let systemInstruction = isAgentActive
      ? `Eres el Agente Creativo de Maverlang Flow. Tu objetivo es ayudar al usuario de forma autónoma a planificar, desarrollar y optimizar contenido multimedia, diseño de personajes, guiones gráficos y herramientas interactivas. Proporciona planes detallados paso a paso, código de ejemplo si es necesario, y recomendaciones profesionales de primer nivel.`
      : `Eres Maverlang Flow, un asistente de inteligencia artificial especializado en diseño creativo, generación multimedia, creación de personajes y escenas. Ayuda al usuario con prompts ingeniosos, descripciones cinemáticas y consejos prácticos de arte digital. Sé directo y profesional.`;

    if (brandBlock) {
      systemInstruction += `\n\n${brandBlock}\nAlinea siempre el resultado creativo con la identidad de marca anterior.`;
    }

    const userContent = brandBlock
      ? `${brandBlock}\n\n### Prompt del usuario\n${prompt}`
      : prompt;

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemInstruction },
      { role: "user", content: userContent },
    ];

    const result = await callOpenRouter({
      model: openRouterModel,
      messages,
      temperature: 0.7,
      max_tokens: 2500,
    });

    return NextResponse.json({ content: result.content });
  } catch (error: unknown) {
    console.error("[FLOW-API] Error:", error);
    return NextResponse.json(
      { error: "Lo sentimos, estamos teniendo dificultades en este momento. Por favor, inténtelo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
