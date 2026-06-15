"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Download, Share2, Sparkles, Link as LinkIcon, Loader2, MessageSquare } from "lucide-react";
import * as htmlToImage from "html-to-image";
import ReactMarkdown from "react-markdown";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

interface ShareChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  answer: string;
}

export function ShareChatDialog({ isOpen, onClose, question, answer }: ShareChatDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanAnswer = answer.length > 600 ? answer.substring(0, 600) + "..." : answer;

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      return dataUrl;
    } catch (err) {
      console.error("Error generating image", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `Maverlang-chat-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleCopyText = () => {
    const textToShare = `💡 Pregunta:\n${question}\n\n🤖 Maverlang AI:\n${cleanAnswer}\n\n✨ Generado por Maverlang — maverlang.cl`;
    navigator.clipboard.writeText(textToShare);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        alert("Debes iniciar sesión para compartir.");
        return;
      }

      const { currentChatId, messages, attachedArticles, attachedFiles } = useAIChatStore.getState();

      if (currentChatId && messages.length > 0) {
        // Force save/sync the chat to Supabase ai_saved_chats
        const supabase = createClient();
        const title = messages.find(m => m.role === "user")?.content.slice(0, 40) + "..." || "Nuevo chat";

        // Check if it already exists
        const { data: existingChat } = await supabase
          .from("ai_saved_chats")
          .select("chat_id")
          .eq("chat_id", currentChatId)
          .maybeSingle();

        if (!existingChat) {
          const { error } = await supabase.from("ai_saved_chats").insert({
            user_id: user.id,
            chat_id: currentChatId,
            title,
            messages,
            attached_articles: attachedArticles,
            attached_files: attachedFiles
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("ai_saved_chats").update({
            title,
            messages,
            attached_articles: attachedArticles,
            attached_files: attachedFiles
          }).eq("chat_id", currentChatId).eq("user_id", user.id);
          if (error) throw error;
        }

        const firstUserMsg = messages.find(m => m.role === "user")?.content || "";
        const slug = slugify(firstUserMsg.slice(0, 40) || "Nuevo Chat");
        const shareUrl = `${window.location.origin}/ai/chat/${slug ? `${slug}-` : ''}${currentChatId}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } else {
        // Fallback to legacy single Q&A sharing
        const res = await fetch("/api/share-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer }),
        });
        
        if (!res.ok) throw new Error("Failed to generate link");
        
        const { id } = await res.json();
        const shareUrl = `${window.location.origin}/share/chat/${id}`;
        
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      console.error("[Share Chat Dialog] Error:", err);
      alert("Error al generar el enlace.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 24 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#1890FF]" />
              Compartir Respuesta
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 bg-gray-50 dark:bg-[#0a0a0a]">
            {/* ─── CARD TO RENDER ─── */}
            <div className="flex justify-center mb-6">
              <div 
                ref={cardRef} 
                className="w-full max-w-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#1890FF] to-indigo-600 p-[2px] shadow-2xl relative"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <div className="bg-white dark:bg-[#0F1117] w-full h-full rounded-[14px] p-5 relative overflow-hidden flex flex-col">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#1890FF]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

                  {/* Header / Logo — bigger, no text */}
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <img 
                      src="/assets/maverlang-logo-small.png" 
                      alt="Maverlang" 
                      className="h-9 w-auto object-contain"
                    />
                  </div>

                  {/* Question */}
                  <div className="mb-4 relative z-10">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-white/5 rounded-xl px-3 py-2 w-fit max-w-[90%] shadow-sm">
                      {question.length > 100 ? question.substring(0, 100) + "..." : question}
                    </p>
                  </div>

                  {/* Answer Preview */}
                  <div className="relative z-10 w-full prose prose-sm dark:prose-invert prose-p:leading-snug max-h-[180px] overflow-hidden text-gray-600 dark:text-gray-400">
                    <ReactMarkdown>
                      {cleanAnswer}
                    </ReactMarkdown>
                    {/* Seamless fade — matches inner card bg exactly */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--card-bg) 0%, var(--card-bg) 20%, transparent 100%)' }} />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-[#0F1117] via-white/80 dark:via-[#0F1117]/80 to-transparent pointer-events-none" />
                  </div>

                  {/* Footer watermark */}
                  <div className="flex items-center justify-center gap-2 pt-3 mt-2 relative z-10 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-semibold tracking-wider text-gray-300 dark:text-gray-600 uppercase">maverlang.cl</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Action Buttons ─── */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="col-span-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-[#1890FF] text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-[#1890FF]/20 active:scale-[0.98]"
              >
                {isGeneratingLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : copiedLink ? (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                {copiedLink ? "¡Enlace Copiado!" : "Generar y Copiar Enlace"}
              </button>

              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isGenerating ? <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Descargar Imagen
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-bold text-xs hover:bg-gray-300 dark:hover:bg-white/15 transition-all active:scale-[0.98]"
              >
                {copiedText ? <Sparkles className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? "¡Copiado!" : "Copiar Texto"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
