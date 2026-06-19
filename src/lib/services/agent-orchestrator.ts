import { generateText, LanguageModel } from 'ai';
import { containsArtifact, parseArtifact, ParsedAction } from '@/lib/webbuilder-parser';

export interface AgentInfo {
  agentName: string;
  role: string;
  task: string;
}

export interface AgentReport extends AgentInfo {
  content: string;
  durationMs: number;
  success: boolean;
  tokensUsed?: number;
}

export interface OrchestrationResult {
  isComplex: boolean;
  reason: string;
  agents: AgentInfo[];
  agentReports: AgentReport[];
  totalOrchestrationTimeMs: number;
  totalTokensUsed: number;
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
  let totalTokensUsed = 0;
  
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
      const { text, usage } = await generateText({
        model,
        system: systemOrchestratorPrompt,
        messages: [
          { role: 'user', content: `Consulta del usuario: "${userMessage}"\n\n${portfolioContext ? `Contexto del portafolio:\n${portfolioContext}` : ''}` }
        ],
        temperature: 0.1,
      });

      totalTokensUsed += usage?.totalTokens || 0;

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
      totalOrchestrationTimeMs: Date.now() - startTime,
      totalTokensUsed
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
      const tokensUsed = agentResponse.usage?.totalTokens || 0;
      onProgress?.(`✅ [Agente] ${agent.agentName} completado en ${duration}ms.\n`);

      return {
        ...agent,
        content: agentResponse.text,
        durationMs: duration,
        success: true,
        tokensUsed
      };
    } catch (err: any) {
      const duration = Date.now() - agentStartTime;
      console.error(`Error in agent ${agent.agentName}:`, err);
      onProgress?.(`❌ [Agente] ${agent.agentName} falló después de ${duration}ms: ${err.message || String(err)}\n`);

      return {
        ...agent,
        content: `Error al procesar la tarea: ${err.message || String(err)}`,
        durationMs: duration,
        success: false,
        tokensUsed: 0
      };
    }
  });

  const agentReports = await Promise.all(agentPromises);
  
  for (const report of agentReports) {
    if (report.tokensUsed) totalTokensUsed += report.tokensUsed;
  }

  const totalDuration = Date.now() - startTime;

  onProgress?.(`\n📊 [Orquestador] Todos los agentes completados o finalizados por límite de tiempo. Consolidando reportes (${totalDuration}ms total)...\n\n`);

  return {
    isComplex: true,
    reason,
    agents,
    agentReports,
    totalOrchestrationTimeMs: totalDuration,
    totalTokensUsed
  };
}

export interface WebBuilderAgentInfo extends AgentInfo {
  filePath: string;
}

export interface WebBuilderAgentReport extends AgentReport {
  filePath: string;
}

export interface WebBuilderOrchestrationResult {
  isComplex: boolean;
  reason: string;
  agents: WebBuilderAgentInfo[];
  agentReports: WebBuilderAgentReport[];
  totalOrchestrationTimeMs: number;
  totalTokensUsed: number;
}

/**
 * Heuristic context selector to optimize tokens by only sending files
 * that are relevant to the target file.
 */
export function selectRelevantContext(
  agentFilePath: string,
  allFiles: Record<string, string>
): Record<string, string> {
  const fileKeys = Object.keys(allFiles);
  if (fileKeys.length <= 3) {
    return allFiles;
  }

  const selected: Record<string, string> = {};
  
  // Helper to normalize paths for comparison
  const normalize = (p: string) => p.replace(/^\.\/|^\/|\\/g, '/').toLowerCase();
  const normalizedAgentPath = normalize(agentFilePath);
  const agentBasename = normalizedAgentPath.split('/').pop() || '';
  const agentNameWithoutExt = agentBasename.replace(/\.[^/.]+$/, "");

  for (const path of fileKeys) {
    const normPath = normalize(path);
    const content = allFiles[path];

    // Always include the target file if it exists, so the agent sees current code
    if (normPath === normalizedAgentPath) {
      selected[path] = content;
      continue;
    }

    // Always include App.tsx/index.css/styles.css as they are core structural files
    const basename = normPath.split('/').pop() || '';
    if (
      basename === 'app.tsx' ||
      basename === 'app.jsx' ||
      basename === 'index.css' ||
      basename === 'styles.css'
    ) {
      selected[path] = content;
      continue;
    }

    // Include if the current file imports/references the target file (excluding extension check)
    if (agentNameWithoutExt && content.toLowerCase().includes(agentNameWithoutExt.toLowerCase())) {
      selected[path] = content;
      continue;
    }

    // Include if the target file (existing content in allFiles) imports/references this file
    const targetFileContent = allFiles[agentFilePath] || '';
    const otherBasename = basename.replace(/\.[^/.]+$/, "");
    if (otherBasename && targetFileContent.toLowerCase().includes(otherBasename.toLowerCase())) {
      selected[path] = content;
      continue;
    }
  }

  return selected;
}

