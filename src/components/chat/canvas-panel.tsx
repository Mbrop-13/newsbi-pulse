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
    <div className="h-full w-full flex flex-col overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] shadow-2xl shadow-black/5 dark:shadow-black/40 relative">
      
      {/* ═══════════════════════════════════════════════════ */}
      {/*  TOP HEADER BAR — macOS/Bolt.new-inspired chrome   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-gray-250/70 dark:border-white/[0.06] bg-white dark:bg-[#0C0C0E] select-none">
        
        {/* Left: View Tabs (Code / Preview) */}
        <div className="flex items-center gap-3.5 min-w-0">
          {hasPreview ? (
            <div className="flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/80">
              <button
                onClick={() => setActiveTab("code")}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer",
                  activeTab === "code"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/30 dark:border-zinc-700/50"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                title="Mostrar código"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer",
                  activeTab === "preview"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/30 dark:border-zinc-700/50"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                title="Mostrar vista previa"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-250/30 dark:border-zinc-800">
              <Code className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Share button - Styled premium black like the image */}
          <button
            onClick={handleCopy} // Using copy code link as primary sharing action
            className="h-8 gap-1.5 rounded-lg px-3 bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition-all flex items-center shadow-sm select-none cursor-pointer"
            title="Compartir código"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>

          {/* Edit (Focus editor) button */}
          <button
            onClick={() => textareaRef.current?.focus()}
            className="w-8 h-8 rounded-lg hover:bg-zinc-150/50 dark:hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
            title="Editar código"
          >
            <Play className="w-3.5 h-3.5 rotate-90" /> {/* Generic indicator icon or pencil representation */}
          </button>

          {/* Copy button with text - light border style */}
          <button
            onClick={handleCopy}
            className="h-8 gap-1.5 rounded-lg px-3 border border-zinc-250 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-750 dark:text-zinc-350 text-xs font-bold transition-all flex items-center shadow-xs select-none cursor-pointer"
            title="Copiar código al portapapeles"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          {/* Export / Download icon button */}
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg hover:bg-zinc-150/50 dark:hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer"
            title="Descargar archivo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            onClick={closeCanvas}
            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent text-zinc-450 hover:text-red-650 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT AREA                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        
        {/* Code Editor View */}
        {(activeTab === "code" || !hasPreview) && (
          <div className="flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-[#0C0C0E]">
            {/* Line Numbers gutter - clean blended look without borders/backgrounds */}
            <div
              ref={lineNumbersRef}
              className="w-12 py-4 text-right select-none bg-transparent pr-4 overflow-hidden shrink-0 font-mono text-[11px] leading-6 text-zinc-350 dark:text-zinc-650"
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
                "flex-1 h-full py-4 px-2 resize-none outline-none border-none bg-transparent overflow-auto",
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
            <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-250/50 dark:border-white/[0.04] bg-white/50 dark:bg-white/[0.02] shrink-0 select-none">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {isHtml ? "Vista Previa HTML" : isSvg ? "Vista Previa SVG" : "Vista Previa Markdown"}
              </span>
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>En vivo</span>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto p-3">
              <div className="h-full rounded-xl overflow-hidden border border-gray-250/60 dark:border-white/[0.04] bg-white dark:bg-[#0C0C0E] shadow-inner">
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
    </div>
  );
}
