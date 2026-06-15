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

      {/* Futuristic Light Footer */}
      <footer className="border-t border-slate-200/80 pt-20 pb-12 bg-slate-50/50 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">
            
            {/* Brand Column */}
            <div className="col-span-2 flex flex-col items-start">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/freepik__background__94196.png?v=1771922713" 
                  alt="Maverlang Logo" 
                  className="h-10 w-auto object-contain opacity-90"
                />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">| Inteligencia Artificial Financiera</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-sm">
                Sistemas multi-agente de IA dedicados al análisis bursátil, verificación de hechos macroeconómicos y procesamiento de lenguaje natural en tiempo real para optimizar portafolios de inversión.
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-black hover:border-black transition-all flex items-center justify-center text-slate-500 shadow-sm"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-black hover:border-black transition-all flex items-center justify-center text-slate-500 shadow-sm"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-black hover:border-black transition-all flex items-center justify-center text-slate-500 shadow-sm"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a 
                  href="mailto:info@maverlang.cl" 
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-black hover:border-black transition-all flex items-center justify-center text-slate-500 shadow-sm"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 1: Secciones */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Secciones</h4>
              <ul className="space-y-2.5">
                <li><Link href="/noticias" className="text-sm text-slate-500 hover:text-black transition-colors">Principal</Link></li>
                <li><Link href="/finanzas" className="text-sm text-slate-500 hover:text-black transition-colors">Finanzas</Link></li>
                <li><Link href="/inversiones" className="text-sm text-slate-500 hover:text-black transition-colors">Inversiones</Link></li>
                <li><Link href="/economia" className="text-sm text-slate-500 hover:text-black transition-colors">Economía</Link></li>
                <li><Link href="/tech-global" className="text-sm text-slate-500 hover:text-black transition-colors">Tech Global</Link></li>
              </ul>
            </div>

            {/* Column 2: Explorar */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Explorar</h4>
              <ul className="space-y-2.5">
                <li><Link href="/para-ti" className="text-sm text-slate-500 hover:text-black transition-colors">Para Ti</Link></li>
                <li><Link href="/breaking" className="text-sm text-slate-500 hover:text-black transition-colors">Breaking</Link></li>
                <li><Link href="/mercados" className="text-sm text-slate-500 hover:text-black transition-colors">Mercados</Link></li>
                <li><Link href="/predicciones" className="text-sm text-slate-500 hover:text-black transition-colors">Predicciones</Link></li>
                <li><Link href="/ai" className="text-sm text-slate-500 hover:text-black transition-colors">Copiloto IA</Link></li>
              </ul>
            </div>

            {/* Column 3: Tu Cuenta */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Tu Cuenta</h4>
              <ul className="space-y-2.5">
                <li><Link href="/profile" className="text-sm text-slate-500 hover:text-black transition-colors">Mi Perfil</Link></li>
                <li><Link href="/guardados" className="text-sm text-slate-500 hover:text-black transition-colors">Guardados</Link></li>
                <li><Link href="/lista-lectura" className="text-sm text-slate-500 hover:text-black transition-colors">Lista de Lectura</Link></li>
                <li><Link href="/suscripcion" className="text-sm text-slate-500 hover:text-black transition-colors">Suscripción</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/privacidad" className="text-sm text-slate-500 hover:text-black transition-colors">Privacidad</Link></li>
                <li><Link href="/terminos" className="text-sm text-slate-500 hover:text-black transition-colors">Términos</Link></li>
                <li><Link href="/soporte" className="text-sm text-slate-500 hover:text-black transition-colors">Soporte</Link></li>
              </ul>
            </div>

          </div>

          {/* Newsletter Box inside footer */}
          <div className="border-t border-slate-200/80 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md text-left">
              <h4 className="text-sm font-bold text-slate-800 mb-1">Suscríbete a nuestro boletín</h4>
              <p className="text-xs text-slate-500">Recibe análisis verificados y alertas macroeconómicas semanales en tu bandeja de entrada.</p>
            </div>
            <div className="w-full md:max-w-xs">
              <NewsletterForm variant="footer" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-200/80 my-6" />

          {/* Copyright Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} Maverlang. Todos los derechos reservados.
            </p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> en Chile 🇨🇱
            </p>
          </div>

        </div>
      </footer>
    </section>
  );
}
