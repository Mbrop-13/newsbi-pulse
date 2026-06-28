"use client";

import { useState, useMemo } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitCompare,
  Plus,
  Minus,
  FilePlus2,
  FileX2,
  ChevronRight,
  ChevronDown,
  FileCode2,
} from "lucide-react";

/**
 * Muestra el diff de la última generación/actualización de la IA.
 *
 * Se alimenta de `lastBuildDiff` del store, que se calcula en
 * setFiles/updateMultipleFiles comparando el snapshot previo vs el nuevo.
 *
 * Es un modal (Dialog) con:
 *  - Un árbol lateral de archivos modificados (+/- por archivo, badge nuevo/eliminado).
 *  - Un visor central con las líneas añadidas (verde) / eliminadas (rojo).
 */
export function DiffViewerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lastBuildDiff = useWebBuilderStore((s) => s.lastBuildDiff);
  const clearBuildDiff = useWebBuilderStore((s) => s.clearBuildDiff);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalAdded = useMemo(
    () => lastBuildDiff.reduce((acc, d) => acc + d.addedCount, 0),
    [lastBuildDiff]
  );
  const totalRemoved = useMemo(
    () => lastBuildDiff.reduce((acc, d) => acc + d.removedCount, 0),
    [lastBuildDiff]
  );

  const current = lastBuildDiff.find((d) => d.path === selectedPath) ?? lastBuildDiff[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) clearBuildDiff();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 py-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary" />
            Cambios de la última generación
            <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-bold">
              <span className="flex items-center gap-0.5 text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                <Plus className="w-2.5 h-2.5" /> {totalAdded}
              </span>
              <span className="flex items-center gap-0.5 text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                <Minus className="w-2.5 h-2.5" /> {totalRemoved}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {lastBuildDiff.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-8">
            <GitCompare className="w-10 h-10 mb-3 opacity-20 text-primary" />
            <p className="font-semibold text-sm text-foreground">Sin cambios recientes</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
              Cuando la IA genere o actualice archivos, aquí verás qué líneas se añadieron o eliminaron.
            </p>
          </div>
        ) : (
          <div className="flex-grow flex min-h-0">
            {/* Sidebar: lista de archivos */}
            <div className="w-56 border-r border-border overflow-y-auto shrink-0 bg-muted/5">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {lastBuildDiff.length} archivo{lastBuildDiff.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="py-1 px-1">
                {lastBuildDiff.map((d) => {
                  const isSelected = (current?.path ?? null) === d.path;
                  return (
                    <button
                      key={d.path}
                      onClick={() => setSelectedPath(d.path)}
                      className={cn(
                        "w-full flex items-center gap-2 py-1.5 px-2 text-left text-[11px] font-medium transition-all rounded-lg",
                        isSelected
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {d.isNew ? (
                        <FilePlus2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : d.isDeleted ? (
                        <FileX2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span className="truncate flex-1">{d.path.split("/").pop()}</span>
                      <span className="flex items-center gap-0.5 shrink-0">
                        {d.addedCount > 0 && (
                          <span className="text-[9px] text-green-500 font-bold">+{d.addedCount}</span>
                        )}
                        {d.removedCount > 0 && (
                          <span className="text-[9px] text-red-500 font-bold">-{d.removedCount}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visor central */}
            <div className="flex-grow flex flex-col min-h-0 bg-background">
              {current ? (
                <>
                  <div className="px-4 py-2 border-b border-border bg-muted/40 shrink-0 flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] font-mono font-bold text-foreground">
                      {current.path}
                    </span>
                    {current.isNew && (
                      <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        NUEVO
                      </span>
                    )}
                    {current.isDeleted && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                        ELIMINADO
                      </span>
                    )}
                  </div>
                  <div className="flex-grow overflow-auto min-h-0 font-mono text-[11px] leading-relaxed">
                    {/* Líneas: cuando hay muchos "equal" consecutivos los colapsamos
                        para no saturar. Mostramos contexto alrededor de los cambios. */}
                    {renderDiffLines(current)}
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-muted-foreground text-xs">
                  Selecciona un archivo
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  function renderDiffLines(file: typeof current) {
    if (!file) return null;
    const lines = file.lines;
    const items: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prev = lines[i - 1];
      const next = lines[i + 1];

      // Colapsar bloques "equal" largos: si una línea equal no tiene vecinos
      // changed y hay muchas seguidas, mostrar un separador "…".
      if (
        line.type === "equal" &&
        prev?.type !== "added" &&
        prev?.type !== "removed" &&
        next?.type !== "added" &&
        next?.type !== "removed"
      ) {
        // contar racha de equals
        let run = 0;
        let j = i;
        while (j < lines.length && lines[j].type === "equal") {
          run++;
          j++;
        }
        if (run > 6) {
          items.push(
            <div
              key={`gap-${i}`}
              className="text-center text-muted-foreground/50 py-1 select-none border-y border-border/30 bg-muted/10"
            >
              ⋯ {run - 6} líneas sin cambios ⋯
            </div>
          );
          // saltar al final de la racha menos 3 de contexto
          i = j - 4;
          continue;
        }
      }

      items.push(
        <div
          key={i}
          className={cn(
            "flex items-start px-3 py-0.5 whitespace-pre-wrap break-all",
            line.type === "added" && "bg-green-500/10",
            line.type === "removed" && "bg-red-500/10"
          )}
        >
          <span className="w-8 shrink-0 text-right pr-2 text-muted-foreground/40 select-none">
            {line.newLineNumber ?? line.oldLineNumber ?? ""}
          </span>
          <span className="w-4 shrink-0 select-none">
            {line.type === "added" && <Plus className="w-3 h-3 text-green-500 inline" />}
            {line.type === "removed" && <Minus className="w-3 h-3 text-red-500 inline" />}
            {line.type === "equal" && <span className="text-muted-foreground/30"> </span>}
          </span>
          <span
            className={cn(
              "flex-1",
              line.type === "added" && "text-green-300",
              line.type === "removed" && "text-red-300",
              line.type === "equal" && "text-foreground/70"
            )}
          >
            {line.text || " "}
          </span>
        </div>
      );
    }
    return items;
  }
}
