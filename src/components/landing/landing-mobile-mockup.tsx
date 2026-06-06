"use client";

import { motion } from "framer-motion";
import { Play, Sparkles, Brain, Network, Terminal } from "lucide-react";

export function LandingMobileMockup() {
  return (
    <section className="py-20 bg-transparent text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Split Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: IA Agents Consensus Explanation */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#38BDF8] text-[10px] font-extrabold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              Consenso de Agentes Autónomos
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-6">
              Múltiples agentes de IA cooperando en tiempo real.
            </h2>
            
            <p className="text-slate-350 text-sm md:text-base leading-relaxed mb-6 font-medium text-slate-300">
              Reclu no depende de una sola respuesta lineal. Nuestra plataforma funciona con un ecosistema de **múltiples agentes de IA autónomos** que trabajan en paralelo. 
            </p>

            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Cada agente toma sus propias decisiones, tiene ideas independientes, analiza los mercados financieros desde enfoques complementarios y debate hipótesis en una red de consenso. El resultado es un análisis de inversiones y noticias sumamente robusto, verificado cruzando fuentes e inmune a sesgos individuales.
            </p>

            {/* Micro console layout showcasing active agent logs */}
            <div className="w-full bg-[#05070c] border border-white/5 rounded-xl p-4 font-mono text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-white/5 pb-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>R-AI Agent Consortium Log</span>
              </div>
              <div className="space-y-1.5">
                <p className="flex items-center gap-2"><span className="text-emerald-400">●</span> <span>[MarketAgent] Analizando correlación de portafolio...</span></p>
                <p className="flex items-center gap-2"><span className="text-blue-400">●</span> <span>[SentimentAgent] Mapeando 45 fuentes de noticias...</span></p>
                <p className="flex items-center gap-2"><span className="text-purple-400">●</span> <span>[Consensus] Debate en curso: Sesgos detectados en Reuters</span></p>
              </div>
            </div>
          </div>

          {/* Right Column: Neural Network Video Placeholder */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full aspect-video md:aspect-[4/3] max-w-lg rounded-2xl border border-white/10 bg-[#05080f]/80 overflow-hidden shadow-2xl group cursor-pointer"
            >
              {/* Dynamic Neural Network SVG Grid Background */}
              <div className="absolute inset-0 opacity-40 z-0 select-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1890FF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1890FF" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Grid of nodes */}
                  <circle cx="20%" cy="30%" r="4" fill="#38BDF8" className="animate-ping" />
                  <circle cx="20%" cy="30%" r="3" fill="#38BDF8" />
                  
                  <circle cx="50%" cy="20%" r="3" fill="#1890FF" />
                  <circle cx="80%" cy="40%" r="4" fill="#0066FF" />
                  <circle cx="35%" cy="65%" r="3" fill="#38BDF8" />
                  <circle cx="65%" cy="75%" r="4" fill="#1890FF" />
                  <circle cx="75%" cy="15%" r="3" fill="#38BDF8" />
                  
                  {/* Connecting lines */}
                  <line x1="20%" y1="30%" x2="50%" y2="20%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="50%" y1="20%" x2="75%" y2="15%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="20%" y1="30%" x2="35%" y2="65%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="35%" y1="65%" x2="65%" y2="75%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="65%" y1="75%" x2="80%" y2="40%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="80%" y1="40%" x2="75%" y2="15%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="50%" y1="20%" x2="80%" y2="40%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="35%" y1="65%" x2="50%" y2="20%" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

                  {/* Pulsing glow under nodes */}
                  <circle cx="50%" cy="40%" r="100" fill="url(#glow)" />
                </svg>
              </div>

              {/* Video Player Action Overlay */}
              <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center p-6 text-center transition-all group-hover:bg-black/40">
                <div className="w-16 h-16 rounded-full bg-[#1890FF] flex items-center justify-center shadow-lg shadow-[#1890FF]/40 group-hover:scale-110 transition-transform mb-4">
                  <Play className="w-7 h-7 text-white fill-white translate-x-0.5" />
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-[#38BDF8] font-bold uppercase mb-1">
                  <Network className="w-4 h-4 animate-pulse" />
                  Video Demo: Redes de Agentes
                </div>
                
                <h4 className="text-sm font-bold text-white max-w-[280px]">
                  Integración de Redes Neuronales & Simulación de Decisiones
                </h4>
                
                <p className="text-[10px] text-gray-400 mt-2 max-w-[240px]">
                  Haz clic para previsualizar (El video real se integrará aquí).
                </p>
              </div>

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
