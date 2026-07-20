import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const messageSchema = z.object({
  id: z.string().max(120),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(50000),
  timestamp: z.union([z.string(), z.number()]).optional(),
  citations: z.array(z.string().max(2000)).max(30).optional(),
});

const shareChatSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("qa"),
    question: z.string().min(1).max(2000),
    answer: z.string().min(1).max(20000),
  }),
  z.object({
    mode: z.literal("full"),
    title: z.string().max(200).optional(),
    messages: z.array(messageSchema).min(1).max(80),
    // Optional preview pair (derived client-side)
    question: z.string().max(2000).optional(),
    answer: z.string().max(20000).optional(),
  }),
]);

/** Compact public snapshot — only fields needed to render a shared conversation. */
function sanitizeMessages(
  messages: z.infer<typeof messageSchema>[]
): Array<{
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  citations?: string[];
}> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => m.content && m.content.trim().length > 0)
    .slice(0, 80)
    .map((m, idx) => ({
      id: m.id || `share-msg-${idx}`,
      role: m.role,
      content: m.content.slice(0, 50000),
      timestamp: m.timestamp != null ? String(m.timestamp) : undefined,
      citations: m.citations?.slice(0, 20),
    }));
}

function deriveQaFromMessages(
  messages: ReturnType<typeof sanitizeMessages>
): { question: string; answer: string; title: string } {
  const firstUser = messages.find((m) => m.role === "user");
  const firstAssistant = messages.find((m) => m.role === "assistant");
  const question = (firstUser?.content || "Conversación compartida").slice(0, 2000);
  const answer = (
    firstAssistant?.content ||
    messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .join("\n\n") ||
    "Sin respuesta de la IA."
  ).slice(0, 20000);
  const title =
    question.length > 60 ? question.slice(0, 57) + "..." : question;
  return { question, answer, title };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    // Back-compat: old clients sent { question, answer } without mode
    const normalized =
      body && typeof body === "object" && !("mode" in body) && body.question && body.answer
        ? { mode: "qa", question: body.question, answer: body.answer }
        : body;

    const parsed = shareChatSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Formato inválido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para compartir" },
        { status: 401 }
      );
    }

    let insertRow: Record<string, unknown>;

    if (parsed.data.mode === "qa") {
      insertRow = {
        user_id: user.id,
        question: parsed.data.question,
        answer: parsed.data.answer,
        share_type: "qa",
        title:
          parsed.data.question.length > 60
            ? parsed.data.question.slice(0, 57) + "..."
            : parsed.data.question,
        messages: null,
      };
    } else {
      const messages = sanitizeMessages(parsed.data.messages);
      if (messages.length === 0) {
        return NextResponse.json(
          { error: "El chat no tiene mensajes para compartir" },
          { status: 400 }
        );
      }
      const derived = deriveQaFromMessages(messages);
      insertRow = {
        user_id: user.id,
        question: (parsed.data.question || derived.question).slice(0, 2000),
        answer: (parsed.data.answer || derived.answer).slice(0, 20000),
        title: (parsed.data.title || derived.title).slice(0, 200),
        share_type: "full",
        messages,
      };
    }

    // Primary insert (with full-chat columns)
    let { data, error } = await supabase
      .from("shared_chat_links")
      .insert(insertRow)
      .select("id")
      .single();

    // Fallback if migration not applied yet (missing columns)
    if (
      error &&
      typeof error.message === "string" &&
      /messages|share_type|title|column/i.test(error.message)
    ) {
      console.warn(
        "[Share Chat API] Full-share columns missing, falling back to Q&A columns only"
      );
      const fallback: Record<string, unknown> = {
        user_id: user.id,
        question: insertRow.question,
        answer:
          parsed.data.mode === "full" && Array.isArray(insertRow.messages)
            ? // Flatten conversation into answer so old schema still shares something useful
              (insertRow.messages as Array<{ role: string; content: string }>)
                .map(
                  (m) =>
                    `${m.role === "user" ? "👤 Usuario" : "🤖 Maverlang AI"}:\n${m.content}`
                )
                .join("\n\n———\n\n")
                .slice(0, 20000)
            : insertRow.answer,
      };
      const retry = await supabase
        .from("shared_chat_links")
        .insert(fallback)
        .select("id")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[Share Chat API] Error inserting into DB:", error);
      return NextResponse.json(
        { error: "Error al guardar el chat compartido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      shareType: parsed.data.mode,
    });
  } catch (error: any) {
    console.error("[Share Chat API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
