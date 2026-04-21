"use client";

import { useState } from "react";
import { Lock, Gift, User, Diamond } from "lucide-react";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const REWARDS = [
  {
    id: "pro_1m",
    title: "Reclu PRO",
    subtitle: "1 Mes",
    tag: "Suscripción",
    gradient: "from-indigo-600 to-purple-800",
    shadowHover: "hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
    borderHover: "hover:border-indigo-400",
    cost: 500,
    shortDesc: "Accede a agentes de IA ilimitados, resúmenes bursátiles en tiempo real y modo lectura sin distracciones.",
    longDesc: "Con Reclu PRO llevas tu investigación al siguiente nivel. Obtendrás acceso prioritario a todas nuestras herramientas analíticas de inteligencia artificial, filtrado de ruido avanzado para mercados financieros y una experiencia de lectura 100% inmersiva libre de interrupciones.\n\nAl canjear esta recompensa, se añadirán 30 días de suscripción premium directamente a tu cuenta registrada.",
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
    longDesc: "Diseñado para los miembros más leales. Este borde cosmético rodeará tu foto de perfil en toda la plataforma (incluyendo el feed principal, artículos y tu panel de estadísticas). \n\nEquípalo para demostrar tu estatus de pionero fundacional en Reclu.",
    imagePlaceholder: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
  }
];

export default function RecompensasPage() {
  const { balance } = useDiamondStore();
  const [selectedReward, setSelectedReward] = useState<typeof REWARDS[0] | null>(null);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Recompensas Reclu</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Elige entre las recompensas a continuación y canjea tus diamantes por artículos exclusivos.</p>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {REWARDS.map((reward) => (
          <div 
            key={reward.id}
            onClick={() => setSelectedReward(reward)}
            className="relative rounded-[24px] bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-1.5"
          >
            {/* Superior: Imagen + Gradiente Premium */}
            <div className={`h-48 sm:h-52 md:h-56 relative p-6 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${reward.gradient}`}>
              {/* Imagen de fondo */}
              <img 
                src={reward.imagePlaceholder} 
                alt={reward.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Tags superiores */}
              <div className="relative z-10 flex justify-end">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-[10px] uppercase tracking-widest shadow-sm border border-white/10">
                  {reward.tag}
                </span>
              </div>
              
              {/* Título inferior */}
              <div className="relative z-10 pr-12">
                <h3 className="text-white text-2xl font-black leading-tight drop-shadow-md">
                  {reward.title}
                </h3>
                <p className="text-white/80 font-medium text-sm mt-1">{reward.subtitle}</p>
              </div>

              {/* Icono especial (Ej. Avatar) */}
              {reward.id === 'avatar_oro' && (
                <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full border-2 border-amber-300 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <User className="w-5 h-5 text-amber-300" />
                </div>
              )}
            </div>

            {/* Inferior: Info + Botón */}
            <div className="px-6 pt-5 pb-6 flex flex-col flex-1 bg-white dark:bg-[#1A1A1E]">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-3 leading-relaxed mb-6">
                {reward.shortDesc}
              </p>
              
              <div className="mt-auto border-t border-gray-100 dark:border-white/5 pt-5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Costo</span>
                  <div className="flex items-center gap-1.5">
                     <Diamond className="w-5 h-5 text-[#1890FF] fill-[#1890FF] drop-shadow-[0_0_8px_rgba(24,144,255,0.4)]" />
                     <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{reward.cost}</span>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-[#1890FF] text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300">
                  Detalles
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reward Details Modal */}
      <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
        <DialogContent className="sm:max-w-[850px] md:max-w-[900px] p-0 overflow-hidden bg-white dark:bg-[#0B0E11] border-gray-200 dark:border-gray-800 rounded-[24px] shadow-2xl">
          {selectedReward && (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
              {/* Image Area */}
              <div className={`w-full md:w-[40%] h-56 md:h-auto relative bg-gradient-to-br ${selectedReward.gradient} flex items-center justify-center shrink-0`}>
                <img 
                  src={selectedReward.imagePlaceholder} 
                  alt={selectedReward.title}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 to-transparent" />
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                  {selectedReward.id === 'avatar_oro' ? (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-amber-300 bg-white/10 backdrop-blur-md flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                      <User className="w-10 h-10 md:w-12 md:h-12 text-amber-300" />
                    </div>
                  ) : (
                    <Gift className="w-16 h-16 md:w-20 md:h-20 text-white mb-4 drop-shadow-xl" />
                  )}
                  <h2 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">{selectedReward.title} <br className="hidden md:block"/>{selectedReward.subtitle}</h2>
                  <span className="mt-4 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedReward.tag}</span>
                </div>
              </div>

              {/* Body Area */}
              <div className="w-full md:w-[60%] p-8 sm:p-10 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Detalles de Compensación</h4>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {selectedReward.longDesc}
                  </p>
                </div>
                
                <div className="mt-10">
                  <div className="bg-blue-50 dark:bg-[#1A202C] border border-blue-100 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-5">
                    <div className="bg-white dark:bg-[#0B0E11] p-3 rounded-2xl shrink-0 shadow-sm border border-gray-100 dark:border-gray-800">
                      <Diamond className="w-8 h-8 text-[#3B71F7] fill-[#3B71F7]" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-base">Costo de Canje</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance requerido: <strong className="text-[#3B71F7] text-lg font-black">{selectedReward.cost} 💎</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button 
                      onClick={() => setSelectedReward(null)}
                      className="flex-1 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-[#1E2329] dark:text-gray-300 dark:hover:bg-[#1A202C] transition-colors order-2 sm:order-1"
                    >
                      Volver
                    </button>
                    <button 
                      disabled={balance < selectedReward.cost}
                      className={`flex-[2] py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 order-1 sm:order-2 shadow-lg ${
                        balance >= selectedReward.cost 
                          ? 'bg-[#3B71F7] hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]' 
                          : 'bg-gray-300 dark:bg-[#1E2329] text-gray-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {balance >= selectedReward.cost ? (
                        <>Efectuar Canje</>
                      ) : (
                        <><Lock className="w-4 h-4"/> Faltan Diamantes</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
