"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const USE_CASES = [
  {
    slug: "sitio-web-1",
    category: "SITIO WEB",
    title: "Vestra — Plataforma de Inversión Social",
    desc: "Landing page premium para trading de acciones y criptomonedas, con gráficos interactivos y animaciones fluidas.",
    image: "https://mail.programbi.com/uploads/Captura-de-pantalla-2026-07-11-071843.png",
    badge: "Web First + Tailwind",
    cta: "Ver ejemplo web"
  },
  {
    slug: "sitio-web-2",
    category: "SITIO WEB",
    title: "Lumen — Agencia de Marketing Creativa",
    desc: "Sitio web corporativo moderno para agencias, con efectos de glassmorphism y transiciones suaves.",
    image: "https://mail.programbi.com/uploads/Captura-de-pantalla-2026-07-11-071908.png",
    badge: "Next.js + Framer Motion",
    cta: "Ver ejemplo web"
  },
  {
    slug: "sitio-web-3",
    category: "SITIO WEB",
    title: "Nocturne — Landing Page de Club Nocturno",
    desc: "Página web premium con temática oscura y luces de neón dinámicas, ideal para eventos de entretenimiento.",
    image: "https://mail.programbi.com/uploads/Captura-de-pantalla-2026-07-11-071939.png",
    badge: "Tailwind + Neon Glow",
    cta: "Ver ejemplo web"
  },
  {
    slug: "aplicacion-1",
    category: "APLICACIÓN MÓVIL",
    title: "NEXUS Blocks — Tetris Arcade",
    desc: "Juego móvil de Tetris moderno y pulido, con físicas clásicas mejoradas, controles táctiles y sintetizador de sonido.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    badge: "HTML5 + Web Audio API",
    cta: "Jugar demo móvil"
  },
  {
    slug: "aplicacion-2",
    category: "APLICACIÓN MÓVIL",
    title: "Agora — E-commerce Móvil de Próxima Generación",
    desc: "Aplicación móvil de comercio electrónico con grid de productos de dos columnas y flujo de checkout optimizado.",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&w=600&q=80",
    badge: "Alpine.js + Tailwind",
    cta: "Probar demo e-commerce"
  },
  {
    slug: "aplicacion-3",
    category: "APLICACIÓN MÓVIL",
    title: "Clarity Invest — Mobile Wallet",
    desc: "Dashboard financiero para dispositivos móviles, con carrusel de inversiones y flujos de compra interactivos.",
    image: "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&w=600&q=80",
    badge: "React Native + Charts",
    cta: "Probar demo financiera"
  },
  {
    slug: "multiplataforma-1",
    category: "MULTIPLATAFORMA",
    title: "SplitWise Pro — Finanzas Compartidas",
    desc: "Aplicación adaptativa para dividir gastos y presupuestos en móviles y de escritorio de forma sincronizada.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    badge: "Multiplatform + Realtime",
    cta: "Ver ejemplo multiplataforma"
  },
  {
    slug: "multiplataforma-2",
    category: "MULTIPLATAFORMA",
    title: "Circle — Red Social Familiar",
    desc: "Red social privada para compartir fotos, chats e hitos familiares en todos tus dispositivos.",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80",
    badge: "Flutter + Firebase",
    cta: "Ver ejemplo multiplataforma"
  },
  {
    slug: "multiplataforma-3",
    category: "MULTIPLATAFORMA",
    title: "MentorMatch — Plataforma de Mentoría",
    desc: "Conecta mentores y aprendices con emparejamiento inteligente basado en IA y videollamadas integradas.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    badge: "React + Node.js",
    cta: "Ver ejemplo multiplataforma"
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
              className="min-w-[280px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 flex"
            >
              <motion.div
                whileHover={{ scale: 1.10, y: -8 }}
                whileTap={{ scale: 1.10, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ originX: index === 0 ? 0 : index === USE_CASES.length - 1 ? 1 : 0.5 }}
                className="group w-full h-full flex flex-col justify-between"
              >
                {/* Card Image area with Unsplash image */}
                <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/40 shadow-sm transition-all duration-300 group-hover:shadow-md mb-5">
                  <img 
                    src={uc.image} 
                    alt={uc.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                  
                  {/* Badge Overlay at the top right */}
                  <div className="absolute top-4 right-4 text-white font-sans font-bold text-[11px] bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs tracking-wider">
                    {uc.badge}
                  </div>
                </div>

                {/* Title & Link below */}
                <div className="flex flex-col items-start px-1">
                  <span className="text-[11px] font-extrabold tracking-widest text-black uppercase mb-2">
                    {uc.category}
                  </span>
                  <h3 className="text-slate-950 font-black text-lg md:text-xl mb-2 leading-snug tracking-tight transition-all duration-300 group-hover:text-black">
                    {uc.title}
                  </h3>
                  <p className="text-slate-500 text-[13px] font-medium mb-4 leading-relaxed min-h-[64px] transition-all duration-300 group-hover:text-slate-700">
                    {uc.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-black text-xs font-bold">
                    {uc.cta} <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
