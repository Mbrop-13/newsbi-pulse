"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsletterFormProps {
  variant?: "sidebar" | "footer" | "inline";
}

export function NewsletterForm({ variant = "sidebar" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // Simulate subscription
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      // Reset after 4 seconds
      setTimeout(() => setStatus("idle"), 4000);
    }, 800);
  };

  if (variant === "footer") {
    return (
      <div>
        <h4 className="text-sm font-bold mb-3 text-foreground flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-accent" />
          Boletín Diario
        </h4>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Recibe las noticias más importantes cada mañana.
        </p>
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              ¡Te has suscrito exitosamente!
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="flex-1 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs placeholder:text-muted-foreground/40 outline-none focus:border-accent/50 transition-colors"
              />
              <Button
                type="submit"
                size="sm"
                disabled={status === "loading"}
                className="bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-lg px-3"
              >
                {status === "loading" ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Sidebar variant (default)
  return (
    <div className="bg-gradient-to-br from-accent/5 via-background to-cyan-500/5 border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Boletín NewsBI</h3>
          <p className="text-[10px] text-muted-foreground">Resumen diario con IA</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Las noticias más relevantes, analizadas por IA, directo a tu bandeja cada mañana.
      </p>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold py-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            ¡Suscripción exitosa!
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-2"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-xs placeholder:text-muted-foreground/40 outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-9 bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-lg group"
            >
              {status === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Suscribiendo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Suscribirme gratis
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
