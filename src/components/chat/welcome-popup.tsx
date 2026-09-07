"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Briefcase,
  Plus,
  Newspaper,
  Target,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type WelcomeActionId =
  | "analyze-portfolio"
  | "create-portfolio"
  | "market-news"
  | "strategy"

export interface WelcomeAction {
  id: WelcomeActionId
  title: string
  description: string
  prompt?: string
  icon: LucideIcon
}

export const WELCOME_ACTIONS: WelcomeAction[] = [
  {
    id: "analyze-portfolio",
    title: "Analizar tu portafolio",
    description: "Rendimiento, riesgos y qué está moviendo tus posiciones hoy.",
    prompt:
      "Analiza mi portafolio. Dame un resumen del rendimiento, las posiciones que más suben y bajan, el riesgo actual y una recomendación concreta.",
    icon: Briefcase,
  },
  {
    id: "create-portfolio",
    title: "Crear un portafolio",
    description: "Armamos una cartera según tu perfil, horizonte y capital.",
    icon: Plus,
  },
  {
    id: "market-news",
    title: "Noticias del mercado",
    description: "Lo más importante de hoy y cómo puede afectar tus inversiones.",
    prompt:
      "Dame un resumen de las noticias financieras más importantes de hoy. Incluye los principales movimientos del mercado, eventos corporativos relevantes y su impacto potencial.",
    icon: Newspaper,
  },
  {
    id: "strategy",
    title: "Estrategia de inversión",
    description: "Un plan diversificado según tu riesgo y objetivos.",
    prompt:
      "Ayúdame a crear una estrategia de inversión. Pregúntame sobre mi perfil de riesgo, horizonte temporal, capital disponible y objetivos. Dame un plan diversificado con porcentajes.",
    icon: Target,
  },
]

const STORAGE_KEY = "maverlang_welcome_popup_dismissed"

interface WelcomePopupProps {
  open: boolean
  onClose: () => void
  onAction: (action: WelcomeAction) => void
}

export function WelcomePopup({ open, onClose, onAction }: WelcomePopupProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/55 backdrop-blur-[2px] cursor-default"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-popup-title"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-[520px] rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#111318] border border-zinc-200/80 dark:border-white/10 shadow-2xl shadow-black/20 overflow-hidden"
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-white/20" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-6 pb-5 sm:px-7 sm:pt-7 sm:pb-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-400 dark:text-zinc-500 mb-2">
                Maverlang AI
              </p>
              <h2
                id="welcome-popup-title"
                className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-zinc-900 dark:text-white leading-snug"
              >
                ¿Qué quieres hacer?
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Analizamos tu portafolio, te ayudamos a crearlo y te mantenemos al día con el mercado.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WELCOME_ACTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => onAction(action)}
                      className="group text-left rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.07] hover:border-zinc-300 dark:hover:border-white/20 p-3.5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-[13px] font-semibold text-zinc-900 dark:text-white leading-tight">
                        {action.title}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {action.description}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full text-center text-[12px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Pregúntame lo que quieras
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface WelcomeChipsProps {
  onAction: (action: WelcomeAction) => void
  className?: string
}

export function WelcomeChips({ onAction, className }: WelcomeChipsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 w-full max-w-2xl px-1",
        className
      )}
    >
      {WELCOME_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Icon className="w-3.5 h-3.5 opacity-70" />
            {action.title}
          </button>
        )
      })}
    </div>
  )
}

export function useWelcomePopup(enabled: boolean) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setOpen(false)
      return
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setOpen(true), 450)
    return () => window.clearTimeout(timer)
  }, [enabled])

  const close = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
  }

  return { open, close }
}
