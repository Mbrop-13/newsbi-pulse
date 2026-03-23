"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Send,
  Twitter,
  Mail,
  Link2,
  Headphones,
} from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  isAudio?: boolean;
}

export function ShareDialog({ isOpen, onClose, title, summary, url, imageUrl, isAudio }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${url}`
    : url;

  const shareText = `${title}${summary ? `\n\n${summary.slice(0, 120)}...` : ""}\n\n📰 Lee más en ProgramBI`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary || "", url: fullUrl });
      } catch { }
    }
  };

  const channels = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
      shadow: "shadow-green-500/20",
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`, "_blank"),
    },
    {
      name: "Telegram",
      icon: <Send className="w-5 h-5" />,
      color: "from-blue-400 to-blue-500",
      shadow: "shadow-blue-400/20",
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, "_blank"),
    },
    {
      name: "X / Twitter",
      icon: <Twitter className="w-5 h-5" />,
      color: "from-gray-700 to-gray-900",
      shadow: "shadow-gray-800/20",
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`, "_blank"),
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5" />,
      color: "from-orange-400 to-red-500",
      shadow: "shadow-orange-500/20",
      action: () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[420px] max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
              {/* Preview card */}
              <div className="p-4 bg-gradient-to-br from-[#1890FF]/5 to-transparent">
                <div className="flex gap-3">
                  {imageUrl && (
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-foreground/5 shrink-0">
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {isAudio && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#1890FF]/10 text-[#1890FF] text-[9px] font-bold flex items-center gap-0.5">
                          <Headphones className="w-2.5 h-2.5" /> AUDIO
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/50 font-medium">programbi.cl</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{title}</p>
                    {summary && <p className="text-[10px] text-muted-foreground/60 line-clamp-1 mt-0.5">{summary}</p>}
                  </div>
                </div>
              </div>

              {/* Share channels */}
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-3">Compartir en</p>
                <div className="grid grid-cols-4 gap-2">
                  {channels.map((ch) => (
                    <button
                      key={ch.name}
                      onClick={ch.action}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-foreground/[0.04] transition-all group"
                    >
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${ch.color} ${ch.shadow} shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 group-active:scale-95`}>
                        {ch.icon}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground/60">{ch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Copy link */}
              <div className="px-4 pb-4">
                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-foreground/[0.05] flex items-center justify-center shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4 text-muted-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-medium text-foreground/60 truncate">{fullUrl}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#1890FF] shrink-0">
                    {copied ? "¡Copiado!" : "Copiar"}
                  </span>
                </button>
              </div>

              {/* Native share (mobile) */}
              {"share" in (typeof navigator !== "undefined" ? navigator : {}) && (
                <div className="px-4 pb-4 -mt-1">
                  <button
                    onClick={nativeShare}
                    className="w-full py-2.5 rounded-2xl bg-[#1890FF]/10 text-[#1890FF] text-xs font-bold hover:bg-[#1890FF]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Más opciones
                  </button>
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
