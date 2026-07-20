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

  // Prefer full columns; fall back if migration not applied
  let { data, error } = await supabase
    .from("shared_chat_links")
    .select("question, answer, created_at, user_id, title, share_type, messages")
    .eq("id", id)
    .single();

  if (error && /column|messages|share_type|title/i.test(error.message || "")) {
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
        }
      : null;
    error = retry.error;
  }

  if (error || !data) {
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
