import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { SharedChatClient } from "./shared-chat-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getSharedChat(id: string) {
  const supabase = createServiceClient();

  // Validar formato mínimo del ID para evitar lookups innecesarios y logs ruidosos.
  // shared_chat_links.id es UUID v4.
  if (!id || !/^[0-9a-fA-F-]{8,64}$/.test(id)) {
    return null;
  }

  // Prefer full columns; fall back if migration not applied
  let { data, error } = await supabase
    .from("shared_chat_links")
    .select("question, answer, created_at, user_id, title, share_type, messages, is_active, expires_at")
    .eq("id", id)
    .single();

  if (error && /column|messages|share_type|title|is_active|expires_at/i.test(error.message || "")) {
    // Migración de revocación no aplicada: retry sin las columnas nuevas
    const retry = await supabase
      .from("shared_chat_links")
      .select("question, answer, created_at, user_id")
      .eq("id", id)
      .single();
    data = retry.data
      ? {
          ...retry.data,
          title: null,
          share_type: "qa",
          messages: null,
          is_active: true,
          expires_at: null,
        }
      : null;
    error = retry.error;
  }

  if (error || !data) {
    return null;
  }

  // ── Control de acceso (A-2): revocación + expiración ──
  // Si el dueño revocó el enlace o expiró, devolver null (404).
  if (data.is_active === false) {
    return null;
  }
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const chat = await getSharedChat(id);

  if (!chat) {
    return {
      title: "Chat no encontrado | Maverlang",
    };
  }

  const raw =
    chat.title ||
    chat.question ||
    "Conversación compartida";
  const title = raw.length > 50 ? raw.substring(0, 50) + "..." : raw;
  const isFull = chat.share_type === "full" || (Array.isArray(chat.messages) && chat.messages.length > 0);

  return {
    title: `${title} | Maverlang AI`,
    description: isFull
      ? "Conversación completa compartida desde Maverlang AI."
      : "Una respuesta generada por Inteligencia Artificial Financiera en Maverlang.",
  };
}

export default async function SharedChatPage({ params }: PageProps) {
  const { id } = await params;
  const chat = await getSharedChat(id);

  if (!chat) {
    notFound();
  }

  return <SharedChatClient chat={chat as any} chatId={id} />;
}
