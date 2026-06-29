import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase";
import { extractIdFromSlug } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Se requiere ID de chat" },
        { status: 400 }
      );
    }

    const chatId = extractIdFromSlug(id);

    // Read via service-role then enforce OWNERSHIP (ASVS 4.1.3 — anti-IDOR).
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ai_saved_chats")
      .select("chat_id, user_id, title, messages, attached_articles, attached_files, created_at")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error) {
      console.error("[Get Chat API] Error fetching from DB:", error);
      return NextResponse.json(
        { error: "Error al obtener el chat" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Chat no encontrado" },
        { status: 404 }
      );
    }

    // Ownership check: deny unless this chat belongs to the authenticated user
    if (data.user_id !== auth.data.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      chat: {
        chat_id: data.chat_id,
        title: data.title,
        messages: data.messages,
        attached_articles: data.attached_articles || [],
        attached_files: data.attached_files || [],
        created_at: data.created_at,
      }
    });
  } catch (error: any) {
    console.error("[Get Chat API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
