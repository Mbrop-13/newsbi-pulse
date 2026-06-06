"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";

interface LandingHeroProps {
  onScrollToFeatures: () => void;
}

export function LandingHero({ onScrollToFeatures }: LandingHeroProps) {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();

  // Typewriter effect state
  const words = ["inversiones", "decisiones", "oportunidades"];
  const [wordIndex, setWordIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subIndex === words[wordIndex].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000); // Pause on full word
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 60 : 120); // Faster erasing

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, wordIndex]);

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push("/ai");
    } else {
      openModal("register");
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-between bg-white text-[#191919] px-6 md:px-12 lg:px-20 pt-28 pb-10 select-none font-sans overflow-hidden">
      {/* Top Floating Navbar */}
      <header className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 lg:px-20 bg-transparent">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0 -my-4">
          <Logo showText={false} size="xl" />
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#191919]/80">
          <Link href="/noticias" className="hover:text-[#1890FF] transition-colors">
            Noticias
          </Link>
          <Link href="/mercados" className="hover:text-[#1890FF] transition-colors">
            Mercados
          </Link>
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#1890FF] transition-colors">
            <span>Portafolio</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#1890FF] transition-colors">
            <span>Suscripciones</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </div>
          <Link href="/soporte" className="hover:text-[#1890FF] transition-colors">
            Soporte
          </Link>
        </nav>

        {/* Right: CTA Button with Dropdown */}
        <div 
          className="flex items-center relative py-2"
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          {/* Main Comenzar Button */}
          <button
            onClick={() => isAuthenticated ? router.push("/ai") : openModal("login")}
            className="flex items-center gap-1 text-xs md:text-sm font-extrabold bg-[#1890FF] text-white hover:bg-[#1890FF]/90 px-5 py-2.5 rounded-l-xl border-r border-[#1890FF]/25 shadow-sm shadow-[#1890FF]/10 transition-all select-none cursor-pointer"
          >
            Comenzar
          </button>

          {/* Chevron Toggler Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onMouseEnter={() => setIsDropdownOpen(true)}
            className="flex items-center justify-center w-9 h-[38px] md:h-[40px] bg-[#1890FF] text-white hover:bg-[#1890FF]/90 rounded-r-xl shadow-sm shadow-[#1890FF]/10 transition-all select-none cursor-pointer"
            aria-label="Opciones de la Plataforma"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu - Framer Motion */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-[38px] md:top-[40px] right-0 w-[260px] bg-[#FAF9F5] border border-[#E9E8E4] rounded-2xl p-5 shadow-2xl z-50 font-sans text-left flex flex-col gap-5"
              >
                {/* Products Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Productos</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link 
                        href="/ai" 
                        className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors"
                      >
                        <span>Asistente de IA (R-AI)</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/portafolio" 
                        className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors"
                      >
                        <span>Análisis de Portafolio</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/mercados" 
                        className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors"
                      >
                        <span>Mercados & Activos</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/noticias" 
                        className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors"
                      >
                        <span>Feed de Noticias</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/suscripcion" 
                        className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors"
                      >
                        <span>Suscripciones Premium</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#E9E8E4]" />

                {/* Models Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Modelos de IA</h4>
                  <ul className="space-y-2.5 text-[13px] font-semibold text-slate-700">
                    <li className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Reclu 2.5 Flash</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Activo</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Reclu 2.5 Pro</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-right">Premium</span>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#E9E8E4]" />

                {/* Log In Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Acceso</h4>
                  <ul className="space-y-2">
                    <li>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openModal("login");
                        }}
                        className="w-full flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors text-left cursor-pointer"
                      >
                        <span>Iniciar Sesión</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openModal("register");
                        }}
                        className="w-full flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-[#1890FF] transition-colors text-left cursor-pointer"
                      >
                        <span>Registrarse</span>
                        <span className="text-[10px] text-slate-400 font-normal">↗</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center my-auto pt-10">
        
        {/* Left Column: Big Headline - font-bold instead of font-black, and block span for word */}
        <div className="lg:col-span-7">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-[#191919] min-h-[180px] sm:min-h-[220px] md:min-h-[280px]">
            Agentes de{" "}
            <span className="inline-block border-b-[3px] md:border-b-[4px] border-[#1890FF] pb-0.5 md:pb-1 text-[#1890FF] font-bold">
              IA
            </span>{" "}
            que potencian tus
            <span className="block mt-3 border-b-[3px] md:border-b-[4px] border-[#1890FF] pb-0.5 md:pb-1 text-[#1890FF] font-bold max-w-fit">
              {words[wordIndex].substring(0, subIndex)}
              <span className="inline-block w-[3px] h-[32px] md:h-[50px] bg-[#1890FF] ml-1.5 animate-pulse" />
            </span>
          </h1>
        </div>

        {/* Right Column: Paragraph with Anthropic Serif font family and blue button */}
        <div className="lg:col-span-5 flex flex-col items-start justify-center">
          <p 
            className="text-lg md:text-xl font-medium text-[#191919]/90 leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            La inteligencia artificial transformará nuestra relación con la información financiera. Reclu es una plataforma de análisis y veracidad autónoma dedicada a potenciar tu portafolio y entregarte noticias sin sesgos ni desinformación.
          </p>

          <button
            onClick={handleCTA}
            className="group flex items-center justify-center gap-2 bg-[#1890FF] text-white hover:bg-[#1890FF]/90 font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-[#1890FF]/25 cursor-pointer"
          >
            {isAuthenticated ? "Abrir Asistente R-AI" : "Comenzar Gratis"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* spacer height only, line removed */}
      <div className="w-full h-8" />
    </section>
  );
}