/**
 * Checks for balanced brackets, braces, and parentheses.
 * Properly skips comments and string literals, while tracing ${ } in template literals.
 */
function checkBrackets(code: string): { isValid: boolean; reason?: string } {
  const stack: string[] = [];
  const openChars = ['{', '[', '('];
  const closeChars = ['}', ']', ')'];
  const matching: Record<string, string> = { '}': '{', ']': '[', ')': '(' };
  
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;
  const templateLiteralExprStack: number[] = [];

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1] || '';
    
    // 1. Handle comments
    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++; // skip /
      }
      continue;
    }
    
    // 2. Handle string literals
    if (inSingleQuote) {
      if (char === "'" && code[i - 1] !== '\\') inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (char === '"' && code[i - 1] !== '\\') inDoubleQuote = false;
      continue;
    }
    
    // 3. Handle template literals and expression interpolation ${ ... }
    if (inTemplateLiteral) {
      // Check if entering interpolation
      if (char === '$' && nextChar === '{') {
        stack.push('{');
        templateLiteralExprStack.push(stack.length);
        i++; // skip {
        continue;
      }
      // Check if closing template literal
      if (char === '`' && code[i - 1] !== '\\') {
        inTemplateLiteral = false;
        continue;
      }
      // If we are in a template literal but NOT inside an expression block, ignore braces/parentheses
      if (templateLiteralExprStack.length === 0) {
        continue;
      }
    }
    
    // Start of comments/strings/template literals
    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (char === "'") {
      inSingleQuote = true;
      continue;
    }
    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (char === '`') {
      inTemplateLiteral = true;
      continue;
    }
    
    // 4. Bracket balancing
    if (openChars.includes(char)) {
      stack.push(char);
    } else if (closeChars.includes(char)) {
      const expected = matching[char];
      if (stack.length === 0) {
        return { isValid: false, reason: `Carácter de cierre inesperado '${char}' sin apertura correspondiente` };
      }
      const last = stack.pop();
      if (last !== expected) {
        return { isValid: false, reason: `Carácter de cierre incorrecto: se esperaba el cierre de '${last}' pero se encontró '${char}'` };
      }
      
      // If we closed a ${ expression block in a template literal
      if (inTemplateLiteral && char === '}' && templateLiteralExprStack.length > 0) {
        const lastExprStackHeight = templateLiteralExprStack[templateLiteralExprStack.length - 1];
        if (stack.length < lastExprStackHeight) {
          templateLiteralExprStack.pop();
        }
      }
    }
  }
  
  if (stack.length > 0) {
    return { isValid: false, reason: `Paréntesis/llaves/corchetes sin cerrar al final del archivo: ${stack.join(', ')}` };
  }
  
  return { isValid: true };
}

/**
 * Basic syntax validator for parsed action content.
 */
function validateBasicSyntax(action: ParsedAction): { isValid: boolean; reason?: string } {
  if (action.type === 'file') {
    const code = action.content;
    const bracketCheck = checkBrackets(code);
    if (!bracketCheck.isValid) {
      return bracketCheck;
    }
    
    // Default export check for main file: App.tsx or App.jsx
    const isApp = action.filePath.toLowerCase().endsWith('app.tsx') || action.filePath.toLowerCase().endsWith('app.jsx');
    if (isApp) {
      const hasExportDefault = code.includes('export default');
      if (!hasExportDefault) {
        return { isValid: false, reason: `El archivo ${action.filePath} debe incluir una exportación por defecto ('export default')` };
      }
    }
  } else if (action.type === 'update') {
    if (!action.diffs || action.diffs.length === 0) {
      return { isValid: false, reason: 'Actualización parcial no contiene bloques SEARCH/REPLACE estructurados válidos.' };
    }
  }
  return { isValid: true };
}

