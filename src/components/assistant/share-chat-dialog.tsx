"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Share2,
  Link as LinkIcon,
  Loader2,
  Check,
  ExternalLink,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/stores/ai-chat-store";

export type ShareMode = "qa" | "full";

interface ShareChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Highlighted Q&A (used for "solo esta respuesta") */
  question: string;
  answer: string;
  /** Full conversation snapshot for "todo el chat" */
  messages?: ChatMessage[];
  /** Default mode when dialog opens */
  defaultMode?: ShareMode;
}

function truncate(text: string, max: number) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

export function ShareChatDialog({
  isOpen,
  onClose,
  question,
  answer,
  messages = [],
  defaultMode = "qa",
}: ShareChatDialogProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<ShareMode>(defaultMode);

  const canShareFull =
    messages.filter((m) => m.role === "user" || m.role === "assistant").length >= 1;
  const userCount = messages.filter((m) => m.role === "user").length;
  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const totalMessages = userCount + assistantCount;

  const effectiveMode: ShareMode =
    mode === "full" && !canShareFull ? "qa" : mode;

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

  useEffect(() => {
    if (!isOpen) return;
    setShareUrl(null);
    setCopiedLink(false);
    setCopiedText(false);
    setIsGeneratingLink(false);
    setMode(defaultMode === "full" && canShareFull ? "full" : "qa");
  }, [isOpen, question, answer, defaultMode, canShareFull]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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

  const buildCopyText = () => {
    if (effectiveMode === "full" && canShareFull) {
      const body = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(
          (m) =>
            `${m.role === "user" ? "Tú" : "Maverlang AI"}:\n${m.content}`
        )
        .join("\n\n———\n\n");
      return `${body}\n\n— Generado por Maverlang · maverlang.cl`;
    }
    return (
      `Pregunta:\n${question}\n\n` +
      `Maverlang AI:\n${answer}\n\n` +
      `— Generado por Maverlang · maverlang.cl`
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
                ) +
                (messages.find((m) => m.role === "user")?.content &&
                messages.find((m) => m.role === "user")!.content.length > 80
                  ? "..."
                  : ""),
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
    let url = shareUrl;
    if (!url) {
      await handleGenerateLink();
      // handleGenerateLink sets state async; re-read after a tick is unreliable.
      // If user already had no url, they can press native share again after link appears.
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title:
            effectiveMode === "full"
              ? "Conversación en Maverlang AI"
              : "Respuesta de Maverlang AI",
          text: truncate(previewQa.question, 120),
          url,
        });
      } catch {
        // cancelled
      }
    }
  };

  if (!isOpen) return null;

  const summaryTitle =
    effectiveMode === "full"
      ? "Chat completo"
      : "Esta respuesta";

  const summaryMeta =
    effectiveMode === "full"
      ? `${totalMessages} mensaje${totalMessages === 1 ? "" : "s"} · solo lectura`
      : "Pregunta y respuesta · solo lectura";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-chat-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", damping: 30, stiffness: 360 }}
          className={cn(
            "relative w-full sm:max-w-md",
            "bg-white dark:bg-zinc-950",
            "rounded-t-3xl sm:rounded-3xl",
            "shadow-2xl border border-black/5 dark:border-white/10",
            "overflow-hidden flex flex-col max-h-[min(92vh,640px)]"
          )}
        >
          {/* Grab handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-0.5">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 sm:pt-5 pb-3 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h3
                id="share-chat-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight"
              >
                Compartir
              </h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Genera un enlace público de solo lectura
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5">
              <button
                type="button"
                onClick={() => handleModeChange("qa")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[12px] font-semibold transition-all cursor-pointer",
                  effectiveMode === "qa"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
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
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                  effectiveMode === "full"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                <MessagesSquare className="w-3.5 h-3.5" />
                Todo el chat
              </button>
            </div>

            {/* Compact summary — not an OG/image mock */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#1890FF]/12 text-[#1890FF] flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {summaryTitle}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {summaryMeta}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Público
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    {effectiveMode === "full" ? "Inicio de la conversación" : "Pregunta"}
                  </p>
                  <p className="text-[13px] leading-snug text-zinc-800 dark:text-zinc-200">
                    {truncate(previewQa.question, 140) || "—"}
                  </p>
                </div>
                {previewQa.answer?.trim() && (
                  <div className="pt-2 border-t border-zinc-200/70 dark:border-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                      {effectiveMode === "full" ? "Primera respuesta" : "Respuesta"}
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-3">
                      {truncate(previewQa.answer.replace(/[#*`>_\[\]()]/g, ""), 220)}
                    </p>
                  </div>
                )}
              </div>

              {effectiveMode === "full" && canShareFull && (
                <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Se incluirán{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {userCount} pregunta{userCount === 1 ? "" : "s"}
                  </span>{" "}
                  y{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {assistantCount} respuesta{assistantCount === 1 ? "" : "s"}
                  </span>
                  .
                </p>
              )}
            </div>

            {/* Generated link */}
            {shareUrl && (
              <div className="rounded-2xl border border-[#1890FF]/25 bg-[#1890FF]/[0.06] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1890FF] mb-2">
                  Enlace listo
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 text-[11px] font-mono bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#1890FF]/25"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    className="shrink-0 h-10 w-10 rounded-xl bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-white/15 transition-colors cursor-pointer"
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
                    className="shrink-0 h-10 w-10 rounded-xl bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-white/15 transition-colors"
                    title="Abrir enlace"
                    aria-label="Abrir enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Primary actions */}
            <div className="space-y-2.5 pt-0.5">
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-semibold text-[13px] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                  copiedLink
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[#1890FF] text-white hover:bg-blue-600 shadow-lg shadow-[#1890FF]/20"
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
                  ? "Generando enlace…"
                  : copiedLink
                    ? "¡Enlace copiado!"
                    : shareUrl
                      ? "Copiar enlace de nuevo"
                      : effectiveMode === "full"
                        ? "Generar enlace del chat"
                        : "Generar y copiar enlace"}
              </button>

              <div
                className={cn(
                  "grid gap-2.5",
                  typeof navigator !== "undefined" &&
                    typeof navigator.share === "function"
                    ? "grid-cols-2"
                    : "grid-cols-1"
                )}
              >
                {typeof navigator !== "undefined" &&
                  typeof navigator.share === "function" && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      disabled={isGeneratingLink}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Otras apps
                    </button>
                  )}

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-all active:scale-[0.99] cursor-pointer"
                >
                  {copiedText ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedText ? "¡Copiado!" : "Copiar texto"}
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
              {effectiveMode === "full"
                ? "Cualquiera con el enlace podrá leer la conversación completa (solo lectura)."
                : "Cualquiera con el enlace podrá ver esta pregunta y respuesta."}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
