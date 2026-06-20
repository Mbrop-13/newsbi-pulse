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
 * Format:
 * <<<SEARCH
 * old code
 * ===
 * new code
 * >>>
 */
function parseDiffBlocks(content: string): { search: string; replace: string }[] {
  const diffs: { search: string; replace: string }[] = [];
  const diffRegex = /<<<SEARCH\n([\s\S]*?)\n===\n([\s\S]*?)\n>>>/g;

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
 * Apply diff updates to an existing file's code.
 * Returns the updated code, or the original if no matches found.
 */
export function applyDiffs(
  originalCode: string,
  diffs: { search: string; replace: string }[]
): string {
  let result = originalCode;
  for (const diff of diffs) {
    // Try exact match first
    if (result.includes(diff.search)) {
      result = result.replace(diff.search, () => diff.replace);
    } else {
      // Try with trimmed whitespace matching (fuzzy)
      const searchTrimmed = diff.search.trim();
      const lines = result.split("\n");
      let matchStart = -1;
      let matchEnd = -1;
      const searchLines = searchTrimmed.split("\n").map(l => l.trim());

      for (let i = 0; i <= lines.length - searchLines.length; i++) {
        let found = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (lines[i + j].trim() !== searchLines[j]) {
            found = false;
            break;
          }
        }
        if (found) {
          matchStart = i;
          matchEnd = i + searchLines.length;
          break;
        }
      }

      if (matchStart !== -1) {
        // Preserve the indentation of the first matched line
        const indent = lines[matchStart].match(/^(\s*)/)?.[1] || "";
        const replaceLines = diff.replace.split("\n").map((line, idx) => {
          if (idx === 0) return indent + line.trimStart();
          return line;
        });
        lines.splice(matchStart, matchEnd - matchStart, ...replaceLines);
        result = lines.join("\n");
      }
    }
  }
  return result;
}

/**
 * Convert parsed artifact actions into a files map for the WebBuilder store.
 * For "update" actions, requires existing files to apply diffs.
 */
export function actionsToFiles(
  actions: ParsedAction[],
  existingFiles?: Record<string, { code: string }>
): Record<string, { code: string }> {
  const files: Record<string, { code: string }> = {};

  for (const action of actions) {
    const filePath = normalizeFilePath(action.filePath);
    if (action.type === "file") {
      // Full file creation/replacement
      files[filePath] = { code: action.content };
    } else if (action.type === "update") {
      // Partial update — apply diffs to existing file
      const existing = existingFiles?.[filePath];
      if (existing) {
        const updatedCode = applyDiffs(existing.code, action.diffs);
        files[filePath] = { code: updatedCode };
      }
      // If file doesn't exist, skip the update (can't apply diff to nothing)
    }
  }

  return files;
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
