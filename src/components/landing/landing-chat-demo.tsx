"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Send, Globe, ShieldCheck, LineChart, Terminal, ArrowRight } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  tool?: {
    name: string;
    status: "running" | "completed";
    result: string;
    type: "search" | "chart" | "verify";
  };
}

const PRESETS = [
  {
    label: "📊 Analizar portafolio tech",
    prompt: "Por favor, analiza mi portafolio de tecnología y las noticias macro de hoy.",
    response: "He analizado tu portafolio tecnológico. El sector de semiconductores muestra volatilidad debido a regulaciones comerciales globales. He optimizado tus alertas de noticias clave para NVIDIA y AMD.",
    tool: {
      name: "portfolio_analyzer",
      result: "Portafolio Tech: 4 activos analizados. Riesgo sectorial moderado-alto. Correlación con IPC: 0.85.",
      type: "chart" as const
    }
  },
  {
    label: "🔍 Verificar noticia sobre IA",
    prompt: "¿Es verdad que se aprobó una regulación de urgencia para modelos fundacionales en Europa?",
    response: "Verificado. La Unión Europea aprobó la versión consolidada del Acta de IA con votación unánime. Los modelos fundacionales con más de 10^25 FLOPS deberán cumplir con protocolos de reporte estrictos de seguridad y consumo energético.",
    tool: {
      name: "verify_claim",
      result: "Veracidad: 95% (Confirmado por fuentes del Parlamento Europeo). Sesgo: Neutro.",
      type: "verify" as const
    }
  },
  {
    label: "🌐 Resumen de tasas de interés",
    prompt: "Busca las últimas noticias sobre la decisión de tasas de interés de la Fed.",
    response: "La Reserva Federal ha decidido mantener las tasas estables en este ciclo, pero ha indicado que la inflación sigue siendo persistente. Los mercados reaccionaron de forma mixta con subidas en bonos soberanos.",
    tool: {
      name: "web_search",
      result: "Encontradas 12 noticias de Reuters, Bloomberg y Financial Times en los últimos 60 minutos.",
      type: "search" as const
    }
  }
];

export function LandingChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola. Soy Maverlang AI, tu copiloto financiero e informativo impulsado por agentes de inteligencia artificial. Selecciona uno de los siguientes análisis rápidos para ver cómo opero en tiempo real."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();

  const handlePresetClick = (idx: number) => {
    if (isTyping) return;
    setActivePreset(idx);
    const preset = PRESETS[idx];

    // Append user message
    const newMessages = [
      ...messages,
      { role: "user" as const, content: preset.prompt }
    ];
    setMessages(newMessages);
    setIsTyping(true);

    // Simulate agent steps
    setTimeout(() => {
      // Show tool starting
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: "",
          tool: {
            name: preset.tool.name,
            status: "running",
            result: "",
            type: preset.tool.type
          }
        }
      ]);

      setTimeout(() => {
        // Complete tool and type response
        setMessages([
          ...newMessages,
          {
            role: "assistant" as const,
            content: preset.response,
            tool: {
              name: preset.tool.name,
              status: "completed",
              result: preset.tool.result,
              type: preset.tool.type
            }
          }
        ]);
        setIsTyping(false);
      }, 1500);

    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCTAClick = () => {
    if (isAuthenticated) {
      router.push("/ai");
    } else {
      openModal("register");
    }
  };

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative overflow-hidden border-b border-slate-100">
      {/* Decorative gradients */}
      <div className="absolute top-[20%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-slate-200/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] rounded-full bg-black/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-black uppercase mb-3">
            MOCKUP INTERACTIVO
          </h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Interacción con agentes en tiempo real
          </p>
          <p className="mt-4 text-slate-500 text-base md:text-lg">
            Maverlang AI no solo conversa; ejecuta herramientas de búsqueda, analiza datos complejos y valida afirmaciones al instante.
          </p>
        </div>

        {/* Chat Console Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Left panel: Available Agents & Prompt Options */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Terminal className="w-5 h-5 text-black" />
                <span className="text-xs uppercase font-extrabold text-slate-700 tracking-wider">Agentes Disponibles</span>
              </div>

              {/* Fake Active Agents */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="relative">
                    <Globe className="w-5 h-5 text-black" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">SearchAgent v3.1</h4>
                    <p className="text-[10px] text-slate-400">Conexión web en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="relative">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">VerifierAgent</h4>
                    <p className="text-[10px] text-slate-400">Verificación de sesgos y fuentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="relative">
                    <LineChart className="w-5 h-5 text-purple-500" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PortfolioAgent</h4>
                    <p className="text-[10px] text-slate-400">Indicadores de activos agregados</p>
                  </div>
                </div>
              </div>

              {/* Prompt selection */}
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">Haz una prueba</span>
              <div className="space-y-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(idx)}
                    disabled={isTyping}
                    className={`w-full text-left text-xs font-semibold p-3.5 rounded-xl border transition-all ${
                      activePreset === idx
                        ? "bg-black/10 border-black text-black shadow-xs"
                        : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/50 hover:border-slate-200"
                    } disabled:opacity-50`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA bottom */}
            <div className="pt-4 border-t border-slate-100 mt-6 lg:mt-0">
              <button
                onClick={handleCTAClick}
                className="w-full bg-black hover:bg-black/90 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Pruébalo con tu cuenta
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right panel: Live Chat Terminal */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
            {/* Terminal header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/10 border border-black/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                    Asistente Maverlang AI
                    <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    En línea
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[360px] md:max-h-[400px]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-black/10 text-neutral-850 border border-black/20 rounded-tr-none"
                        : "bg-slate-100 text-slate-800 border border-slate-200/40 rounded-tl-none"
                    }`}
                  >
                    {msg.content}

                    {/* Tool Box inside message */}
                    {msg.tool && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                        <div className="flex items-center justify-between mb-1.5 text-slate-500">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Terminal className="w-3.5 h-3.5 text-black animate-pulse" />
                            Tool: {msg.tool.name}
                          </span>
                          <span className={msg.tool.status === "completed" ? "text-emerald-600 font-bold" : "text-amber-500 font-bold animate-pulse"}>
                            {msg.tool.status === "completed" ? "SUCCESS" : "RUNNING..."}
                          </span>
                        </div>
                        {msg.tool.status === "completed" && (
                          <div className="text-slate-600 text-[11px] leading-relaxed border-t border-slate-200 pt-1.5 mt-1.5">
                            {msg.tool.result}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && messages[messages.length - 1].content === "" && (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                  Agentes ejecutando herramientas complejas...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Fake input bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 items-center">
              <input
                type="text"
                disabled
                placeholder="Haz click en una de las pruebas de la izquierda..."
                className="flex-1 bg-white text-xs text-slate-450 rounded-xl px-4 py-3.5 border border-slate-200 focus:outline-none cursor-not-allowed"
              />
              <button
                disabled
                className="bg-slate-200 text-slate-400 p-3.5 rounded-xl cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
