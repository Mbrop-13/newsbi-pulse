"use client";

import { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { 
  X, 
  Play, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Loader2, 
  Check, 
  Terminal, 
  AlertCircle,
  Eye,
  Code,
  Copy,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Language badge colors
const LANG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  python: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  javascript: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20" },
  typescript: { bg: "bg-blue-600/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-600/20" },
  tsx: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20" },
  jsx: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20" },
  html: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
  htm: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
  css: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  json: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  markdown: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20" },
  md: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20" },
  svg: { bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500/20" },
};

const DEFAULT_LANG_COLOR = { bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-500/20" };

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
  } = useCanvasStore();

  const [isRunning, setIsRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [consoleOpen, setConsoleOpen] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Reset to code tab when a new file opens
  useEffect(() => {
    if (activeFile) {
      setActiveTab("code");
      setConsoleOpen(true);
    }
  }, [activeFile?.title]);

  if (!activeFile) {
    return (
      <div className="h-full w-full flex items-center justify-center select-none">
        <div className="flex flex-col items-center text-center space-y-5 p-8 max-w-sm">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-500/10 dark:to-orange-500/10 backdrop-blur-sm border border-amber-500/10 flex items-center justify-center shadow-xl shadow-amber-500/5">
              <FileCode2 className="w-9 h-9 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-bold text-zinc-800 dark:text-white">Intérprete de Código</h4>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              El asistente generará código aquí. Podrás editar, ejecutar y previsualizar en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Esperando código...</span>
          </div>
        </div>
      </div>
    );
  }

  const lineCount = activeFile.code.split("\n").length;
  const langKey = activeFile.language.toLowerCase();
  const isPython = langKey === "python";
  const isHtml = langKey === "html" || langKey === "htm";
  const isSvg = langKey === "svg";
  const isMarkdown = langKey === "markdown" || langKey === "md";
  const hasPreview = isHtml || isSvg || isMarkdown;
  const langColor = LANG_COLORS[langKey] || DEFAULT_LANG_COLOR;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleRunCode = async () => {
    if (!isPython) return;
    setIsRunning(true);
    
    try {
      const response = await fetch("/api/run-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: activeFile.code }),
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
    const ext = extensions[langKey] || "txt";
    const blob = new Blob([activeFile.code], { type: "text/plain;charset=utf-8" });
    const safeTitle = activeFile.title.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    saveAs(blob, `${safeTitle}.${ext}`);
    toast.success("Archivo descargado con éxito");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setIsCopied(true);
      toast.success("Código copiado al portapapeles");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  const hasConsoleOutput = activeFile.stdout || activeFile.output || activeFile.error;
  const consoleHasContent = !!(activeFile.stdout || activeFile.output || activeFile.error);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] shadow-sm relative">
      
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] select-none">
        {/* Left: language badge + file name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wide shrink-0",
            langColor.bg,
            langColor.text,
            langColor.border
          )}>
            <Code className="w-3 h-3" />
            <span>{activeFile.language}</span>
          </div>
          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {activeFile.title}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPython && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="h-8 gap-1.5 rounded-lg px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition-all flex items-center shadow-sm select-none cursor-pointer disabled:opacity-60"
              title="Ejecutar código"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden sm:inline">{isRunning ? "Ejecutando" : "Ejecutar"}</span>
            </button>
          )}

          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
            title="Deshacer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
            title="Rehacer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
            title="Copiar código"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
            title="Descargar archivo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeCanvas}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View tabs (only when preview is available) */}
      {hasPreview && (
        <div className="px-4 py-2 flex items-center gap-2 border-b border-zinc-100 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] shrink-0 select-none">
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
              activeTab === "code"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Code className="w-3.5 h-3.5" />
            Código
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
              activeTab === "preview"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-white dark:bg-[#0C0C0E]">
        
        {/* Code Editor */}
        {(activeTab === "code" || !hasPreview) && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div
              ref={lineNumbersRef}
              className="w-12 py-4 text-right select-none bg-zinc-50/50 dark:bg-transparent pr-3 overflow-hidden shrink-0 font-mono text-[11px] leading-6 text-zinc-400 dark:text-zinc-600"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="h-6 flex items-center justify-end tabular-nums">
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={activeFile.code}
              onChange={(e) => updateActiveFileCode(e.target.value)}
              onScroll={handleScroll}
              className={cn(
                "flex-1 h-full py-4 px-3 resize-none outline-none border-none bg-white dark:bg-[#0C0C0E] overflow-auto",
                "text-zinc-800 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-700",
                "font-mono text-[13px] leading-6 selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200",
                "[scrollbar-width:thin] scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-white/[0.06]"
              )}
              placeholder="Escribe tu código aquí..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {hasPreview && activeTab === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-50/50 dark:bg-[#090909]">
            <div className="flex-1 overflow-auto p-3">
              <div className="h-full rounded-xl overflow-hidden border border-zinc-200/60 dark:border-white/[0.04] bg-white dark:bg-[#0C0C0E]">
                {isHtml && (
                  <iframe
                    srcDoc={activeFile.code}
                    title="HTML Preview"
                    sandbox="allow-scripts"
                    className="w-full h-full border-0"
                  />
                )}
                {isSvg && (
                  <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: activeFile.code }}
                      className="max-w-full max-h-full flex items-center justify-center"
                    />
                  </div>
                )}
                {isMarkdown && (
                  <div className="w-full h-full overflow-auto p-6 text-zinc-800 dark:text-zinc-200 font-sans prose dark:prose-invert max-w-none text-sm leading-relaxed [scrollbar-width:thin]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeFile.code}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Console / Output */}
      {consoleHasContent && (
        <div className="shrink-0 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#0A0A0A]">
          <button
            onClick={() => setConsoleOpen(!consoleOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                Consola
              </span>
              {activeFile.durationMs ? (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {activeFile.durationMs}ms
                </span>
              ) : null}
              {activeFile.success === false && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  Error
                </span>
              )}
            </div>
            {consoleOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            )}
          </button>
          
          {consoleOpen && (
            <div className="px-4 pb-3">
              <div className="rounded-lg border border-zinc-200/60 dark:border-white/[0.04] bg-white dark:bg-[#0C0C0E] p-3 max-h-48 overflow-auto [scrollbar-width:thin]">
                {activeFile.output && (
                  <div className="font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                    {activeFile.output}
                  </div>
                )}
                {activeFile.stdout && (
                  <div className="font-mono text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {activeFile.stdout}
                  </div>
                )}
                {activeFile.error && (
                  <div className="font-mono text-[12px] leading-relaxed text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {activeFile.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
