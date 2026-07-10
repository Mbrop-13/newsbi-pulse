"use client";

import { useState, useRef, useEffect } from "react";
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
  Bot,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    id: "google/gemini-3.1-flash-lite-image",
    name: "Nano Banana 2 Lite",
    badge: "Lite",
    icon: "✨ 🍌",
    desc: "Google Gemini 3.1 Flash Lite Image. Modelo de generación rápido y eficiente (consume 15 créditos).",
  },
  {
    id: "google/gemini-3-pro-image",
    name: "Nano Banana Pro",
    badge: "Pro",
    icon: "🍌",
    desc: "Google Gemini 3 Pro Image. Calidad de imagen y razonamiento de primer nivel (consume 55 créditos).",
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function FlowClient() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(FLOW_MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Selector states matching the screenshot design
  const [generationType, setGenerationType] = useState<"imagen" | "video">("imagen");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1" | "3:4" | "9:16">("3:4");
  const [multiplier, setMultiplier] = useState<"1x" | "x2" | "x3" | "x4">("x2");

  const getBaseCost = (modelId: string) => {
    return modelId === "google/gemini-3.1-flash-lite-image" ? 15 : 55;
  };

  const getMultiplierNumber = (mult: string) => {
    switch (mult) {
      case "1x": return 1;
      case "x2": return 2;
      case "x3": return 3;
      case "x4": return 4;
      default: return 1;
    }
  };

  const totalCost = getBaseCost(selectedModel.id) * getMultiplierNumber(multiplier);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt.trim();
    setPrompt("");

    // Append user message
    const userMsgId = Math.random().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userPrompt }]);
    setLoading(true);

    try {
      const res = await fetch("/api/flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          model: selectedModel.id,
          isAgentActive,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al generar la respuesta.");
      }

      const data = await res.json();
      const assistantMsgId = Math.random().toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: data.content },
      ]);
    } catch (err: any) {
      console.error("[FLOW-CLIENT] Error:", err);
      toast.error(err.message || "Error al comunicarse con la IA.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to map ratio string to shape emoji
  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "🖥️";
      case "4:3":
        return "📺";
      case "1:1":
        return "⏹️";
      case "3:4":
        return "📱";
      case "9:16":
        return "📲";
      default:
        return "📱";
    }
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
      <main className="flex-1 flex flex-col p-6 relative z-10 overflow-y-auto hidden-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
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
          </div>
        ) : (
          <div className="max-w-2xl w-full mx-auto space-y-6 py-4 flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col w-full animate-fade-in",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4.5 py-3 rounded-2xl text-xs max-w-[85%] font-medium leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-[#1890FF] text-white rounded-tr-none"
                      : "bg-[#121317] border border-zinc-800/80 text-zinc-200 rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[9px] text-zinc-650 mt-1.5 px-1 font-semibold uppercase tracking-wider">
                  {msg.role === "user" ? "Tú" : "Flow"}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start w-full animate-pulse">
                <div className="px-4.5 py-3 rounded-2xl text-xs max-w-[85%] bg-[#121317] border border-zinc-800/80 text-zinc-500 rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Generando respuestas...</span>
                </div>
                <span className="text-[9px] text-zinc-650 mt-1.5 px-1 font-semibold uppercase tracking-wider">
                  Generando
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
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
                  className="px-3.5 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-855 border border-zinc-800/60 hover:text-white text-zinc-350 text-[11px] font-bold flex items-center gap-2 transition-all duration-200 select-none cursor-pointer leading-none"
                >
                  <span className="truncate">{selectedModel.icon} {selectedModel.name}</span>
                  <span className="text-[10px] text-zinc-400 font-bold leading-none flex items-center gap-1 shrink-0">
                    {getAspectRatioIcon(aspectRatio)} {multiplier}
                  </span>
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
                        className="absolute right-0 bottom-full mb-3 w-[22rem] bg-[#16171b] border border-zinc-800/90 rounded-[28px] shadow-2xl p-4.5 z-40 text-white flex flex-col gap-4.5 select-none font-sans"
                      >
                        {/* 1. Tabs at the top (Imagen / Vídeo) */}
                        <div className="flex bg-[#0d0e11] rounded-2xl p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setGenerationType("imagen")}
                            className={cn(
                              "flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer",
                              generationType === "imagen"
                                ? "bg-[#2b2d35] text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Imagen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenerationType("video")}
                            className={cn(
                              "flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer",
                              generationType === "video"
                                ? "bg-[#2b2d35] text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span>Vídeo</span>
                          </button>
                        </div>

                        {/* 2. Aspect Ratio Row */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { id: "16:9", label: "16:9", icon: <rect x="2" y="6" width="20" height="12" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "4:3", label: "4:3", icon: <rect x="3" y="5" width="18" height="14" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "1:1", label: "1:1", icon: <rect x="4" y="4" width="16" height="16" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "3:4", label: "3:4", icon: <rect x="5" y="3" width="14" height="18" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "9:16", label: "9:16", icon: <rect x="6" y="2" width="12" height="20" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                          ].map((item) => {
                            const active = aspectRatio === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setAspectRatio(item.id as any)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-2xl gap-2 transition-all cursor-pointer aspect-square",
                                  active
                                    ? "bg-[#2b2d35] text-white border border-zinc-700/30"
                                    : "text-zinc-500 hover:text-zinc-350 hover:bg-[#1a1c22]/50"
                                )}
                              >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">{item.icon}</svg>
                                <span className="text-[10px] font-black">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* 3. Multiplier Row (1x, x2, x3, x4) */}
                        <div className="grid grid-cols-4 bg-[#0d0e11] rounded-2xl p-1 gap-1">
                          {["1x", "x2", "x3", "x4"].map((m) => {
                            const active = multiplier === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMultiplier(m as any)}
                                className={cn(
                                  "py-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer",
                                  active
                                    ? "bg-[#2b2d35] text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>

                        {/* 4. Model Selection Dropdown Field */}
                        <div className="relative">
                          <select
                            value={selectedModel.id}
                            onChange={(e) => {
                              const found = FLOW_MODELS.find(m => m.id === e.target.value);
                              if (found) setSelectedModel(found);
                            }}
                            className="w-full bg-[#0d0e11] border border-zinc-800/80 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-200 outline-none cursor-pointer appearance-none pr-10 hover:bg-zinc-950 transition-colors"
                          >
                            {FLOW_MODELS.map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#121317] text-zinc-300">
                                {m.icon} {m.name} ({m.badge})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>

                        {/* 5. Points cost indicator */}
                        <div className="text-center py-1">
                          <p className="text-[11px] text-zinc-500 font-semibold leading-none">
                            La generación consumirá <span className="underline decoration-zinc-650 decoration-wavy underline-offset-2">{totalCost} puntos</span>
                          </p>
                        </div>

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  prompt.trim() && !loading
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
