"use client";

import { use, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { ChatLanding } from "@/components/chat/chat-landing";
import { ChatMessages } from "@/components/chat/chat-messages";
import { AuthModals } from "@/components/auth-modals";
import { Bot, Sparkles, ArrowRight, Loader2, Home } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatPage(props: PageProps) {
  const params = use(props.params);
  const chatId = params.id;

  const { user, isAuthenticated, isLoaded: isAuthLoaded } = useAuthStore();
  const [chatData, setChatData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: "login" | "register" }>({
    isOpen: false,
    view: "login"
  });

  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({});

  const toggleReasoning = (id: string) => {
    setOpenReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAuthRequest = (view: "login" | "register") => {
    setAuthModal({ isOpen: true, view });
  };

  useEffect(() => {
    async function fetchChat() {
      try {
        const res = await fetch(`/api/chat/${chatId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Chat no encontrado");
          } else {
            setError("Error al cargar el chat");
          }
          return;
        }
        const data = await res.json();
        if (data.success && data.chat) {
          setChatData(data.chat);
        } else {
          setError("Error al cargar el chat");
        }
      } catch (err) {
        console.error("[Chat Page] Error fetching chat:", err);
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    }

    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  const isOwner = isAuthenticated && user && chatData && user.id === chatData.user_id;

  // Load chat into store if current user is owner
  useEffect(() => {
    if (isOwner && chatData) {
      const activeChatId = useAIChatStore.getState().currentChatId;
      if (activeChatId !== chatData.chat_id) {
        useAIChatStore.setState({
          currentChatId: chatData.chat_id,
          messages: chatData.messages,
          attachedArticles: chatData.attached_articles || [],
          attachedFiles: chatData.attached_files || [],
        });
      }
    }
  }, [isOwner, chatData]);

  if (loading || !isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F1117]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#1890FF] animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0F1117] p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">El chat que buscas no está disponible o no existe.</p>
        <Link href="/ai">
          <button className="bg-[#1890FF] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-600 transition-all">
            Ir al Chat Principal
          </button>
        </Link>
      </div>
    );
  }

  if (isOwner) {
    return (
      <>
        <AuthModals 
          isOpen={authModal.isOpen} 
          onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
          defaultView={authModal.view} 
        />
        <ChatLanding />
      </>
    );
  }

  // Render Premium Read-Only Shared Chat Page
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1117] flex flex-col relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1890FF]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AuthModals 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        defaultView={authModal.view} 
      />

      {/* Top Header */}
      <header className="sticky top-0 z-20 w-full border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/assets/maverlang-logo-small.png" 
            alt="Maverlang Logo" 
            className="h-8 w-auto object-contain"
          />
          <span className="font-extrabold text-sm tracking-wide text-gray-900 dark:text-white uppercase">
            MAVERLANG <span className="text-[#1890FF]">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/ai">
              <button className="flex items-center gap-1.5 py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all">
                <Home className="w-3.5 h-3.5" />
                Ir al Chat Principal
              </button>
            </Link>
          ) : (
            <>
              <button 
                onClick={() => handleAuthRequest("login")}
                className="py-2 px-4 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs font-bold transition-all"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => handleAuthRequest("register")}
                className="py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-all shadow-md"
              >
                Comenzar Gratis
              </button>
            </>
          )}
        </div>
      </header>

      {/* Shared Chat Messages */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative min-h-0">
        <ChatMessages
          messages={chatData.messages}
          isLoading={false}
          onFeedback={() => {}}
          onShare={() => {}}
          openReasoning={openReasoning}
          onToggleReasoning={toggleReasoning}
        />

        {/* Conversion CTA Block */}
        <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0F1117] dark:via-[#0F1117]/95 pt-8 pb-10 px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-blue-500/20 dark:border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1890FF]/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                  ¿Quieres realizar tus propias consultas?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">
                  Accede a la Inteligencia Artificial financiera más avanzada del mercado, datos de portafolio en tiempo real y análisis profundo.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleAuthRequest("register")}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                >
                  Probar Maverlang AI Gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
