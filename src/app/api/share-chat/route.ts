import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Se requiere pregunta y respuesta" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para compartir" },
        { status: 401 }
      );
    }

    // Insert shared chat into DB
    const { data, error } = await supabase
      .from("shared_chat_links")
      .insert({
        user_id: user.id,
        question,
        answer,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Share Chat API] Error inserting into DB:", error);
      return NextResponse.json(
        { error: "Error al guardar el chat compartido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    console.error("[Share Chat API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
