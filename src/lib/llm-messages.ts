import { z } from "zod";

/** Client-supplied chat turns: never accept system/tool/developer roles. */
export const clientChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(50_000),
});

export type ClientChatMessage = z.infer<typeof clientChatMessageSchema>;

/**
 * Drop attacker-controlled system/tool roles and cap history.
 * Prevents "role: system" prompt injection from the JSON body.
 */
export function sanitizeClientMessages(
  raw: unknown,
  opts: { maxMessages?: number; maxContentChars?: number } = {}
): ClientChatMessage[] {
  const maxMessages = opts.maxMessages ?? 24;
  const maxContentChars = opts.maxContentChars ?? 50_000;
  if (!Array.isArray(raw)) return [];

  const out: ClientChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    if (role !== "user" && role !== "assistant") continue;
    const content = (item as { content?: unknown }).content;
    const text =
      typeof content === "string"
        ? content
        : content == null
          ? ""
          : String(content);
    if (!text.trim()) continue;
    out.push({
      role,
      content: text.slice(0, maxContentChars),
    });
    if (out.length >= maxMessages) break;
  }
  return out;
}
