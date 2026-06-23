"use client"

import { useState, useMemo } from "react"
import { Check, Cpu, PanelLeft, Sparkles, Crown, X, CheckCircle2, ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"

export interface MaverlangModel {
  id: "fast" | "pro"
  name: string
  description: string
  provider: string
  icon: string
}

const AVAILABLE_MODELS: MaverlangModel[] = [
  {
    id: "fast",
    name: "Maverlang v2.5",
    description: "Respuestas rápidas y precisas (Por defecto)",
    provider: "Maverlang",
    icon: "⚡",
  },
  {
    id: "pro",
    name: "Maverlang v2.5 Pro",
    description: "Análisis financiero profundo y razonamiento reflexivo",
    provider: "Maverlang",
    icon: "🧠",
  },
]

interface ModelSelectorProps {
  selectedModelId: string
  onModelSelect: (model: MaverlangModel) => void
  variant?: "floating" | "inline"
}

export function ModelSelector({ selectedModelId, onModelSelect, variant = "floating" }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const { setOpenMobile } = useSidebar()
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellReason, setUpsellReason] = useState<"pro">("pro")

  const user = useAuthStore((s) => s.user)
  const userTier = user?.role === "admin" ? "ultra" : (user?.tier || "free")

  const selectedModel = useMemo(() => {
    return AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
  }, [selectedModelId])

  if (variant === "inline") {
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="w-fit h-7 gap-1 bg-transparent hover:bg-muted/50 hover:text-black dark:hover:text-white px-2 rounded-lg text-xs font-normal text-black dark:text-white cursor-pointer shrink-0 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <span className="transition-colors">
                <span className="hidden md:inline">{selectedModel.name}</span>
                <span className="inline md:hidden">{selectedModel.id === "pro" ? "v2.5 Pro" : "v2.5"}</span>
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            sideOffset={8}
            align="end"
            className="w-[280px] rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {AVAILABLE_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => {
                  if (userTier === "free" && model.id === "pro") {
                    setUpsellReason("pro")
                    setShowUpsell(true)
                    setOpen(false)
                    return
                  }
                  onModelSelect(model)
                  setOpen(false)
                }}
                className="group/item text-xs flex items-center py-2 px-3 rounded-xl cursor-pointer transition-colors duration-150 select-none focus:bg-muted focus:text-foreground"
              >
                <div className="flex flex-col w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-foreground transition-colors duration-150">
                      {model.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate transition-colors duration-150 mt-0.5">
                    {model.description}
                  </span>
                </div>
                {selectedModel?.id === model.id && (
                  <Check className="h-4 w-4 ml-auto text-teal-650 dark:text-teal-400 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AnimatePresence>
          {showUpsell && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
              onClick={() => setShowUpsell(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }} 
                onClick={(e) => e.stopPropagation()} 
                className="bg-white dark:bg-[#0F1117] rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-gray-100 dark:border-white/10 text-center overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#1890FF]/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

                <button 
                  onClick={() => setShowUpsell(false)} 
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl ring-8 ring-[#1890FF]/10">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    Desbloquea Maverlang Pro
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[300px] mx-auto font-medium">
                    Activa el análisis financiero profundo, razonamiento reflexivo de IA, orquestación de agentes y búsqueda en tiempo real.
                  </p>

                  {/* Benefits */}
                  <div className="space-y-3 text-left mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Modelos Pro con razonamiento profundo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Búsqueda web en tiempo real e informes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Soporte para Agentes de IA y Gráficos</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setShowUpsell(false);
                      window.location.href = "/suscripcion";
                    }} 
                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#1890FF] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Prueba 7 días gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <button 
                    onClick={() => setShowUpsell(false)} 
                    className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    Ahora no
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 h-22 md:hidden pointer-events-none z-[5] bg-gradient-to-b from-background via-background to-transparent" />
      <div className="absolute top-4 left-4 z-10 flex items-center gap-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 md:hidden"
          aria-label="Abrir menú"
          onClick={() => setOpenMobile(true)}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="w-fit h-12 justify-between bg-transparent hover:bg-muted/50 hover:text-black dark:hover:text-white px-4 max-w-[90vw] md:max-w-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedModel ? (
                  <div className="flex items-center gap-2 min-w-0 max-w-[55vw] md:max-w-none">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200 transition-colors">
                      <span className="hidden md:inline">{selectedModel.name}</span>
                      <span className="inline md:hidden">{selectedModel.id === "pro" ? "v2.5 Pro" : "v2.5"}</span>
                    </span>
                    <span className="text-xs text-primary/35 font-medium shrink-0 ml-1">
                      {selectedModel.provider}
                    </span>
                  </div>
                ) : (
                  <>
                    <Cpu className="h-5 w-5" />
                    <span className="text-muted-foreground">Seleccionar modelo...</span>
                  </>
                )}
              </div>
              <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-[280px] rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            {AVAILABLE_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => {
                  if (userTier === "free" && model.id === "pro") {
                    setUpsellReason("pro")
                    setShowUpsell(true)
                    setOpen(false)
                    return
                  }
                  onModelSelect(model)
                  setOpen(false)
                }}
                className="group/item text-xs flex items-center py-2 px-3 rounded-xl cursor-pointer transition-colors duration-150 select-none focus:bg-muted focus:text-foreground"
              >
                <div className="flex flex-col w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-foreground transition-colors duration-150">
                      {model.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground transition-colors duration-150 mt-0.5">
                    {model.description}
                  </span>
                </div>
                {selectedModel?.id === model.id && (
                  <Check className="h-4 w-4 ml-auto text-teal-650 dark:text-teal-400 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {showUpsell && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowUpsell(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white dark:bg-[#0F1117] rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-gray-100 dark:border-white/10 text-center overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#1890FF]/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

              <button 
                onClick={() => setShowUpsell(false)} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2 z-10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl ring-8 ring-[#1890FF]/10">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  Desbloquea Maverlang Pro
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[300px] mx-auto font-medium">
                  Activa el análisis financiero profundo, razonamiento reflexivo de IA, orquestación de agentes y búsqueda en tiempo real.
                </p>

                {/* Benefits */}
                <div className="space-y-3 text-left mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Modelos Pro con razonamiento profundo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Búsqueda web en tiempo real e informes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Soporte para Agentes de IA y Gráficos</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setShowUpsell(false);
                    window.location.href = "/suscripcion";
                  }} 
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#1890FF] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Prueba 7 días gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <button 
                  onClick={() => setShowUpsell(false)} 
                  className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  Ahora no
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
