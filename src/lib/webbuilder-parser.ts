/**
 * Maverlang WebBuilder Artifact Parser
 *
 * Parses the AI model's streaming response to extract file artifacts.
 * Supports two action types:
 *
 * 1. FULL FILE (type="file") — Creates or replaces an entire file:
 *
 * <maverlangArtifact id="project" title="Dashboard Financiero">
 *   <maverlangAction type="file" filePath="/App.tsx">
 *     // complete code here
 *   </maverlangAction>
 * </maverlangArtifact>
 *
 * 2. PARTIAL UPDATE (type="update") — Modifies specific parts of an existing file:
 *
 * <maverlangArtifact id="project" title="Actualización">
 *   <maverlangAction type="update" filePath="/App.tsx">
 * <<<SEARCH
 *     <button className="bg-blue-500">Click</button>
 * ===
 *     <button className="bg-red-600 shadow-lg">Click</button>
 * >>>
 *   </maverlangAction>
 * </maverlangArtifact>
 */

export interface ParsedFileAction {
  type: "file";
  filePath: string;
  content: string;
}

export interface ParsedUpdateAction {
  type: "update";
  filePath: string;
  diffs: { search: string; replace: string }[];
}

export type ParsedAction = ParsedFileAction | ParsedUpdateAction;

export interface ParsedArtifact {
  id: string;
  title: string;
  actions: ParsedAction[];
}

/**
 * Normaliza la ruta de un archivo a la convención del WebBuilder:
 *  - Garantiza barra inicial ("/App.tsx", no "App.tsx").
 *  - Colapsa la carpeta "src/" si el modelo la añade por costumbre Vite/CRA
 *    ("/src/App.tsx" o "src/App.tsx" -> "/App.tsx").
 * El resto del sistema (DEFAULT_FILES, prompt final, template Sandpack
 * "react-ts") usa rutas raíz sin "src/". Sin esta normalización, el código
 * generado aterriza en "/src/App.tsx" mientras Sandpack renderiza el entry
 * "/App.tsx" (la pantalla del cohete por defecto), sin lanzar ningún error.
 */
function normalizeFilePath(filePath: string): string {
  let path = filePath.startsWith("/") ? filePath : "/" + filePath;
  // Colapsar el segmento "src/" inmediatamente después de la barra inicial.
  // Solo el primer segmento (ej: /src/App.tsx -> /App.tsx, /src/components/X -> /components/X).
  // No afecta rutas válidas que contengan "src" más adentro (raro en este sistema).
  path = path.replace(/^\/src\//, "/");
  return path;
}

/**
 * Parse a complete or partial artifact from the AI response text.
 * Works on the full accumulated text (not just incremental chunks).
 */
export function parseArtifact(text: string): ParsedArtifact | null {
  // Match the outer artifact wrapper
  const artifactMatch = text.match(
    /<maverlangArtifact\s+(?:[^>]*?)id="([^"]*)"(?:\s+title="([^"]*)")?[^>]*>/
  );
  if (!artifactMatch) return null;

  const id = artifactMatch[1];
  const title = artifactMatch[2] || "Proyecto";

  const actions: ParsedAction[] = [];

  // Extract all actions (file or update)
  const actionRegex =
    /<maverlangAction\s+type="(file|update)"\s+filePath="([^"]+)">([\s\S]*?)(?:<\/maverlangAction>|$)/g;

  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    const actionType = match[1] as "file" | "update";
    const rawFilePath = match[2];
    const filePath = normalizeFilePath(rawFilePath);
    let content = match[3];

    // Strip CDATA wrappers if present (handles cases where the LLM wraps code in CDATA for XML compliance)
    content = content.replace(/^\s*<!\[CDATA\[/gi, "");
    content = content.replace(/\]\]>\s*$/gi, "");

    // Trim leading/trailing whitespace from content
    content = content.replace(/^\n/, "").replace(/\n$/, "");

    if (actionType === "file") {
      // Full file replacement
      if (content.length > 0) {
        actions.push({
          type: "file",
          filePath,
          content,
        });
      }
    } else if (actionType === "update") {
      // Parse search/replace diff blocks
      const diffs = parseDiffBlocks(content);
      if (diffs.length > 0) {
        actions.push({
          type: "update",
          filePath,
          diffs,
        });
      }
    }
  }

  return { id, title, actions };
}

/**
 * Parse diff blocks from the update action content.
 *
 * Formato canónico del sistema:
 *   <<<SEARCH
 *   old code
 *   ===
 *   new code
 *   >>>
 *
 * El LLM a veces varía el número de marcadores (estilo Aider usa <<<<<<<,
 * =======, >>>>>>>REPLACE). La regex es tolerante a 2+ repeticiones de cada
 * marcador para absorber esas varianzas sin romper el formato canónico.
 * Acepta también un sufijo opcional "REPLACE" tras el cierre.
 */
function parseDiffBlocks(content: string): { search: string; replace: string }[] {
  const diffs: { search: string; replace: string }[] = [];
  // SEARCH: >=2 '<' seguidos de "SEARCH" (con espacios opcionales).
  // Separador: >=2 '='.
  // Cierre: >=2 '>' con sufijo opcional "REPLACE" (estilo Aider).
  const diffRegex = /<{2,}\s*SEARCH\s*\n([\s\S]*?)\n={2,}\s*\n([\s\S]*?)\n>{2,}\s*(?:REPLACE)?/g;

  let match;
  while ((match = diffRegex.exec(content)) !== null) {
    const search = match[1];
    const replace = match[2];
    if (search.length > 0) {
      diffs.push({ search, replace });
    }
  }

  return diffs;
}

/**
 * Resultado de aplicar diffs con reporte de fallos (estilo Aider).
 * - `code`: el código con todos los bloques que SÍ coincidieron aplicados.
 * - `failed`: los bloques que NO se encontraron (ni exacto ni fuzzy), con la
 *   razón. Permite al llamador avisar al usuario / re-pedir al LLM en vez de
 *   hacer un no-op silencioso (que es el bug que impedía que el LLM editara).
 */
export interface FailedDiff {
  search: string;
  replace: string;
  reason: string;
}

export interface ApplyDiffsResult {
  code: string;
  failed: FailedDiff[];
}

/**
 * Apply diff updates to an existing file's code, reporting which blocks failed.
 * Aplica bloque por bloque sobre el resultado mutado: los bloques exitosos se
 * aplican igual que antes; los que no coinciden se acumulan en `failed` con su
 * razón ("no encontrado" | "ambiguo") en vez de descartarse silenciosamente.
 */
