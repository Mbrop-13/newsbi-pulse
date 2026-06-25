"use client";
 
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { cn } from "@/lib/utils";
import { Code2, Sparkles } from "lucide-react";
 
interface CanvasFileCardProps {
  title: string;
  code: string;
  language: string;
  timestamp?: string;
  stdout?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  success?: boolean;
}
 
export function CanvasFileCard({
  title,
  code,
  language,
  stdout,
  output,
  error,
  durationMs,
  success,
}: CanvasFileCardProps) {
  const openCanvas = useCanvasStore((s) => s.openCanvas);
  const langUpper = language.toUpperCase();
  
  return (
    <button
      onClick={() => {
        openCanvas({
          title,
          code,
          language,
          stdout,
          output,
          error,
          durationMs,
          success,
        });
      }}
      className={cn(
        "text-left flex flex-col w-full max-w-[280px] rounded-[20px] border transition-all duration-200",
        "bg-white hover:bg-zinc-50/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50",
        "border-zinc-300 dark:border-zinc-800/80 shadow-none",
        "p-4 select-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      )}
    >
      {/* Header: code icon with sparkles + language name */}
      <div className="flex items-center gap-2.5 text-black dark:text-white font-bold text-[15px] select-none">
        <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
          <Code2 className="w-4.5 h-4.5 stroke-[2.2] text-black dark:text-white" />
          <Sparkles className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-black dark:text-white fill-current" />
        </div>
        <span>{langUpper}</span>
      </div>
 
      {/* Divider */}
      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-850/80 my-3" />
 
      {/* File info with neutral radio indicator (single line) */}
      <div className="flex items-center gap-3 w-full min-w-0">
        {/* Radio dot */}
        <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-transparent">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
        </div>
 
        {/* Single line text stack */}
        <span className="text-[13.5px] font-medium text-zinc-500 dark:text-zinc-400 truncate flex-1">
          Generar {title}
        </span>
      </div>
    </button>
  );
}
