"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  FileCode2,
  FileJson,
  FileText,
  Palette,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  RefreshCw,
  Download,
  FolderOpen,
  Terminal,
  Code2,
  GitCompare,
  RotateCcw,
  CornerDownLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Sencillo scoring fuzzy: devuelve score > 0 si query "encaja" con target,
 * priorizando coincidencias en orden y al inicio de palabras. Usado para el
 * filtrado tipo Sublime/VSCode de la lista de archivos.
 */
function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Match directo: bonus alto.
  const directIdx = t.indexOf(q);
  if (directIdx !== -1) {
    let score = 100 - directIdx;
    if (directIdx === 0) score += 50;
    return score;
  }

  // Subsecuencia: cada char de q debe aparecer en t en orden.
  let ti = 0;
  let score = 0;
  let lastMatchIdx = -1;
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi];
    let found = -1;
    for (; ti < t.length; ti++) {
      if (t[ti] === c) {
        found = ti;
        break;
      }
    }
    if (found === -1) return 0; // no encaja
    // Bonus por cercanía entre matches consecutivos.
    score += lastMatchIdx === -1 ? 10 : 10 - Math.min(9, found - lastMatchIdx - 1);
    if (found === 0 || /[/.\-_]/.test(t[found - 1])) score += 5; // inicio de palabra
    lastMatchIdx = found;
    ti = found + 1;
  }
  return Math.max(score, 1);
}

type PaletteMode = "actions" | "files";

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  section: string;
  run: () => void;
  disabled?: boolean;
}

/**
 * Command palette unificada:
 *   - Cmd/Ctrl+K  → modo acciones (toggle tab, undo, refresh, diff, reset…)
 *   - Cmd/Ctrl+P  → modo archivos (búsqueda fuzzy para abrir)
 *
 * Se monta una sola vez en el workspace y escucha los atajos globalmente.
 * El padre puede forzar la apertura vía props si lo necesita.
 */