export function applyDiffsWithReport(
  originalCode: string,
  diffs: { search: string; replace: string }[]
): ApplyDiffsResult {
  let result = originalCode;
  const failed: FailedDiff[] = [];

  for (const diff of diffs) {
    // Try exact match first
    if (result.includes(diff.search)) {
      result = result.replace(diff.search, () => diff.replace);
      continue;
    }

    // Fuzzy: línea por línea con trim. Cuenta coincidencias para detectar
    // ambigüedad (mismo bloque aparece varias veces → no sabemos cuál cambiar).
    const searchTrimmed = diff.search.trim();
    const lines = result.split("\n");
    const searchLines = searchTrimmed.split("\n").map(l => l.trim());

    let matchStart = -1;
    let matchCount = 0;

    for (let i = 0; i <= lines.length - searchLines.length; i++) {
      let found = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (lines[i + j].trim() !== searchLines[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        matchCount++;
        if (matchStart === -1) matchStart = i;
        // Seguimos contando para detectar ambigüedad, pero solo guardamos el 1º.
      }
    }

    if (matchStart !== -1 && matchCount === 1) {
      const matchEnd = matchStart + searchLines.length;
      // Preserve the indentation of the first matched line
      const indent = lines[matchStart].match(/^(\s*)/)?.[1] || "";
      const replaceLines = diff.replace.split("\n").map((line, idx) => {
        if (idx === 0) return indent + line.trimStart();
        return line;
      });
      lines.splice(matchStart, matchEnd - matchStart, ...replaceLines);
      result = lines.join("\n");
    } else if (matchCount > 1) {
      failed.push({
        search: diff.search,
        replace: diff.replace,
        reason: `ambiguo: el bloque coincide ${matchCount} veces en el archivo`,
      });
    } else {
      failed.push({
        search: diff.search,
        replace: diff.replace,
        reason: "no encontrado: el bloque SEARCH no existe en el archivo actual",
      });
    }
  }
  return { code: result, failed };
}

/**
 * Apply diff updates to an existing file's code.
 * Wrapper fino sobre `applyDiffsWithReport` que devuelve solo el código
 * (mantiene la firma export original para callers que no necesitan el reporte).
 */
export function applyDiffs(
  originalCode: string,
  diffs: { search: string; replace: string }[]
): string {
  return applyDiffsWithReport(originalCode, diffs).code;
}

/**
 * Pre-valida diffs contra el código actual SIN aplicarlos (no muta).
 * Devuelve `{ allMatch, failed }` para que el bucle verificar→reparar decida
 * si re-pedir al LLM (estilo Aider/Bolt) antes de aceptar la generación.
 *
 * Es un wrapper sobre `applyDiffsWithReport` que descarta el `code` resultante
 * — solo interesa saber qué bloques NO coincidirían si se aplicaran.
 */
export function validateDiffsAgainstFile(
  code: string,
  diffs: { search: string; replace: string }[]
): { allMatch: boolean; failed: FailedDiff[] } {
  const { failed } = applyDiffsWithReport(code, diffs);
  return { allMatch: failed.length === 0, failed };
}

/**
 * Bloque de edición parcial que no pudo aplicarse al archivo destino.
 * `reason` explica por qué (no encontrado / ambiguo / archivo inexistente).
 */
export interface FailedUpdate {
  filePath: string;
  search: string;
  reason: string;
}

/**
 * Resultado de convertir acciones del artefacto en archivos.
 * - `files`: mapa de archivos creados/actualizados (solo los que cambiaron).
 * - `failedUpdates`: ediciones parciales cuyo bloque SEARCH no coincidió, para
 *   que el llamador pueda avisar al usuario / re-pedir al LLM.
 */
export interface ActionsToFilesResult {
  files: Record<string, { code: string }>;
  failedUpdates: FailedUpdate[];
}

/**
 * Convert parsed artifact actions into a files map for the WebBuilder store.
 * For "update" actions, requires existing files to apply diffs.
 *
 * Devuelve además `failedUpdates`: las ediciones parciales cuyo bloque SEARCH
 * no se encontró en el archivo actual (estilo Aider). Antes esto era un no-op
 * silencioso, que era el bug que impedía que las ediciones del LLM aterrizen.
 */
export function actionsToFiles(
  actions: ParsedAction[],
  existingFiles?: Record<string, { code: string }>
): ActionsToFilesResult {
  const files: Record<string, { code: string }> = {};
  const failedUpdates: FailedUpdate[] = [];

  for (const action of actions) {
    const filePath = normalizeFilePath(action.filePath);
    if (action.type === "file") {
      // Full file creation/replacement
      files[filePath] = { code: action.content };
    } else if (action.type === "update") {
      // Partial update — apply diffs to existing file
      const existing = existingFiles?.[filePath];
      if (existing) {
        const { code: updatedCode, failed } = applyDiffsWithReport(existing.code, action.diffs);
        files[filePath] = { code: updatedCode };
        for (const f of failed) {
          failedUpdates.push({ filePath, search: f.search, reason: f.reason });
        }
      } else {
        // El archivo no existe: no se puede aplicar el diff a nada.
        for (const d of action.diffs) {
          failedUpdates.push({
            filePath,
            search: d.search,
            reason: "archivo inexistente: no se puede aplicar SEARCH/REPLACE a un archivo que no existe",
          });
        }
      }
    }
  }

  return { files, failedUpdates };
}

/**
 * Check if a text chunk contains a WebBuilder artifact opening tag.
 */
export function containsArtifact(text: string): boolean {
  return text.includes("<maverlangArtifact");
}

/**
 * Check if the artifact is fully closed (streaming is done for this artifact).
 */
export function isArtifactComplete(text: string): boolean {
  return text.includes("</maverlangArtifact>");
}

/**
 * Strip artifact XML from the AI response text, leaving only the natural language.
 */
export function stripArtifactXml(text: string): string {
  let clean = text;
  
  // 1. Remove XML artifact blocks (complete or incomplete/streaming)
  clean = clean.replace(/<maverlangArtifact[\s\S]*?<\/maverlangArtifact>/gi, "");
  clean = clean.replace(/<maverlangArtifact[\s\S]*$/gi, "");
  
  // 2. Remove markdown code blocks (complete or incomplete/streaming)
  clean = clean.replace(/```[a-zA-Z]*[\s\S]*?```/g, "");
  clean = clean.replace(/```[a-zA-Z]*[\s\S]*$/g, "");
  
  return clean.trim();
}
