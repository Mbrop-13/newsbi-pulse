"use client";

import { Loader2 } from "lucide-react";

export function PremiumSkeletonLoader({ isAiResponding }: { isAiResponding: boolean }) {
  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-8 overflow-hidden select-none">
      {/* Grid pattern with light gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(13,110,253,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,110,253,0.015)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-60 pointer-events-none" />
      
      {/* Neon radial glows */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Default visual mockup loader when compiling or loading */}
        <div className="w-full bg-card/45 border border-border/20 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mb-6 space-y-0 animate-pulse relative">
          {/* Window header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/10">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted/50" />
              <span className="w-2 h-2 rounded-full bg-muted/50" />
              <span className="w-2 h-2 rounded-full bg-muted/50" />
            </div>
            <div className="w-24 h-2 bg-muted/40 rounded-full" />
            <div className="w-3 h-3 bg-muted/40 rounded" />
          </div>
          {/* Mockup dashboard grid */}
          <div className="p-4 flex gap-3 h-40">
            <div className="w-1/4 flex flex-col gap-2.5 border-r border-border/10 pr-3">
              <div className="w-full h-6 bg-muted/50 rounded-lg" />
              <div className="w-5/6 h-4 bg-muted/30 rounded-lg" />
              <div className="w-4/5 h-4 bg-muted/30 rounded-lg" />
            </div>
            <div className="flex-grow flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-muted/40 rounded-lg" />
                <div className="h-8 bg-muted/40 rounded-lg" />
                <div className="h-8 bg-muted/40 rounded-lg" />
              </div>
              <div className="flex-grow bg-muted/20 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-2 bg-muted rounded-full" />
                  <div className="w-6 h-2 bg-muted rounded-full" />
                </div>
                <div className="flex items-end gap-1 h-10 pt-2">
                  <div className="flex-1 bg-primary/10 rounded-t h-1/3" />
                  <div className="flex-1 bg-primary/15 rounded-t h-2/3" />
                  <div className="flex-1 bg-primary/20 rounded-t h-1/2 animate-bounce" />
                  <div className="flex-1 bg-primary/10 rounded-t h-3/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highly Premium Shimmery Loader Badge */}
        <div className="relative group w-full max-w-xs">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-full blur opacity-30 group-hover:opacity-40 transition duration-1000 animate-tilt"></div>
          <div className="relative flex items-center justify-center gap-2.5 bg-card/85 border border-border/30 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            <span className="text-[10px] font-bold tracking-tight text-foreground/80">
              {isAiResponding ? "Agentes programando..." : "Compilando interfaz..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
