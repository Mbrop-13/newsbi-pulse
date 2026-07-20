"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Download,
  Share2,
  Link as LinkIcon,
  Loader2,
  Check,
  ExternalLink,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/stores/ai-chat-store";

export type ShareMode = "qa" | "full";

interface ShareChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Highlighted Q&A (used for "solo esta respuesta" and preview card) */
  question: string;
  answer: string;
  /** Full conversation snapshot for "todo el chat" */
  messages?: ChatMessage[];
  /** Default mode when dialog opens */
  defaultMode?: ShareMode;
}

export function ShareChatDialog({
  isOpen,
  onClose,
  question,
  answer,
  messages = [],
  defaultMode = "qa",
}: ShareChatDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<ShareMode>(defaultMode);

  const canShareFull = messages.filter((m) => m.role === "user" || m.role === "assistant").length >= 1;
  const userCount = messages.filter((m) => m.role === "user").length;
  const assistantCount = messages.filter((m) => m.role === "assistant").length;

  const effectiveMode: ShareMode =
    mode === "full" && !canShareFull ? "qa" : mode;

  // Preview Q&A for the card / metadata
  const previewQa = useMemo(() => {
    if (effectiveMode === "full" && canShareFull) {
      const firstUser = messages.find((m) => m.role === "user");
      const firstAssistant = messages.find((m) => m.role === "assistant");
      return {
        question: firstUser?.content || question || "Conversación compartida",
        answer: firstAssistant?.content || answer || "",
      };
    }
    return { question, answer };
  }, [effectiveMode, canShareFull, messages, question, answer]);

  // Reset when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setShareUrl(null);
    setCopiedLink(false);
    setCopiedText(false);
    setIsGenerating(false);
    setIsGeneratingLink(false);
    setMode(defaultMode === "full" && canShareFull ? "full" : "qa");
  }, [isOpen, question, answer, defaultMode, canShareFull]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Changing mode invalidates previous link (different payload)
  const handleModeChange = (next: ShareMode) => {
    if (next === mode) return;
    if (next === "full" && !canShareFull) {
      toast.error("No hay mensajes suficientes para compartir el chat completo");
      return;
    }
    setMode(next);
    setShareUrl(null);
    setCopiedLink(false);
  };

  const previewAnswer =
    previewQa.answer.length > 600
      ? previewQa.answer.substring(0, 600) + "..."
      : previewQa.answer;
  const previewQuestion =
    previewQa.question.length > 120
      ? previewQa.question.substring(0, 120) + "..."
      : previewQa.question;

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#080B11",
        cacheBust: true,
      });
      return dataUrl;
    } catch (err) {
      console.error("Error generating image", err);
      toast.error("No se pudo generar la imagen");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `Maverlang-chat-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Imagen descargada");
  };

  const buildCopyText = () => {
    if (effectiveMode === "full" && canShareFull) {
      const body = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(
          (m) =>
            `${m.role === "user" ? "💡 Tú" : "🤖 Maverlang AI"}:\n${m.content}`
        )
        .join("\n\n———\n\n");
      return `${body}\n\n✨ Generado por Maverlang — maverlang.cl`;
    }
    return (
      `💡 Pregunta:\n${question}\n\n` +
      `🤖 Maverlang AI:\n${answer}\n\n` +
      `✨ Generado por Maverlang — maverlang.cl`
    );
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopiedText(true);
      toast.success("Texto copiado al portapapeles");
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast.error("No se pudo copiar el texto");
    }
  };

  const handleGenerateLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        toast.success("Enlace copiado");
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        toast.error("No se pudo copiar el enlace");
      }
      return;
    }

    if (effectiveMode === "qa") {
      if (!question.trim() || !answer.trim()) {
        toast.error("No hay contenido suficiente para compartir");
        return;
      }
    } else if (!canShareFull) {
      toast.error("No hay mensajes para compartir");
      return;
    }

    setIsGeneratingLink(true);
    try {
      const payload =
        effectiveMode === "full"
          ? {
              mode: "full" as const,
              title:
                (messages.find((m) => m.role === "user")?.content || "Chat").slice(
                  0,
                  80
                ) + (messages.find((m) => m.role === "user")?.content && messages.find((m) => m.role === "user")!.content.length > 80 ? "..." : ""),
              messages: messages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .slice(0, 80)
                .map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: (m.content || "").slice(0, 50000),
                  timestamp:
                    m.timestamp instanceof Date
                      ? m.timestamp.toISOString()
                      : m.timestamp
                        ? String(m.timestamp)
                        : undefined,
                  citations: m.citations?.slice(0, 20),
                })),
              question: previewQa.question.slice(0, 2000),
              answer: (previewQa.answer || " ").slice(0, 20000),
            }
          : {
              mode: "qa" as const,
              question: question.slice(0, 2000),
              answer: answer.slice(0, 20000),
            };

      // Ensure answer is non-empty for full mode (API may still use it as preview)
      if (payload.mode === "full" && !payload.answer.trim()) {
        payload.answer = "Conversación compartida en Maverlang AI.";
      }

      const res = await fetch("/api/share-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast.error("Inicia sesión para generar un enlace público");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo generar el enlace");
      }

      const { id } = await res.json();
      if (!id) throw new Error("Respuesta inválida del servidor");

      const url = `${window.location.origin}/share/chat/${id}`;
      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        toast.success(
          effectiveMode === "full"
            ? "Enlace del chat completo copiado"
            : "Enlace público copiado"
        );
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        toast.message("Enlace generado", {
          description: "Cópialo desde el campo de abajo",
        });
      }
    } catch (err: any) {
      console.error("[Share Chat Dialog] Error:", err);
      toast.error(err?.message || "Error al generar el enlace");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleNativeShare = async () => {
    const url = shareUrl;
    if (!url) {
      await handleGenerateLink();
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title:
            effectiveMode === "full"
              ? "Conversación en Maverlang AI"
              : "Respuesta de Maverlang AI",
          text: previewQa.question.slice(0, 120),
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      await handleGenerateLink();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-chat-title"
      >
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
            <h3
              id="share-chat-title"
              className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <Share2 className="w-5 h-5 text-[#1890FF]" />
              Compartir
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 bg-gray-50 dark:bg-[#0a0a0a]">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-2xl bg-gray-200/70 dark:bg-white/5 border border-border/40">
              <button
                type="button"
                onClick={() => handleModeChange("qa")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  effectiveMode === "qa"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Esta respuesta
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("full")}
                disabled={!canShareFull}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                  effectiveMode === "full"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessagesSquare className="w-3.5 h-3.5" />
                Todo el chat
              </button>
            </div>

            {effectiveMode === "full" && canShareFull && (
              <p className="mb-4 text-[11px] text-muted-foreground text-center leading-relaxed">
                Se compartirán{" "}
                <span className="font-semibold text-foreground">
                  {userCount} pregunta{userCount === 1 ? "" : "s"}
                </span>{" "}
                y{" "}
                <span className="font-semibold text-foreground">
                  {assistantCount} respuesta{assistantCount === 1 ? "" : "s"}
                </span>{" "}
                en un enlace público de solo lectura.
              </p>
            )}

            {/* Preview card */}
            <div className="flex justify-center mb-6">
              <div
                ref={cardRef}
                className="w-full max-w-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/30 p-[1px] shadow-2xl relative"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <div className="bg-[#080B11] w-full h-full rounded-[23px] p-6 relative overflow-hidden flex flex-col min-h-[340px]">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#1890FF]/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/12 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/Logo 2-Blanco.png"
                        alt="Maverlang"
                        className="h-8 w-auto object-contain"
                      />
                      <span className="text-sm font-black tracking-wider text-slate-100 italic">
                        MAVERLANG
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                      {effectiveMode === "full" ? "Chat completo" : "Copiloto IA"}
                    </div>
                  </div>

                  <div className="mb-4 relative z-10">
                    <p className="text-xs font-semibold text-slate-100 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3.5 py-2.5 w-fit max-w-[95%] shadow-sm leading-normal">
                      💡 {previewQuestion}
                    </p>
                  </div>

                  <div className="relative z-10 w-full text-slate-300 text-[11.5px] leading-relaxed max-h-[170px] overflow-hidden select-none">
                    <div className="prose prose-invert prose-p:leading-relaxed prose-xs max-w-none">
                      <ReactMarkdown>{previewAnswer || "…"}</ReactMarkdown>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#080B11] via-[#080B11]/70 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-auto relative z-10 border-t border-white/[0.05]">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      {effectiveMode === "full"
                        ? `${userCount + assistantCount} mensajes`
                        : "Respuesta de IA"}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest text-[#1890FF] uppercase">
                      maverlang.cl
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated public link */}
            {shareUrl && (
              <div className="mb-4 rounded-2xl border border-[#1890FF]/20 bg-[#1890FF]/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1890FF] mb-1.5">
                  Enlace público
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 text-[11px] font-mono bg-white dark:bg-black/40 border border-border/50 rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    className="shrink-0 h-9 w-9 rounded-xl bg-white dark:bg-white/10 border border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    title="Copiar enlace"
                    aria-label="Copiar enlace"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 h-9 w-9 rounded-xl bg-white dark:bg-white/10 border border-border/50 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/15 transition-colors"
                    title="Abrir enlace"
                    aria-label="Abrir enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className={cn(
                  "col-span-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                  copiedLink
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-[#1890FF] text-white hover:bg-blue-600 shadow-[#1890FF]/20"
                )}
              >
                {isGeneratingLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                {isGeneratingLink
                  ? "Generando enlace..."
                  : copiedLink
                    ? "¡Enlace copiado!"
                    : shareUrl
                      ? "Copiar enlace de nuevo"
                      : effectiveMode === "full"
                        ? "Generar enlace del chat"
                        : "Generar y copiar enlace"}
              </button>

              {typeof navigator !== "undefined" &&
                typeof navigator.share === "function" && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isGeneratingLink}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 dark:bg-white/10 text-white rounded-2xl font-bold text-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir con otra app
                  </button>
                )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {isGenerating ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Descargar imagen
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-bold text-xs hover:bg-gray-300 dark:hover:bg-white/15 transition-all active:scale-[0.98] cursor-pointer"
              >
                {copiedText ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedText ? "¡Copiado!" : "Copiar texto"}
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] text-muted-foreground leading-relaxed">
              {effectiveMode === "full"
                ? "Cualquiera con el enlace podrá leer toda la conversación (solo lectura)."
                : "El enlace es público: cualquiera con el link podrá ver esta pregunta y respuesta."}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
