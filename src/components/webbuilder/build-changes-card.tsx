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

// Límite de archivos visibles antes de colapsar a "+N más".
const MAX_VISIBLE_FILES = 6;

/**
 * Tarjeta de cambios del último build, INTEGRADA dentro de la barra de input
 * (no es un componente flotante con borde propio). Se renderiza como la
 * sección superior de la barra de escribir: sin fondo/borde/redondez propios,
 * separada de la zona de texto solo por un divider sutil. Crece
 * incrementalmente con cada archivo generado, colapsa a "+N archivos más" a
 * partir de MAX_VISIBLE_FILES.
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
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden"
      >
        {/* Lista de archivos — sin fondo, solo divider que la separa del área
            de texto de la barra. Máximo 6 visibles para no invadir el input. */}
        <div className="px-1 pt-0.5 pb-1 max-h-[140px] overflow-y-auto scrollbar-hide">
          <div className="space-y-px">
            {lastBuildDiff.slice(0, MAX_VISIBLE_FILES).map((d) => (
              <motion.button
                key={d.path}
                layout
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => openFile(d.path)}
                className={cn(
                  "group w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all duration-150",
                  "hover:bg-zinc-100/90 dark:hover:bg-white/[0.05] active:scale-[0.995]"
                )}
              >
                {d.isNew ? (
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : d.isDeleted ? (
                  <FileX2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : (
                  <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}

                <span className="text-[12px] font-medium text-foreground/85 dark:text-foreground/85 truncate flex-1 group-hover:text-foreground transition-colors">
                  {d.path.split("/").pop()}
                </span>

                <div className="flex items-center gap-1 shrink-0 tabular-nums">
                  {d.addedCount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-500">+{d.addedCount}</span>
                  )}
                  {d.removedCount > 0 && (
                    <span className="text-[11px] font-bold text-red-500">−{d.removedCount}</span>
                  )}
                  <Code2 className="w-3 h-3 text-muted-foreground/25 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              </motion.button>
            ))}

            {remaining > 0 && (
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground">
                +{remaining} {remaining === 1 ? "archivo más" : "archivos más"}
              </div>
            )}
          </div>
        </div>

        {/* Footer compacto, sin borde superior (la división va abajo): totales
            micro + acción Aceptar fusionada a la derecha. */}
        <div className="flex items-center justify-between px-2 pb-1 pt-1 border-t border-foreground/5 dark:border-foreground/10">
          <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
            <span className="flex items-center gap-0.5 text-emerald-500/90">
              <Plus className="w-2.5 h-2.5" />{totalAdded}
            </span>
            <span className="flex items-center gap-0.5 text-red-500/90">
              <Minus className="w-2.5 h-2.5" />{totalRemoved}
            </span>
            <span className="text-muted-foreground/45 font-medium hidden sm:inline">
              · toca para ver
            </span>
          </div>

          <button
            onClick={() => clearBuildDiff()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-all active:scale-95 shrink-0"
          >
            <Check className="w-3 h-3" />
            Aceptar
          </button>
        </div>

        {/* Divisor separando esta sección del área de texto de la barra */}
        <div className="h-px bg-foreground/8 dark:bg-foreground/12 -mx-2.5 mb-2" />
      </motion.div>
    </AnimatePresence>
  );
}