"use client";

import { useState, useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface BuildModeOption {
  id: "plan" | "turbo";
  name: string;
  description: string;
}

const BUILD_MODES: BuildModeOption[] = [
  {
    id: "plan",
    name: "Builder: Plan",
    description: "Planifica y aprueba los cambios antes de construir",
  },
  {
    id: "turbo",
    name: "Builder: Turbo",
    description: "Planifica y construye de una sola vez",
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-fit h-fit gap-1 bg-transparent hover:bg-transparent hover:text-black dark:hover:text-white border-0 p-0 text-sm font-normal text-black dark:text-white cursor-pointer shrink-0 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <span className="transition-colors">
            {selectedMode.id === "plan" ? "Plan" : "Turbo"}
          </span>
          <ChevronDown className={cn("h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        sideOffset={8}
        align="end"
        className="w-[280px] rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {BUILD_MODES.map((mode) => {
          const isActive = mode.id === buildMode;

          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className="group/item text-xs flex items-center py-2 px-3 rounded-xl cursor-pointer transition-colors duration-150 select-none focus:bg-muted focus:text-foreground"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-xs text-foreground transition-colors duration-150">
                  {mode.id === "plan" ? "Plan" : "Turbo"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate transition-colors duration-150 mt-0.5">
                  {mode.description}
                </span>
              </div>
              {isActive && (
                <Check className="h-4 w-4 ml-auto text-teal-650 dark:text-teal-400 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
