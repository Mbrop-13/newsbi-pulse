"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Link2, MessageCircle, Send, Twitter, Mail, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * Hero del programa de referidos: banner gradiente azul + caja de enlace
 * (copiar) + tiles sociales (WhatsApp/Telegram/X/Email). Reutiliza los
 * patrones de share-dialog.tsx y el banner de /profile.
 */
export function ReferralHero({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${code}`
      : `https://maverlang.cl/?ref=${code}`;

  const shareText =
    "¡Únete a Maverlang! La IA que analiza mercados y noticias, y construye apps por ti. Usa mi enlace y obtenéis días gratis:";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("¡Enlace copiado! Compártelo con tus amigos.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const channels = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
      shadow: "shadow-green-500/30",
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`,
          "_blank"
        ),
    },
    {
      name: "Telegram",
      icon: <Send className="w-5 h-5" />,
      color: "from-blue-400 to-blue-500",
      shadow: "shadow-blue-400/30",
      action: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank"
        ),
    },
    {
      name: "X / Twitter",
      icon: <Twitter className="w-5 h-5" />,
      color: "from-gray-700 to-gray-900",
      shadow: "shadow-gray-800/30",
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
          "_blank"
        ),
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5" />,
      color: "from-orange-400 to-red-500",
      shadow: "shadow-orange-500/30",
      action: () =>
        window.open(
          `mailto:?subject=${encodeURIComponent("Te invito a Maverlang")}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`
        ),
    },
  ];

  const gridBg = {
    backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
    backgroundSize: "32px 32px",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full"
    >
      <div className="relative rounded-[32px] bg-gradient-to-br from-[#0052CC] via-[#0066FF] to-[#22D3EE] p-[1px] shadow-2xl shadow-blue-500/20 overflow-hidden">
        <div className="rounded-[31px] overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.08]" style={gridBg} />
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-cyan-300/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 p-6 md:p-10 text-white">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-bold uppercase tracking-widest mb-4">
              <Gift className="w-3.5 h-3.5" />
              Programa de referidos
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-2">
              Invita y gana días gratis
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-md leading-relaxed mb-6">
              Comparte tu enlace. Cuando un amigo se suscriba, ganáis días de plan y desbloqueas recompensas por niveles.
            </p>

            {/* Link box */}
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-all group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {copied ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Link2 className="w-4 h-4 text-white/80" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white/70 truncate">{fullUrl}</p>
              </div>
              <span className="text-[11px] font-bold text-white shrink-0 px-3 py-1.5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                {copied ? "¡Copiado!" : "Copiar"}
              </span>
            </button>

            {/* Social tiles */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {channels.map((ch) => (
                <button
                  key={ch.name}
                  onClick={ch.action}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${ch.color} ${ch.shadow} shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 group-active:scale-95`}
                  >
                    {ch.icon}
                  </div>
                  <span className="text-[10px] font-medium text-white/70">{ch.name}</span>
                </button>
              ))}
            </div>

            {/* Sparkles accent */}
            <div className="hidden md:flex items-center gap-1.5 mt-5 text-white/60 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Recompensas escalan: 1, 3, 5, 10 y 25 referidos
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
