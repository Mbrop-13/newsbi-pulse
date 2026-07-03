"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Loader2,
  X,
  Share2,
  Gift,
  Check,
  ArrowRight,
  Sparkles,
  Trophy,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ReferralHero } from "@/components/referrals/referral-hero";
import { MilestoneProgress } from "@/components/referrals/milestone-progress";
import { ReferralStats as ReferralStatsGrid } from "@/components/referrals/referral-stats";
import { ReferralList } from "@/components/referrals/referral-list";
import { REFERRAL_MILESTONES } from "@/lib/referral-config";
import type { ReferralStats } from "@/lib/referrals";

export default function ReferidosPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthGuard>
        <ReferidosContent />
      </AuthGuard>
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-[#1890FF]" />
    </div>
  );
}

function ReferidosContent() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const logoSrc = isDark ? "/assets/Logo 2-Blanco.png" : "/assets/Maverlang Logo-2.png";

  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 relative pb-24 animate-fade-in">
      {/* Floating close */}
      <Link
        href="/ai"
        className="absolute top-6 right-6 p-2 rounded-full bg-neutral-200/60 hover:bg-neutral-200 dark:bg-zinc-850/60 dark:hover:bg-zinc-800 text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-300 z-50 shadow-sm border border-neutral-300/20 dark:border-zinc-700/20"
      >
        <X className="w-5 h-5" />
      </Link>

      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] pointer-events-none rounded-full bg-gradient-to-b from-[#0066FF]/10 via-transparent to-transparent dark:from-[#0066FF]/15 blur-3xl" />

      {/* Header */}
      <header className="max-w-3xl mx-auto text-center pt-20 pb-8 px-4 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <img
            src={logoSrc}
            alt="Maverlang Logo"
            className="h-12 w-auto object-contain select-none pointer-events-none"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight mb-2">
          Invita y gana
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base max-w-md mx-auto">
          Comparte Maverlang con tus amigos. Cuando se suscriban, ganáis días de plan y desbloqueáis recompensas por niveles.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 relative z-10 space-y-6">
        {loading || !stats ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-[#1890FF]" />
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
                    icon: <CreditCard className="w-4 h-4" />,
                    title: "2. Se suscriben",
                    desc: "Cuando tu amigo se registra y se suscribe, el referido cuenta como válido.",
                  },
                  {
                    icon: <Gift className="w-4 h-4" />,
                    title: "3. Ganas días",
                    desc: "Recibes días de plan por cada referido, y recompensas extra al subir de nivel.",
                  },
                ].map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 p-5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#1890FF]/10 text-[#1890FF] flex items-center justify-center mb-3">
                      {s.icon}
                    </div>
                    <p className="text-[13px] font-bold text-neutral-900 dark:text-white mb-1">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
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
                      className={`relative rounded-2xl p-5 border transition-all ${
                        reached
                          ? "border-[#1890FF]/40 bg-[#1890FF]/5 dark:bg-[#1890FF]/[0.07] shadow-sm"
                          : "border-neutral-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                            reached
                              ? "bg-gradient-to-br from-[#0052CC] to-[#0066FF] text-white shadow-lg shadow-blue-500/30"
                              : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500"
                          }`}
                        >
                          {m.threshold}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-bold text-neutral-900 dark:text-white">
                              +{m.days} días de plan
                            </p>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1890FF]">
                              <Sparkles className="w-3 h-3" />
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Al alcanzar {m.threshold} {m.threshold === 1 ? "referido cualificado" : "referidos cualificados"}
                          </p>
                        </div>
                        {reached ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                            <Check className="w-3 h-3" />
                            Desbloqueado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-600 shrink-0">
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
            <div className="rounded-[32px] bg-neutral-950 dark:bg-white/5 text-white p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div>
                <p className="text-sm font-bold mb-1">¿Listo para ganar días gratis?</p>
                <p className="text-[11px] text-white/60">Cada amigo que se suscribe te acerca al siguiente nivel.</p>
              </div>
              <a
                href={`/?ref=${stats.code}`}
                className="inline-flex items-center gap-2 bg-[#1890FF] hover:bg-blue-600 text-white font-bold text-xs px-5 py-3 rounded-full transition-all shadow-lg shadow-[#1890FF]/20 active:scale-95 shrink-0"
              >
                <Share2 className="w-4 h-4" />
                Compartir ahora
              </a>
            </div>
          </>
        )}
      </main>
    </div>
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
