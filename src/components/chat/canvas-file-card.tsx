"use client";

import { useCanvasStore } from "@/lib/stores/canvas-store";
import { Code2, Terminal } from "lucide-react";
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
  timestamp,
  stdout,
  output,
  error,
  durationMs,
  success,
}: CanvasFileCardProps) {
  const openCanvas = useCanvasStore((s) => s.openCanvas);
  
  // Format current time as default if not provided
  const displayTime = timestamp || new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  const isPython = language.toLowerCase() === "python";

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
        "w-full max-w-md text-left flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300",
        "bg-blue-600/10 hover:bg-blue-600/15 dark:bg-blue-950/40 dark:hover:bg-blue-900/40",
        "border border-blue-500/25 shadow-sm group relative hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
        {isPython ? <Terminal className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
          {title}
        </h4>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">
          {displayTime}
        </p>
      </div>
    </button>
  );
}
