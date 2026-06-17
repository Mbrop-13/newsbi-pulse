/**
 * Maverlang WebBuilder Artifact Parser
 *
 * Parses the AI model's streaming response to extract file artifacts.
 * The AI is instructed to emit file blocks using a custom XML format:
 *
 * <maverlangArtifact id="project" title="Dashboard Financiero">
 *   <maverlangAction type="file" filePath="/App.tsx">
 *     // code here
 *   </maverlangAction>
 *   <maverlangAction type="file" filePath="/styles.css">
 *     // css here
 *   </maverlangAction>
 * </maverlangArtifact>
 */

export interface ParsedFileAction {
  type: "file";
  filePath: string;
  content: string;
}

export interface ParsedArtifact {
  id: string;
  title: string;
  actions: ParsedFileAction[];
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

  // Extract all file actions (even partial ones for streaming)
  const actions: ParsedFileAction[] = [];
  const actionRegex =
    /<maverlangAction\s+type="file"\s+filePath="([^"]+)">([\s\S]*?)(?:<\/maverlangAction>|$)/g;

  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    const filePath = match[1];
    let content = match[2];

    // Trim leading/trailing whitespace from code content
    content = content.replace(/^\n/, "").replace(/\n$/, "");

    if (content.length > 0) {
      actions.push({
        type: "file",
        filePath,
        content,
      });
    }
  }

  return { id, title, actions };
}

/**
 * Convert parsed artifact actions into a files map for the WebBuilder store.
 */
export function actionsToFiles(
  actions: ParsedFileAction[]
): Record<string, { code: string }> {
  const files: Record<string, { code: string }> = {};
  for (const action of actions) {
    files[action.filePath] = { code: action.content };
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
