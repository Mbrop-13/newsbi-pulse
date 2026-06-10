"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Cpu, PanelLeft, Sparkles, Crown, X, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"

export interface RecluModel {
  id: "fast" | "pro" | "agent"
  name: string
  description: string
  provider: string
  icon: string
}

// Keep MaverlangModel type alias for compatibility in other files
export type MaverlangModel = RecluModel

const AVAILABLE_MODELS: RecluModel[] = [
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
  {
    id: "agent",
    name: "Maverlang v2.6 Agent",
    description: "Orquestación de agentes con razonamiento avanzado (Swarm)",
    provider: "Maverlang",
    icon: "🐝",
  },
]

interface ModelSelectorProps {
  selectedModelId: string
  onModelSelect: (model: RecluModel) => void
  variant?: "floating" | "inline"
}

export function ModelSelector({ selectedModelId, onModelSelect, variant = "floating" }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const { setOpenMobile } = useSidebar()
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellReason, setUpsellReason] = useState<"pro" | "agent">("pro")

  const user = useAuthStore((s) => s.user)
  const userTier = user?.role === "admin" ? "ultra" : (user?.tier || "free")

  const selectedModel = useMemo(() => {
    return AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
  }, [selectedModelId])

  if (variant === "inline") {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="w-fit h-8 gap-1 bg-white/5 dark:bg-white/5 border border-border/40 hover:bg-muted/50 px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 shadow-sm cursor-pointer"
            >
              <img 
                src={selectedModel.id === "fast" ? "/assets/mav25.png" : selectedModel.id === "pro" ? "/assets/mav25pro.png" : "/assets/mav26.png"} 
                alt={selectedModel.name} 
                className="h-5 w-auto object-contain block dark:hidden"
              />
              <img 
                src={selectedModel.id === "fast" ? "/assets/mav25-R.png" : selectedModel.id === "pro" ? "/assets/mav25pro-R.png" : "/assets/mav26-R.png"} 
                alt={selectedModel.name} 
                className="h-5 w-auto object-contain hidden dark:block"
              />
              {selectedModel.id === "agent" && (
                <span className="text-[10px] font-black tracking-wider text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] px-1 py-0.5 uppercase leading-none shrink-0 ml-1">
                  AGENT
                </span>
              )}
              <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[280px] p-0 shadow-lg border scrollbar-hide z-50 bg-popover text-popover-foreground"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command className="scrollbar-hide">
              <CommandList className="scrollbar-hide">
                <CommandEmpty>No se encontraron modelos.</CommandEmpty>
                <CommandGroup>
                  {AVAILABLE_MODELS.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.name}
                      className="group/item text-xs flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors duration-150 data-selected:bg-black! data-selected:text-white! dark:data-selected:bg-slate-900! select-none"
                      onSelect={() => {
                        if (userTier === "free" && (model.id === "pro" || model.id === "agent")) {
                          setUpsellReason(model.id === "pro" ? "pro" : "agent")
                          setShowUpsell(true)
                          setOpen(false)
                          return
                        }
                        onModelSelect(model)
                        setOpen(false)
                      }}
                    >
                      <div className="flex flex-col w-full min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img 
                            src={model.id === "fast" ? "/assets/mav25.png" : model.id === "pro" ? "/assets/mav25pro.png" : "/assets/mav26.png"} 
                            alt={model.name} 
                            className="h-5 w-auto object-contain block dark:hidden group-hover/item:hidden group-data-selected/item:hidden"
                          />
                          <img 
                            src={model.id === "fast" ? "/assets/mav25-R.png" : model.id === "pro" ? "/assets/mav25pro-R.png" : "/assets/mav26-R.png"} 
                            alt={model.name} 
                            className="h-5 w-auto object-contain hidden dark:block group-hover/item:block group-data-selected/item:block"
                          />
                          {model.id === "agent" && (
                            <span className="text-[10px] font-black tracking-wider text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] px-1 py-0.5 uppercase leading-none shrink-0">
                              AGENT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate group-data-selected/item:text-gray-300 transition-colors">
                          {model.description}
                        </span>
                      </div>
                      {selectedModel?.id === model.id && (
                        <Check className="h-4 w-4 ml-auto text-blue-500 group-data-selected/item:text-white" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
                    {upsellReason === "pro" ? "Desbloquea Maverlang Pro" : "Desbloquea Maverlang Agent"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[300px] mx-auto font-medium">
                    {upsellReason === "pro" 
                      ? "Activa el análisis financiero profundo, razonamiento reflexivo de IA y búsqueda en tiempo real."
                      : "Orquesta múltiples agentes de IA expertos (Swarm) para simulaciones y reportes avanzados."
                    }
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="w-fit h-12 justify-between bg-transparent hover:bg-muted/50 px-4 max-w-[90vw] md:max-w-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedModel ? (
                  <div className="flex items-center gap-2 min-w-0 max-w-[55vw] md:max-w-none">
                    <img 
                      src={selectedModel.id === "fast" ? "/assets/mav25.png" : selectedModel.id === "pro" ? "/assets/mav25pro.png" : "/assets/mav26.png"} 
                      alt={selectedModel.name} 
                      className="h-6 w-auto object-contain block dark:hidden"
                    />
                    <img 
                      src={selectedModel.id === "fast" ? "/assets/mav25-R.png" : selectedModel.id === "pro" ? "/assets/mav25pro-R.png" : "/assets/mav26-R.png"} 
                      alt={selectedModel.name} 
                      className="h-6 w-auto object-contain hidden dark:block"
                    />
                    {selectedModel.id === "agent" && (
                      <span className="text-[11px] font-black tracking-wider text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] px-1.5 py-0.5 uppercase leading-none shrink-0 ml-1">
                        AGENT
                      </span>
                    )}
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
              <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-fit min-w-[300px] p-0 shadow-lg border scrollbar-hide z-50 bg-popover text-popover-foreground animate-in fade-in zoom-in-95 duration-100"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command className="scrollbar-hide">
              <CommandList className="scrollbar-hide">
                <CommandEmpty>No se encontraron modelos.</CommandEmpty>
                <CommandGroup>
                  {AVAILABLE_MODELS.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.name}
                      className="group/item cursor-pointer transition-colors duration-150 data-selected:bg-black! data-selected:text-white! dark:data-selected:bg-slate-900! select-none"
                      onSelect={() => {
                        if (userTier === "free" && (model.id === "pro" || model.id === "agent")) {
                          setUpsellReason(model.id === "pro" ? "pro" : "agent")
                          setShowUpsell(true)
                          setOpen(false)
                          return
                        }
                        onModelSelect(model)
                        setOpen(false)
                      }}
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={model.id === "fast" ? "/assets/mav25.png" : model.id === "pro" ? "/assets/mav25pro.png" : "/assets/mav26.png"} 
                            alt={model.name} 
                            className="h-6 w-auto object-contain block dark:hidden group-hover/item:hidden group-data-selected/item:hidden"
                          />
                          <img 
                            src={model.id === "fast" ? "/assets/mav25-R.png" : model.id === "pro" ? "/assets/mav25pro-R.png" : "/assets/mav26-R.png"} 
                            alt={model.name} 
                            className="h-6 w-auto object-contain hidden dark:block group-hover/item:block group-data-selected/item:block"
                          />
                          {model.id === "agent" && (
                            <span className="text-[11px] font-black tracking-wider text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] px-1.5 py-0.5 uppercase leading-none shrink-0">
                              AGENT
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground group-data-selected/item:text-gray-300 transition-colors">
                          {model.description}
                        </span>
                      </div>
                      {selectedModel?.id === model.id && (
                        <Check className="h-4 w-4 ml-auto group-data-selected/item:text-white" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
                  {upsellReason === "pro" ? "Desbloquea Maverlang Pro" : "Desbloquea Maverlang Agent"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[300px] mx-auto font-medium">
                  {upsellReason === "pro" 
                    ? "Activa el análisis financiero profundo, razonamiento reflexivo de IA y búsqueda en tiempo real."
                    : "Orquesta múltiples agentes de IA expertos (Swarm) para simulaciones y reportes avanzados."
                  }
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
