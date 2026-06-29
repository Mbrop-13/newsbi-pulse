import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { extractIdFromSlug } from "@/lib/utils";
import ChatClient from "./chat-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getChatData(id: string) {
  const chatId = extractIdFromSlug(id);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ai_saved_chats")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // ── Ownership check (ASVS 4.1.3 — anti-IDOR on server page) ──
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.id !== data.user_id) {
    // Distinguish "not found" from "forbidden" is itself a leak — return null (404).
    return null;
  }

  return {
    chat_id: data.chat_id,
    user_id: data.user_id,
    title: data.title,
    messages: data.messages || [],
    attached_articles: data.attached_articles || [],
    attached_files: data.attached_files || [],
    created_at: data.created_at,
    is_web_builder: data.is_web_builder || false,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const chat = await getChatData(id);

  if (!chat) {
    return {
      title: "Chat no encontrado | Maverlang",
    };
  }

  const title = chat.title || chat.messages[0]?.content?.slice(0, 50) || "Conversación IA";
  const displayTitle = title.length > 50 ? title.substring(0, 50) + "..." : title;

  return {
    title: `${displayTitle} | Maverlang AI`,
    description: "Una conversación de Inteligencia Artificial financiera en Maverlang.",
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const chatData = await getChatData(id);

  return <ChatClient initialChatData={chatData} rawParamId={id} />;
}
