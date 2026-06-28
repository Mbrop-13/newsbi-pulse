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
  Undo2,
} from "lucide-react";

/**
 * Diff palabra-a-palabra inline.
 *
 * Toma una línea removed y su línea added adyacente (el caso típico de una
 * edición) y devuelve los spans a renderizar resaltando solo las palabras que
 * cambiaron, en vez de colorear toda la línea. Si las líneas son muy distintas
 * (diff de palabras > 70%), devolvemos null para caer al render de línea entera.
 */
function computeWordDiff(
  oldText: string,
  newText: string
): { addedWords: string[]; removedWords: string[]; common: Array<{ value: string; type: "equal" | "added" | "removed" }> } | null {
  // Tokenización simple por palabras + espacios (conserva separadores).
  const tokenize = (s: string) =>
    s.split(/(\s+)/).filter((t) => t.length > 0);
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  // LCS sobre tokens para alinear.
  const n = oldTokens.length;
  const m = newTokens.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (oldTokens[i] === newTokens[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const common: Array<{ value: string; type: "equal" | "added" | "removed" }> = [];
  let i = 0, j = 0;
  let changedTokens = 0;
  while (i < n && j < m) {
    if (oldTokens[i] === newTokens[j]) {
      common.push({ value: oldTokens[i], type: "equal" });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      common.push({ value: oldTokens[i], type: "removed" });
      changedTokens++;
      i++;
    } else {
      common.push({ value: newTokens[j], type: "added" });
      changedTokens++;
      j++;
    }
  }
  while (i < n) { common.push({ value: oldTokens[i], type: "removed" }); changedTokens++; i++; }
  while (j < m) { common.push({ value: newTokens[j], type: "added" }); changedTokens++; j++; }

  // Si casi todo cambió, el word-diff no aporta claridad → línea entera.
  const totalTokens = Math.max(n, m, 1);
  if (changedTokens / totalTokens > 0.7) return null;
  return { addedWords: [], removedWords: [], common };
}

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
  const revertFileToPrev = useWebBuilderStore((s) => s.revertFileToPrev);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [revertedPaths, setRevertedPaths] = useState<Set<string>>(new Set());

  const handleRevert = (path: string) => {
    const ok = revertFileToPrev(path);
    if (ok) {
      setRevertedPaths((prev) => new Set(prev).add(path));
    }
  };

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
                    <span className="text-[11px] font-mono font-bold text-foreground flex-1 truncate">
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
                    {/* #8 Revertir este archivo al estado anterior al build.
                        Solo si hubo cambios reales (no es equal) y no se ha revertido ya. */}
                    {(current.addedCount > 0 || current.removedCount > 0) && !revertedPaths.has(current.path) && (
                      <button
                        onClick={() => handleRevert(current.path)}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-1 rounded-lg transition-all active:scale-95"
                        title="Revertir este archivo al estado anterior a la última generación"
                      >
                        <Undo2 className="w-3 h-3" />
                        Revertir
                      </button>
                    )}
                    {revertedPaths.has(current.path) && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                        <Undo2 className="w-3 h-3" />
                        Revertido
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

      // #8 WORD-LEVEL DIFF INLINE: si esta línea es "removed" y la siguiente es
      // "added" (el patrón clásico de una edición), calculamos el diff de
      // palabras y renderizamos AMBAS líneas con resaltado inline (solo las
      // palabras que cambiaron), en vez de colorear la línea entera.
      if (line.type === "removed" && next?.type === "added") {
        const wordDiff = computeWordDiff(line.text, next.text);
        if (wordDiff) {
          // Línea removed con resaltado de palabras eliminadas.
          items.push(
            <div key={`rm-${i}`} className="flex items-start px-3 py-0.5 whitespace-pre-wrap break-all bg-red-500/10">
              <span className="w-8 shrink-0 text-right pr-2 text-muted-foreground/40 select-none">{line.oldLineNumber ?? ""}</span>
              <span className="w-4 shrink-0 select-none"><Minus className="w-3 h-3 text-red-500 inline" /></span>
              <span className="flex-1 text-red-300">
                {wordDiff.common.map((w, k) =>
                  w.type === "removed" ? (
                    <span key={k} className="bg-red-500/30 rounded-sm">{w.value}</span>
                  ) : w.type === "added" ? null : (
                    <span key={k} className="opacity-50">{w.value}</span>
                  )
                )}
              </span>
            </div>
          );
          // Línea added con resaltado de palabras añadidas.
          items.push(
            <div key={`ad-${i + 1}`} className="flex items-start px-3 py-0.5 whitespace-pre-wrap break-all bg-green-500/10">
              <span className="w-8 shrink-0 text-right pr-2 text-muted-foreground/40 select-none">{next.newLineNumber ?? ""}</span>
              <span className="w-4 shrink-0 select-none"><Plus className="w-3 h-3 text-green-500 inline" /></span>
              <span className="flex-1 text-green-300">
                {wordDiff.common.map((w, k) =>
                  w.type === "added" ? (
                    <span key={k} className="bg-green-500/30 rounded-sm">{w.value}</span>
                  ) : w.type === "removed" ? null : (
                    <span key={k} className="opacity-50">{w.value}</span>
                  )
                )}
              </span>
            </div>
          );
          i++; // consumir la línea "added" que ya renderizamos aquí.
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
