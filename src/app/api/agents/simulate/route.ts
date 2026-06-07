import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTokenLimit, incrementTokenUsage } from "@/lib/check-limits";

export const maxDuration = 300; // 5 minutes (requires Pro plan on Vercel)

// ── Helper to extract JSON block between the first '{' and the last '}'
function extractJsonObject(str: string): string {
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  return str;
}

// ── Helper to escape raw control characters (like newlines, carriage returns, tabs) 
// that are inside double-quoted string values in a raw JSON string.
function sanitizeJsonString(str: string): string {
  let result = "";
  let insideString = false;
  let isEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (insideString) {
      if (isEscaped) {
        result += char;
        isEscaped = false;
      } else if (char === '\\') {
        result += char;
        isEscaped = true;
      } else if (char === '"') {
        result += char;
        insideString = false;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        insideString = true;
      }
      result += char;
    }
  }
  return result;
}

interface MimoOptions {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
  search?: boolean;
  user?: string;
}

// ── Custom client helper to communicate with the native Xiaomi Mimo API ──
async function callMimo(options: MimoOptions): Promise<{ content: string; citations?: string[]; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error('MIMO_API_KEY is not defined in environment variables.');
  }

  const payload: any = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2500,
    user: options.user,
  };

  // If search is enabled, we inject the native web_search tool
  if (options.search) {
    payload.tools = [
      {
        type: 'web_search',
        max_keyword: 3,
        force_search: false,
        limit: 2,
      }
    ];
  }

  const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(300000) // 5 minutes timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Mimo API] ERROR ${response.status} for model "${options.model}":`, errorText);
    throw new Error(`Mimo API error: ${response.status} ${response.statusText} (model: ${options.model})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extract web search citations from annotations
  const citations: string[] = [];
  const message = data.choices?.[0]?.message;
  if (message?.annotations) {
    for (const ann of message.annotations) {
      if (ann.type === 'url_citation' && ann.url) {
        citations.push(ann.url);
      }
    }
  }

  return {
    content,
    citations: citations.length > 0 ? [...new Set(citations)] : undefined,
    usage: data.usage ? {
      prompt_tokens: data.usage.prompt_tokens || 0,
      completion_tokens: data.usage.completion_tokens || 0,
      total_tokens: data.usage.total_tokens || 0
    } : undefined
  };
}

// ── Build the system prompt dynamically based on the agent personality type ──
function buildSystemPrompt(
  agentType: string,
  rounds: number,
  portfolioText: string,
  financialContext: string,
  customAgents?: any[],
  agentCount: number = 4
): string {
  const portfolioBlock = portfolioText
    ? `Contexto del Portafolio del Usuario:\n${portfolioText}`
    : "";
  const financialBlock = financialContext
    ? `Contexto Técnico e Histórico Adicional (Generado por el Pre-Procesador Mimo):\n${financialContext}`
    : "";

  const jsonSchema = `{
  "dialogue": [
    {
      "id": "1",
      "agentName": "Nombre del agente",
      "avatar": "emoji correspondiente",
      "role": "Rol del agente",
      "sentiment": "bullish | bearish | neutral",
      "message": "Argumentación experta, altamente técnica, profesional y precisa.",
      "time": "Hace 1 min"
    }
  ],
  "summaryReport": "# Título del Reporte\\n\\nEscribe aquí un análisis exhaustivo y de nivel institucional en formato Markdown. Debe incluir:\\n- **Resumen Ejecutivo:** Evaluación de la situación.\\n- **Análisis de Volatilidad y Riesgos:** Nivel de riesgo esperado.\\n- **Perspectiva del Panel:** Consenso entre los agentes participantes.\\n- **Tabla de Acciones Afectadas:** Una tabla markdown con ticker, dirección esperada, rango y nivel de confianza.\\n- **Disclaimers:** Advertencia corporativa estándar.",
  "sentiment": [
    { "label": "Optimista (Bullish)", "value": 60 },
    { "label": "Pesimista (Bearish)", "value": 30 },
    { "label": "Indeciso (Neutral)", "value": 10 }
  ]
}`;

  const webSearchLine = "Los agentes cuentan con acceso a búsqueda web en tiempo real. Utiliza la información fresca del buscador y las noticias de última hora para fundamentar y enriquecer los argumentos con eventos reales, cotizaciones de mercado y datos técnicos vigentes.";

  switch (agentType) {
    case 'custom': {
      const agentsList = (customAgents || []).map((a, i) => 
        `${i + 1}. "${a.agentName}" (avatar: ${a.avatar}): Especializado en ${a.role}. Enfoque de análisis: ${a.specialty || 'General'}.`
      ).join("\n");

      return `Eres una mesa redonda de debate y análisis de élite de Reclu AI.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${customAgents?.length || 4} agentes personalizados respondiendo a la consulta y contexto provisto.

LOS AGENTES QUE INTEGRAN TU MESA REDONDA SON:
${agentsList || "Ninguno especificado."}

Cada agente debe mantener su rol y especialidad durante todo el debate, aportando perspectivas técnicas y rigurosas basadas en su enfoque de análisis.

${portfolioBlock}

${financialBlock}

${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'general': {
      return `Eres una mesa redonda de análisis general de Reclu AI.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes de propósito general respondiendo a la consulta y contexto provisto.

Los agentes participantes deben representar asistentes de Reclu AI con diversas perspectivas lógicas, analíticas, creativas, basadas en datos, implementación y viabilidad práctica. Cada uno de los ${agentCount} agentes debe tener un nombre representativo coherente y un avatar afín (como 🤖, 💡, 🔬, ⚡, ⚙️, etc.).

${portfolioBlock}

${financialBlock}

${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'research': {
      return `Eres una mesa redonda de Investigación de Mercados de élite de Reclu.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes especializados en investigación de mercados respondiendo a la consulta y contexto provisto.

Los agentes participantes se especializan en investigación de mercados, tendencias de consumo, análisis sectorial, análisis de sentimiento y minería de datos. El panel de ${agentCount} agentes debe contar con especialistas representativos y avatares acordes (tales como 📊, 🔍, 💬, 📈, etc.).

${portfolioBlock}

${financialBlock}

${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'risk': {
      return `Eres una mesa redonda de Análisis de Riesgo de élite de Reclu.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes especializados en gestión y análisis de riesgos respondiendo a la consulta y contexto provisto.

Los agentes participantes se especializan en evaluación de riesgos, volatilidad, cobertura (hedging), correlaciones de activos y simulación de escenarios de estrés. El panel de ${agentCount} agentes debe contar con especialistas con avatares acordes (tales como 📉, 🛡️, 🔗, 🎯, etc.).

${portfolioBlock}

${financialBlock}

${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'financial':
    default: {
      return `Eres una mesa redonda de inversión y mercados financieros de élite de Reclu.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes financieros especializados respondiendo a la consulta y contexto provisto.

Los agentes participantes deben representar especialidades financieras y de mercado que discuten y debaten la consulta desde sus respectivos puntos de vista. Entre los agentes participantes debe haber especialistas de las siguientes disciplinas:
- Analista Fundamental (avatares: 🧠 | 📊): Se enfoca en balances corporativos, ingresos, ratios y múltiplos de valoración de las compañías.
- Analista Técnico (avatares: 📈 | 📊): Se enfoca en gráficos, soportes, resistencias, medias móviles, CAGRs y volatilidad.
- Estratega Macro (avatares: 🌐 | 📊): Se enfoca en tasas de interés, inflación, políticas de la Fed, tendencias sectoriales y globales.
- Gestor de Riesgos (avatares: 🛡️ | 📊): Se enfoca en impacto en cartera, diversificación, correlaciones y mitigación de riesgos.
- Otros especialistas de finanzas si el panel requiere más de 4 agentes (ej: Analista de Divisas, Estratega de Derivados, Economista de Materias Primas, etc., con avatares afines).

Asegúrate de que cada uno de los ${agentCount} agentes tenga un nombre exclusivo coherente y una especialidad clara.

${portfolioBlock}

${financialBlock}

${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

{
  "dialogue": [
    {
      "id": "1",
      "agentName": "Nombre del Agente Especialista",
      "avatar": "emoji correspondiente (ej: 🧠, 📈, 🌐, 🛡️, etc.)",
      "role": "Especialidad o rol del agente",
      "sentiment": "bullish | bearish | neutral",
      "message": "Argumentación experta, altamente técnica, profesional y precisa sobre el impacto del evento en los mercados, apoyándote en cotizaciones reales o datos corporativos.",
      "time": "Hace 1 min"
    }
  ],
  "summaryReport": "# Título del Reporte Corporativo de Inversión\\n\\nEscribe aquí un análisis exhaustivo y de nivel institucional en formato Markdown. Debe incluir:\\n- **Resumen Ejecutivo:** Evaluación de la situación.\\n- **Análisis de Volatilidad y Riesgos:** Nivel de riesgo esperado.\\n- **Perspectiva del Panel:** Consenso general entre los agentes.\\n- **Tabla de Acciones Afectadas:** Una tabla markdown con ticker, dirección esperada, rango y nivel de confianza.\\n- **Disclaimers:** Advertencia corporativa estándar.",
  "sentiment": [
    { "label": "Optimista (Bullish)", "value": 60 },
    { "label": "Pesimista (Bearish)", "value": 30 },
    { "label": "Indeciso (Neutral)", "value": 10 }
  ]
}`;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { articleTitle, articleContent, rounds = 5, modelId, agentType = 'financial', customAgents, agentCount = 4 } = body;

    if (!articleTitle) {
      return NextResponse.json({ error: "El título o tema es requerido" }, { status: 400 });
    }

    // 2. Check token limit for user
    const tokenLimit = await checkTokenLimit(user.id);
    if (!tokenLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: "Has alcanzado el límite de tokens de tu plan para la IA. Actualiza tu suscripción para continuar debatiendo.",
        upgradeRequired: tokenLimit.tier === "free" ? "pro" : tokenLimit.tier === "pro" ? "max" : "ultra"
      }, { status: 403 });
    }

    // 3. Load user portfolio context
    const { data: dbAssets } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
    let portfolioText = "";
    if (dbAssets && dbAssets.length > 0) {
      portfolioText = dbAssets.map(a => `- ${a.symbol}: ${a.shares || 0} acciones (${a.company_name || ""})`).join("\n");
    }

    let enrichedTitle = articleTitle;
    let financialContext = "";
    let totalTokensUsed = 0;

    // 4. Unconditional Pre-Processor using mimo-v2.5 (Reclu v2.5 Flash)
    const preProcessorPrompt = `Analiza detalladamente la siguiente consulta del usuario para un espacio de debate financiero experto:
Consulta del usuario: "${articleTitle}"

Portafolio actual del usuario (activos en cartera):
${portfolioText || "El portafolio está vacío o no especificado."}

Tu objetivo es actuar como un Director de Análisis Financiero y Estrategia de Wall Street de élite. Debes generar un bloque de contexto financiero extremadamente denso e histórico para alimentar una mesa redonda de agentes de inversión especializados.

Sigue estas directrices obligatorias:
1. Identifica los activos, empresas, tickers o sectores financieros relevantes mencionados o implícitos en la consulta.
2. Si el usuario pregunta por su portafolio o el futuro del mismo (ej: "cómo se verá en 4 meses", rendimientos proyectados, etc.), genera una simulación de contexto detallada con:
   - Datos financieros e históricos clave de cada activo (ej: comportamiento típico del sector, volatilidad histórica, catalizadores de crecimiento, múltiplos de valoración, etc.).
   - Escenarios macroeconómicos factibles para los próximos meses.
   - Rendimientos esperados basados en su CAGR histórico, tendencias de mercado recientes y dinámicas de su industria.
3. Si el usuario pregunta por una empresa o activo específico, proporciona su contexto financiero profundo: trayectoria de ingresos, ventajas competitivas históricas, desempeño de su sector, tendencias clave de mercado y principales riesgos financieros.
4. Genera una consulta enriquecida y pulida ("enrichedQuery") adaptada a un lenguaje profesional de mercado.
5. Genera un bloque de contexto financiero denso ("financialContext") con formato Markdown técnico, rico en cifras de referencia, análisis de riesgos y tendencias históricas detalladas.
6. Tienes búsqueda web activada. DEBES buscar cotizaciones en tiempo real, últimos reportes trimestrales (earnings), noticias de última hora o cualquier dato financiero fresco relacionado con la consulta antes de estructurar el contexto.

Devuelve estrictamente un objeto JSON con este formato exacto:
{
  "enrichedQuery": "Consulta refinada y profesional de Wall Street basada en la original",
  "financialContext": "### Contexto Financiero e Histórico Enriquecido\\n\\n[Escribe aquí todo el contexto técnico detallado, incluyendo tablas, proyecciones históricas, tendencias sectoriales y desglose de activos en base a la consulta del usuario.]"
}`;

    try {
      const analysisResult = await callMimo({
        model: "xiaomi/mimo-v2.5", // Mimo v2.5 Flash
        messages: [
          { role: "system", content: "Eres un asistente de ingeniería de prompts financieros de élite. Devuelve solo JSON sin markdown." },
          { role: "user", content: preProcessorPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4500,
        search: true, // Enable web search for the pre-processor!
        user: user.id
      });
      
      let jsonText = analysisResult.content.trim();
      jsonText = extractJsonObject(jsonText);
      jsonText = sanitizeJsonString(jsonText);
      
      const parsed = JSON.parse(jsonText);
      if (parsed.enrichedQuery) {
        enrichedTitle = parsed.enrichedQuery;
      }
      if (parsed.financialContext) {
        financialContext = parsed.financialContext;
      }
      if (analysisResult.usage?.total_tokens) {
        totalTokensUsed += analysisResult.usage.total_tokens;
      }
      console.log(`[Agents API] Enriched prompt and generated financial context for "${articleTitle}"`);
    } catch (e) {
      console.error("[Agents API] Error in pre-processing query:", e);
      // Fallback if Mimo pre-processor fails, we still have the original articleTitle
    }

    // 5. Map Swarm Model based on modelId (Fast/Pro)
    const activeModel = modelId === "pro" ? "xiaomi/mimo-v2.5-pro" : "xiaomi/mimo-v2.5";

    const systemPrompt = buildSystemPrompt(agentType, rounds, portfolioText, financialContext, customAgents, agentCount);

    const userPrompt = `Semilla de Análisis:
Tema: "${enrichedTitle}"
Contexto del usuario: "${articleContent || "Sin contenido adicional"}"

Configuración del debate:
- Número de rondas de análisis: ${rounds} intervenciones del panel experto.

Ejecuta el enjambre de debate y genera el reporte JSON.`;

    console.log(`[Agents API] Running expert roundtable debate (type: ${agentType}) with model: ${activeModel} on: "${enrichedTitle}"`);

    const result = await callMimo({
      model: activeModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 6000,
      search: true, // Enable web search for live market grounding!
      user: user.id
    });

    let rawText = result.content.trim();
    rawText = extractJsonObject(rawText);
    rawText = sanitizeJsonString(rawText);

    if (result.usage?.total_tokens) {
      totalTokensUsed += result.usage.total_tokens;
    }

    // Record token usage in database
    if (totalTokensUsed > 0) {
      await incrementTokenUsage(user.id, totalTokensUsed);
      console.log(`[Agents API] Saved token usage for user ${user.id}: ${totalTokensUsed} tokens.`);
    }

    try {
      const simulationData = JSON.parse(rawText);
      return NextResponse.json({
        success: true,
        simulation: simulationData
      });
    } catch (parseError: any) {
      console.error("[Agents API] Failed to parse simulation JSON:", rawText, parseError);
      return NextResponse.json({
        success: false,
        error: "Failed to generate structured simulation payload",
        details: parseError.message,
        rawText
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[Agents API] Error:", error);
    return NextResponse.json(
      { error: "Failed to run expert roundtable debate", details: error.message },
      { status: 500 }
    );
  }
}
