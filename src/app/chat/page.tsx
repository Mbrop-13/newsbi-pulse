"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Bot, Loader2, ExternalLink, Trash2, History, ChevronRight, Paperclip, HelpCircle, FileText, X } from "lucide-react";
import { useAIChatStore, ChatMessage, AttachedArticle } from "@/lib/stores/ai-chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";

export default function MobileChatPage() {
  const router = useRouter();
  const {
    messages, addMessage, isLoading, setLoading, clearMessages,
    attachedArticles, removeArticle, savedChats, loadChat, deleteSavedChat,
    attachedFiles, attachFile, removeFile
  } = useAIChatStore();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));

  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const questionLimit = userTier === "free" ? 3 : userTier === "pro" ? 40 : userTier === "max" ? 100 : 999999;
  const reachedQuestionLimit = userMessagesCount >= questionLimit;
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  // Auto-scroll to bottom
  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showHistory]);

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
          content: content.slice(0, 15000),
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-slate-950 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Bot className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Asistente</h2>
              <p className="text-[10px] text-green-500 font-medium">En línea</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {userTier !== "free" && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                showHistory ? "bg-blue-500/10 text-blue-500" : "text-gray-500 hover:bg-blue-500/10 hover:text-blue-500"
              }`}
            >
              <History className="w-4 h-4" />
            </button>
          )}
          {messages.length > 0 && !showHistory && (
            <button
              onClick={clearMessages}
              className="w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Usage Banner */}
      {(userTier === "free" || userTier === "pro" || (userTier === "max" && userMessagesCount >= 85)) && (
        <div className="bg-blue-500/5 border-b border-blue-500/10 px-4 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Consultas: {userMessagesCount}/{questionLimit}</span>
          <div className="relative group cursor-help flex items-center justify-center">
            <HelpCircle className="w-3 h-3 text-blue-500" />
          </div>
        </div>
      )}

      {/* Chat Area */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Historial Premium</h3>
            <span className="text-[10px] text-gray-500">{savedChats.length}/10 chats</span>
          </div>
          
          {savedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
              <History className="w-8 h-8 mb-3 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">No hay chats guardados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedChats.map((chat) => (
                <div
                  key={chat.id}
                  className="group flex flex-col gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  onClick={() => {
                    loadChat(chat.id);
                    setShowHistory(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 flex-1">{chat.title}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedChat(chat.id);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a]">
          {attachedArticles.length > 0 && messages.length === 0 && (
            <div className="space-y-2 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 px-1">Contexto</p>
              {attachedArticles.map((art) => (
                <ArticleContextCard key={art.id} article={art} onRemove={removeArticle} />
              ))}
            </div>
          )}

          {messages.length === 0 && !isLoading && attachedArticles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">¿En qué te puedo ayudar?</h3>
              <p className="text-xs text-gray-500 max-w-[220px]">
                Pregúntame sobre portafolios, noticias o análisis financiero.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[280px]">
                {[
                  "Análisis de AAPL",
                  "Noticias de hoy",
                  "Resumen mercado",
                  "Inflación EEUU",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-medium hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left text-gray-700 dark:text-gray-300 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#1890FF] text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-bl-sm text-gray-800 dark:text-gray-200"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[14px] leading-relaxed font-medium">{msg.content}</p>
                )}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Fuentes</p>
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
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-[13px] text-gray-500 font-medium">Escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      )}

      {/* Input Area */}
      {!showHistory && (
        <div className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-white/5 pb-safe">
          {(attachedArticles.length > 0 || attachedFiles.length > 0) && messages.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {attachedArticles.map((art) => (
                  <div key={art.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 shrink-0 max-w-[150px]">
                    <span className="text-[10px] font-medium truncate text-gray-700 dark:text-gray-300">{art.title}</span>
                    <button onClick={() => removeArticle(art.id)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts,.js,.tsx,.jsx,.html" />
            <div className={`flex items-end gap-2 bg-gray-100 dark:bg-slate-900 rounded-2xl p-2 transition-all ${
              reachedQuestionLimit ? "opacity-70" : "focus-within:ring-2 focus-within:ring-blue-500/20"
            }`}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || reachedQuestionLimit || attachedFiles.length >= MAX_FILES}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={reachedQuestionLimit ? `Límite alcanzado` : "Mensaje..."}
                className="flex-1 bg-transparent text-sm py-3 px-1 outline-none placeholder:text-gray-400 resize-none max-h-[100px] disabled:cursor-not-allowed text-gray-900 dark:text-white"
                rows={1}
                disabled={isLoading || reachedQuestionLimit}
                style={{ minHeight: "44px" }}
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || reachedQuestionLimit}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  input.trim() && !isLoading && !reachedQuestionLimit
                    ? "bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/30 active:scale-95"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-400"
                }`}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleContextCard({ article, onRemove }: { article: AttachedArticle; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-sm">
      {article.image_url && (
        <img src={article.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {article.category && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">{article.category}</span>
            )}
            <p className="text-xs font-semibold leading-tight line-clamp-2 mt-0.5 text-gray-800 dark:text-gray-200">{article.title}</p>
          </div>
          <button onClick={() => onRemove(article.id)} className="text-gray-400 hover:text-red-500 mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
