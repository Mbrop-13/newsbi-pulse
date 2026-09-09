"use client"

import {
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
      "Analiza mi portafolio con las cotizaciones en vivo. Dame un resumen del rendimiento, las posiciones que más suben y bajan, el riesgo actual y una recomendación concreta.",
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

interface WelcomeChipsProps {
  onAction: (action: WelcomeAction) => void
  className?: string
}

export function WelcomeChips({ onAction, className }: WelcomeChipsProps) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl px-1",
        "grid grid-cols-2 gap-2",
        "md:flex md:flex-wrap md:items-center md:justify-center",
        className
      )}
    >
      {WELCOME_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            type="button"
            title={action.description}
            onClick={() => onAction(action)}
            className={cn(
              "flex items-center gap-1.5 text-left md:text-center",
              "px-3 py-2.5 md:py-1.5 rounded-2xl md:rounded-full",
              "text-[12px] font-medium leading-tight",
              "border border-zinc-200 dark:border-white/10",
              "text-zinc-600 dark:text-zinc-300",
              "bg-white/80 dark:bg-white/[0.04]",
              "hover:text-zinc-900 dark:hover:text-white",
              "hover:bg-zinc-100 dark:hover:bg-white/[0.08]",
              "hover:border-zinc-300 dark:hover:border-white/20",
              "transition-all duration-200 cursor-pointer active:scale-95",
              "md:whitespace-nowrap"
            )}
          >
            <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span className="min-w-0">{action.title}</span>
          </button>
        )
      })}
    </div>
  )
}
