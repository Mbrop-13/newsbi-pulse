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

// Secure JSON extractor to ensure robustness when parsing LLM outputs
function extractJsonBlock(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text;
}

export async function runOrchestration(
  model: LanguageModel,
  userMessage: string,
  portfolioContext?: string,
  onProgress?: (text: string) => void
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  onProgress?.("🧠 [Orquestador] Iniciando análisis de complejidad de la consulta...\n");

  const systemOrchestratorPrompt = `Actúas como el LLM Coordinador y Orquestador de una plataforma financiera de élite.
Tu tarea es analizar la consulta del usuario y determinar si requiere ser delegada a agentes especializados en paralelo para recopilar y verificar información antes de dar la respuesta final.

CRITERIOS PARA DELEGACIÓN:
- Sí requiere delegación (isComplex: true) si la consulta involucra análisis comparativo de múltiples empresas, proyecciones financieras complejas, análisis de noticias contradictorias de última hora, optimización de portafolios, o cruce de datos de múltiples sectores.
- No requiere delegación (isComplex: false) si es un saludo, una pregunta general sencilla, una consulta básica sobre un solo ticker, o preguntas conversacionales simples.

Si determinas que requiere delegación, define hasta 5 agentes especializados (mínimo 2, máximo 5) con nombres, roles específicos e instrucciones de tareas claras e independientes.

DEBES responder ÚNICAMENTE con un bloque JSON en el siguiente formato (sin explicaciones, sin markdown, solo el JSON):
{
  "isComplex": true,
  "reason": "Explicación del motivo de la decisión",
  "agents": [
    {
      "agentName": "Nombre del Agente (ej: FundamentalAgent, SentimentAgent)",
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

    const isComplex = !!result.isComplex;
    const reason = result.reason || 'Sin motivo provisto';
    const rawAgents: AgentInfo[] = Array.isArray(result.agents) ? result.agents : [];

    // Limit to max 5 agents
    const agents = rawAgents.slice(0, 5);

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

    // Run agents in parallel
    const agentPromises = agents.map(async (agent): Promise<AgentReport> => {
      const agentStartTime = Date.now();
      onProgress?.(`⏳ [Agente] ${agent.agentName} (${agent.role}) iniciando tarea: "${agent.task}"...\n`);

      const agentSystemPrompt = `Actúas como el agente experto "${agent.agentName}" con el rol de "${agent.role}".
Tu tarea asignada por el Orquestador es: "${agent.task}".
Responde a tu tarea de forma concisa, técnica, objetiva y 100% en español.
REGLA CRÍTICA: Enfócate estrictamente en tu sub-tarea asignada. No saludes ni des rodeos. Longitud máxima: 150 palabras.`;

      try {
        const agentResponse = await generateText({
          model,
          system: agentSystemPrompt,
          messages: [{ role: 'user', content: `Consulta original: "${userMessage}"\nSub-tarea: "${agent.task}"` }],
          temperature: 0.5,
        });

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

    onProgress?.(`\n📊 [Orquestador] Todos los agentes completados. Consolidando reportes (${totalDuration}ms total)...\n\n`);

    return {
      isComplex: true,
      reason,
      agents,
      agentReports,
      totalOrchestrationTimeMs: totalDuration
    };

  } catch (error: any) {
    console.error("Orchestration failed:", error);
    onProgress?.(`⚠️ [Orquestador] Error durante la fase de análisis/delegación: ${error.message || String(error)}. Respondiendo directamente.\n\n`);
    
    return {
      isComplex: false,
      reason: `Failed to orchestrate: ${error.message || String(error)}`,
      agents: [],
      agentReports: [],
      totalOrchestrationTimeMs: Date.now() - startTime
    };
  }
}
