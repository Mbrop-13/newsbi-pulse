"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Sparkles, CheckCircle2, Share2, Loader2, Trophy, Medal, Star, Crown, Gift, Rocket, ShieldAlert, ArrowRight, Twitter, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/auth-guard";

interface ReferralData {
  code: string | null;
  referralsCount: number;
  claimedMilestones: number[];
  referredUsers?: { id: string; name: string; date: string; avatar: string | null }[];
}

const MILESTONES = [
  { count: 1, title: "10 Días PRO", subtitle: "Acceso premium gratuito", tier: "pro", icon: Star, color: "from-amber-400 to-orange-500", glow: "shadow-orange-500/30", emoji: "⭐" },
  { count: 3, title: "1 Mes PRO", subtitle: "Acceso completo por 30 días", tier: "pro", icon: Medal, color: "from-slate-300 to-slate-500", glow: "shadow-slate-500/30", emoji: "🥈" },
  { count: 5, title: "1 Mes MAX", subtitle: "Herramientas avanzadas", tier: "max", icon: Trophy, color: "from-yellow-400 to-amber-600", glow: "shadow-yellow-500/30", emoji: "🏆" },
  { count: 10, title: "3 Meses MAX", subtitle: "Trimestre entero gratis", tier: "max", icon: Gift, color: "from-emerald-400 to-teal-600", glow: "shadow-emerald-500/30", emoji: "💎" },
  { count: 25, title: "3 Meses ULTRA", subtitle: "Experiencia institucional", tier: "ultra", icon: Crown, color: "from-fuchsia-500 to-purple-600", glow: "shadow-purple-500/30", emoji: "👑" },
];

const STEPS = [
  { num: "1", title: "Comparte tu enlace", desc: "Copia tu enlace único o compártelo por WhatsApp, Twitter o email.", icon: Share2 },
  { num: "2", title: "Tus amigos se registran", desc: "Cuando un amigo se registra con tu enlace, se suma automáticamente.", icon: Users },
  { num: "3", title: "Desbloquea premios", desc: "Reclama meses gratis de Pro, Max o Ultra según tus referidos.", icon: Gift },
];

function GemIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12l4 6-10 13L2 9Z" /><path d="M11 3 8 9l4 13 4-13-3-6" /><path d="M2 9h20" />
    </svg>
  );
}

export default function ReferralsPage() {
  return (
    <AuthGuard>
      <ReferralsContent />
    </AuthGuard>
  );
}

