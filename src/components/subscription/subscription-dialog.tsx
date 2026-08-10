"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscriptionDialogStore } from "@/lib/stores/subscription-dialog-store";
import { SubscriptionContent } from "@/components/subscription/subscription-content";

/**
 * Overlay a pantalla completa con los planes (mismo contenido que /suscripcion).
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
        <div className="fixed inset-0 z-[200] flex flex-col">
          {/* Sin padding ni max-width: ocupa toda la ventana */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Planes y suscripciones"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full h-full min-h-0 bg-[#f8f8fb] dark:bg-zinc-950 flex flex-col"
          >
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <SubscriptionContent variant="dialog" onClose={close} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
