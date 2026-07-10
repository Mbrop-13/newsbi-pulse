"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Sparkles, Laptop, TrendingUp, Check, Loader2, ArrowRight, User, X } from "lucide-react";

function MovingStarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const stars: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
    }> = [];

    // Pre-fill starry sky particles
    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 0.25 + 0.05,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Solid pitch black base
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Render star particles
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Animate particles downwards
        star.y += star.speedY;

        // Reset particles looping
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none rounded-[33px]" />;
}

export function OnboardingDialog() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const hasCompletedSetup = useAssistantStore((s) => s.hasCompletedSetup);
  const completeSetup = useAssistantStore((s) => s.completeSetup);
  const saveToSupabase = useAssistantStore((s) => s.saveToSupabase);
  const isLoadingConfig = useAssistantStore((s) => s.isLoadingConfig);
  
  const getUserName = useAssistantStore((s) => s.getUserName);
  const setUserName = useAssistantStore((s) => s.setUserName);
  
  const getPrimaryInterest = useAssistantStore((s) => s.getPrimaryInterest);
  const setPrimaryInterest = useAssistantStore((s) => s.setPrimaryInterest);

  const [step, setStep] = useState(1);
  const [localName, setLocalName] = useState("");
  const [localInterest, setLocalInterest] = useState<"crear_apps" | "finanzas" | "ambas" | "">("");
  const [saving, setSaving] = useState(false);

  // Sync initial values when store completes loading
  useEffect(() => {
    if (!isLoadingConfig) {
      setLocalName(getUserName());
      setLocalInterest((getPrimaryInterest() as any) || "");
    }
  }, [isLoadingConfig, getUserName, getPrimaryInterest]);

  // Display only if authenticated, config has finished loading, and setup is not completed
  if (!isAuthenticated || isLoadingConfig || hasCompletedSetup) {
    return null;
  }

  const handleNext = () => {
    setUserName(localName.trim());
    setStep(2);
  };

  const handleSave = async (interestVal?: "crear_apps" | "finanzas" | "ambas" | "") => {
    const finalInterest = interestVal !== undefined ? interestVal : localInterest;
    setSaving(true);
    try {
      setUserName(localName.trim());
      setPrimaryInterest(finalInterest);
      completeSetup();
      if (user?.id) {
        await saveToSupabase(user.id);
      }
    } catch (err) {
      console.error("Error saving onboarding preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAll = async () => {
    setSaving(true);
    try {
      completeSetup();
      if (user?.id) {
        await saveToSupabase(user.id);
      }
    } catch (err) {
      console.error("Error skipping onboarding preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      {/* Outer Border Layer: Pure white rectangle wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="w-full max-w-lg bg-white p-[3px] rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        {/* Starry Background (Black space inner wrapper) */}
        <div className="rounded-[33px] overflow-hidden relative bg-black w-full min-h-[380px] md:min-h-[420px] flex flex-col items-center justify-center p-6 md:p-8 select-none">
          <MovingStarsBackground />

          {/* Floating close X icon in the top right of the starry container */}
          <button
            type="button"
            onClick={handleSkipAll}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-20 active:scale-95 cursor-pointer shadow-sm"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Foreground Main Card Panel */}
          <div className="relative z-10 w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[24px] p-6 shadow-xl border border-white/20 text-zinc-900 dark:text-white flex flex-col justify-between min-h-[290px] md:min-h-[320px]">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Welcome Header */}
                    <div className="flex items-center gap-2 mb-2 text-[#1890FF]">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bienvenido</span>
                    </div>
                    <h2 className="text-lg font-black tracking-tight leading-snug mb-2 text-zinc-950 dark:text-white">
                      ¡Te damos la bienvenida a Maverlang!
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-6 font-medium">
                      Escribe tu nombre para que tu asistente de Inteligencia Artificial pueda recordarte e interactuar contigo de manera más personalizada.
                    </p>

                    {/* Input name wrapper */}
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        placeholder="Escribe tu nombre (opcional)"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-zinc-950 dark:focus:border-white transition-all font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNext();
                        }}
                      />
                    </div>
                  </div>

                  {/* Foot actions */}
                  <div className="flex items-center justify-between gap-3 mt-6 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 shrink-0">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSkipAll}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                    >
                      Saltar todo
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs px-4 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
                    >
                      Siguiente
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-lg font-black tracking-tight leading-snug mb-1 text-zinc-950 dark:text-white">
                      ¿Qué te interesa principalmente?
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium mb-4">
                      Personalizaremos las respuestas de la IA según tus objetivos principales.
                    </p>

                    {/* Interest options */}
                    <div className="space-y-2">
                      {[
                        {
                          id: "crear_apps",
                          label: "Crear aplicaciones y plataformas",
                          desc: "Proyectos interactivos, código e interfaces",
                          icon: <Laptop className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
                        },
                        {
                          id: "finanzas",
                          label: "Funciones de finanzas y mercados",
                          desc: "Portafolios, tickers e insights económicos",
                          icon: <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
                        },
                        {
                          id: "ambas",
                          label: "Ambas cosas por igual",
                          desc: "Aprovechar al máximo todas las funciones",
                          icon: <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />,
                        },
                      ].map((item) => {
                        const isSelected = localInterest === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setLocalInterest(item.id as any);
                              // Auto save on selection for better UX
                              handleSave(item.id as any);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 active:scale-[0.99] ${
                              isSelected
                                ? "border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-950 shadow-xs"
                                : "border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20"
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-950 dark:text-white leading-tight">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium leading-none">
                                {item.desc}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Foot actions */}
                  <div className="mt-5 shrink-0 flex flex-col gap-3">
                    <p className="text-[9px] text-zinc-400 text-center font-semibold">
                      * Puedes cambiar estas preferencias en cualquier momento desde los ajustes.
                    </p>
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave()}
                        className="inline-flex items-center justify-center min-w-[80px] bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Comenzar"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
