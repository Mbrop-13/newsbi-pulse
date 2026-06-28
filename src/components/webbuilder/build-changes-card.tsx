"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  FilePlus2,
  FileX2,
  FileCode2,
  Code2,
  Check,
} from "lucide-react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { cn } from "@/lib/utils";

// Límite de archivos visibles antes de colapsar (renderiza solo los últimos N;
// seguirán contándose en el total). Mantiene la tarjeta compacta.
const MAX_VISIBLE_FILES = 4;

/**
 * Tarjeta de cambios del último build: extensión visual de la barra de input.
 *
 * Diseño: misma familia de bordes/redondez que la barra de input (no una
 * tarjeta flotante con cabecera), crece incrementalmente con cada archivo,
 * colapsa a partir de MAX_VISIBLE_FILES. Sin título "Cambios aplicados" (ruido):
 * la firma es solo la lista紧凑a de archivos +/− y una acción "Aceptar".
 *
 * Click en archivo → abre el editor de código (tab "code").
 */
export function BuildChangesCard() {
  const lastBuildDiff = useWebBuilderStore((s) => s.lastBuildDiff);
  const clearBuildDiff = useWebBuilderStore((s) => s.clearBuildDiff);
  const setSelectedTab = useWebBuilderStore((s) => s.setSelectedTab);
  const setActiveFile = useWebBuilderStore((s) => s.setActiveFile);

  if (lastBuildDiff.length === 0) return null;

  const totalAdded = lastBuildDiff.reduce((acc, d) => acc + d.addedCount, 0);
  const totalRemoved = lastBuildDiff.reduce((acc, d) => acc + d.removedCount, 0);
  const remaining = Math.max(0, lastBuildDiff.length - MAX_VISIBLE_FILES);

  const openFile = (path: string) => {
    setActiveFile(path);
    setSelectedTab("code");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="overflow-hidden mb-1"
      >
        <div className={cn(
          "w-full max-w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md",
          "rounded-t-xl border border-b-0 border-zinc-200/70 dark:border-zinc-800/70",
          "shadow-sm"
        )}>
          {/* Lista de archivos — crece incrementalmente, sin cabecera */}
          <div className="px-2 pt-2 pb-1 max-h-[156px] overflow-y-auto custom-scrollbar">
            <div className="space-y-0.5">
              {lastBuildDiff.slice(0, MAX_VISIBLE_FILES).map((d) => (
                <motion.button
                  key={d.path}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => openFile(d.path)}
                  className={cn(
                    "group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-200",
                    "hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] active:scale-[0.995]"
                  )}
                >
                  {/* Icono compacto (16px, sin caja) */}
                  {d.isNew ? (
                    <FilePlus2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : d.isDeleted ? (
                    <FileX2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}

                  {/* Nombre */}
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate flex-1 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {d.path.split("/").pop()}
                  </span>

                  {/* +/- */}
                  <div className="flex items-center gap-1 shrink-0 tabular-nums">
                    {d.addedCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-500">+{d.addedCount}</span>
                    )}
                    {d.removedCount > 0 && (
                      <span className="text-[10px] font-bold text-red-500">−{d.removedCount}</span>
                    )}
                    <Code2 className="w-3 h-3 text-muted-foreground/25 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                </motion.button>
              ))}

              {/* Cola colapsada */}
              {remaining > 0 && (
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground/70">
                  +{remaining} {remaining === 1 ? "archivo más" : "archivos más"}
                </div>
              )}
            </div>
          </div>

          {/* Pie: solo la acción Aceptar + totales sutiles, sin cabecera */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-zinc-200/40 dark:border-zinc-800/50">
            {/* Totales micro, discretionarios */}
            <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
              <span className="flex items-center gap-0.5 text-emerald-500/90">
                <Plus className="w-2.5 h-2.5" />{totalAdded}
              </span>
              <span className="flex items-center gap-0.5 text-red-500/90">
                <Minus className="w-2.5 h-2.5" />{totalRemoved}
              </span>
              <span className="text-muted-foreground/40 font-medium hidden sm:inline">
                · toca para ver código
              </span>
            </div>

            <button
              onClick={() => clearBuildDiff()}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-95 shrink-0"
            >
              <Check className="w-3 h-3" />
              Aceptar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}