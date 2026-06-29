"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface EmpresasHeroProps {
  onScrollToPlans: () => void;
  onScrollToContact: () => void;
}

export function EmpresasHero({ onScrollToPlans, onScrollToContact }: EmpresasHeroProps) {
  return (
    <section className="relative min-h-[88vh] flex flex-col justify-between bg-[#0a0a0f] text-white px-6 md:px-12 lg:px-20 pt-28 pb-16 overflow-hidden font-sans">
      {/* Glow + grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 50% 30%, black 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#1890FF]/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-[#7C3AED]/10 blur-[120px] rounded-full" />
      </div>

      {/* Top nav */}
      <header className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 lg:px-20">
        <Link href="/home" className="flex items-center gap-2.5">
          <span className="text-2xl font-black tracking-tighter italic">Maverlang</span>
          <span className="text-[10px] font-extrabold uppercase bg-[#1890FF] text-white px-2 py-0.5 rounded">Empresas</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <button onClick={onScrollToPlans} className="hover:text-white transition">Planes</button>
          <a href="#beneficios" className="hover:text-white transition">Beneficios</a>
          <a href="#casos" className="hover:text-white transition">Casos de uso</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
          <Link href="/empresas/dashboard" className="hover:text-white transition">Mi organización</Link>
        </nav>
        <button
          onClick={onScrollToContact}
          className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-white/90 transition"
        >
          Agendar demo
        </button>
      </header>

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mx-auto mb-7"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#1890FF]" />
          IA financiera para toda tu organización
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
        >
          Potencia a todo tu equipo<br />
          con <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1890FF] to-[#7C3AED]">inteligencia financiera</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-7 max-w-2xl mx-auto text-lg md:text-xl text-white/60 leading-relaxed"
        >
          Fondos de inversión, corretajes, estudios jurídicos y universidades usan Maverlang
          para auditar mercados en tiempo real, verificar datos y tomar decisiones sin sesgos.
          Un panel de control, una factura, infinitas posibilidades.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={onScrollToPlans}
            className="group inline-flex items-center gap-2 bg-[#1890FF] hover:bg-[#0f7be0] text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-[#1890FF]/30"
          >
            Ver planes para equipos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onScrollToContact}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold px-7 py-3.5 rounded-xl transition-all"
          >
            <Building2 className="w-4 h-4" />
            Hablar con ventas
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex items-center justify-center gap-6 text-xs text-white/40"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Cumplimiento y RLS</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Facturación centralizada</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> SLA dedicado</span>
        </motion.div>
      </div>
    </section>
  );
}