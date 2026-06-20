"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Code2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
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

interface BuildModeOption {
  id: "plan" | "turbo";
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const BUILD_MODES: BuildModeOption[] = [
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

  const {
    buildMode,
    setBuildMode,
  } = useWebBuilderStore();

  // Determine current active mode option
  const selectedMode = useMemo(() => {
    return BUILD_MODES.find((m) => m.id === buildMode) || BUILD_MODES[0];
  }, [buildMode]);

  const handleSelectMode = (modeId: "plan" | "turbo") => {
    setOpen(false);
    setBuildMode(modeId);
  };

  const SelectedIcon = selectedMode.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-fit h-8 gap-1.5 bg-white/5 dark:bg-white/5 border border-border/40 hover:bg-muted/50 px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 shadow-sm cursor-pointer shrink-0"
        >
          <SelectedIcon className={cn("h-3.5 w-3.5 shrink-0", selectedMode.id === "plan" ? "text-violet-500" : "text-amber-500")} />
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
                const isActive = mode.id === buildMode;

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
  );
}