/**
 * Calls generateText with XML artifact structural and syntax validation.
 * Retries once if errors are found, inserting feedback into the system prompt.
 */
async function generateWebBuilderCodeWithVerification(
  model: LanguageModel,
  agent: WebBuilderAgentInfo,
  systemPrompt: string,
  userMessage: string,
  onProgress?: (text: string) => void
): Promise<{ text: string; usage?: { totalTokens?: number } }> {
  let attempt = 1;
  let currentSystemPrompt = systemPrompt;
  let totalUsageTokens = 0;

  while (attempt <= 2) {
    if (attempt > 1) {
      onProgress?.(`⚠️ [Agente] ${agent.agentName} falló la verificación de sintaxis o estructura. Iniciando re-intento con feedback...\n`);
    }

    const { text, usage } = await generateText({
      model,
      system: currentSystemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: attempt === 1 ? 0.2 : 0.1,
    });

    if (usage?.totalTokens) {
      totalUsageTokens += usage.totalTokens;
    }

    // 1. Check if contains artifact XML tag
    if (!containsArtifact(text)) {
      if (attempt === 1) {
        currentSystemPrompt = `${systemPrompt}\n\n[ERROR ANTERIOR] Tu respuesta anterior no contenía el tag XML <maverlangArtifact>. Recuerda que tu respuesta DEBE contener ÚNICAMENTE el XML <maverlangArtifact> correspondiente, sin explicaciones ni markdown fuera de él.`;
        attempt++;
        continue;
      } else {
        return { text, usage: { totalTokens: totalUsageTokens } };
      }
    }

    // 2. Check if XML structure is parseable
    const parsed = parseArtifact(text);
    if (!parsed || parsed.actions.length === 0) {
      if (attempt === 1) {
        currentSystemPrompt = `${systemPrompt}\n\n[ERROR ANTERIOR] Tu respuesta anterior no pudo ser parseada correctamente como un bloque XML de Maverlang Artifact. Asegúrate de cerrar todos los tags <maverlangArtifact> y <maverlangAction> correctamente, y no agregues texto de introducción ni de cierre.`;
        attempt++;
        continue;
      } else {
        return { text, usage: { totalTokens: totalUsageTokens } };
      }
    }

    // 3. Check for syntax and exports
    let syntaxValid = true;
    let syntaxErrorMsg = '';
    
    for (const action of parsed.actions) {
      const validation = validateBasicSyntax(action);
      if (!validation.isValid) {
        syntaxValid = false;
        syntaxErrorMsg = validation.reason || 'Error de sintaxis desconocido';
        break;
      }
    }

    if (!syntaxValid) {
      if (attempt === 1) {
        currentSystemPrompt = `${systemPrompt}\n\n[ERROR ANTERIOR] El código que generaste anteriormente tenía errores de compilación o de estructura:\n"${syntaxErrorMsg}"\nPor favor, corrige este error. Asegúrate de balancear todos los paréntesis, corchetes y llaves, y de incluir una exportación por defecto si es App.tsx.`;
        attempt++;
        continue;
      } else {
        return { text, usage: { totalTokens: totalUsageTokens } };
      }
    }

    // Passed all validations
    return { text, usage: { totalTokens: totalUsageTokens } };
  }

  return { text: '', usage: { totalTokens: totalUsageTokens } };
}

