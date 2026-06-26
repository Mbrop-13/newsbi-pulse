"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, User, ArrowRight, MessageSquarePlus, LogIn, Copy, Check, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthModalStore } from "@/lib/stores/auth-store";

interface SharedChatData {
  question: string;
  answer: string;
  created_at: string;
  user_id: string;
}

export function SharedChatClient({ chat, chatId }: { chat: SharedChatData; chatId: string }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [copied, setCopied] = useState(false);
  const { openModal } = useAuthModalStore();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleStartOwnConversation = () => {
    if (isLoggedIn) {
      router.push("/");
    } else {
      openModal("register");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0 z-10">
        <Link href="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img 
            src="/assets/maverlang-logo-small.png" 
            alt="Maverlang Logo" 
            className="h-7 w-auto object-contain select-none pointer-events-none"
          />
          <span className="font-extrabold text-sm tracking-wide text-foreground uppercase hidden sm:inline">
            MAVERLANG <span className="text-[#1890FF]">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/50 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Compartir"}
          </button>
        </div>
      </header>

      {/* Shared chat label */}
      <div className="flex items-center justify-center py-2 bg-muted/30 border-b border-border/20">
        <p className="text-[11px] text-muted-foreground font-medium">
          Conversación compartida · {new Date(chat.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
          
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] md:max-w-[75%]">
              <div className="bg-secondary dark:bg-secondary text-[15px] rounded-3xl px-5 py-3.5">
                <p className="whitespace-pre-wrap">{chat.question}</p>
              </div>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-3 items-start max-w-full">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1890FF] to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className={cn(
                "prose prose-sm md:prose-base dark:prose-invert",
                "prose-p:leading-relaxed prose-p:my-2",
                "prose-headings:font-bold prose-headings:tracking-tight",
                "prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900/80 prose-pre:rounded-xl prose-pre:border prose-pre:border-border/30",
                "prose-code:text-[13px] prose-code:font-mono",
                "prose-table:text-sm",
                "prose-li:my-0.5",
                "prose-a:text-[#1890FF] prose-a:no-underline hover:prose-a:underline",
                "text-foreground max-w-none"
              )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{chat.answer}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Bar — replaces the input bar */}
      <div className="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
          <button
            onClick={handleStartOwnConversation}
            disabled={isCheckingAuth}
            className={cn(
              "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm",
              "bg-gradient-to-r from-[#1890FF] to-indigo-600 hover:from-[#1890FF]/90 hover:to-indigo-600/90 text-white",
              isCheckingAuth && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCheckingAuth ? (
              <span className="animate-pulse">Cargando...</span>
            ) : isLoggedIn ? (
              <>
                <MessageSquarePlus className="w-4.5 h-4.5" />
                Iniciar conversación propia
              </>
            ) : (
              <>
                <LogIn className="w-4.5 h-4.5" />
                Registrarse para conversar
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-muted-foreground mt-2.5 font-medium">
            Maverlang AI · Inteligencia Artificial Financiera
          </p>
        </div>
      </div>
    </div>
  );
}
