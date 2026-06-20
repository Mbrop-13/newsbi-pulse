"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Code2, Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BuildModeOption {
  id: "chat" | "plan" | "turbo";
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const BUILD_MODES: BuildModeOption[] = [
  {
    id: "chat",
    name: "Chat normal",
    description: "Conversa con la IA normalmente",
    icon: MessageSquare,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    id: "plan",
    name: "Builder: Plan",
    description: "Planifica y aprueba los cambios antes de construir",
    icon: Code2,
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    id: "turbo",
    name: "Builder: Turbo",
    description: "Planifica y construye de una sola vez",
    icon: Zap,
    color: "text-amber-500 bg-amber-500/10",
  },
];

export function BuildModeSelector() {
  const [open, setOpen] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [pendingModeSelection, setPendingModeSelection] = useState<"plan" | "turbo" | null>(null);

  const {
    isWebBuilderMode,
    buildMode,
    setWebBuilderMode,
    setBuildMode,
    resetProject,
  } = useWebBuilderStore();

  const messages = useAIChatStore((s) => s.messages);
  const clearMessages = useAIChatStore((s) => s.clearMessages);

  // Determine current active mode option
  const selectedMode = useMemo(() => {
    if (!isWebBuilderMode) return BUILD_MODES[0];
    return BUILD_MODES.find((m) => m.id === buildMode) || BUILD_MODES[1];
  }, [isWebBuilderMode, buildMode]);

  const handleSelectMode = (modeId: "chat" | "plan" | "turbo") => {
    setOpen(false);

    if (modeId === "chat") {
      setWebBuilderMode(false);
      return;
    }

    // Switching to Builder mode (plan or turbo)
    if (!isWebBuilderMode && messages.length > 0) {
      // Need confirmation dialog to start new clean chat
      setPendingModeSelection(modeId);
      setShowNewChatDialog(true);
    } else {
      // Transition immediately
      setBuildMode(modeId);
      setWebBuilderMode(true);
    }
  };

  const confirmNewChatBuilder = () => {
    if (pendingModeSelection) {
      clearMessages();
      resetProject();
      setBuildMode(pendingModeSelection);
      setWebBuilderMode(true);
      setPendingModeSelection(null);
    }
    setShowNewChatDialog(false);
  };

  const SelectedIcon = selectedMode.icon;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-fit h-8 gap-1.5 bg-white/5 dark:bg-white/5 border border-border/40 hover:bg-muted/50 px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 shadow-sm cursor-pointer shrink-0"
          >
            <SelectedIcon className={cn("h-3.5 w-3.5 shrink-0", selectedMode.id === "chat" ? "text-emerald-500" : selectedMode.id === "plan" ? "text-violet-500" : "text-amber-500")} />
            <span className="font-bold text-[10px] sm:text-xs transition-colors">
              {selectedMode.name}
            </span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1 transition-colors" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={8}
          align="end"
          className="w-[280px] p-0 shadow-lg border scrollbar-hide z-50 bg-popover text-popover-foreground animate-in fade-in slide-in-from-bottom-2 duration-200"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="scrollbar-hide">
            <CommandList className="scrollbar-hide">
              <CommandEmpty>No se encontraron modos.</CommandEmpty>
              <CommandGroup>
                {BUILD_MODES.map((mode) => {
                  const IconComponent = mode.icon;
                  const isActive =
                    (mode.id === "chat" && !isWebBuilderMode) ||
                    (isWebBuilderMode && mode.id === buildMode);

                  return (
                    <CommandItem
                      key={mode.id}
                      value={mode.name}
                      className="group/item text-xs flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 ease-out data-selected:bg-black! data-selected:text-white! dark:data-selected:bg-slate-900! data-selected:scale-[1.02] data-selected:shadow-md select-none"
                      onSelect={() => handleSelectMode(mode.id)}
                    >
                      <div className="flex items-center gap-2.5 w-full min-w-0">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", mode.color)}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-xs text-gray-700 dark:text-gray-300 group-hover/item:text-white group-data-selected/item:text-white transition-colors duration-300">
                            {mode.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate group-hover/item:text-gray-300 group-data-selected/item:text-gray-300 transition-colors">
                            {mode.description}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 ml-auto text-blue-500 group-data-selected/item:text-white" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md p-6 rounded-3xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <span className="p-2 bg-violet-500/10 text-violet-500 rounded-xl">🚀</span>
              Iniciar nuevo chat para Builder
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
              Para comenzar a desarrollar aplicaciones o plataformas web con el <strong>Builder</strong>, es necesario iniciar una nueva conversación limpia.
              <br />
              <br />
              ¿Deseas iniciar un nuevo chat y activar el Builder ahora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewChatDialog(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmNewChatBuilder}
              className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
            >
              Sí, comenzar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