export async function runWebBuilderOrchestration(
  model: LanguageModel,
  userMessage: string,
  existingFiles?: Record<string, string>,
  onProgress?: (text: string) => void
): Promise<WebBuilderOrchestrationResult> {
  const startTime = Date.now();
  let totalTokensUsed = 0;
  onProgress?.("🧠 [Orquestador WebBuilder] Iniciando planificación de arquitectura y archivos...\n");

  const existingFilesContext = existingFiles && Object.keys(existingFiles).length > 0;
  
  const systemPlannerPrompt = `Actúas como el Arquitecto de Software y Orquestador de Maverlang WebBuilder.
Tu tarea es analizar la consulta del usuario y los archivos existentes en el proyecto (si los hay), y planificar los cambios de código.

Determina si la consulta es simple (isComplex: false) o compleja (isComplex: true).
- Consultas simples (isComplex: false): Saludos, preguntas conceptuales de programación, o cambios muy pequeños en un único archivo que pueden ser realizados directamente por el LLM final (ej. "cambia el color del botón a azul", "cambia el título de la página").
- Consultas complejas (isComplex: true): Crear una nueva aplicación web desde cero, agregar múltiples componentes interactivos, realizar modificaciones extensas en más de un archivo, o cambios estructurales grandes.

Si la consulta es compleja (isComplex: true), debes descomponer la tarea en archivos individuales. Asigna cada archivo a un agente constructor especializado (mínimo 2, máximo 5 archivos/agentes en total). Cada agente se encargará de crear o actualizar UN ÚNICO archivo de código.
Por ejemplo, si necesitas crear una dashboard interactiva, podrías planificar:
1. "src/App.tsx" -> asignado a AppAgent (Desarrollador React Principal) para el layout y estado general.
2. "src/components/FinanceChart.tsx" -> asignado a ChartAgent (Especialista en Visualización) para el gráfico interactivo.
3. "src/index.css" -> asignado a StyleAgent (Especialista CSS) para los estilos globales y Tailwind.

DEBES responder ÚNICAMENTE con un bloque JSON en el siguiente formato (sin explicaciones, sin markdown, solo el JSON):
{
  "isComplex": true,
  "reason": "Explicación del diseño y plan de archivos",
  "agents": [
    {
      "agentName": "Nombre del Agente (ej: AppAgent)",
      "role": "Rol específico del agente (ej: Desarrollador React Principal)",
      "task": "Explicación detallada de lo que debe implementar en su archivo asignado",
      "filePath": "Ruta exacta del archivo (ej: src/App.tsx)"
    }
  ]
}

Si determinas que no requiere delegación (isComplex: false), responde con:
{
  "isComplex": false,
  "reason": "Explicación breve del motivo de no delegar",
  "agents": []
}
`;

  let isComplex = false;
  let reason = "";
  let agents: WebBuilderAgentInfo[] = [];

  try {
    const { text, usage } = await generateText({
      model,
      system: systemPlannerPrompt,
      messages: [
        {
          role: 'user',
          content: `Consulta del usuario: "${userMessage}"
          
${existingFilesContext ? `Archivos existentes:\n${Object.keys(existingFiles).map(p => `- ${p}`).join('\n')}` : '(Proyecto vacío)'}`
        }
      ],
      temperature: 0.1,
    });

    if (usage?.totalTokens) totalTokensUsed += usage.totalTokens;

    const jsonText = extractJsonBlock(text);
    const result = JSON.parse(jsonText);

    isComplex = !!result.isComplex;
    reason = result.reason || 'Sin motivo';
    const rawAgents = Array.isArray(result.agents) ? result.agents : [];
    agents = rawAgents.slice(0, 5).map((a: any) => ({
      agentName: a.agentName || 'BuilderAgent',
      role: a.role || 'Desarrollador',
      task: a.task || 'Crear código',
      filePath: a.filePath || 'src/App.tsx'
    }));
  } catch (err: any) {
    console.error("WebBuilder planning phase failed:", err);
    isComplex = false;
    reason = `Error en planificación: ${err.message || String(err)}`;
    agents = [];
  }

  if (!isComplex || agents.length === 0) {
    onProgress?.(`✅ [Orquestador WebBuilder] Análisis completo: Es una consulta simple. Se resolverá de forma directa (${reason}).\n\n`);
    return {
      isComplex: false,
      reason,
      agents: [],
      agentReports: [],
      totalOrchestrationTimeMs: Date.now() - startTime,
      totalTokensUsed
    };
  }

  onProgress?.(`🔍 [Orquestador WebBuilder] Plan de archivos creado: "${reason}"\n`);
  onProgress?.(`🤖 Creando ${agents.length} agentes constructores en paralelo...\n\n`);

  const agentPromises = agents.map(async (agent): Promise<WebBuilderAgentReport> => {
    const agentStartTime = Date.now();
    onProgress?.(`⏳ [Agente] ${agent.agentName} (${agent.role}) generando/actualizando \`${agent.filePath}\`...\n`);

    const agentSystemPrompt = `Actúas como el agente constructor experto "${agent.agentName}" con el rol de "${agent.role}".
Tu tarea específica es implementar o modificar el archivo "${agent.filePath}" de acuerdo a la instrucción: "${agent.task}".

Debes generar el contenido de tu archivo utilizando el formato XML de Maverlang Artifacts.
REGLAS CRÍTICAS DE RESPUESTA:
1. Responde ÚNICAMENTE con el bloque XML <maverlangArtifact> que contiene la acción para tu archivo. No incluyes explicaciones en lenguaje natural antes ni después del bloque XML.
2. El bloque debe tener la estructura correspondiente.
Si vas a CREAR o REEMPLAZAR un archivo por completo, usa type="file":
<maverlangArtifact id="project" title="Creación de archivo">
  <maverlangAction type="file" filePath="${agent.filePath}">
// Tu código React/HTML/CSS aquí
  </maverlangAction>
</maverlangArtifact>

Si vas a MODIFICAR un archivo existente, usa type="update" con bloques search/replace:
<maverlangArtifact id="project" title="Modificación de archivo">
  <maverlangAction type="update" filePath="${agent.filePath}">
<<<<SEARCH
// Código exacto actual a buscar
====
// Código modificado de reemplazo
>>>>
  </maverlangAction>
</maverlangArtifact>

3. Todo código React debe usar importaciones estándar que estén disponibles en un entorno Vite + React normal.
4. Recuerda: Tu response debe contener SOLAMENTE el XML. No agregues comentarios introductorios ni de cierre en markdown fuera del XML.
`;

    // Filter existing files context per-agent to optimize tokens
    const relevantFiles = selectRelevantContext(agent.filePath, existingFiles || {});
    const relevantFilesContext = Object.keys(relevantFiles).length > 0;

    const agentUserMessage = `Consulta original del usuario: "${userMessage}"

PLAN DE ARCHIVOS COORDINADOS:
${agents.map(a => `- Archivo: \`${a.filePath}\` (generado por ${a.agentName} - ${a.role}): ${a.task}`).join('\n')}

ARCHIVOS EXISTENTES EN EL PROYECTO (SELECCIÓN RELEVANTE):
${relevantFilesContext ? Object.entries(relevantFiles).map(([path, content]) => `--- Archivo: ${path} ---\n${content}\n`).join('\n') : '(Ninguno o vacío)'}

Tu tarea asignada: Generar o actualizar el archivo \`${agent.filePath}\` de acuerdo a: "${agent.task}".
Recuerda devolver ÚNICAMENTE el XML con tu código.`;

    try {
      const agentPromise = generateWebBuilderCodeWithVerification(
        model,
        agent,
        agentSystemPrompt,
        agentUserMessage,
        onProgress
      );

      const agentResponse = await withTimeout(
        agentPromise,
        120000,
        new Error("Excedió el tiempo límite de ejecución de 120 segundos")
      );

      const duration = Date.now() - agentStartTime;
      const tokensUsed = agentResponse.usage?.totalTokens || 0;
      const content = agentResponse.text;
      onProgress?.(`✅ [Agente] ${agent.agentName} completó la edición de \`${agent.filePath}\` en ${duration}ms.\n`);

      return {
        ...agent,
        content,
        durationMs: duration,
        success: true,
        tokensUsed
      };
    } catch (err: any) {
      const duration = Date.now() - agentStartTime;
      console.error(`Error in WebBuilder Agent ${agent.agentName}:`, err);
      onProgress?.(`❌ [Agente] ${agent.agentName} falló para \`${agent.filePath}\` después de ${duration}ms: ${err.message || String(err)}\n`);

      return {
        ...agent,
        content: `Error al procesar la tarea para ${agent.filePath}: ${err.message || String(err)}`,
        durationMs: duration,
        success: false,
        tokensUsed: 0
      };
    }
  });

  const agentReports = await Promise.all(agentPromises);
  
  for (const report of agentReports) {
    if (report.tokensUsed) totalTokensUsed += report.tokensUsed;
  }

  const totalDuration = Date.now() - startTime;

  onProgress?.(`\n📊 [Orquestador WebBuilder] Todos los archivos generados en paralelo (${totalDuration}ms total).\n\n`);

  return {
    isComplex: true,
    reason,
    agents,
    agentReports,
    totalOrchestrationTimeMs: totalDuration,
    totalTokensUsed
  };
}
