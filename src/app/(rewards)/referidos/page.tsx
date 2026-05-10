"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Sparkles, CheckCircle2, ChevronRight, Share2, Loader2, Trophy, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReferralData {
  code: string | null;
  referralsCount: number;
  claimedMilestones: number[];
}

const MILESTONES = [
  { count: 2, title: "1 Mes PRO", subtitle: "Acceso gratuito", tier: "pro" },
  { count: 5, title: "3 Meses MAX", subtitle: "Herramientas avanzadas", tier: "max" },
  { count: 10, title: "1 Año ULTRA", subtitle: "Experiencia completa", tier: "ultra" },
];

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

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
    const text = `¡Únete a Reclu, la mejor IA financiera, y analicemos el mercado juntos! Usa mi enlace: ${link}`;
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
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
      </div>
    );
  }

  const progressCount = data?.referralsCount || 0;
  const maxMilestone = MILESTONES[MILESTONES.length - 1].count;
  const progressPercent = Math.min(100, (progressCount / maxMilestone) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1890FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              Invita a tus amigos <span className="text-2xl">🤝</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Regala acceso a la mejor IA financiera y gana meses de suscripción <span className="text-[#1890FF] font-bold">gratis</span> cuando se registren.
            </p>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-3 bg-[#1890FF]/5 dark:bg-[#1890FF]/10 text-[#1890FF] px-6 py-4 rounded-2xl border border-[#1890FF]/20">
            <Users className="w-8 h-8" />
            <div>
              <div className="text-3xl font-black">{progressCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">Amigos unidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Link Section */}
      <div className="bg-gray-900 dark:bg-black border border-gray-800 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        <h3 className="text-white text-xl font-bold mb-6">Tu enlace único de invitación</h3>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto relative z-10">
          <div className="flex-1 w-full bg-black/50 dark:bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center justify-between group">
            <span className="text-gray-300 font-mono text-sm truncate">
              {window.location.origin}/registro?ref={data?.code}
            </span>
            <button 
              onClick={handleCopy}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          
          <button 
            onClick={shareToWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-all shrink-0 shadow-[0_4px_14px_rgba(37,211,102,0.3)]"
          >
            <Share2 className="w-5 h-5" />
            Compartir
          </button>
        </div>
      </div>

      {/* Rewards Progress Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-sm relative">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tus Recompensas</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Desbloquea premios automáticos al alcanzar las metas.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-200 dark:border-red-500/20">
            {error}
          </div>
        )}

        <div className="relative pt-8 pb-4">
          {/* Main Progress Bar Background */}
          <div className="absolute top-12 left-0 right-0 h-3 bg-gray-100 dark:bg-gray-800 rounded-full" />
          
          {/* Main Progress Bar Fill */}
          <motion.div 
            className="absolute top-12 left-0 h-3 bg-gradient-to-r from-[#1890FF] to-indigo-500 rounded-full shadow-[0_0_15px_rgba(24,144,255,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          <div className="relative flex justify-between">
            {MILESTONES.map((milestone, index) => {
              const isReached = progressCount >= milestone.count;
              const isClaimed = data?.claimedMilestones.includes(milestone.count);
              const isClaiming = claiming === milestone.count;

              return (
                <div key={index} className="flex flex-col items-center w-1/3 text-center">
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-4 border-white dark:border-slate-900 ${
                    isReached 
                      ? "bg-gradient-to-br from-[#1890FF] to-indigo-500 text-white shadow-lg scale-110" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}>
                    {isClaimed ? <CheckCircle2 className="w-5 h-5" /> : <Trophy className="w-4 h-4" />}
                  </div>

                  <div className="mt-4 flex flex-col items-center">
                    <span className={`text-sm font-black ${isReached ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                      {milestone.count} Amigos
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${isReached ? "text-[#1890FF]" : "text-gray-400"}`}>
                      {milestone.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden md:block">
                      {milestone.subtitle}
                    </span>

                    {/* Claim Button */}
                    <AnimatePresence>
                      {isReached && !isClaimed && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleClaim(milestone.count)}
                          disabled={isClaiming}
                          className="mt-4 flex items-center gap-1.5 px-4 py-1.5 bg-[#1890FF] text-white text-xs font-bold rounded-full hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50"
                        >
                          {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Reclamar
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {isClaimed && (
                      <div className="mt-4 flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-500/20">
                        ¡Cobrado!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
