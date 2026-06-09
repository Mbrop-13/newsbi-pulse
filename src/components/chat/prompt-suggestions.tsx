"use client"

import { Zap } from "lucide-react"

interface PromptSuggestion {
  title: string
  description: string
  prompt_message: string
}

const SUGGESTIONS: PromptSuggestion[] = [
  {
    title: "Mi portafolio",
    description: "Analiza el rendimiento de tus acciones",
    prompt_message:
      "Muéstrame cómo va mi portafolio hoy. Dame un resumen del rendimiento, las acciones que más subieron y bajaron, y una recomendación general.",
  },
  {
    title: "Noticias del mercado",
    description: "Resumen de noticias financieras",
    prompt_message:
      "Dame un resumen de las noticias financieras más importantes de hoy. Incluye los principales movimientos del mercado, eventos corporativos relevantes y su impacto potencial.",
  },
  {
    title: "Análisis técnico",
    description: "Analiza una acción en detalle",
    prompt_message:
      "Necesito un análisis técnico detallado. Pregúntame qué acción quiero analizar, y luego dame niveles de soporte/resistencia, tendencias, y señales de compra/venta.",
  },
  {
    title: "Comparar acciones",
    description: "Compara el rendimiento de varias acciones",
    prompt_message:
      "Quiero comparar acciones. Pregúntame cuáles quiero comparar, y luego dame una tabla comparativa con métricas clave como P/E, rendimiento, dividendos y recomendación.",
  },
  {
    title: "Estrategia de inversión",
    description: "Genera un plan de inversión personalizado",
    prompt_message:
      "Ayúdame a crear una estrategia de inversión. Pregúntame sobre mi perfil de riesgo, horizonte temporal, capital disponible y objetivos. Dame un plan diversificado con porcentajes.",
  },
  {
    title: "Alertas de precio",
    description: "Configura alertas para tus acciones",
    prompt_message:
      "Quiero configurar alertas de precio para mis acciones. Muéstrame mis posiciones actuales y ayúdame a establecer niveles de alerta para cada una.",
  },
]

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function PromptSuggestions({ onSelect, disabled = false }: PromptSuggestionsProps) {
  return (
    <div className="max-w-2xl mx-auto w-full mt-4 md:mt-2 px-6 md:px-0">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>Sugerencias</span>
      </div>
      <div className="max-h-46 overflow-y-auto scrollbar-hide">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={`${s.title}-${idx}`}
            type="button"
            className="w-full text-left rounded-md px-3 py-2 hover:bg-muted/40 transition-colors"
            onClick={() => onSelect(s.prompt_message)}
            disabled={disabled}
          >
            <div className="font-medium">{s.title}</div>
            <div className="text-sm text-muted-foreground">{s.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromptSuggestions
