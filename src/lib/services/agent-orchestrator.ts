import { generateText, LanguageModel } from 'ai';

export interface AgentInfo {
  agentName: string;
  role: string;
  task: string;
}

export interface AgentReport extends AgentInfo {
  content: string;
  durationMs: number;
  success: boolean;
}

export interface OrchestrationResult {
  isComplex: boolean;
  reason: string;
  agents: AgentInfo[];
  agentReports: AgentReport[];
  totalOrchestrationTimeMs: number;
}

// In-memory cache for query complexity classification
interface CachedClassification {
  isComplex: boolean;
  reason: string;
  agents: AgentInfo[];
  timestamp: number;
}

const classificationCache = new Map<string, CachedClassification>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Secure JSON extractor to ensure robustness when parsing LLM outputs
function extractJsonBlock(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text;
}

// Helper for promise timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: Error): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export async function runOrchestration(
  model: LanguageModel,
  userMessage: string,
  portfolioContext?: string,
  onProgress?: (text: string) => void,
  isWebBuilder: boolean = false
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  
  // Clean message for cache key lookup, including the mode to prevent collisions
  const cacheKey = `${isWebBuilder ? 'webbuilder' : 'finance'}:${userMessage.trim().toLowerCase()}`;
  const cached = classificationCache.get(cacheKey);
  
  let isComplex = false;
  let reason = "";
  let agents: AgentInfo[] = [];
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    onProgress?.("🧠 [Orquestador] Usando decisión de complejidad pre-clasificada (Caché).\n");
    isComplex = cached.isComplex;
    reason = cached.reason;
    agents = cached.agents;
  } else {
    onProgress?.("🧠 [Orquestador] Iniciando análisis de complejidad de la consulta...\n");
    
    const systemOrchestratorPrompt = isWebBuilder
      ? `Actúas como el Arquitecto de Software y Orquestador de Maverlang WebBuilder.
Tu tarea es analizar la consulta del usuario sobre la aplicación web que desea construir o modificar, y determinar si requiere ser delegada a agentes especializados en paralelo para diseñar, codificar, estilizar e implementar la aplicación de forma óptima.

CRITERIOS PARA DELEGACIÓN:
- SÍ requiere delegación (isComplex: true) si la consulta requiere crear una nueva aplicación web desde cero, agregar múltiples componentes interactivos, realizar integraciones lógicas complejas, rediseñar layouts de forma mayoritaria, o realizar modificaciones extensas de código.
  Ejemplos de consultas que SÍ requieren delegación:
  * "Crea un panel de control financiero con gráficos y simulación de interés compuesto"
  * "Agrega un sistema de autenticación ficticio y una base de datos local a la aplicación"
  * "Rediseña la interfaz actual para que tenga glassmorphism, modo oscuro/claro y animaciones con Framer Motion"
  * "Agrega una sección completa de mercados bursátiles interactiva"
- NO requiere delegación (isComplex: false) si es un saludo, una pregunta general sobre programación, una modificación de texto simple, un cambio de color rápido o preguntas simples.
  Ejemplos de consultas que NO requieren delegación:
  * "Hola, ¿me puedes ayudar?"
  * "¿Cómo se usa useState en React?"
  * "Cambia el título del encabezado a 'Mi Aplicación'"
  * "Haz que el botón sea de color rojo"

Si determinas que requiere delegación, define hasta 5 agentes especializados (mínimo 2, máximo 5) con nombres, roles específicos e instrucciones de tareas claras e independientes. Ejemplos de agentes:
- DesignerAgent (Diseñador UX/UI) - Definir paleta de colores, layouts, estructura visual y experiencia de usuario.
- CodeAgent (Desarrollador React/TS) - Desarrollar la lógica principal del componente App.tsx, hooks y estado interactivo (useState, useEffect).
- StyleAgent (Maquetador CSS/Tailwind) - Crear la estructura de clases Tailwind CSS y los estilos globales en styles.css.
- LogicAgent (Ingeniero de Interacciones) - Diseñar la lógica de cálculo interna, flujos de datos y simulación de datos interactivos.
- AnimationAgent (Especialista en Motion) - Diseñar micro-interacciones, efectos hover y animaciones del sistema con framer-motion.

DEBES responder ÚNICAMENTE con un bloque JSON en el siguiente formato (sin explicaciones, sin markdown, solo el JSON):
{
  "isComplex": true,
  "reason": "Explicación breve del motivo de la decisión",
  "agents": [
    {
      "agentName": "Nombre del Agente",
      "role": "Rol o especialidad del agente",
      "task": "Tarea o sub-pregunta específica a responder"
    }
  ]
}`
      : `Actúas como el LLM Coordinador y Orquestador de una plataforma financiera de élite.
Tu tarea es analizar la consulta del usuario y determinar si requiere ser delegada a agentes especializados en paralelo para recopilar y verificar información antes de dar la respuesta final.

CRITERIOS PARA DELEGACIÓN:
- SÍ requiere delegación (isComplex: true) si la consulta requiere análisis comparativo de múltiples empresas, proyecciones financieras complejas, análisis de noticias contradictorias de última hora, optimización de portafolios, o cruce de datos de múltiples sectores.
  Ejemplos de consultas que SÍ requieren delegación:
  * "Compara los fundamentales de AAPL, MSFT y GOOGL"
  * "Analiza el impacto macroeconómico de la subida de tasas de la Fed en el sector tecnológico y bancario"
  * "Haz un análisis DAFO de Tesla considerando sus últimos reportes de entregas y la competencia china"
  * "Optimiza mi portafolio actual entre acciones defensivas y de crecimiento"
- NO requiere delegación (isComplex: false) si es un saludo, una pregunta general sencilla, una consulta básica sobre un solo ticker, o preguntas conversacionales simples.
  Ejemplos de consultas que NO requieren delegación:
  * "Hola, ¿cómo estás?"
  * "Precio actual de Apple"
  * "¿Qué es el ratio PER?"
  * "¿Cuál es la capitalización de mercado de Tesla?"
  * "¿Qué pasó hoy en las noticias?"

Si determinas que requiere delegación, define hasta 5 agentes especializados (mínimo 2, máximo 5) con nombres, roles específicos e instrucciones de tareas claras e independientes. E.g.:
- FundamentalAgent (Analista de Balances) - Analizar métricas financieras.
- SentimentAgent (Analista de Sentimiento de Mercado) - Analizar el tono y noticias.
- MacroAgent (Economista Macro) - Analizar impacto de tasas/inflación.
- TechnicalAgent (Analista Técnico) - Evaluar tendencias de precios y soporte/resistencia.
- CompetitorAgent (Analista de Competencia) - Comparar con rivales directos.

DEBES responder ÚNICAMENTE con un bloque JSON en el siguiente formato (sin explicaciones, sin markdown, solo el JSON):
{
  "isComplex": true,
  "reason": "Explicación breve del motivo de la decisión",
  "agents": [
    {
      "agentName": "Nombre del Agente",
      "role": "Rol o especialidad del agente",
      "task": "Tarea o sub-pregunta específica a responder"
    }
  ]
}`;

    try {
      const { text } = await generateText({
        model,
        system: systemOrchestratorPrompt,
        messages: [
          { role: 'user', content: `Consulta del usuario: "${userMessage}"\n\n${portfolioContext ? `Contexto del portafolio:\n${portfolioContext}` : ''}` }
        ],
        temperature: 0.1,
      });

      const jsonText = extractJsonBlock(text);
      const result = JSON.parse(jsonText);

      isComplex = !!result.isComplex;
      reason = result.reason || 'Sin motivo provisto';
      const rawAgents: AgentInfo[] = Array.isArray(result.agents) ? result.agents : [];
      agents = rawAgents.slice(0, 5);

      // Save to cache
      classificationCache.set(cacheKey, {
        isComplex,
        reason,
        agents,
        timestamp: Date.now()
      });

    } catch (err: any) {
      console.error("Classification phase failed, falling back to simple query execution:", err);
      isComplex = false;
      reason = `Error en clasificación: ${err.message || String(err)}`;
      agents = [];
    }
  }

  if (!isComplex || agents.length === 0) {
    onProgress?.(`✅ [Orquestador] Consulta analizada: Es simple. Resolviendo directamente (${reason}).\n\n`);
    return {
      isComplex: false,
      reason,
      agents: [],
      agentReports: [],
      totalOrchestrationTimeMs: Date.now() - startTime
    };
  }

  onProgress?.(`🔍 [Orquestador] Consulta compleja detectada: "${reason}"\n`);
  onProgress?.(`🤖 Creando ${agents.length} agentes expertos para investigar en paralelo...\n\n`);

  // Run agents in parallel with a timeout of 45 seconds per agent
  const agentPromises = agents.map(async (agent): Promise<AgentReport> => {
    const agentStartTime = Date.now();
    onProgress?.(`⏳ [Agente] ${agent.agentName} (${agent.role}) iniciando tarea: "${agent.task}"...\n`);

    const agentSystemPrompt = `Actúas como el agente experto "${agent.agentName}" con el rol de "${agent.role}".
Tu tarea asignada por el Orquestador es: "${agent.task}".
Responde a tu tarea de forma concisa, técnica, objetiva y 100% en español.
REGLAS CRÍTICAS:
1. Enfócate estrictamente en tu sub-tarea asignada. No saludes ni des rodeos.
2. Longitud máxima: 120 palabras. Sé directo y específico.
3. Si generas código o fórmulas, márcalos como bloques de código reutilizables.
4. Presenta datos como listas o tablas cuando sea posible.
5. Tu respuesta será consolidada por el agente orquestador principal — no repitas contexto ya conocido.`;

    try {
      const agentPromise = generateText({
        model,
        system: agentSystemPrompt,
        messages: [{ role: 'user', content: `Consulta original: "${userMessage}"\nSub-tarea: "${agent.task}"` }],
        temperature: 0.5,
      });

      // Wrap the LLM call with a 45-second timeout
      const agentResponse = await withTimeout(
        agentPromise,
        45000,
        new Error("Excedió el tiempo límite de ejecución de 45 segundos")
      );

      const duration = Date.now() - agentStartTime;
      onProgress?.(`✅ [Agente] ${agent.agentName} completado en ${duration}ms.\n`);

      return {
        ...agent,
        content: agentResponse.text,
        durationMs: duration,
        success: true
      };
    } catch (err: any) {
      const duration = Date.now() - agentStartTime;
      console.error(`Error in agent ${agent.agentName}:`, err);
      onProgress?.(`❌ [Agente] ${agent.agentName} falló después de ${duration}ms: ${err.message || String(err)}\n`);

      return {
        ...agent,
        content: `Error al procesar la tarea: ${err.message || String(err)}`,
        durationMs: duration,
        success: false
      };
    }
  });

  const agentReports = await Promise.all(agentPromises);
  const totalDuration = Date.now() - startTime;

  onProgress?.(`\n📊 [Orquestador] Todos los agentes completados o finalizados por límite de tiempo. Consolidando reportes (${totalDuration}ms total)...\n\n`);

  return {
    isComplex: true,
    reason,
    agents,
    agentReports,
    totalOrchestrationTimeMs: totalDuration
  };
}
