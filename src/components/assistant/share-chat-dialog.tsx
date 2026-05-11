"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Download, Share2, Sparkles, Link as LinkIcon, Loader2, MessageSquare } from "lucide-react";
import * as htmlToImage from "html-to-image";
import ReactMarkdown from "react-markdown";

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
        backgroundColor: "#0B0F1A",
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
      link.download = `reclu-chat-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleCopyText = () => {
    const textToShare = `💡 Pregunta:\n${question}\n\n🤖 Reclu AI:\n${cleanAnswer}\n\n✨ Generado por Reclu — reclu.cl`;
    navigator.clipboard.writeText(textToShare);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
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
    } catch (err) {
      console.error(err);
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
            {/* ─── PREMIUM CARD ─── */}
            <div className="flex justify-center mb-6">
              <div 
                ref={cardRef} 
                className="w-full max-w-[420px] rounded-[20px] overflow-hidden shadow-2xl relative"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {/* Dark premium background */}
                <div className="bg-[#0B0F1A] w-full relative overflow-hidden">
                  
                  {/* Ambient glow effects */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[120px] bg-[#1890FF]/15 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-[200px] h-[100px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

                  {/* ── Top: Logo centered ── */}
                  <div className="flex items-center justify-center pt-6 pb-4 relative z-10">
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/freepik__background__94196.png?v=1771922713" 
                      alt="Reclu" 
                      className="h-10 w-auto object-contain drop-shadow-lg"
                    />
                  </div>

                  {/* Thin separator line */}
                  <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* ── Question bubble ── */}
                  <div className="px-5 pt-4 pb-3 relative z-10">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-white/60" />
                      </div>
                      <p className="text-[13px] font-semibold text-white/90 leading-snug">
                        {question.length > 120 ? question.substring(0, 120) + "..." : question}
                      </p>
                    </div>
                  </div>

                  {/* ── Answer area ── */}
                  <div className="px-5 pb-2 relative z-10">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden">
                      {/* Small AI badge */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#1890FF] to-indigo-500 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1890FF]/80">Reclu AI</span>
                      </div>

                      {/* Content with clean fade */}
                      <div className="relative max-h-[180px] overflow-hidden">
                        <div className="prose prose-sm prose-invert prose-p:my-1 prose-p:leading-relaxed prose-p:text-[13px] prose-headings:text-white prose-strong:text-white/90 max-w-none text-white/70">
                          <ReactMarkdown>
                            {cleanAnswer}
                          </ReactMarkdown>
                        </div>
                        {/* Clean fade to card background */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B1018] via-[#0B1018]/80 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ── Footer watermark ── */}
                  <div className="flex items-center justify-center gap-2 py-4 relative z-10">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[10px] font-medium tracking-wider text-white/25 uppercase">reclu.cl</span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
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