function ReferralsContent() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const referralLink = typeof window !== "undefined" && data?.code
    ? `${window.location.origin}/registro?ref=${data.code}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareToWhatsApp = () => {
    const text = `¡Únete a Maverlang, la mejor IA financiera! Usa mi enlace y obtén beneficios exclusivos: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToTwitter = () => {
    const text = `Descubrí @MaverlangCL — una plataforma de noticias financieras con IA increíble. Únete con mi enlace:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareByEmail = () => {
    const subject = "Te invito a probar Maverlang — IA para mercados financieros";
    const body = `Hola,\n\nQuiero compartirte Maverlang, una plataforma de noticias financieras con IA.\n\nRegistrate con mi enlace y ambos ganamos beneficios:\n${referralLink}\n\n¡Saludos!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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
      if (!res.ok) throw new Error(json.error || "Error al reclamar");
      setData(prev => prev ? { ...prev, claimedMilestones: [...prev.claimedMilestones, milestone] } : null);
    } catch (err: any) { setError(err.message); }
    finally { setClaiming(null); }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Cargando recompensas...</p>
      </div>
    );
  }

  const progress = data?.referralsCount || 0;
  const CYCLE = 25;
  const cycle = Math.floor(Math.max(0, progress - 1) / CYCLE);
  const cycleProgress = progress - (cycle * CYCLE);

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-accent/15 to-purple-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/10 to-cyan-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 p-8 md:p-12 lg:p-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Programa de Recompensas
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight"
              >
                Invita Amigos,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-500 to-pink-500">
                  Gana Premium.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-muted-foreground text-lg max-w-xl leading-relaxed mx-auto lg:mx-0"
              >
                Por cada amigo que se una con tu enlace, desbloquearás meses gratis de 
                las mejores herramientas financieras con IA.
              </motion.p>
            </div>
            
            {/* Progress Orb */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.3 }}
              className="shrink-0 relative group"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/10 blur-2xl scale-150 animate-pulse" />
              <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-card border-2 border-border/50 shadow-2xl flex flex-col items-center justify-center">
                <Users className="w-8 h-8 text-accent mb-1 opacity-70" />
                <div className="text-6xl md:text-7xl font-black text-foreground tracking-tighter">{progress}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Referidos</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══ SHARE LINK ═══ */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm"
      >
        <h3 className="text-lg font-bold text-foreground mb-1">Tu enlace único</h3>
        <p className="text-sm text-muted-foreground mb-5">Compártelo y gana recompensas cada vez que un amigo se registre.</p>
        
        {/* Link input */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 flex items-center justify-between group hover:border-accent/40 transition-colors">
            <span className="text-muted-foreground font-mono text-sm truncate select-all">
              {referralLink || "Cargando..."}
            </span>
            <button onClick={handleCopy} className="ml-3 shrink-0 w-9 h-9 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-accent transition-colors border border-border/50">
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button onClick={shareToWhatsApp} className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-sm hover:-translate-y-0.5">
            <Share2 className="w-4 h-4" />WhatsApp
          </button>
          <button onClick={shareToTwitter} className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-sm hover:-translate-y-0.5">
            <Twitter className="w-4 h-4" />Twitter / X
          </button>
          <button onClick={shareByEmail} className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-sm rounded-xl transition-all border border-border hover:-translate-y-0.5">
            <Mail className="w-4 h-4" />Email
          </button>
        </div>
      </motion.div>

      {/* ═══ HOW IT WORKS ═══ */}
      <div>
        <h2 className="text-2xl font-black text-foreground mb-6">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 relative group hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm font-black">{step.num}</div>
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══ MILESTONES ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-accent" />
          <div>
            <h2 className="text-2xl font-black text-foreground">Camino de Recompensas</h2>
            <p className="text-sm text-muted-foreground">Desbloquea niveles al referir amigos</p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/20 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />{error}
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="mb-8 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-muted-foreground">Progreso del ciclo</span>
            <span className="text-sm font-bold text-foreground">{cycleProgress} / {CYCLE}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (cycleProgress / CYCLE) * 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {MILESTONES.map(m => (
              <div key={m.count} className="text-center">
                <span className={`text-xs font-bold ${cycleProgress >= m.count ? "text-accent" : "text-muted-foreground/50"}`}>
                  {m.emoji}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MILESTONES.map((milestone, index) => {
            const actualCount = milestone.count + (cycle * CYCLE);
            const isReached = progress >= actualCount;
            const isClaimed = data?.claimedMilestones.includes(actualCount);
            const isClaiming_ = claiming === actualCount;
            const Icon = milestone.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.08 }}
                className={`relative rounded-2xl border overflow-hidden transition-all group ${
                  isReached
                    ? "bg-card border-border shadow-lg hover:shadow-xl hover:-translate-y-1"
                    : "bg-muted/30 border-border/50 opacity-60 grayscale"
                }`}
              >
                {/* Top gradient strip */}
                <div className={`h-1.5 bg-gradient-to-r ${milestone.color} ${!isReached ? "opacity-30" : ""}`} />
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isReached 
                        ? `bg-gradient-to-br ${milestone.color} text-white shadow-lg ${milestone.glow}` 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isReached ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}>
                      {actualCount} referidos
                    </div>
                  </div>

                  <h3 className={`text-lg font-black mb-1 ${isReached ? "text-foreground" : "text-muted-foreground"}`}>
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{milestone.subtitle}</p>

                  {isClaimed ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl w-full justify-center">
                      <CheckCircle2 className="w-4 h-4" />Reclamado
                    </div>
                  ) : isReached ? (
                    <button
                      onClick={() => handleClaim(actualCount)}
                      disabled={isClaiming_}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-purple-600 hover:from-accent/90 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 hover:-translate-y-0.5"
                    >
                      {isClaiming_ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      Reclamar Premio
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground font-bold text-sm rounded-xl w-full justify-center">
                      Faltan {actualCount - progress} amigos
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══ MIS REFERIDOS ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-7 h-7 text-accent" />
          <div>
            <h2 className="text-2xl font-black text-foreground">Mis Referidos</h2>
            <p className="text-sm text-muted-foreground">Personas que se han unido con tu enlace</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {(!data?.referredUsers || data.referredUsers.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Aún no tienes referidos</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Comparte tu enlace con tus amigos. Cuando se registren, aparecerán aquí y ambos ganarán beneficios.
              </p>
              <button 
                onClick={handleCopy}
                className="px-6 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                Copiar mi enlace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.referredUsers.map((user) => (
                <div key={user.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Se unió el {new Date(user.date).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="shrink-0 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Registrado
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CTA FOOTER ═══ */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="text-center pt-8 border-t border-border"
      >
        <p className="text-sm text-muted-foreground mb-1">
          Las recompensas se acumulan y se aplican automáticamente a tu cuenta.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Ciclo actual: {cycle + 1} · Los milestones se reinician cada 25 referidos.
        </p>
      </motion.div>
    </div>
  );
}
