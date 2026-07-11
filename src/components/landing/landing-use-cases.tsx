"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const USE_CASES = [
  {
    slug: "auditoria-corporativa",
    category: "AUDITORÍA DE INVERSIONES",
    title: "Auditoría de Inversiones Corporativas con Agentes IA",
    desc: "Cómo un Gestor de Fondos o Administrador de Activos podría ocupar Maverlang para auditar transacciones en tiempo real con agentes de IA.",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
    badge: "AI Multi-Agente + Supabase",
    cta: "Lee la historia de auditoría"
  },
  {
    slug: "deteccion-de-sesgos",
    category: "ANÁLISIS DE PRENSA",
    title: "Detección y Purificación de Sesgos Informativos",
    desc: "Cómo un Analista Financiero podría ocupar Maverlang para purificar noticias y eliminar sesgo macroeconómico de forma inmediata.",
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80",
    badge: "Python + LLMs",
    cta: "Lee la historia de purificación"
  },
  {
    slug: "seguimiento-automatizado",
    category: "WEALTH MANAGEMENT",
    title: "Monitoreo Automatizado de Portafolios",
    desc: "Cómo un Asesor Patrimonial o Inversor podría ocupar Maverlang para recibir alertas inteligentes vinculadas a sus activos en cartera.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    badge: "Upstash + Cron",
    cta: "Lee la historia de monitoreo"
  },
  {
    slug: "prediccion-banco-central",
    category: "ANALÍTICA PREDICTIVA",
    title: "Predicción de Variaciones de Tasas del Banco Central",
    desc: "Cómo una Firma de Corretaje podría ocupar Maverlang para anticipar de manera analítica decisiones de tasas swap del Banco Central.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    badge: "Next.js + Azure",
    cta: "Lee la historia de predicción"
  },
  {
    slug: "analisis-sentimiento-cripto",
    category: "CRIPTO & SOCIAL",
    title: "Medición de Sentimiento Real de Criptoactivos",
    desc: "Cómo un Inversor de Activos Digitales podría ocupar Maverlang para filtrar campañas artificiales de bots y medir el sentimiento social real.",
    image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=600&q=80",
    badge: "Azure + OpenAI",
    cta: "Lee la historia de criptoactivos"
  },
  {
    slug: "regulacion-fiscal",
    category: "COMPLIANCE LEGAL",
    title: "Auditoría Regulatoria y Fiscal de Boletines Oficiales",
    desc: "Cómo un Estudio Jurídico o Tributario podría ocupar Maverlang para monitorizar decretos en boletines oficiales en busca de riesgos.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
    badge: "Supabase + RLS",
    cta: "Lee la historia de compliance"
  },
  {
    slug: "cadena-suministro",
    category: "LOGÍSTICA GLOBAL",
    title: "Resiliencia Geopolítica de Cadenas de Suministro",
    desc: "Cómo un Gestor de Operaciones Logísticas podría ocupar Maverlang para predecir cierres portuarios debido a eventos geopolíticos.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    badge: "Capacitor + React",
    cta: "Lee la historia de logística"
  },
  {
    slug: "educacion-financiera",
    category: "ACADEMIA & FINANZAS",
    title: "Simulación Académica en Laboratorios Financieros",
    desc: "Cómo una Universidad o Academia podría ocupar Maverlang como herramienta interactiva para que estudiantes auditen mercados.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    badge: "MercadoPago + Node",
    cta: "Lee la historia de academia"
  }
];

export function LandingUseCases() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const targetScrollRef = useRef<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth = 344; // 320px (card) + 24px (gap)
    const currentScroll = container.scrollLeft;

    let baseScroll = currentScroll;
    if (animationRef.current !== null && targetScrollRef.current !== null) {
      baseScroll = targetScrollRef.current;
      cancelAnimationFrame(animationRef.current);
    }

    const targetScroll = baseScroll + (direction === "left" ? -cardWidth : cardWidth);
    const maxScroll = container.scrollWidth - container.clientWidth;
    const clampedTarget = Math.max(0, Math.min(targetScroll, maxScroll));

    targetScrollRef.current = clampedTarget;

    const startScroll = currentScroll;
    const distance = clampedTarget - startScroll;
    if (distance === 0) return;

    const duration = 650;
    let startTime: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      container.scrollLeft = startScroll + distance * easeOutCubic(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScroll);
      } else {
        animationRef.current = null;
        targetScrollRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animateScroll);
  };

  return (
    <section className="pt-8 pb-20 bg-white text-slate-900 overflow-hidden font-sans select-none">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header with Navigation Controls */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-black uppercase mb-3">
              EJEMPLOS DE USO
            </h2>
            <p className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950">
              ¿Para qué podrías ocupar Maverlang?
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Use Cases Cards Carousel */}
        <div 
          ref={carouselRef}
          className="flex gap-8 overflow-x-auto py-10 px-4 -mx-4 scrollbar-none hide-scrollbar scroll-smooth"
        >
          {USE_CASES.map((uc, index) => (
            <Link 
              key={uc.slug}
              href={`/casos-de-uso/${uc.slug}`}
              className="min-w-[280px] sm:min-w-[325px] max-w-[325px] flex-shrink-0 flex"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="group w-full flex flex-col bg-white border border-[#E9E8E4]/60 rounded-[32px] p-4.5 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 text-left cursor-pointer"
              >
                {/* Card Image area with Unsplash image */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/40 shadow-xs mb-5">
                  <img 
                    src={uc.image} 
                    alt={uc.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  
                  {/* Badge Overlay at the top right */}
                  <div className="absolute top-3 right-3 text-white font-sans font-bold text-[9px] bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-xs tracking-wider uppercase">
                    {uc.badge}
                  </div>
                </div>

                {/* Title & Description & CTA */}
                <div className="flex flex-col flex-1 px-1 justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#1890FF] uppercase block mb-1.5">
                      {uc.category}
                    </span>
                    <h3 className="text-slate-950 font-extrabold text-base sm:text-lg mb-2.5 leading-snug tracking-tight">
                      {uc.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-5 min-h-[50px] line-clamp-3">
                      {uc.desc}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[#1890FF] text-xs font-bold mt-auto group/btn">
                    <span>{uc.cta}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
