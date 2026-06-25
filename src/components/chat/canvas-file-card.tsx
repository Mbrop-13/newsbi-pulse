"use client";

import { useCanvasStore } from "@/lib/stores/canvas-store";
import { cn } from "@/lib/utils";

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
        "text-left flex flex-col w-full max-w-[280px] rounded-2xl border transition-all duration-300",
        "bg-white hover:bg-zinc-50/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50",
        "border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md",
        "p-4 select-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      )}
    >
      {/* Header: Monospace tag + language */}
      <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-xs tracking-wide uppercase">
        <span className="text-[#1890FF] dark:text-blue-400 font-mono font-extrabold text-sm">&lt;/&gt;</span>
        <span>{langUpper}</span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80 my-2.5" />

      {/* File Action & Name with double circle radio */}
      <div className="flex items-start gap-3">
        {/* Radio dot icon exactly like the image */}
        <div className="mt-1 shrink-0 flex items-center justify-center w-4.5 h-4.5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-transparent">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
        </div>

        {/* Text stack */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            Generate
          </span>
          <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 truncate font-mono mt-0.5">
            {title}
          </span>
        </div>
      </div>
    </button>
  );
}
