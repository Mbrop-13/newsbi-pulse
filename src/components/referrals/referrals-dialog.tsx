"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Loader2,
  X,
  Share2,
  Trophy,
  UserPlus,
} from "lucide-react";
import { ReferralHero } from "@/components/referrals/referral-hero";
import { MilestoneProgress } from "@/components/referrals/milestone-progress";
import { ReferralStats as ReferralStatsGrid } from "@/components/referrals/referral-stats";
import { ReferralList } from "@/components/referrals/referral-list";
import { REFERRAL_MILESTONES } from "@/lib/referral-config";
import type { ReferralStats } from "@/lib/referrals";
import { useReferralsDialogStore } from "@/lib/stores/referrals-dialog-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export function ReferralsDialog() {
  const isOpen = useReferralsDialogStore((s) => s.isOpen);
  const setOpen = useReferralsDialogStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isOpen || !user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats as ReferralStats);
      }
    } catch {
      // silencioso: la página muestra estado vacío
    } finally {
      setLoading(false);
    }
  }, [isOpen, user]);

  useEffect(() => {
    load();
  }, [load]);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const logoSrc = isDark ? "/assets/Logo 2-Blanco.png" : "/assets/Maverlang Logo-2.png";

  // Prevent scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl overflow-hidden">
        {/* Background radial glow inside popup */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-800/10 via-transparent to-transparent dark:from-zinc-800/20 blur-3xl" />

        {/* Main dialog card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0c0d12] border border-neutral-200/60 dark:border-zinc-800/80 rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10"
        >
          {/* Floating close inside the card header */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-300 z-50 shadow-sm border border-neutral-300/20 dark:border-zinc-700/20 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 space-y-7">
            
            {/* Modal Header (Now inside scrollable area) */}
            <div className="text-center pb-2 pt-4">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={logoSrc}
                  alt="Maverlang Logo"
                  className="h-10 w-auto object-contain select-none pointer-events-none"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
                Invita y gana
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-sm mx-auto mt-1">
                Comparte Maverlang con tus amigos. Cuando se suscriban, ganáis días de plan y desbloqueáis recompensas por niveles.
              </p>
            </div>

            {loading || !stats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
              </div>
            ) : (
              <>
                {/* Hero con enlace + sociales */}
                {stats.code && <ReferralHero code={stats.code} />}

                {/* Stats */}
                <ReferralStatsGrid
                  invited={stats.invited}
                  qualified={stats.qualified}
                  pending={stats.pending}
                  daysEarned={stats.daysEarned}
                />

                {/* Milestone progress */}
                <MilestoneProgress qualified={stats.qualified} />

                {/* Cómo funciona */}
                <Section title="Cómo funciona" icon={<Share2 className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        icon: <Share2 className="w-4 h-4" />,
                        title: "1. Comparte",
                        desc: "Envía tu enlace a quien quieras. Funciona por WhatsApp, redes o email.",
                      },
                      {
                        icon: <Trophy className="w-4 h-4" />,
                        title: "2. Se suscriben",
                        desc: "Cuando tu amigo se registra y se suscribe, el referido cuenta como válido.",
                      },
                      {
                        icon: <UserPlus className="w-4 h-4" />,
                        title: "3. Ganas días",
                        desc: "Recibes días de plan por cada referido, y recompensas extra al subir de nivel.",
                      },
                    ].map((s, i) => (
                      <motion.div
                        key={s.title}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 p-4 shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mb-2.5">
                          {s.icon}
                        </div>
                        <p className="text-[12px] font-bold text-neutral-900 dark:text-white mb-1">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </Section>

                {/* Recompensas por nivel */}
                <Section title="Recompensas por nivel" icon={<Trophy className="w-4 h-4" />}>
                  <div className="space-y-3">
                    {REFERRAL_MILESTONES.map((m, i) => {
                      const reached = stats.qualified >= m.threshold;
                      return (
                        <motion.div
                          key={m.threshold}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                          className={`relative rounded-2xl p-4 border transition-all ${
                            reached
                              ? "border-zinc-350 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/50 shadow-sm"
                              : "border-neutral-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                                reached
                                  ? "bg-foreground text-background shadow-md"
                                  : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500"
                              }`}
                            >
                              {m.threshold}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[12px] font-bold text-neutral-900 dark:text-white">
                                  +{m.days} días de plan
                                </p>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                  {m.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Al alcanzar {m.threshold} {m.threshold === 1 ? "referido cualificado" : "referidos cualificados"}
                              </p>
                            </div>
                            {reached ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-650 dark:text-emerald-450 bg-emerald-500/10 px-2.5 py-0.5 rounded-full shrink-0">
                                Desbloqueado
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-650 shrink-0">
                                {m.threshold - stats.qualified} más
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Section>

                {/* Lista de referidos */}
                <Section title="Tus referidos" icon={<UserPlus className="w-4 h-4" />}>
                  <ReferralList referrals={stats.referrals} />
                </Section>

                {/* CTA footer */}
                <div className="rounded-[24px] bg-neutral-950 dark:bg-white/5 text-white p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                  <div>
                    <p className="text-xs font-bold mb-1">¿Listo para ganar días gratis?</p>
                    <p className="text-[10px] text-white/60">Cada amigo que se suscribe te acerca al siguiente nivel.</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        typeof window !== "undefined"
                          ? `${window.location.origin}/?ref=${stats.code}`
                          : `https://maverlang.cl/?ref=${stats.code}`
                      );
                      alert("¡Enlace copiado!");
                    }}
                    className="inline-flex items-center gap-2 bg-foreground text-background font-bold text-xs px-4 py-2.5 rounded-full transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir enlace
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-neutral-500 dark:text-zinc-400">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
