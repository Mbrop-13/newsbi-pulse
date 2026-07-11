"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

export function LandingNavbar() {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 lg:px-20 bg-transparent">
      {/* Left: Brand Logo */}
      <div className="flex items-center shrink-0 -my-4">
        <Logo showText={false} size="md" forceLight={true} />
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#191919]/80">
        <Link href="/noticias" className="hover:text-black transition-colors">
          Noticias
        </Link>
        <Link href="/mercados" className="hover:text-black transition-colors">
          Mercados
        </Link>
        <Link href="/portafolio" className="hover:text-black transition-colors">
          Portafolio
        </Link>
        <Link href="/suscripcion" className="hover:text-black transition-colors">
          Suscripciones
        </Link>
        <Link href="/suscripcion" className="hover:text-black transition-colors">
          Empresas
        </Link>
        <Link href="/?settings=soporte" className="hover:text-black transition-colors">
          Soporte
        </Link>
      </nav>

      {/* Right: CTA Button with Dropdown */}
      <div 
        className="flex items-stretch h-9 md:h-10 relative"
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        {/* Main Comenzar Button */}
        <button
          onClick={() => isAuthenticated ? router.push("/ai") : openModal("login")}
          className="flex items-center gap-1 text-xs md:text-sm font-extrabold bg-black text-white hover:bg-black/90 px-5 rounded-l-xl border-r border-white/10 shadow-sm shadow-black/10 transition-all select-none cursor-pointer"
        >
          Comenzar
        </button>

        {/* Chevron Toggler Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onMouseEnter={() => setIsDropdownOpen(true)}
          className="flex items-center justify-center w-9 bg-black text-white hover:bg-black/90 rounded-r-xl shadow-sm shadow-black/10 transition-all select-none cursor-pointer"
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
              className="absolute top-full mt-1 right-0 w-[260px] bg-[#FAF9F5] border border-[#E9E8E4] rounded-2xl p-5 shadow-2xl z-50 font-sans text-left flex flex-col gap-5"
            >
              {/* Products Section */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Productos</h4>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/ai" 
                      className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-black transition-colors"
                    >
                      <span>Asistente de IA (Maverlang AI)</span>
                      <span className="text-[10px] text-slate-400 font-normal">↗</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/portafolio" 
                      className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-black transition-colors"
                    >
                      <span>Análisis de Portafolio</span>
                      <span className="text-[10px] text-slate-400 font-normal">↗</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/mercados" 
                      className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-black transition-colors"
                    >
                      <span>Mercados & Activos</span>
                      <span className="text-[10px] text-slate-400 font-normal">↗</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/noticias" 
                      className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-black transition-colors"
                    >
                      <span>Feed de Noticias</span>
                      <span className="text-[10px] text-slate-400 font-normal">↗</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/suscripcion" 
                      className="flex items-center justify-between text-[13px] font-bold text-slate-800 hover:text-black transition-colors"
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
                    <span className="font-bold text-slate-800">Maverlang 2.5 Flash</span>
                    <span className="text-[10px] bg-black/10 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Activo</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Maverlang 2.5 Pro</span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-right">Premium</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
