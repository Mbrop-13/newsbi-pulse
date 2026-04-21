"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles, Loader2, ExternalLink, Trash2, Newspaper, History, ChevronRight, Paperclip, HelpCircle, FileText } from "lucide-react";
import { useAIChatStore, ChatMessage, AttachedArticle } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";

export function AIChatSidebar() {
  const {
    isOpen, close, messages, addMessage, isLoading, setLoading, clearMessages,
    attachedArticles, attachArticle, removeArticle, savedChats, loadChat, deleteSavedChat,
    attachedFiles, attachFile, removeFile
  } = useAIChatStore();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));

  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const questionLimit = userTier === "free" ? 3 : userTier === "pro" ? 40 : userTier === "max" ? 100 : 999999;
  const reachedQuestionLimit = userMessagesCount >= questionLimit;
  const MAX_AI_ARTICLES = userTier === "free" ? 1 : userTier === "pro" ? 5 : 10;
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  // Auto-scroll to bottom
  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showHistory]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !showHistory) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, showHistory]);

  // Auto-attach article when opening on an article page
  useEffect(() => {
    if (!isOpen) return;
    const match = pathname.match(/^\/article\/(.+)$/);
    if (!match) return;

    const articleId = decodeURIComponent(match[1]);
    // Check if already attached
    if (attachedArticles.find((a) => a.id === articleId || a.slug === articleId)) return;
    
    // Check limits
    if (attachedArticles.length >= MAX_AI_ARTICLES) return;

    // Fetch article data
    (async () => {
      const isUUID = /^[0-9a-f]{8}-/.test(articleId);
      let query = supabase.from("news_articles").select("id, title, summary, category, image_url, slug");
      if (isUUID) query = query.eq("id", articleId);
      else query = query.eq("slug", articleId);

      const { data } = await query.single();
      if (data) {
        attachArticle({
          id: data.id,
          title: data.title,
          summary: data.summary || "",
          category: data.category || "",
          image_url: data.image_url || "",
          slug: data.slug || "",
        });
      }
    })();
  }, [isOpen, pathname]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedFiles.length >= MAX_FILES) {
      alert(`Has alcanzado el límite de ${MAX_FILES} archivos para tu plan.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        attachFile({
          id: Date.now().toString(),
          name: file.name,
          content: content.slice(0, 15000), // Max chars to protect token limit
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || reachedQuestionLimit) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          articles: attachedArticles,
          files: attachedFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de IA");

      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        citations: data.citations,
      });
    } catch (err: any) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${err.message}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={sidebarRef}
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 32, stiffness: 350 }}
          className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] z-[70] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-white/5 shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">R-ai</h2>
                  <p className="text-[10px] text-muted-foreground/60">Búsqueda en tiempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {userTier !== "free" && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                      showHistory ? "bg-purple-500/10 text-purple-500" : "text-muted-foreground/40 hover:bg-purple-500/10 hover:text-purple-500"
                    }`}
                    title="Historial de chats"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
                {messages.length > 0 && !showHistory && (
                  <button
                    onClick={clearMessages}
                    className="w-7 h-7 rounded-xl hover:bg-red-500/10 flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-red-500"
                    title="Nuevo chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={close}
                  className="w-7 h-7 rounded-xl hover:bg-red-500/10 flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Usage Banner */}
          {(userTier === "free" || userTier === "pro" || (userTier === "max" && userMessagesCount >= 85)) && (
            <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Uso: {userMessagesCount}/{questionLimit} preguntas</span>
              <div className="relative group cursor-help flex items-center justify-center p-1">
                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                <div className="absolute right-0 top-full mt-2 w-48 p-3 rounded-xl bg-purple-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl shadow-purple-500/20 text-center leading-relaxed font-medium">
                  {userTier === "free" 
                    ? "Haz upgrade a Pro para obtener límite de 40 preguntas."
                    : userTier === "pro"
                    ? "Actualiza a Max para obtener 100 consultas a R-ai y audios."
                    : "Actualiza tu plan a Ultra para romper todos los límites."}
                </div>
              </div>
            </div>
          )}

          {/* Messages or History */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">Historial Premium</h3>
                <span className="text-[10px] text-muted-foreground/50">{savedChats.length}/10 chats</span>
              </div>
              
              {savedChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
                  <History className="w-8 h-8 mb-3 text-muted-foreground/30" />
                  <p className="text-xs font-medium">No hay chats guardados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedChats.map((chat) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={chat.id}
                      className="group flex flex-col gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-purple-500/5 border border-transparent hover:border-purple-500/20 transition-all cursor-pointer"
                      onClick={() => {
                        loadChat(chat.id);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium line-clamp-2 flex-1">{chat.title}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedChat(chat.id);
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(chat.timestamp).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Attached articles shown as cards at the top of the chat */}
              {attachedArticles.length > 0 && messages.length === 0 && (
                <div className="space-y-2 mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                    Contexto de noticias
                  </p>
                  {attachedArticles.map((art) => (
                    <ArticleContextCard key={art.id} article={art} onRemove={removeArticle} />
                  ))}
                </div>
              )}

              {messages.length === 0 && !isLoading && attachedArticles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-purple-500/30" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">¿En qué te puedo ayudar?</h3>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Pregúntame sobre noticias, mercados, predicciones o cualquier tema de actualidad.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[280px]">
                    {[
                      "¿Qué pasó hoy?",
                      "Noticias de IA",
                      "Análisis del mercado",
                      "Tendencias tech",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-[11px] font-medium hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 0 && !isLoading && attachedArticles.length > 0 && (
                <div className="flex flex-col items-center text-center px-6 mt-4">
                  <h3 className="font-semibold text-sm mb-1">Pregunta sobre estas noticias</h3>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    La IA tiene contexto de las noticias adjuntas. Haz cualquier pregunta.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-[#0052CC] to-[#0066FF] text-white rounded-br-lg"
                        : "bg-secondary/50 border border-border rounded-bl-lg"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:my-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
                          Fuentes
                        </p>
                        {msg.citations.slice(0, 3).map((url, i) => {
                          let hostname = url;
                          try { hostname = new URL(url).hostname; } catch {}
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-400 transition-colors truncate"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{hostname}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/50 border border-border rounded-2xl rounded-bl-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                      <span className="text-xs text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Attached Articles Bar and Input */}
          {!showHistory && (
            <>
              {/* Attached Articles & Files Bar */}
              {(attachedArticles.length > 0 || attachedFiles.length > 0) && messages.length > 0 && (
            <div className="px-4 pt-2 border-t border-gray-200/30 dark:border-white/5">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {attachedArticles.map((art) => (
                  <div
                    key={art.id}
                    className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg px-2.5 py-1.5 shrink-0 max-w-[200px] group"
                  >
                    {art.image_url && (
                      <img
                        src={art.image_url}
                        alt=""
                        className="w-6 h-6 rounded object-cover shrink-0"
                      />
                    )}
                    <span className="text-[10px] font-medium truncate">{art.title}</span>
                    <button
                      onClick={() => removeArticle(art.id)}
                      className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-1.5 shrink-0 max-w-[200px] group"
                  >
                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-[10px] font-medium truncate text-purple-600 dark:text-purple-400">{file.name}</span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200/50 dark:border-white/5 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".txt,.md,.csv,.json,.ts,.js,.tsx,.jsx,.html" 
            />
            <div className={`flex items-center gap-2 bg-secondary/30 border border-border rounded-xl px-3 py-1 transition-all ${
              reachedQuestionLimit ? "opacity-70 bg-red-500/5 border-red-500/20" : "focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20"
            }`}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={reachedQuestionLimit ? `Límite de ${questionLimit} preguntas alcanzado` : "Escribe tu pregunta..."}
                className="flex-1 bg-transparent text-sm py-2.5 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed"
                disabled={isLoading || reachedQuestionLimit}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || reachedQuestionLimit || attachedFiles.length >= MAX_FILES}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:bg-purple-500/10 hover:text-purple-500 disabled:opacity-30 transition-colors shrink-0"
                title="Adjuntar archivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || reachedQuestionLimit}
                className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white disabled:opacity-30 transition-opacity shrink-0 hover:shadow-lg hover:shadow-purple-500/20 disabled:hover:shadow-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {reachedQuestionLimit ? (
              <p className="text-[10px] text-red-500/70 mt-2 text-center font-medium">
                Has alcanzado el límite gratuito. Actualiza a Pro para chats ilimitados.
              </p>
            ) : (
              <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
                R-ai puede cometer errores. Considera verificar la información importante.
              </p>
            )}
          </div>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ArticleContextCard({ article, onRemove }: { article: AttachedArticle; onRemove: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 bg-purple-500/5 border border-purple-500/15 rounded-xl p-3 group"
    >
      {article.image_url && (
        <img
          src={article.image_url}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {article.category && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500">
                {article.category}
              </span>
            )}
            <p className="text-xs font-semibold leading-snug line-clamp-2 mt-0.5">{article.title}</p>
          </div>
          <button
            onClick={() => onRemove(article.id)}
            className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