export function CommandPalette() {
  const {
    files,
    setActiveFile,
    setSelectedTab,
    setSplitView,
    undo,
    redo,
    canUndo,
    canRedo,
    resetProject,
    lastBuildDiff,
  } = useWebBuilderStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>("actions");
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Acciones disponibles (se reconstruyen al cambiar el estado relevante).
  const actions: CommandAction[] = useMemo(() => {
    const close = () => setOpen(false);
    return [
      {
        id: "tab-preview",
        label: "Ir a Vista Previa",
        icon: Monitor,
        section: "Vistas",
        keywords: "preview vista",
        run: () => { setSelectedTab("preview"); close(); },
      },
      {
        id: "tab-code",
        label: "Ir a Código",
        icon: Code2,
        section: "Vistas",
        keywords: "code codigo editor",
        run: () => { setSelectedTab("code"); close(); },
      },
      {
        id: "tab-files",
        label: "Ir a Archivos",
        icon: FolderOpen,
        section: "Vistas",
        keywords: "files archivos explorador",
        run: () => { setSelectedTab("files"); close(); },
      },
      {
        id: "tab-console",
        label: "Ir a Consola",
        icon: Terminal,
        section: "Vistas",
        keywords: "console consola logs",
        run: () => { setSelectedTab("console"); close(); },
      },
      {
        id: "split-toggle",
        label: "Alternar pantalla dividida",
        icon: Monitor,
        section: "Layout",
        keywords: "split dividir pantalla",
        run: () => { setSplitView(!useWebBuilderStore.getState().isSplitView); close(); },
      },
      {
        id: "undo",
        label: "Deshacer cambio",
        icon: Undo2,
        section: "Historial",
        keywords: "undo deshacer",
        disabled: !canUndo(),
        run: () => { undo(); close(); },
      },
      {
        id: "redo",
        label: "Rehacer cambio",
        icon: Redo2,
        section: "Historial",
        keywords: "redo rehacer",
        disabled: !canRedo(),
        run: () => { redo(); close(); },
      },
      {
        id: "diff",
        label: "Ver cambios de la última generación",
        icon: GitCompare,
        section: "Código",
        keywords: "diff cambios git",
        disabled: lastBuildDiff.length === 0,
        run: () => { window.dispatchEvent(new CustomEvent("maverlang-open-diff")); close(); },
      },
      {
        id: "refresh",
        label: "Recargar vista previa",
        icon: RefreshCw,
        section: "Preview",
        keywords: "refresh recargar reload",
        run: () => { window.dispatchEvent(new CustomEvent("maverlang-refresh-preview")); close(); },
      },
      {
        id: "reset",
        label: "Restaurar plantilla limpia",
        icon: RotateCcw,
        section: "Proyecto",
        keywords: "reset restaurar limpiar",
        run: () => { resetProject(); close(); },
      },
    ];
  }, [setSelectedTab, setSplitView, undo, redo, canUndo, canRedo, resetProject, lastBuildDiff.length]);

  // Lista de archivos con scoring fuzzy.
  const fileResults = useMemo(() => {
    const all = Object.keys(files);
    if (!query.trim()) {
      return all.slice(0, 50).map((path) => ({ path, score: 1 }));
    }
    return all
      .map((path) => ({ path, score: fuzzyScore(query, path) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [files, query]);

  // Lista de acciones filtrada por query.
  const actionResults = useMemo(() => {
    if (!query.trim()) return actions;
    return actions
      .map((a) => {
        const haystack = `${a.label} ${a.keywords ?? ""} ${a.section}`.toLowerCase();
        return { a, score: fuzzyScore(query, haystack) };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .map((x) => x.a);
  }, [actions, query]);

  const items = mode === "files" ? fileResults : actionResults;
  const itemCount = items.length;

  // Reset selección al cambiar query o modo.
  useEffect(() => setActiveIndex(0), [query, mode, itemCount]);

  // Foco al input al abrir.
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, mode]);

  // Atajos globales: Cmd/Ctrl+K (acciones), Cmd/Ctrl+P (archivos), Escape cerrar.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => {
          if (!o) setMode("actions");
          return !o;
        });
      } else if (mod && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setOpen(true);
        setMode("files");
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const executeItem = useCallback(
    (idx: number) => {
      if (mode === "files") {
        const r = fileResults[idx];
        if (r) {
          setActiveFile(r.path);
          setSelectedTab("code");
          setOpen(false);
        }
      } else {
        const a = actionResults[idx];
        if (a && !a.disabled) a.run();
      }
    },
    [mode, fileResults, actionResults, setActiveFile, setSelectedTab]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(itemCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeItem(activeIndex);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 gap-0 max-w-xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          {mode === "files" ? (
            <FileCode2 className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              mode === "files"
                ? "Buscar archivo por nombre…"
                : "Escribe un comando o busca…"
            }
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
          />
          <kbd className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {itemCount === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              {mode === "files"
                ? "No hay archivos que coincidan."
                : "No hay comandos que coincidan."}
            </div>
          ) : mode === "files" ? (
            (fileResults as { path: string; score: number }[]).map((r, idx) => (
              <ResultRow
                key={r.path}
                active={idx === activeIndex}
                onClick={() => executeItem(idx)}
                onHover={() => setActiveIndex(idx)}
              >
                <FileIconFor path={r.path} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground truncate">
                    {r.path.split("/").pop()}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">
                    {r.path}
                  </p>
                </div>
                {idx === activeIndex && <CornerDownLeft className="w-3 h-3 text-muted-foreground" />}
              </ResultRow>
            ))
          ) : (
            actionResults.map((a, idx) => (
              <ResultRow
                key={a.id}
                active={idx === activeIndex}
                disabled={a.disabled}
                onClick={() => !a.disabled && executeItem(idx)}
                onHover={() => setActiveIndex(idx)}
              >
                <a.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground truncate">{a.label}</p>
                  {a.hint && (
                    <p className="text-[10px] text-muted-foreground truncate">{a.hint}</p>
                  )}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {a.section}
                </span>
              </ResultRow>
            ))
          )}
        </div>

        {/* Footer / atajos */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-bold">↑↓</kbd> navegar</span>
            <span><kbd className="font-bold">↵</kbd> seleccionar</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "files" ? "actions" : "files")}
              className="hover:text-foreground transition-colors"
            >
              {mode === "files" ? "⌘K comandos" : "⌘P archivos"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  children,
  active,
  disabled,
  onClick,
  onHover,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <div
      onMouseMove={onHover}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted/50",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
    </div>
  );
}

function FileIconFor({ path }: { path: string }) {
  if (path.endsWith(".tsx") || path.endsWith(".ts"))
    return <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />;
  if (path.endsWith(".json"))
    return <FileJson className="w-4 h-4 text-yellow-400 shrink-0" />;
  if (path.endsWith(".css"))
    return <Palette className="w-4 h-4 text-pink-400 shrink-0" />;
  if (path.endsWith(".html"))
    return <FileCode2 className="w-4 h-4 text-orange-400 shrink-0" />;
  return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
}
