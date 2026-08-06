"use client";

import { cn } from "@/lib/utils";

type Variant = "default" | "portfolio" | "markets" | "news" | "chat" | "flow" | "compact";

/**
 * Skeleton de página completa — evita pantalla en blanco mientras carga auth o datos.
 */
export function PageLoadingSkeleton({
  variant = "default",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-1 min-h-[50vh] items-center justify-center bg-background",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-[3px] border-[#1890FF]/25 border-t-[#1890FF] animate-spin" />
          <p className="text-xs font-medium text-muted-foreground">Cargando…</p>
        </div>
      </div>
    );
  }

  if (variant === "flow") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col h-[100dvh] bg-[#f8f9fa] dark:bg-[#07080a]",
          className
        )}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-48 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="px-3 pb-4">
          <div className="mx-auto max-w-3xl h-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === "chat") {
    return (
      <div className={cn("flex flex-1 flex-col h-[100dvh] bg-background", className)}>
        <div className="flex-1" />
        <div className="px-3 pb-6">
          <div className="mx-auto max-w-3xl h-28 rounded-2xl bg-muted/40 border border-border/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === "portfolio") {
    return (
      <div className={cn("min-h-[100dvh] bg-background pt-14 md:pt-6 pb-10 px-4 sm:px-6", className)}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted rounded animate-pulse" />
              <div className="h-3 w-52 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 p-4 space-y-2 animate-pulse">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="h-12 rounded-2xl bg-muted/50 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/40 p-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted/60 rounded" />
              </div>
              <div className="h-4 w-14 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "markets") {
    return (
      <div className={cn("min-h-[100dvh] bg-background pt-14 md:pt-6 pb-10 px-4 sm:px-6", className)}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="h-4 w-14 bg-muted rounded" />
                </div>
                <div className="h-5 w-20 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
          <div className="h-56 rounded-2xl bg-muted/40 border border-border/30 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === "news") {
    return (
      <div className={cn("min-h-[100dvh] bg-background pt-14 md:pt-6 pb-10 px-4 sm:px-6", className)}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="rounded-2xl overflow-hidden border border-border/40 animate-pulse">
            <div className="h-48 sm:h-64 bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-24 bg-muted/70 rounded" />
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted/50 rounded" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-2/3 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // default
  return (
    <div className={cn("min-h-[100dvh] bg-background pt-14 md:pt-6 pb-10 px-4 sm:px-6", className)}>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-border/40 bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-muted/25 border border-border/30 animate-pulse" />
      </div>
    </div>
  );
}
