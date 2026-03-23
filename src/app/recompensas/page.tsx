"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Lock, CheckCircle2, ChevronRight, Gift, Sparkles, AlertCircle, LogIn, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthModals } from "@/components/auth-modals";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const REWARDS = [
  {
    id: "pro_1m",
    title: "NewsBI PRO",
    subtitle: "1 Mes",
    tag: "Suscripción",
    gradient: "from-indigo-600 to-purple-800",
    shadowHover: "hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
    borderHover: "hover:border-indigo-400",
    cost: 500,
    shortDesc: "Accede a agentes de IA ilimitados, resúmenes bursátiles en tiempo real y modo lectura sin distracciones.",
    longDesc: "Con NewsBI PRO llevas tu investigación al siguiente nivel. Obtendrás acceso prioritario a todas nuestras herramientas analíticas de inteligencia artificial, filtrado de ruido avanzado para mercados financieros y una experiencia de lectura 100% inmersiva libre de interrupciones.\n\nAl canjear esta recompensa, se añadirán 30 días de suscripción premium directamente a tu cuenta registrada.",
    imagePlaceholder: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "avatar_oro",
    title: "Avatar Dorado",
    subtitle: "Exclusivo",
    tag: "Cosmético",
    gradient: "from-amber-400 to-orange-600",
    shadowHover: "hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    borderHover: "hover:border-amber-400",
    cost: 150,
    shortDesc: "Destaca tus comentarios en la comunidad con un aro animado color oro diseñado para lectores pioneros.",
    longDesc: "Diseñado para los miembros más leales. Este borde cosmético rodeará tu foto de perfil en toda la plataforma (incluyendo el feed principal, artículos y tu panel de estadísticas). \n\nEquípalo para demostrar tu estatus de pionero fundacional en NewsBI Pulse.",
    imagePlaceholder: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
  }
];

export default function RecompensasPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { balance, consecutiveDays, loadDiamonds, claimDiamonds, canClaimToday, isLoading } = useDiamondStore();
  const [justClaimed, setJustClaimed] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "login" as "login" | "register" });
  const [selectedReward, setSelectedReward] = useState<typeof REWARDS[0] | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDiamonds(user.id);
    }
  }, [isAuthenticated, user, loadDiamonds]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, view: "login" });
      return;
    }
    const res = await claimDiamonds();
    if (res.success) {
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 3000);
    }
  };

  const getRewardForDay = (day: number) => {
    if (day >= 1 && day <= 3) return 10;
    if (day >= 4 && day <= 6) return 20;
    if (day === 7) return 50;
    return 10;
  };

  const targetDay = canClaimToday ? (consecutiveDays % 7) + 1 : consecutiveDays || 1;

  // Prevent hydration mismatch on initial render for user state
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] relative overflow-hidden flex flex-col pt-16">
      {/* Decorative Lights */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1890FF]/20 mix-blend-screen filter blur-[100px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 mix-blend-screen filter blur-[100px] pointer-events-none animate-pulse duration-7000" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 pb-24 flex-1 transition-all duration-700">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1890FF]/10 dark:to-indigo-500/20 mb-6 shadow-xl shadow-blue-500/10 border border-blue-200/50 dark:border-[#1890FF]/30"
          >
             <Gem className="w-16 h-16 text-[#1890FF] fill-[#1890FF]/20 drop-shadow-md" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-[#1890FF] to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 mb-4"
          >
            Diamantes Recompensas
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Nuestra forma de agradecerte por estar informado con NewsBI. Acumula diamantes diarios y canjéalos por beneficios exclusivos en la plataforma.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 inline-flex flex-col items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-10 py-6 rounded-3xl border border-blue-100/50 dark:border-blue-900/30 shadow-xl"
          >
            <span className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-1">Tu Balance</span>
            <div className="flex items-center gap-3">
              <span className="text-5xl md:text-6xl font-black text-[#1890FF] tracking-tighter shadow-sm">{balance}</span>
              <Gem className="w-8 h-8 md:w-10 md:h-10 text-[#1890FF] fill-[#1890FF]/20 mt-1" />
            </div>
          </motion.div>
        </div>

        {/* 7-Day Cycle Visualizer */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-blue-900/5 mb-12"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Racha Semanal
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                La racha actual se perderá si pasas más de 48 horas sin reclamar.
              </p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 font-bold px-4 py-2 rounded-xl text-sm border border-amber-200 dark:border-amber-500/30">
              Día Actual: {targetDay} de 7
            </div>
          </div>

          <div className="relative mb-14 pt-6 pb-2">
            
            <div className="flex items-center justify-between w-full px-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const reward = getRewardForDay(day);
                let state = 'locked';
                if (canClaimToday || !isAuthenticated) {
                  if (day < targetDay) state = 'claimed';
                  else if (day === targetDay) state = 'current';
                } else {
                  if (day <= consecutiveDays) state = 'claimed';
                  else if (day === consecutiveDays + 1) state = 'locked';
                }

                return (
                  <div key={day} className="relative flex flex-col items-center group w-12 sm:w-16">
                    {/* Day label */}
                    <span className={`absolute -top-8 text-xs font-bold transition-colors ${state === 'claimed' ? 'text-[#1890FF] dark:text-blue-400' : 'text-gray-400'}`}>
                      Día {day}
                    </span>
                    
                    {/* Circle Node */}
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm md:text-lg font-black border-4 transition-all duration-300 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${
                      state === 'claimed' 
                        ? 'border-[#1890FF] text-[#1890FF] shadow-[0_0_20px_rgba(24,144,255,0.4)] scale-105' 
                        : state === 'current'
                        ? 'border-indigo-500 text-indigo-500 ring-4 ring-indigo-500/30 scale-110 animate-pulse'
                        : 'border-gray-200/50 dark:border-gray-800/50 text-gray-400 dark:text-gray-500'
                    }`}>
                      {state === 'claimed' ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
                      ) : (
                        day === 7 ? <Gem className="w-5 h-5 sm:w-6 sm:h-6" /> : day
                      )}
                    </div>

                    {/* Reward visible permanently */}
                    <div className="absolute -bottom-8 whitespace-nowrap text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-opacity">
                      +{reward} <Gem className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center pt-8 border-t border-gray-100 dark:border-gray-800">
            {canClaimToday || !isAuthenticated ? (
              <button 
                onClick={handleClaim}
                disabled={isLoading}
                className="w-full md:w-2/3 lg:w-1/2 relative group overflow-hidden rounded-2xl px-8 py-5 sm:py-6 bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white font-black text-xl hover:shadow-[0_0_40px_rgba(24,144,255,0.6)] transition-all disabled:opacity-70 transform md:hover:scale-105 duration-300"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? 'PROCESANDO...' : `RECLAMAR +${getRewardForDay(targetDay)} DIAMANTES`}
                  {!isLoading && <Sparkles className="w-6 h-6" />}
                </span>
              </button>
            ) : (
              <div className="px-8 py-5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 font-bold flex items-center justify-center gap-3 w-full md:w-2/3 lg:w-1/2 cursor-not-allowed">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span>Reclamo completado. ¡Nos vemos mañana!</span>
              </div>
            )}

            <AnimatePresence>
              {justClaimed && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute mt-24 text-green-600 dark:text-green-400 font-black text-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2"
                >
                  <Sparkles className="w-6 h-6" />
                  ¡Misión cumplida! Diamantes depositados.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Rewards Store */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <Gift className="w-8 h-8 text-indigo-500" />
              Boutique de Diamantes
            </h2>
            <button className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#1890FF] hover:text-indigo-600 transition-colors">
              Ver Catálogo Completo <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {REWARDS.map((reward) => (
              <div 
                key={reward.id}
                onClick={() => setSelectedReward(reward)}
                className={`rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl transition-all group flex flex-col cursor-pointer ${reward.shadowHover} ${reward.borderHover}`}
              >
                <div className={`h-40 bg-gradient-to-br ${reward.gradient} relative p-6 flex items-end`}>
                  <div className="absolute top-4 right-4 bg-black/20 backdrop-blur px-3 py-1 rounded-full text-white font-black text-xs">{reward.tag}</div>
                  <h3 className="text-white text-2xl font-black relative z-10 leading-tight">
                    {reward.title}<br/>{reward.subtitle}
                  </h3>
                  {reward.id === 'avatar_oro' && (
                    <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-4 border-amber-300 bg-white/20 backdrop-blur flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {reward.id === 'pro_1m' && (
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">{reward.shortDesc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">{reward.cost} <Gem className="w-5 h-5 text-[#1890FF]" /></span>
                    <button className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${balance >= reward.cost ? (reward.id === 'avatar_oro' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20' : 'bg-black dark:bg-white text-white dark:text-black') : 'bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center gap-2'}`}>
                      {balance >= reward.cost ? 'Detalles' : <><Lock className="w-4 h-4"/> Detalles</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholder for future */}
            <div className="rounded-3xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 border-dashed dark:border-gray-700 overflow-hidden flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
                 <Gem className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">Próximamente</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Nuestra armería está forjando nuevas recompensas legendarias. ¡Sigue ahorrando tus diamantes!</p>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Auth Modals for Claiming */}
      
      {/* Reward Details Modal */}
      <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-3xl">
          {selectedReward && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Left / Top Banner Image Area */}
              <div className={`w-full md:w-2/5 h-48 sm:h-64 md:h-auto relative bg-gradient-to-br ${selectedReward.gradient} flex items-center justify-center shrink-0`}>
                <img 
                  src={selectedReward.imagePlaceholder} 
                  alt={selectedReward.title}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 to-transparent" />
                <div className="relative z-10 flex flex-col items-center text-center px-4 md:px-6">
                  {selectedReward.id === 'avatar_oro' ? (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-amber-300 bg-white/20 backdrop-blur flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                      <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                  ) : (
                    <Gift className="w-16 h-16 md:w-20 md:h-20 text-white mb-2 drop-shadow-md" />
                  )}
                  <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{selectedReward.title} <br className="hidden md:block"/>{selectedReward.subtitle}</h2>
                  <span className="mt-3 bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">{selectedReward.tag}</span>
                </div>
              </div>

              {/* Right / Modal Body */}
              <div className="w-full md:w-3/5 p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Acerca de esta recompensa</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                    {selectedReward.longDesc}
                  </p>
                </div>
                
                <div className="mt-8">
                  <div className="bg-blue-50 dark:bg-[#1890FF]/10 border border-blue-100 dark:border-[#1890FF]/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-full shrink-0 shadow-sm">
                      <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-[#1890FF]" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Costo de Canje</h5>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Balance requerido: <strong className="text-[#1890FF] text-lg">{selectedReward.cost} 💎</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button 
                      onClick={() => setSelectedReward(null)}
                      className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors order-2 sm:order-1"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={balance < selectedReward.cost}
                      className={`flex-[2] py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                        balance >= selectedReward.cost 
                          ? 'bg-[#1890FF] hover:bg-blue-600 shadow-xl shadow-blue-500/20 hover:-translate-y-1' 
                          : 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {balance >= selectedReward.cost ? (
                        <>Canjear Recompensa</>
                      ) : (
                        <><Lock className="w-4 h-4"/> Diamantes Insuficientes</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AuthModals
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultView={authModal.view}
      />
    </div>
  );
}
