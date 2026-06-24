"use client";

import { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { 
  X, 
  Play, 
  Download, 
  Share2, 
  RotateCcw, 
  RotateCw, 
  Cloud, 
  History, 
  Loader2, 
  Check, 
  Terminal, 
  AlertCircle,
  Eye,
  Code,
  Columns
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function CanvasPanel() {
  const { 
    activeFile, 
    closeCanvas, 
    updateActiveFileCode, 
    updateActiveFileResult, 
    undo, 
    redo, 
    undoStack, 
    redoStack,
    history,
    openCanvas
  } = useCanvasStore();

  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside listener for history dropdown
    function handleClickOutside(event: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);

  if (!activeFile) {
    return (
      <div className="h-full w-full bg-white dark:bg-[#0A0A0A] rounded-[28px] border border-gray-200 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-4 shadow-2xl relative select-none">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shadow-lg border border-amber-500/10">
          <Terminal className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-white">Intérprete de Código (Canvas)</h4>
          <p className="text-xs text-zinc-500 dark:text-gray-400 max-w-[280px]">
            Escribe un mensaje para que el asistente genere código, analice datos o ejecute scripts en Python.
          </p>
        </div>
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      </div>
    );
  }

  const lineCount = activeFile.code.split("\n").length;
  const isPython = activeFile.language.toLowerCase() === "python";
  const isHtml = activeFile.language.toLowerCase() === "html" || activeFile.language.toLowerCase() === "htm";
  const isSvg = activeFile.language.toLowerCase() === "svg";
  const isMarkdown = activeFile.language.toLowerCase() === "markdown" || activeFile.language.toLowerCase() === "md";
  const hasPreview = isHtml || isSvg || isMarkdown;

  // Sync scroll between textarea and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Run Python script
  const handleRunCode = async () => {
    if (!isPython) return;
    setIsRunning(true);
    
    try {
      const response = await fetch("/api/run-python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: activeFile.code,
        }),
      });

      const data = await response.json();
      
      updateActiveFileResult({
        stdout: data.stdout || "",
        output: data.output !== undefined && data.output !== null ? String(data.output) : undefined,
        error: data.stderr || data.error || undefined,
        durationMs: data.durationMs || 0,
        success: data.success,
      });

      if (data.success) {
        toast.success("Script ejecutado correctamente");
      } else {
        toast.error("Error al ejecutar el script");
      }
    } catch (err: any) {
      console.error(err);
      updateActiveFileResult({
        error: err.message || "Error al conectar con el servidor",
        success: false,
      });
      toast.error("Error de conexión");
    } finally {
      setIsRunning(false);
    }
  };

  // Download code file
  const handleDownload = () => {
    const extensions: Record<string, string> = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      tsx: "tsx",
      jsx: "jsx",
      html: "html",
      css: "css",
      json: "json",
    };
    const ext = extensions[activeFile.language.toLowerCase()] || "txt";
    const blob = new Blob([activeFile.code], { type: "text/plain;charset=utf-8" });
    const safeTitle = activeFile.title.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    saveAs(blob, `${safeTitle}.${ext}`);
    toast.success("Archivo descargado con éxito");
  };

  // Copy code link / code contents
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setIsCopied(true);
      toast.success("Código copiado al portapapeles");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-[#0A0A0A] rounded-[28px] border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
      {/* Top Header Panel */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#0c0c0c] select-none">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
            {activeFile.title}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Cloud className="w-3 h-3" />
            <span>Sincronizado</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo/Redo controls */}
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Deshacer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Rehacer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-0.5" />

          {/* Python execution button */}
          {isPython && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={cn(
                "h-8 gap-1.5 rounded-lg px-3 flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-md",
                isRunning 
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/20" 
                  : "bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98]"
              )}
              title="Ejecutar Script de Python"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-black text-black border-none" />
              )}
              <span>{isRunning ? "Ejecutando" : "Ejecutar"}</span>
            </button>
          )}

          {/* Download file */}
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Descargar archivo"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* History selection */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer",
                showHistory && "bg-gray-200/50 dark:bg-white/5 text-zinc-950 dark:text-white"
              )}
              title="Historial de archivos"
            >
              <History className="w-4 h-4" />
            </button>
            
            {showHistory && (
              <div className="absolute right-0 top-9 w-64 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1115] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-450 dark:text-muted-foreground mb-1">
                  Archivos recientes ({history.length})
                </div>
                {history.length === 0 ? (
                  <div className="text-[11px] text-zinc-500 p-2 text-center font-semibold">Sin historial</div>
                ) : (
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {history.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          openCanvas(file);
                          setShowHistory(false);
                        }}
                        className={cn(
                          "w-full text-left text-xs px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer font-medium",
                          activeFile.title === file.title ? "text-blue-650 dark:text-blue-400 bg-blue-50/50 dark:bg-white/[0.02]" : "text-zinc-700 dark:text-gray-300 hover:text-zinc-950 dark:hover:text-white"
                        )}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="truncate flex-1">{file.title}</span>
                        <span className="text-[9px] text-zinc-500 dark:text-gray-500 uppercase font-mono">{file.language}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share / Copy */}
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Copiar código"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>

          {hasPreview && (
            <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 border border-gray-200 dark:border-white/5 mr-1.5 shrink-0 select-none">
              <button
                onClick={() => setViewMode("editor")}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "editor" ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-950 dark:text-gray-400 dark:hover:text-white"
                )}
                title="Mostrar solo código"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Código</span>
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "split" ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-950 dark:text-gray-400 dark:hover:text-white"
                )}
                title="Mostrar código y vista previa"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dividido</span>
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "preview" ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-950 dark:text-gray-400 dark:hover:text-white"
                )}
                title="Mostrar solo vista previa"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Vista Previa</span>
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-0.5" />

          {/* Close Panel */}
          <button
            onClick={closeCanvas}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar Canvas"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex min-h-0 relative font-mono text-sm leading-relaxed overflow-hidden">
        <div className="flex h-full w-full overflow-hidden p-2 gap-2 relative bg-gray-50 dark:bg-[#090909]">
          
          {/* 1. Code Editor (visible when viewMode is "editor" or "split") */}
          {(viewMode === "editor" || viewMode === "split" || !hasPreview) && (
            <div className="flex-1 h-full flex overflow-hidden bg-transparent">
              {/* Scrollable Line Numbers column */}
              <div
                ref={lineNumbersRef}
                className="w-11 py-3 text-right select-none text-zinc-400 dark:text-white/20 bg-transparent pr-3 border-r border-gray-250 dark:border-white/5 overflow-hidden shrink-0 font-mono text-xs font-bold"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className="h-6 leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Main text area */}
              <textarea
                ref={textareaRef}
                value={activeFile.code}
                onChange={(e) => updateActiveFileCode(e.target.value)}
                onScroll={handleScroll}
                className={cn(
                  "flex-1 h-full py-3 px-4 resize-none outline-none border-none bg-transparent overflow-auto",
                  "text-zinc-800 dark:text-[#E4E4E7] placeholder-zinc-400 dark:placeholder-[#3F3F46] font-mono text-xs leading-6 selection:bg-blue-500/30 selection:text-white",
                  "[scrollbar-width:thin] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10"
                )}
                placeholder="Escribe tu código aquí..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Vertical divider handle for split view */}
          {hasPreview && viewMode === "split" && (
            <div className="w-[1px] h-full bg-gray-200 dark:bg-white/5 shrink-0" />
          )}

          {/* 2. Previewer Pane (visible when hasPreview is true and viewMode is "preview" or "split") */}
          {hasPreview && (viewMode === "preview" || viewMode === "split") && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-100 dark:bg-[#050505] rounded-2xl border border-gray-200 dark:border-white/5 p-2 animate-in fade-in duration-200">
              {isHtml && (
                <iframe
                  srcDoc={activeFile.code}
                  title="HTML Preview"
                  sandbox="allow-scripts"
                  className="w-full h-full bg-white rounded-xl border-0 shadow-xs"
                />
              )}
              {isSvg && (
                <div className="w-full h-full flex items-center justify-center bg-white dark:bg-zinc-950/40 p-4 overflow-auto rounded-xl shadow-xs">
                  <div 
                    dangerouslySetInnerHTML={{ __html: activeFile.code }}
                    className="max-w-full max-h-full flex items-center justify-center"
                  />
                </div>
              )}
              {isMarkdown && (
                <div className="w-full h-full overflow-auto bg-white dark:bg-[#070707] p-6 text-zinc-800 dark:text-gray-200 rounded-xl font-sans prose dark:prose-invert max-w-none text-xs [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 leading-relaxed shadow-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeFile.code}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Terminal / Output Console at the bottom */}
      {(isPython || activeFile.stdout || activeFile.output || activeFile.error) && (
        <div className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#080808] shrink-0 max-h-60 flex flex-col overflow-hidden">
          {/* Console Header */}
          <div className="px-5 py-2.5 bg-gray-100/50 dark:bg-[#0C0C0C] border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-500 dark:text-gray-400">
                Consola de Ejecución
              </span>
            </div>
            {activeFile.durationMs !== undefined && (
              <span className="text-[10px] text-zinc-400 dark:text-gray-500 font-mono">
                {activeFile.durationMs}ms
              </span>
            )}
          </div>

          {/* Output Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10 text-zinc-800 dark:text-gray-300">
            {isRunning ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 py-1 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ejecutando script en el sandbox...</span>
              </div>
            ) : (
              <>
                {/* 1. Show Errors/Stderr */}
                {activeFile.error && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-red-650 dark:text-red-500 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Error (stderr)</span>
                    </div>
                    <pre className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/10 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                      <code>{activeFile.error}</code>
                    </pre>
                  </div>
                )}

                {/* 2. Show Standard Output (stdout) */}
                {activeFile.stdout && (
                  <div className="space-y-1">
                    <div className="text-emerald-700 dark:text-emerald-500 font-bold">Consola (stdout)</div>
                    <pre className="text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-500/10 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                      <code>{activeFile.stdout}</code>
                    </pre>
                  </div>
                )}

                {/* 3. Show return value */}
                {activeFile.output && (
                  <div className="space-y-1">
                    <div className="text-blue-750 dark:text-blue-500 font-bold">Retorno</div>
                    <pre className="text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/10 border border-blue-250 dark:border-blue-500/10 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                      <code>{activeFile.output}</code>
                    </pre>
                  </div>
                )}

                {/* No execution results yet */}
                {!activeFile.stdout && !activeFile.output && !activeFile.error && (
                  <div className="text-zinc-450 dark:text-gray-500 italic py-2">
                    Pulsa "Ejecutar" para correr este script en el sandbox de WebAssembly.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

