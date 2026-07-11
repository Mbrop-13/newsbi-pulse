"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NewsletterForm } from "../newsletter-form";

export function LandingCTA() {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push("/ai");
    } else {
      openModal("register");
    }
  };

  return (
    <section className="relative bg-white text-slate-900 border-t border-slate-100">
      {/* Glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      {/* CTA Box */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/60 p-8 md:p-16 text-center shadow-sm">
          {/* Background blurred sphere */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-zinc-200/40 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-950">
              ¿Listo para experimentar el futuro de la información?
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8">
              Únete hoy a Maverlang. Obtén respuestas verificadas, análisis de carteras impulsados por IA y mantente a la vanguardia de las noticias del mercado global.
            </p>

            <button
              onClick={handleCTA}
              className="mx-auto bg-black hover:bg-black/90 text-white font-bold px-8 py-4 rounded-full transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:scale-105 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isAuthenticated ? "Ir al Asistente IA" : "Comenzar Gratis Ahora"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
