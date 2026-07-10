"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Laptop, TrendingUp, Check, Loader2, ArrowRight, User, X, Sparkles } from "lucide-react";


/* ─── Animated Stars Border ─────────────────────────────────────────── */
function StarsBorder() {
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

    interface Star {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      twinkleSpeed: number;
      twinkleOffset: number;
    }

    const stars: Star[] = [];
    const starCount = 55;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.5,
        speedX: (Math.random() - 0.5) * 0.12,
        speedY: Math.random() * 0.18 + 0.02,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.025 + 0.008,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);
      time += 1;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.25 + 0.75;
        ctx.globalAlpha = star.opacity * twinkle;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.x += star.speedX;
        star.y += star.speedY;

        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none"
      style={{ borderRadius: "inherit" }}
    />
  );
}

/* ─── Step Indicator ────────────────────────────────────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <motion.div
            key={stepNum}
            animate={{
              width: isActive ? 28 : 10,
              backgroundColor: isActive || isDone ? "#1E293B" : "#D4D4D8",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="h-2.5 rounded-full"
          />
        );
      })}
    </div>
  );
}

/* ─── Main Dialog ───────────────────────────────────────────────────── */
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

  useEffect(() => {
    if (!isLoadingConfig) {
      setLocalName(getUserName());
      setLocalInterest((getPrimaryInterest() as any) || "");
    }
  }, [isLoadingConfig, getUserName, getPrimaryInterest]);

  if (!isAuthenticated || isLoadingConfig || hasCompletedSetup) {
    return null;
  }

  const handleNext = () => {
    setUserName(localName.trim());
    setStep(2);
  };

  /* "Saltar" skips the current step only */
  const handleSkipStep = () => {
    if (step === 1) {
      setStep(2);
    } else {
      handleSave("");
    }
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

  const handleClose = async () => {
    setSaving(true);
    try {
      completeSetup();
      if (user?.id) {
        await saveToSupabase(user.id);
      }
    } catch (err) {
      console.error("Error skipping onboarding:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* ── Outer Popup Container (bigger: max-w-2xl) ─────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        {/* Close X Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="absolute top-5 right-5 z-30 p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
          title="Cerrar"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* ── Thin outer white padding, thick stars border ───── */}
        <div className="p-[3px]">
          <div className="relative rounded-[22px] overflow-hidden bg-[#08080e] p-[10px]">
            <StarsBorder />

            {/* ── Inner White Content Card ───────────────────── */}
            <div className="relative z-10 bg-white rounded-[14px] overflow-hidden">
              <div className="px-10 pt-10 pb-9 md:px-12 md:pt-12 md:pb-10">

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Header: Logo + Step Indicator */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Bienvenido a</p>
                          <img
                            src="https://mail.programbi.com/uploads/Maverlang-Logo-1.png"
                            alt="Maverlang"
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <StepIndicator current={1} total={2} />
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight mb-3">
                        Cuéntanos sobre ti
                      </h2>
                      <p className="text-zinc-500 text-base leading-relaxed mb-10 max-w-md">
                        Escribe tu nombre para que la IA pueda recordarte y personalizar tu experiencia.
                      </p>

                      {/* Name input */}
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                        <input
                          type="text"
                          value={localName}
                          onChange={(e) => setLocalName(e.target.value)}
                          placeholder="Tu nombre (opcional)"
                          className="w-full pl-14 pr-6 py-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-base font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleNext();
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-100">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleSkipStep}
                          className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
                        >
                          Saltar
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base px-7 py-3.5 rounded-full transition-all active:scale-95 shadow-sm"
                        >
                          Siguiente
                          <ArrowRight className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Header: Logo + Step Indicator */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Configura tu</p>
                          <img
                            src="https://mail.programbi.com/uploads/Maverlang-Logo-1.png"
                            alt="Maverlang"
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <StepIndicator current={2} total={2} />
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight mb-3">
                        ¿Qué te interesa?
                      </h2>
                      <p className="text-zinc-500 text-base leading-relaxed mb-8">
                        Personalizaremos tu experiencia de IA según tus objetivos.
                      </p>

                      {/* Interest options */}
                      <div className="space-y-3">
                        {[
                          {
                            id: "crear_apps" as const,
                            label: "Crear aplicaciones",
                            desc: "Proyectos interactivos, código e interfaces",
                            icon: <Laptop className="w-5 h-5" />,
                          },
                          {
                            id: "finanzas" as const,
                            label: "Finanzas y mercados",
                            desc: "Portafolios, tickers e insights económicos",
                            icon: <TrendingUp className="w-5 h-5" />,
                          },
                          {
                            id: "ambas" as const,
                            label: "Ambas cosas",
                            desc: "Aprovecha al máximo todas las funciones",
                            icon: <Sparkles className="w-5 h-5" />,
                          },
                        ].map((item) => {
                          const isSelected = localInterest === item.id;
                          return (
                            <motion.button
                              key={item.id}
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                setLocalInterest(item.id);
                                handleSave(item.id);
                              }}
                              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer ${
                                isSelected
                                  ? "border-zinc-900 bg-zinc-50 shadow-sm"
                                  : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50"
                              }`}
                            >
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-zinc-900 text-white"
                                  : "bg-zinc-100 text-zinc-500"
                              }`}>
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-zinc-900 leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-sm text-zinc-500 mt-0.5 font-medium">
                                  {item.desc}
                                </p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Note */}
                      <p className="text-xs text-zinc-400 text-center mt-6 font-medium">
                        Puedes cambiar esto en cualquier momento desde los ajustes.
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          ← Atrás
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSave()}
                          className="inline-flex items-center justify-center min-w-[120px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base px-7 py-3.5 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Comenzar"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
