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
  Copy,
  FileCode2,
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
    history,
    openCanvas
  } = useCanvasStore();

  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  // Reset to code tab when a new file opens
  useEffect(() => {
    if (activeFile) {
      setActiveTab("code");
    }
  }, [activeFile?.title]);

  if (!activeFile) {
    return (
      <div className="h-full w-full flex items-center justify-center select-none">
        <div className="flex flex-col items-center text-center space-y-5 p-8 max-w-sm">
          {/* Elegant loading orb */}
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

  const hasConsoleOutput = isPython || activeFile.stdout || activeFile.output || activeFile.error;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] shadow-2xl shadow-black/5 dark:shadow-black/40 relative">
      
      {/* ═══════════════════════════════════════════════════ */}
      {/*  TOP HEADER BAR — macOS-inspired window chrome     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-gray-200/80 dark:border-white/[0.06] bg-gray-50/70 dark:bg-[#111114] backdrop-blur-sm select-none">
        
        {/* Left: File Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Colored dot indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30 shrink-0" />
          
          <span className="text-[13px] font-semibold text-zinc-800 dark:text-white truncate max-w-[180px]">
            {activeFile.title}
          </span>

          {/* Language badge */}
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border",
            langColor.bg, langColor.text, langColor.border
          )}>
            {activeFile.language}
          </div>

          {/* Sync status */}
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
            <Cloud className="w-3 h-3" />
            <span className="hidden sm:inline">Sincronizado</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="w-7 h-7 rounded-lg hover:bg-gray-200/60 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            title="Deshacer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {/* Redo */}
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="w-7 h-7 rounded-lg hover:bg-gray-200/60 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            title="Rehacer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.06] mx-0.5" />

          {/* Python Run button */}
          {isPython && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={cn(
                "h-7 gap-1.5 rounded-lg px-3 flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer",
                isRunning 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" 
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
              )}
              title="Ejecutar"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{isRunning ? "Ejecutando..." : "Ejecutar"}</span>
            </button>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-7 h-7 rounded-lg hover:bg-gray-200/60 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Descargar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="w-7 h-7 rounded-lg hover:bg-gray-200/60 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Copiar código"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* History */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer",
                showHistory && "bg-gray-200/60 dark:bg-white/5 text-zinc-700 dark:text-white"
              )}
              title="Historial"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            
            {showHistory && (
              <div className="absolute right-0 top-9 w-72 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#151518]/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Archivos recientes · {history.length}
                </div>
                {history.length === 0 ? (
                  <div className="text-[11px] text-zinc-400 p-3 text-center font-medium">Sin historial</div>
                ) : (
                  <div className="space-y-0.5 max-h-52 overflow-y-auto scrollbar-thin">
                    {history.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          openCanvas(file);
                          setShowHistory(false);
                        }}
                        className={cn(
                          "w-full text-left text-[12px] px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer",
                          activeFile.title === file.title 
                            ? "bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold" 
                            : "text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] font-medium"
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          activeFile.title === file.title ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
                        )} />
                        <span className="truncate flex-1">{file.title}</span>
                        <span className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.5 rounded",
                          LANG_COLORS[file.language.toLowerCase()]?.bg || "bg-zinc-100 dark:bg-white/5",
                          LANG_COLORS[file.language.toLowerCase()]?.text || "text-zinc-500"
                        )}>
                          {file.language}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.06] mx-0.5" />

          {/* Close */}
          <button
            onClick={closeCanvas}
            className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  TAB BAR — Code / Preview toggle                   */}
      {/* ═══════════════════════════════════════════════════ */}
      {hasPreview && (
        <div className="px-4 py-1.5 flex items-center gap-1 border-b border-gray-200/60 dark:border-white/[0.04] bg-gray-50/40 dark:bg-[#0e0e11] shrink-0 select-none">
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
              activeTab === "code"
                ? "bg-white dark:bg-white/[0.07] text-zinc-900 dark:text-white shadow-sm border border-gray-200/80 dark:border-white/[0.08]"
                : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-white/[0.03]"
            )}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Código</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
              activeTab === "preview"
                ? "bg-white dark:bg-white/[0.07] text-zinc-900 dark:text-white shadow-sm border border-gray-200/80 dark:border-white/[0.08]"
                : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-gray-100/60 dark:hover:bg-white/[0.03]"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT AREA                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        
        {/* Code Editor View */}
        {(activeTab === "code" || !hasPreview) && (
          <div className="flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-[#0C0C0E]">
            {/* Line Numbers gutter */}
            <div
              ref={lineNumbersRef}
              className="w-12 py-4 text-right select-none bg-gray-50/50 dark:bg-[#0a0a0c] pr-3 border-r border-gray-200/60 dark:border-white/[0.04] overflow-hidden shrink-0 font-mono text-[11px] leading-6 text-zinc-300 dark:text-zinc-700"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="h-6 flex items-center justify-end tabular-nums">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Main text editor */}
            <textarea
              ref={textareaRef}
              value={activeFile.code}
              onChange={(e) => updateActiveFileCode(e.target.value)}
              onScroll={handleScroll}
              className={cn(
                "flex-1 h-full py-4 px-4 resize-none outline-none border-none bg-transparent overflow-auto",
                "text-zinc-800 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-700",
                "font-mono text-[12px] leading-6 selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200",
                "[scrollbar-width:thin] scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-white/[0.06]"
              )}
              placeholder="Escribe tu código aquí..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview View */}
        {hasPreview && activeTab === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/50 dark:bg-[#090909]">
            {/* Preview header */}
            <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-200/50 dark:border-white/[0.04] bg-white/50 dark:bg-white/[0.02] shrink-0 select-none">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {isHtml ? "HTML Preview" : isSvg ? "SVG Preview" : "Markdown Preview"}
              </span>
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>En vivo</span>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto p-3">
              <div className="h-full rounded-xl overflow-hidden border border-gray-200/60 dark:border-white/[0.04] bg-white dark:bg-[#0C0C0E] shadow-inner">
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

      {/* ═══════════════════════════════════════════════════ */}
      {/*  TERMINAL / CONSOLE — macOS-inspired bottom panel  */}
      {/* ═══════════════════════════════════════════════════ */}
      {hasConsoleOutput && (
        <div className={cn(
          "border-t border-gray-200/80 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#09090b] shrink-0 flex flex-col overflow-hidden transition-all duration-200",
          consoleCollapsed ? "max-h-[36px]" : "max-h-56"
        )}>
          {/* Console Header — macOS style */}
          <button
            onClick={() => setConsoleCollapsed(!consoleCollapsed)}
            className="px-4 py-2 flex items-center justify-between shrink-0 select-none hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {/* Terminal traffic lights */}
              <div className="flex items-center gap-1.5">
                <div className="w-[9px] h-[9px] rounded-full bg-red-500/80" />
                <div className="w-[9px] h-[9px] rounded-full bg-yellow-500/80" />
                <div className="w-[9px] h-[9px] rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                  Consola
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFile.durationMs !== undefined && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono tabular-nums">
                  {activeFile.durationMs}ms
                </span>
              )}
              {activeFile.success === true && (
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                </div>
              )}
              {activeFile.success === false && (
                <div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                </div>
              )}
            </div>
          </button>

          {/* Console Output */}
          {!consoleCollapsed && (
            <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5 font-mono text-[11px] scrollbar-thin scrollbar-thumb-zinc-200/50 dark:scrollbar-thumb-white/[0.04]">
              {isRunning ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 py-2 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-semibold">Ejecutando en sandbox...</span>
                </div>
              ) : (
                <>
                  {/* Errors */}
                  {activeFile.error && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wide">
                        <AlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </div>
                      <pre className="text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-950/15 border border-red-200/60 dark:border-red-500/10 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        <code>{activeFile.error}</code>
                      </pre>
                    </div>
                  )}

                  {/* Stdout */}
                  {activeFile.stdout && (
                    <div className="space-y-1.5">
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wide">stdout</div>
                      <pre className="text-zinc-700 dark:text-zinc-300 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/40 dark:border-emerald-500/10 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        <code>{activeFile.stdout}</code>
                      </pre>
                    </div>
                  )}

                  {/* Return value */}
                  {activeFile.output && (
                    <div className="space-y-1.5">
                      <div className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wide">Retorno</div>
                      <pre className="text-zinc-700 dark:text-zinc-300 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-500/10 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        <code>{activeFile.output}</code>
                      </pre>
                    </div>
                  )}

                  {/* No output yet */}
                  {!activeFile.stdout && !activeFile.output && !activeFile.error && (
                    <div className="text-zinc-400 dark:text-zinc-600 py-2 flex items-center gap-2">
                      <Play className="w-3 h-3" />
                      <span>Pulsa "Ejecutar" para correr este script.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
