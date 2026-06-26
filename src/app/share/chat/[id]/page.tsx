import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, Bot, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createServiceClient } from "@/lib/supabase";

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1117] flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1890FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Logo */}
      <div className="mb-10 text-center relative z-10">
        <Link href="/home" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
          <img 
            src="/assets/maverlang-logo-small.png" 
            alt="Maverlang Logo" 
            className="h-8 w-auto object-contain select-none pointer-events-none"
          />
          <span className="font-extrabold text-lg tracking-wide text-gray-900 dark:text-white uppercase">
            MAVERLANG <span className="text-[#1890FF]">AI</span>
          </span>
        </Link>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Conversación compartida el {new Date(chat.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* The Chat Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* User Question */}
        <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">U</span>
            </div>
            <div className="pt-2">
              <p className="text-gray-900 dark:text-white font-medium text-lg md:text-xl leading-snug">
                {chat.question}
              </p>
            </div>
          </div>
        </div>

        {/* AI Answer */}
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1890FF] to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 w-full overflow-hidden pt-1">
              <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:text-gray-900 dark:prose-pre:text-gray-100 text-gray-700 dark:text-gray-300 max-w-none">
                <ReactMarkdown>{chat.answer}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center relative z-10">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 font-editorial">
          ¿Quieres respuestas como esta?
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Únete a Maverlang y accede a la Inteligencia Artificial financiera más avanzada del mercado, datos en tiempo real y análisis profundo.
        </p>
        <Link href="/home">
          <button className="bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3.5 px-8 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity mx-auto shadow-xl">
            Comenzar gratis
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

    </div>
  );
}
