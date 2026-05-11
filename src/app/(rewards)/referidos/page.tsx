"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Sparkles, CheckCircle2, Share2, Loader2, Trophy, Medal, Star, Crown, Gift, Rocket, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

interface ReferralData {
  code: string | null;
  referralsCount: number;
  claimedMilestones: number[];
}

const MILESTONES_BASE = [
  { 
    count: 1, 
    title: "10 Días PRO", 
    subtitle: "Prueba premium gratuita", 
    tier: "pro",
    icon: Star,
    color: "from-amber-400 to-orange-500",
    shadow: "shadow-orange-500/30"
  },
  { 
    count: 3, 
    title: "1 Mes PRO", 
    subtitle: "Acceso estándar gratuito", 
    tier: "pro",
    icon: Medal,
    color: "from-slate-400 to-slate-600",
    shadow: "shadow-slate-500/30"
  },
  { 
    count: 5, 
    title: "1 Mes MAX", 
    subtitle: "Herramientas avanzadas desbloqueadas", 
    tier: "max",
    icon: Trophy,
    color: "from-yellow-400 to-amber-600",
    shadow: "shadow-yellow-500/30"
  },
  { 
    count: 10, 
    title: "3 Meses MAX", 
    subtitle: "Un trimestre entero gratis", 
    tier: "max",
    icon: GemIcon, // Custom component defined below
    color: "from-emerald-400 to-teal-600",
    shadow: "shadow-emerald-500/30"
  },
  { 
    count: 25, 
    title: "3 Meses ULTRA", 
    subtitle: "Experiencia institucional completa", 
    tier: "ultra",
    icon: Crown,
    color: "from-fuchsia-500 to-purple-600",
    shadow: "shadow-purple-500/30"
  },
];

function GemIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!data?.code) return;
    const link = `${window.location.origin}/registro?ref=${data.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareToWhatsApp = () => {
    if (!data?.code) return;
    const link = `${window.location.origin}/registro?ref=${data.code}`;
    const text = `¡Únete a Reclu, la mejor IA financiera, y analicemos el mercado juntos! Usa mi enlace y obtén beneficios exclusivos: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleClaim = async (milestone: number) => {
    setClaiming(milestone);
    setError("");
    try {
      const res = await fetch("/api/referrals/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestone }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Error al reclamar");
      }
      
      // Update local state to reflect claimed
      setData(prev => prev ? {
        ...prev,
        claimedMilestones: [...prev.claimedMilestones, milestone]
      } : null);
      
      alert(`¡Felicidades! Has desbloqueado tu premio. Tu nueva fecha de renovación es: ${new Date(json.newPeriodEnd).toLocaleDateString()}`);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#1890FF]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-[#1890FF] border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Cargando tus recompensas...</p>
      </div>
    );
  }

  const progressCount = data?.referralsCount || 0;
  const CYCLE_SIZE = 25;
  const activeCycle = Math.floor(Math.max(0, progressCount - 1) / CYCLE_SIZE);
  const currentCycleProgress = progressCount - (activeCycle * CYCLE_SIZE);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ─── PREMIUM HERO SECTION ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 dark:bg-black border border-gray-800 shadow-2xl p-8 md:p-12">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1890FF]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-10000" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md w-max mx-auto md:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-[#1890FF]" />
              Programa de Recompensas
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Invita Amigos. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1890FF] to-purple-500">
                Gana Acceso Premium.
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed mx-auto md:mx-0">
              Construye tu red. Por cada amigo que se una con tu enlace, desbloquearás meses gratis de nuestras mejores herramientas financieras.
            </p>
          </div>
          
          {/* Dynamic Progress Orb */}
          <div className="shrink-0 relative group perspective-1000">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", duration: 1.5, bounce: 0.4 }}
              className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 shadow-2xl flex flex-col items-center justify-center transform-style-3d group-hover:rotate-y-12 transition-transform duration-500"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1890FF]/20 to-transparent blur-xl" />
              <Users className="w-10 h-10 text-[#1890FF] mb-2 opacity-80" />
              <div className="text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg relative z-10">
                {progressCount}
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Referidos
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── SHARE LINK MODULE ─── */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">Tu enlace único de invitación</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md relative z-10">
          Cópialo o compártelo directamente. Tus amigos deben registrarse usándolo para que cuente tu progreso.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto relative z-10">
          <div className="flex-1 w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between group hover:border-[#1890FF]/50 transition-colors">
            <span className="text-gray-600 dark:text-gray-300 font-mono text-sm sm:text-base truncate select-all">
              {window.location.origin}/registro?ref={data?.code}
            </span>
            <button 
              onClick={handleCopy}
              className="ml-3 shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/10 dark:hover:text-[#1890FF] transition-all shadow-sm"
              title="Copiar enlace"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          
          <button 
            onClick={shareToWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all shrink-0 shadow-[0_8px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:-translate-y-1"
          >
            <Share2 className="w-5 h-5" />
            Compartir en WhatsApp
          </button>
        </div>
      </motion.div>

      {/* ─── MILESTONES BATTLE-PASS STYLE ─── */}
      <div className="pt-8">
        <div className="flex items-center gap-3 mb-8">
          <Gift className="w-8 h-8 text-[#1890FF]" />
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Camino de Recompensas</h2>
            <p className="text-gray-500 text-sm">Desbloquea niveles automáticamente</p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-200 dark:border-red-500/20 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <div className="relative space-y-6">
          {/* Vertical Progress Line (Desktop) */}
          <div className="hidden md:block absolute left-[5.5rem] top-8 bottom-8 w-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
          <motion.div 
            className="hidden md:block absolute left-[5.5rem] top-8 w-1.5 bg-gradient-to-b from-[#1890FF] to-purple-500 rounded-full shadow-[0_0_10px_rgba(24,144,255,0.5)] origin-top"
            initial={{ scaleY: 0 }}
            animate={{ 
              scaleY: Math.min(1, currentCycleProgress / MILESTONES_BASE[MILESTONES_BASE.length - 1].count) 
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {MILESTONES_BASE.map((milestone, index) => {
            const actualMilestoneCount = milestone.count + (activeCycle * CYCLE_SIZE);
            const isReached = progressCount >= actualMilestoneCount;
            const isClaimed = data?.claimedMilestones.includes(actualMilestoneCount);
            const isClaiming = claiming === actualMilestoneCount;
            const Icon = milestone.icon;

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-6 rounded-3xl border transition-all duration-300
                  ${isReached 
                    ? "bg-white dark:bg-[#0f1117] border-gray-200 dark:border-white/10 shadow-xl" 
                    : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 opacity-70 grayscale"
                  }
                `}
              >
                {/* Milestone Counter */}
                <div className="flex items-center gap-4 md:w-32 shrink-0 z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-colors
                    ${isReached 
                      ? `bg-gradient-to-br ${milestone.color} text-white shadow-lg ${milestone.shadow}` 
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    }
                  `}>
                    {actualMilestoneCount}
                  </div>
                  <div className="md:hidden text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Referidos
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${isReached ? "text-[#1890FF]" : "text-gray-400"}`} />
                      <h3 className={`text-xl font-black ${isReached ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {milestone.title}
                      </h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {milestone.subtitle}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 mt-2 sm:mt-0">
                    {isClaimed ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        Reclamado
                      </div>
                    ) : isReached ? (
                      <button
                        onClick={() => handleClaim(actualMilestoneCount)}
                        disabled={isClaiming}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1890FF] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_15px_rgba(24,144,255,0.3)] hover:shadow-[0_4px_20px_rgba(24,144,255,0.4)] disabled:opacity-50 hover:-translate-y-0.5"
                      >
                        {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Reclamar Premio
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm rounded-xl">
                        Faltan {actualMilestoneCount - progressCount} amigos
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
