"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscriptionDialogStore } from "@/lib/stores/subscription-dialog-store";
import { SubscriptionContent } from "@/components/subscription/subscription-content";

/**
 * Overlay de planes/suscripciones (mismo contenido que /suscripcion).
 * Se abre desde el menú del usuario sin navegar a otra página.
 */
export function SubscriptionDialog() {
  const isOpen = useSubscriptionDialogStore((s) => s.isOpen);
  const close = useSubscriptionDialogStore((s) => s.close);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={close}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Planes y suscripciones"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[28px] overflow-hidden bg-[#f8f8fb] dark:bg-zinc-950 border-0 sm:border border-neutral-200/60 dark:border-zinc-800/80 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <SubscriptionContent variant="dialog" onClose={close} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
