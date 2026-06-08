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
  agentCount: number = 4,
  subTasks: any[] = []
): string {
  const portfolioBlock = portfolioText
    ? `Contexto del Portafolio del Usuario:\n${portfolioText}`
    : "";
  const financialBlock = financialContext
    ? `Contexto Técnico e Histórico Adicional (Generado por el Pre-Procesador Mimo):\n${financialContext}`
    : "";
  const subTasksBlock = subTasks && subTasks.length > 0
    ? `Distribución de Sub-Tareas por el LLM Principal (Orquestador):\n${subTasks.map((t, idx) => `- Agente ${idx + 1} ("${t.agentName}", avatar: ${t.avatar}, rol: ${t.role}): ${t.assignedTask}`).join("\n")}`
    : "";

  const jsonSchema = `{
  "dialogue": [
    {
      "id": "1",
      "agentName": "Nombre del agente",
      "avatar": "emoji",
      "role": "Rol",
      "sentiment": "bullish | bearish | neutral",
      "thinking": "Explicación breve y técnica de su proceso de razonamiento o análisis antes de dar su veredicto final. No uses iconos de cerebros.",
      "message": "Argumentación experta..."
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

${subTasksBlock ? `${subTasksBlock}\n\n` : ""}${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'general': {
      return `Eres una mesa redonda de análisis general de Reclu AI.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes de propósito general respondiendo a la consulta y contexto provisto.

Los agentes participantes deben representar asistentes de Reclu AI con diversas perspectivas lógicas, analíticas, creativas, basadas en datos, implementación y viabilidad práctica. Cada uno de los ${agentCount} agentes debe tener un nombre representativo coherente y un avatar afín (como 🤖, 💡, 🔬, ⚡, ⚙️, etc.).

${portfolioBlock}

${financialBlock}

${subTasksBlock ? `${subTasksBlock}\n\n` : ""}${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'research': {
      return `Eres una mesa redonda de Investigación de Mercados de élite de Reclu.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes especializados en investigación de mercados respondiendo a la consulta y contexto provisto.

Los agentes participantes se especializan en investigación de mercados, tendencias de consumo, análisis sectorial, análisis de sentimiento y minería de datos. El panel de ${agentCount} agentes debe contar con especialistas representativos y avatares acordes (tales como 📊, 🔍, 💬, 📈, etc.).

${portfolioBlock}

${financialBlock}

${subTasksBlock ? `${subTasksBlock}\n\n` : ""}${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

${jsonSchema}`;
    }

    case 'risk': {
      return `Eres una mesa redonda de Análisis de Riesgo de élite de Reclu.
Debes simular un debate experto de exactamente ${rounds} turnos (generando exactamente ${rounds} comentarios en el arreglo "dialogue") entre ${agentCount} agentes especializados en gestión y análisis de riesgos respondiendo a la consulta y contexto provisto.

Los agentes participantes se especializan en evaluación de riesgos, volatilidad, cobertura (hedging), correlaciones de activos y simulación de escenarios de estrés. El panel de ${agentCount} agentes debe contar con especialistas con avatares acordes (tales como 📉, 🛡️, 🔗, 🎯, etc.).

${portfolioBlock}

${financialBlock}

${subTasksBlock ? `${subTasksBlock}\n\n` : ""}${webSearchLine}

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

${subTasksBlock ? `${subTasksBlock}\n\n` : ""}${webSearchLine}

Tu respuesta debe ser estrictamente un objeto JSON válido. No incluyas explicaciones previas ni markdown adicional fuera del JSON (excepto que el contenido de "summaryReport" interno sí debe ser markdown rico). El JSON debe coincidir exactamente con este esquema:

{
  "dialogue": [
    {
      "id": "1",
      "agentName": "Nombre del Agente Especialista",
      "avatar": "emoji correspondiente (ej: 🧠, 📈, 🌐, 🛡️, etc.)",
      "role": "Especialidad o rol del agente",
      "sentiment": "bullish | bearish | neutral",
      "thinking": "Explicación breve y técnica de su proceso de razonamiento o análisis antes de dar su veredicto final. No uses iconos de cerebros.",
      "message": "Argumentación experta, altamente técnica, profesional y precisa sobre el impacto del evento en los mercados, apoyándote en cotizaciones reales o datos corporativos."
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
    let subTasks: any[] = [];
    let totalTokensUsed = 0;

    // 4. Procesamiento previo incondicional usando mimo-v2.5 (Reclu v2.5 Flash) que actúa como Director de Análisis y Orquestador
    const preProcessorPrompt = `Analiza detalladamente la siguiente consulta del usuario actuando como el LLM Principal y Orquestador para un espacio de debate financiero experto:
Consulta del usuario: "${articleTitle}"

Portafolio actual del usuario (activos en cartera):
${portfolioText || "El portafolio está vacío o no especificado."}

Tu objetivo es actuar como un Director de Análisis Financiero y Estrategia de Wall Street de élite (LLM Principal y Orquestador). Debes desglosar la consulta en un conjunto de hasta 5 sub-tareas o sub-preguntas específicas y asignarlas a agentes especialistas ideales. Asimismo, debes generar un bloque de contexto financiero extremadamente denso e histórico para alimentar la mesa redonda.

Sigue estas directrices obligatorias:
1. Identifica los activos, empresas, tickers o sectores financieros relevantes en la consulta.
2. Si la consulta involucra múltiples dimensiones o activos, divídela en sub-tareas específicas (máximo 5) para que cada agente analice una parte del problema de forma profesional.
3. Si el usuario pregunta por su portafolio o el futuro del mismo, genera una simulación de contexto detallada con datos financieros e históricos clave.
4. Genera una consulta enriquecida y pulida ("enrichedQuery") adaptada a un lenguaje profesional de mercado.
5. Genera un bloque de contexto financiero denso ("financialContext") con formato Markdown técnico.
6. Tienes búsqueda web activada. DEBES buscar cotizaciones en tiempo real, últimos reportes trimestrales (earnings), noticias de última hora o cualquier dato financiero fresco relacionado con la consulta.

Devuelve estrictamente un objeto JSON con este formato exacto:
{
  "enrichedQuery": "Consulta refinada...",
  "subTasks": [
    {
      "agentName": "Nombre del Agente",
      "avatar": "emoji",
      "role": "Rol o Especialidad",
      "assignedTask": "Sub-pregunta o sub-tarea específica que este agente debe analizar"
    }
  ],
  "financialContext": "### Contexto Financiero e Histórico Enriquecido\\n\\n[Escribe aquí todo el contexto técnico detallado...]"
}`;

    try {
      const analysisResult = await callMimo({
        model: "xiaomi/mimo-v2.5", // Mimo v2.5 Flash
        messages: [
          { role: "system", content: "Eres un asistente de ingeniería de prompts financieros de élite. Devuelve solo JSON sin markdown." },
          { role: "user", content: preProcessorPrompt }
        ],
        temperature: 0.3,
        max_tokens: 6000,
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
      if (parsed.subTasks) {
        subTasks = parsed.subTasks;
      }
      if (analysisResult.usage?.total_tokens) {
        totalTokensUsed += analysisResult.usage.total_tokens;
      }
      console.log(`[Agents API] Enriched prompt and generated financial context/subtasks for "${articleTitle}"`);
    } catch (e) {
      console.error("[Agents API] Error in pre-processing query:", e);
      // Fallback si falla el preprocesador Mimo
    }

    // 5. Mapear el modelo de Swarm según modelId (Fast/Pro)
    const activeModel = modelId === "pro" ? "xiaomi/mimo-v2.5-pro" : "xiaomi/mimo-v2.5";

    const finalAgentCount = subTasks && subTasks.length > 0 ? Math.min(5, subTasks.length) : agentCount;
    const systemPrompt = buildSystemPrompt(agentType, rounds, portfolioText, financialContext, customAgents, finalAgentCount, subTasks);

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
      max_tokens: 10000,
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
