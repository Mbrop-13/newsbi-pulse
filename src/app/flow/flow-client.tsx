"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sliders,
  Plus,
  HelpCircle,
  Settings,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Layers,
  Bot,
  Paperclip,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Model option interface
interface ModelOption {
  id: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
}

const FLOW_MODELS: ModelOption[] = [
  {
    id: "nano-banana",
    name: "Nano Banana 2",
    badge: "x4",
    icon: "✨ 🍌",
    desc: "Modelo rápido especializado en contenido multimedia y animaciones cortas.",
  },
  {
    id: "veo-2-turbo",
    name: "Veo 2 Turbo",
    badge: "x8",
    icon: "🎬 🚀",
    desc: "Generador de video hiper-realista con alta tasa de cuadros.",
  },
  {
    id: "imagen-3",
    name: "Imagen 3 Ultra",
    badge: "HD",
    icon: "🎨 💎",
    desc: "Modelo insignia para renders artísticos y diseño de personajes.",
  },
  {
    id: "midjourney",
    name: "Midjourney v6.1",
    badge: "Ultra",
    icon: "🔥 ⚡",
    desc: "Estética cinematográfica y texturas hiper-detalladas.",
  },
];

export default function FlowClient() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(FLOW_MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isAgentActive, setIsAgentActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    toast.success(`Prompt enviado a ${selectedModel.name}: "${prompt}"`);
    setPrompt("");
  };

  return (
    <div className="flex-1 min-h-screen bg-[#07080a] text-white flex flex-col relative overflow-hidden font-sans select-none">
      {/* Background Subtle Gradient Grids */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(24,144,255,0.06),transparent)]" />
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Top Header Section */}
      <header className="h-16 shrink-0 border-b border-zinc-900/60 px-6 flex items-center justify-between gap-4 z-15">
        {/* Left: Search Bar & Filters */}
        <div className="flex-1 max-w-md relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar multimedia, caracteres..."
            className="w-full bg-[#111216] border border-zinc-800/80 rounded-full pl-9 pr-10 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700/80 focus:ring-1 focus:ring-zinc-700/80 transition-all duration-200 font-semibold"
          />
          <button 
            type="button"
            onClick={() => toast.info("Configuraciones de filtro avanzadas")}
            className="absolute right-3.5 p-0.5 hover:text-[#1890FF] text-zinc-500 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick actions, PRO indicator & user */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            onClick={() => toast.info("Añadir nuevo recurso")}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            onClick={() => toast.info("Ayuda y Documentación")}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            onClick={() => toast.info("Ajustes de Flow")}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            onClick={() => toast.info("Más opciones")}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          {/* Premium PRO badge */}
          <span className="inline-flex items-center bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider select-none leading-none h-5">
            Pro
          </span>

          {/* Dummy User Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1890FF] to-indigo-600 text-white flex items-center justify-center text-xs font-black select-none shadow-md shrink-0">
            M
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        <div className="flex flex-col items-center max-w-sm">
          {/* Retro Pixelated Flower SVG */}
          <div className="w-16 h-16 text-zinc-600 dark:text-zinc-500 mb-6 flex items-center justify-center animate-pulse">
            <svg viewBox="0 0 24 24" className="w-16 h-16" fill="currentColor">
              {/* Petal Center */}
              <rect x="11" y="11" width="2" height="2" />
              {/* Top Petal */}
              <rect x="11" y="8" width="2" height="2" />
              <rect x="11" y="6" width="2" height="2" />
              {/* Bottom Petal */}
              <rect x="11" y="14" width="2" height="2" />
              <rect x="11" y="16" width="2" height="2" />
              {/* Left Petal */}
              <rect x="8" y="11" width="2" height="2" />
              <rect x="6" y="11" width="2" height="2" />
              {/* Right Petal */}
              <rect x="14" y="11" width="2" height="2" />
              <rect x="16" y="11" width="2" height="2" />
              {/* Diagonals */}
              <rect x="9" y="9" width="2" height="2" />
              <rect x="13" y="9" width="2" height="2" />
              <rect x="9" y="13" width="2" height="2" />
              <rect x="13" y="13" width="2" height="2" />
              {/* Stem (Green) */}
              <rect x="11" y="18" width="2" height="6" fill="#10B981" />
              {/* Stem Leaves */}
              <rect x="9" y="20" width="2" height="1" fill="#10B981" />
              <rect x="13" y="21" width="2" height="1" fill="#10B981" />
            </svg>
          </div>

          <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 tracking-wide select-none leading-relaxed px-4">
            Empieza a crear o arrastra y suelta contenido multimedia
          </h3>
        </div>
      </main>

      {/* Floating Prompt Chat Panel at the bottom */}
      <div className="w-full max-w-xl mx-auto px-4 pb-6 shrink-0 z-20">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-[#121317] border border-zinc-800/80 rounded-3xl p-3 flex items-center justify-between gap-3 shadow-2xl focus-within:border-zinc-700/80 transition-all duration-200 relative">
            
            {/* Left Options group */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Attach/Upload Button */}
              <button
                type="button"
                onClick={() => toast.info("Carga de archivos multimedia (Próximamente)")}
                className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Agent Pill Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isAgentActive;
                  setIsAgentActive(next);
                  toast.success(next ? "Modo Agente activado" : "Modo Agente desactivado");
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 select-none border ${
                  isAgentActive 
                    ? "bg-[#1890FF]/15 text-[#1890FF] border-[#1890FF]/30" 
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800/60 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agente</span>
              </button>
            </div>

            {/* Prompt input field */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="¿Qué quieres crear?"
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none py-1.5 font-medium min-w-0"
            />

            {/* Right Options group */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {/* Image/Video LLM Selector Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 hover:text-white text-zinc-350 text-[10px] font-bold flex items-center gap-1 transition-all duration-200 select-none cursor-pointer"
                >
                  <span className="truncate">{selectedModel.icon} {selectedModel.name}</span>
                  <span className="text-amber-500 border border-amber-500/30 px-1 rounded-sm text-[8px] scale-90">{selectedModel.badge}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
                </button>

                {/* Model Selector Dropdown */}
                <AnimatePresence>
                  {showModelDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowModelDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 bottom-full mb-2 w-72 bg-[#121317] border border-zinc-800/80 rounded-2xl shadow-2xl p-2 z-40 space-y-1"
                      >
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2.5 py-1">Seleccionar Modelo</p>
                        {FLOW_MODELS.map((m) => {
                          const selected = m.id === selectedModel.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m);
                                setShowModelDropdown(false);
                                toast.success(`Modelo cambiado a ${m.name}`);
                              }}
                              className={`w-full flex flex-col text-left p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                selected
                                  ? "bg-zinc-850/80 border border-zinc-700/50"
                                  : "hover:bg-zinc-900/60 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                                  <span>{m.icon}</span>
                                  {m.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-500 border border-amber-500/20 px-1 rounded text-[7px] font-black leading-none py-0.5">{m.badge}</span>
                                  {selected && <Check className="w-3.5 h-3.5 text-[#1890FF]" />}
                                </div>
                              </div>
                              <p className="text-[9px] text-zinc-500 leading-relaxed mt-1 font-medium">{m.desc}</p>
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  prompt.trim()
                    ? "bg-[#1890FF] hover:bg-blue-600 text-white active:scale-90 shadow-md cursor-pointer"
                    : "bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed"
                }`}
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </form>

        {/* Disclaimer note */}
        <p className="text-center text-[9px] text-zinc-600 dark:text-zinc-500 mt-3 tracking-wide font-medium select-none">
          Maverlang Flow puede cometer errores, así que comprueba sus respuestas.
        </p>
      </div>
    </div>
  );
}
