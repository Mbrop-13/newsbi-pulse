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
    <div className="flex items-center gap-2 shrink-0">
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

  // CRITICAL: The popup MUST NOT show if the user is not authenticated or not logged in
  if (!isAuthenticated || !user || isLoadingConfig || hasCompletedSetup) {
    return null;
  }

  const handleNext = () => {
    setUserName(localName.trim());
    setStep(2);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* ── Outer Starry Container (Responsive: fixed in desktop, auto/scrollable in mobile) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="relative w-full max-w-[94vw] md:w-[640px] h-auto md:h-[530px] bg-[#08080e] rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] overflow-hidden p-[8px] md:p-[10px] flex flex-col"
      >
        <StarsBorder />

        {/* ── Inner White Content Card (with inner scroll if content overflows on small viewports) ── */}
        <div className="relative z-10 bg-white rounded-[18px] h-full flex flex-col justify-between p-6 md:p-10 select-none overflow-y-auto md:overflow-visible">
          {/* Close X Button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="absolute top-4 right-4 md:top-5 md:right-5 z-35 p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full flex flex-col justify-between gap-6 md:gap-0"
              >
                {/* Header: Logo image only + Step Indicator */}
                <div className="relative flex items-center justify-between w-full mb-2">
                  <div className="w-10" />
                  <img
                    src="https://mail.programbi.com/uploads/Maverlang-Logo-1.png"
                    alt="Maverlang"
                    className="h-8 w-auto object-contain mx-auto"
                  />
                  <StepIndicator current={1} total={2} />
                </div>

                {/* Body Content */}
                <div className="flex-1 flex flex-col justify-center my-auto py-4 md:py-0">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight mb-3 text-center">
                    Cuéntanos sobre ti
                  </h2>
                  <p className="text-zinc-500 text-sm md:text-base leading-relaxed mb-6 md:mb-8 text-center mx-auto max-w-md">
                    Escribe tu nombre para que la IA pueda recordarte y personalizar tu experiencia.
                  </p>

                  {/* Name input */}
                  <div className="relative max-w-md mx-auto w-full">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="Tu nombre (opcional)"
                      className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-base font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNext();
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-zinc-100 shrink-0">
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
                    className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base px-7 py-3 rounded-full transition-all active:scale-95 shadow-sm"
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
                className="h-full flex flex-col justify-between gap-6 md:gap-0"
              >
                {/* Header: Logo image only + Step Indicator */}
                <div className="relative flex items-center justify-between w-full mb-2">
                  <div className="w-10" />
                  <img
                    src="https://mail.programbi.com/uploads/Maverlang-Logo-1.png"
                    alt="Maverlang"
                    className="h-8 w-auto object-contain mx-auto"
                  />
                  <StepIndicator current={2} total={2} />
                </div>

                {/* Body Content */}
                <div className="flex-1 flex flex-col justify-center my-auto py-2 md:py-0">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 leading-tight mb-2 text-center">
                    ¿Qué te interesa?
                  </h2>
                  <p className="text-zinc-500 text-sm md:text-base leading-relaxed mb-4 md:mb-6 text-center">
                    Personalizaremos tu experiencia de IA según tus objetivos.
                  </p>

                  {/* 3 Square options: horizontal on desktop, vertical list on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-full">
                    {[
                      {
                        id: "crear_apps" as const,
                        label: "Crear apps",
                        desc: "Proyectos y código",
                        icon: <Laptop className="w-6 h-6 text-white" />,
                      },
                      {
                        id: "finanzas" as const,
                        label: "Finanzas",
                        desc: "Mercados e insights",
                        icon: <TrendingUp className="w-6 h-6 text-white" />,
                      },
                      {
                        id: "ambas" as const,
                        label: "Ambas",
                        desc: "Todas las funciones",
                        icon: <Sparkles className="w-6 h-6 text-white" />,
                      },
                    ].map((item) => {
                      const isSelected = localInterest === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setLocalInterest(item.id);
                            handleSave(item.id);
                          }}
                          className={`relative overflow-hidden rounded-2xl border transition-all flex flex-row md:flex-col items-center justify-start md:justify-between p-4 md:p-5 h-auto md:aspect-square text-left md:text-center cursor-pointer ${
                            isSelected
                              ? "border-zinc-950 shadow-md ring-2 ring-zinc-950/15"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          {/* Mini starry background inside each card */}
                          <div className="absolute inset-0 bg-[#0a0a0f]">
                            <StarsBorder />
                            <div className="absolute inset-0 bg-black/15" />
                          </div>

                          {/* Content */}
                          <div className="relative z-10 flex flex-row md:flex-col items-center justify-start md:justify-center h-full w-full text-white gap-3.5 md:gap-0">
                            <div className="p-2.5 bg-white/10 rounded-xl md:mb-2 shrink-0">
                              {item.icon}
                            </div>
                            <div className="flex flex-col md:items-center">
                              <p className="text-sm font-extrabold leading-tight">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.5 md:mt-1 leading-tight md:max-w-[100px]">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {/* Check Indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 md:top-2 md:right-2 md:translate-y-0 z-20 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 text-zinc-950" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-zinc-100 shrink-0">
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
                    className="inline-flex items-center justify-center min-w-[120px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base px-7 py-3 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Comenzar"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
