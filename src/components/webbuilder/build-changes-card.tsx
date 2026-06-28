"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  FilePlus2,
  FileX2,
  FileCode2,
  Check,
  Code2,
  Sparkles,
} from "lucide-react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de cambios del último build, mostrada sobre la barra de input cuando
 * hay archivos generados/modificados/eliminados por la IA.
 *
 * Cada archivo muestra +/− líneas (o badge NUEVO/ELIMINADO). Al hacer clic en
 * un archivo se abre el editor de código (tab "code" + setActiveFile). El botón
 * "Aceptar" cierra la tarjeta (limpia `lastBuildDiff` del store).
 */
export function BuildChangesCard() {
  const lastBuildDiff = useWebBuilderStore((s) => s.lastBuildDiff);
  const clearBuildDiff = useWebBuilderStore((s) => s.clearBuildDiff);
  const setSelectedTab = useWebBuilderStore((s) => s.setSelectedTab);
  const setActiveFile = useWebBuilderStore((s) => s.setActiveFile);

  if (lastBuildDiff.length === 0) return null;

  const totalAdded = lastBuildDiff.reduce((acc, d) => acc + d.addedCount, 0);
  const totalRemoved = lastBuildDiff.reduce((acc, d) => acc + d.removedCount, 0);

  const openFile = (path: string) => {
    setActiveFile(path);
    setSelectedTab("code");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mb-2 mx-auto w-full max-w-2xl"
      >
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-xl">
          {/* Glow decorativo sutil */}
          <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200/40 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-[12px] font-black text-zinc-900 dark:text-white truncate">
                Cambios aplicados
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider shrink-0 hidden sm:inline">
                {lastBuildDiff.length} {lastBuildDiff.length === 1 ? "archivo" : "archivos"}
              </span>
            </div>

            {/* Totales +/− */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <Plus className="w-2.5 h-2.5" />
                {totalAdded}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                <Minus className="w-2.5 h-2.5" />
                {totalRemoved}
              </span>
            </div>
          </div>

          {/* Lista de archivos */}
          <div className="px-2 py-2 max-h-[180px] overflow-y-auto custom-scrollbar">
            <div className="space-y-0.5">
              {lastBuildDiff.map((d) => (
                <button
                  key={d.path}
                  onClick={() => openFile(d.path)}
                  className={cn(
                    "group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-200",
                    "hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] active:scale-[0.99]"
                  )}
                >
                  {/* Icono según tipo de cambio */}
                  {d.isNew ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <FilePlus2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  ) : d.isDeleted ? (
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                      <FileX2 className="w-3.5 h-3.5 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  )}

                  {/* Nombre + ruta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                        {d.path.split("/").pop()}
                      </span>
                      {d.isNew && (
                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/15 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Nuevo
                        </span>
                      )}
                      {d.isDeleted && (
                        <span className="text-[8px] font-black text-red-500 bg-red-500/15 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Eliminado
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/60 truncate block">
                      {d.path}
                    </span>
                  </div>

                  {/* +/- del archivo */}
                  <div className="flex items-center gap-1 shrink-0">
                    {d.addedCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-500 tabular-nums">
                        +{d.addedCount}
                      </span>
                    )}
                    {d.removedCount > 0 && (
                      <span className="text-[10px] font-bold text-red-500 tabular-nums">
                        −{d.removedCount}
                      </span>
                    )}
                    {/* Ícono "ver código" visible al hover */}
                    <Code2 className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer: botón Aceptar */}
          <div className="px-3 py-2.5 border-t border-zinc-200/40 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground/70 font-medium hidden sm:inline">
              Toca un archivo para ver su código
            </span>
            <button
              onClick={() => clearBuildDiff()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-95 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              Aceptar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}