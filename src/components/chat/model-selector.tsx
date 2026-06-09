"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Cpu, PanelLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
    name: "Reclu v2.5",
    description: "Respuestas rápidas y precisas (Por defecto)",
    provider: "Reclu",
    icon: "⚡",
  },
  {
    id: "pro",
    name: "Reclu v2.5 Pro",
    description: "Análisis financiero profundo y razonamiento reflexivo",
    provider: "Reclu",
    icon: "🧠",
  },
  {
    id: "agent",
    name: "Reclu v2.6 Agent",
    description: "Orquestación de agentes con razonamiento avanzado (Swarm)",
    provider: "Reclu",
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

  const selectedModel = useMemo(() => {
    return AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]
  }, [selectedModelId])

  if (variant === "inline") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-fit h-8 gap-1 bg-white/5 dark:bg-white/5 border border-border/40 hover:bg-muted/50 px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 shadow-sm cursor-pointer"
          >
            <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedModel.name}</span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
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
                    className="group/item text-xs flex items-center py-2 px-3 rounded-lg hover:bg-accent cursor-pointer"
                    onSelect={() => {
                      onModelSelect(model)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col w-full min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold truncate text-foreground">
                          {model.name}
                        </span>
                        {model.id === "agent" && (
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {model.description}
                      </span>
                    </div>
                    {selectedModel?.id === model.id && (
                      <Check className="h-4 w-4 ml-auto text-blue-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
                    <span className="truncate text-sm max-w-full">{selectedModel.name}</span>
                    <span className="text-xs text-primary/35 font-medium">
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
            className="w-fit min-w-[300px] p-0 shadow-lg border scrollbar-hide"
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
                      className="group/item"
                      onSelect={() => {
                        onModelSelect(model)
                        setOpen(false)
                      }}
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate max-w-[60vw] md:max-w-none">
                            {model.name}
                          </span>
                          {model.id === "agent" && (
                            <Sparkles className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                      {selectedModel?.id === model.id && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
