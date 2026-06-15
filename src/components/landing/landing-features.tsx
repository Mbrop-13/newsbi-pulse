"use client";

import { motion } from "framer-motion";
import { Bot, LineChart, TrendingUp, Sparkles, Play, ChevronRight } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  {
    id: "ai-assistant",
    title: "Asistente Conversacional Maverlang AI",
    desc: "Pregúntale sobre cualquier evento económico, tendencia o noticia. Maverlang AI investiga fuentes en vivo, resume el contexto y responde de forma crítica y analítica. Ahora, analizar mercados es tan fácil como mantener una conversación.",
    cta: "Más sobre el Asistente",
    link: "/ai",
    visual: (
      <div className="relative w-full h-full min-h-[300px] md:min-h-[380px] bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center p-8 overflow-hidden">
        {/* Abstract network or glowing lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white text-xs font-mono shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-slate-300" /> Maverlang Consenso</span>
            <span className="text-[10px] text-emerald-400 font-bold">ACTIVO</span>
          </div>
          <p className="mb-2 text-slate-200">"El análisis del sector semiconductores indica una sobredemanda. He consolidado reportes de 12 fuentes financieras."</p>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-white" />
          </div>
        </div>
        
        {/* Video Overlay Placeholder */}
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer hover:bg-black/25 transition-all">
          <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          </div>
          <span className="text-white text-xs font-bold mt-3 uppercase tracking-wider">Ver Vídeo Demo</span>
        </div>
      </div>
    ),
    reverse: false
  },
  {
    id: "portfolio",
    title: "Portafolio de Inversión Inteligente",
    desc: "Monitorea tus activos financieros en tiempo real y recibe reportes agregados automáticos. Maverlang AI audita las noticias del mercado internacional y te avisa de inmediato de cualquier cambio que afecte tus inversiones.",
    cta: "Ver tu Portafolio",
    link: "/portafolio",
    visual: (
      <div className="relative w-full h-full min-h-[300px] md:min-h-[380px] bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white to-transparent" />
        
        {/* Simple Portfolio visual card mockup */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activos en Seguimiento</span>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+8.45%</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">AAPL (Apple)</span>
              <span className="font-mono text-slate-600">$172.50</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">NVDA (Nvidia)</span>
              <span className="font-mono text-slate-600">$875.12</span>
            </div>
          </div>
        </div>

        {/* Video Overlay Placeholder */}
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer hover:bg-black/25 transition-all">
          <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-emerald-600 translate-x-0.5" />
          </div>
          <span className="text-white text-xs font-bold mt-3 uppercase tracking-wider">Ver Vídeo Demo</span>
        </div>
      </div>
    ),
    reverse: true
  },
  {
    id: "predictions",
    title: "Mercados de Predicciones por IA",
    desc: "Pronostica eventos económicos y globales basados en la agregación de opiniones inteligentes y cuotas proyectadas. Visualiza gráficos e históricos de probabilidades para tomar mejores decisiones.",
    cta: "Explorar Predicciones",
    link: "/mercados",
    visual: (
      <div className="relative w-full h-full min-h-[300px] md:min-h-[380px] bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        {/* Prediction odds graphic mockup */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white shadow-xl">
          <div className="text-xs font-bold text-purple-200 mb-1">PROBABILIDAD DEL EVENTO</div>
          <div className="text-2xl font-black mb-3">78.4% <span className="text-xs text-emerald-400 font-bold">▲ +2.3%</span></div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded">Fed Baja Tasas en Junio</span>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded">Consenso: Alta</span>
          </div>
        </div>

        {/* Video Overlay Placeholder */}
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer hover:bg-black/25 transition-all">
          <div className="w-14 h-14 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-purple-600 translate-x-0.5" />
          </div>
          <span className="text-white text-xs font-bold mt-3 uppercase tracking-wider">Ver Vídeo Demo</span>
        </div>
      </div>
    ),
    reverse: false
  },
  {
    id: "verification",
    title: "Análisis & Verificación de Noticias",
    desc: "Nuestra IA analiza automáticamente sesgos editoriales, detecta clickbait y califica la confianza de cada publicación cruzando datos de medios internacionales para que siempre leas información veraz.",
    cta: "Ir a Noticias Verificadas",
    link: "/noticias",
    visual: (
      <div className="relative w-full h-full min-h-[300px] md:min-h-[380px] bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        
        {/* Verification rating visual card mockup */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-black">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Score de Confianza</span>
          </div>
          <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-3">Bloomberg: Decisiones del Banco Central de Chile</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-black/20 border-t-black flex items-center justify-center font-mono text-xs font-black text-slate-800">
              9.2
            </div>
            <div>
              <p className="text-[10px] font-bold text-black">Confianza muy alta</p>
              <p className="text-[9px] text-slate-400">Verificado contra 14 fuentes corporativas</p>
            </div>
          </div>
        </div>

        {/* Video Overlay Placeholder */}
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer hover:bg-black/25 transition-all">
          <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          </div>
          <span className="text-white text-xs font-bold mt-3 uppercase tracking-wider">Ver Vídeo Demo</span>
        </div>
      </div>
    ),
    reverse: true
  }
];

export function LandingFeatures() {
  return (
    <section className="bg-white text-slate-900 overflow-hidden select-none font-sans">
      
      {/* Title wrapper styled like Anthropic sections */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <h2 className="text-sm font-bold tracking-widest text-black uppercase mb-4">
          CAPACIDADES DE NUEVA GENERACIÓN
        </h2>
        <p className="text-3xl md:text-5xl font-bold tracking-tight text-slate-950 max-w-2xl leading-[1.1]">
          Diseñado para ir más allá de la simple información.
        </p>
      </div>

      {/* Dynamic alternating split sections */}
      <div className="w-full">
        {SECTIONS.map((section, idx) => (
          <div 
            key={section.id} 
            className="w-full py-16 md:py-24 hover:bg-slate-50/30 transition-colors"
          >
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text Side */}
              <div 
                className={`lg:col-span-5 flex flex-col items-start ${
                  section.reverse ? "lg:order-2" : ""
                }`}
              >
                <h3 className="text-2xl md:text-4xl font-bold text-slate-950 tracking-tight mb-4 leading-tight">
                  {section.title}
                </h3>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 font-medium">
                  {section.desc}
                </p>
                <Link 
                  href={section.link}
                  className="inline-flex items-center gap-1 text-black text-xs md:text-sm font-bold hover:underline"
                >
                  {section.cta} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Graphic/Video Side */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`lg:col-span-7 w-full overflow-hidden rounded-[32px] shadow-lg border border-slate-150/80 ${
                  section.reverse ? "lg:order-1" : ""
                }`}
              >
                {section.visual}
              </motion.div>

            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
