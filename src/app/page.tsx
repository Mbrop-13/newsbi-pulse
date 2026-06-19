"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { Logo } from "@/components/logo";
import { ArrowRight, Sparkles, Code2, Rocket, Palette } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const { setWebBuilderMode } = useWebBuilderStore();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Redirigir al área de chat con el prompt inicial
    // Si no está autenticado, podría guardarse en localStorage, pero por ahora pedimos login o lo mandamos a /ai para que el middleware maneje.
    // Lo más sencillo es enviarlo a /ai con un query param, o solo a /ai si no queremos complicar el estado inicial
    // Por ahora, activaremos el modo builder y redirigiremos.
    setWebBuilderMode(true);
    
    // For simplicity, we just redirect to /ai. The user can type it again, or we can use localStorage to pass the initial prompt.
    localStorage.setItem("maverlang_initial_prompt", prompt);
    
    if (isAuthenticated) {
      router.push("/ai");
    } else {
      openModal("login");
    }
  };

  const suggestions = [
    { text: "Un dashboard de finanzas oscuro", icon: <Code2 className="w-3.5 h-3.5" /> },
    { text: "Landing page para una startup", icon: <Rocket className="w-3.5 h-3.5" /> },
    { text: "App de notas minimalista", icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1890FF]/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1890FF]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 lg:px-20">
        <div className="flex items-center">
          <Logo showText={true} size="md" />
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button 
              onClick={() => router.push("/ai")}
              className="text-sm font-semibold hover:text-[#1890FF] transition-colors"
            >
              Ir a la App
            </button>
          ) : (
            <>
              <button 
                onClick={() => openModal("login")}
                className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
              >
                Ingresar
              </button>
              <button 
                onClick={() => openModal("register")}
                className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-white/90 transition-all"
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-4xl mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#1890FF]" />
            <span>El primer Web Builder impulsado por Agentes Autónomos</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            ¿Qué vas a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1890FF] to-purple-500">construir</span> hoy?
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto font-medium">
            Describe la plataforma web que imaginas y nuestra IA la codificará, diseñará y desplegará por ti en segundos.
          </p>

          {/* Big Input Area */}
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1890FF]/30 to-purple-500/30 rounded-3xl blur-md opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-[#15161A] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-white/20">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Un dashboard administrativo para mi tienda online..."
                className="w-full bg-transparent text-white placeholder-white/40 px-4 py-4 md:py-5 outline-none text-lg"
              />
              <button 
                type="submit"
                disabled={!prompt.trim()}
                className="bg-white text-black p-3 md:p-4 rounded-xl ml-2 shrink-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </form>

          {/* Suggestions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {suggestions.map((sugg, i) => (
              <button
                key={i}
                onClick={() => setPrompt(sugg.text)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
              >
                {sugg.icon}
                {sugg.text}
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-white/40 text-sm font-medium">
        <p>© {new Date().getFullYear()} Maverlang AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
