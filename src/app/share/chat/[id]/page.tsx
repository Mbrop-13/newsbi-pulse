import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { SharedChatClient } from "./shared-chat-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Fetch chat data on the server
async function getSharedChat(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shared_chat_links")
    .select("question, answer, created_at, user_id")
    .eq("id", id)
    .single();

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

  const title = chat.question.length > 50 ? chat.question.substring(0, 50) + "..." : chat.question;

  return {
    title: `Chat sobre: ${title} | Maverlang AI`,
    description: "Una respuesta generada por Inteligencia Artificial Financiera en Maverlang.",
  };
}

export default async function SharedChatPage({ params }: PageProps) {
  const { id } = await params;
  const chat = await getSharedChat(id);

  if (!chat) {
    notFound();
  }

  return <SharedChatClient chat={chat} chatId={id} />;
}
