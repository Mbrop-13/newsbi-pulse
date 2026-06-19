"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { SandpackConsole, SandpackProvider, SandpackCodeEditor, useSandpack } from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SandpackPreviewWrapper } from "./sandpack-preview-wrapper";
import { parseArtifact } from "@/lib/webbuilder-parser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Monitor,
  Code2,
  Terminal,
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileJson,
  FileText,
  Palette,
  Download,
  FolderOpen,
  Folder,
  Copy,
  Check,
  Cloud,
  Loader2,
  Share2,
  RefreshCw,
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  MousePointer2,
  Cpu,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";

// ─── File Icon Resolver ────────────────────────────
function getFileIcon(path: string) {
  if (path.endsWith(".tsx") || path.endsWith(".ts"))
    return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
  if (path.endsWith(".json"))
    return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
  if (path.endsWith(".css"))
    return <Palette className="w-3.5 h-3.5 text-pink-400" />;
  if (path.endsWith(".html"))
    return <FileCode2 className="w-3.5 h-3.5 text-orange-400" />;
  return <FileText className="w-3.5 h-3.5 text-gray-400" />;
}

// ─── File Tree Component ────────────────────────────
function FileTree() {
  const { files, activeFilePath, setActiveFile } = useWebBuilderStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Build a tree from file paths
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    for (const path of Object.keys(files)) {
      const parts = path.split("/").filter(Boolean);
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = { __isFile: true, __path: path };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
    }
    return root;
  }, [files]);

  function renderNode(
    node: Record<string, any>,
    depth: number = 0,
    parentPath: string = ""
  ) {
    const entries = Object.entries(node).sort(([a, av], [b, bv]) => {
      // Folders first, then files
      const aIsFile = av.__isFile;
      const bIsFile = bv.__isFile;
      if (aIsFile && !bIsFile) return 1;
      if (!aIsFile && bIsFile) return -1;
      return a.localeCompare(b);
    });

    return entries.map(([name, value]) => {
      if (value.__isFile) {
        const isActive = activeFilePath === value.__path;
        return (
          <button
            key={value.__path}
            onClick={() => setActiveFile(value.__path)}
            className={cn(
              "w-full flex items-center gap-2 py-1.5 pr-2 text-left text-[11px] font-medium transition-all duration-150 rounded-lg group",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            {getFileIcon(name)}
            <span className="truncate">{name}</span>
          </button>
        );
      }

      // Folder
      const folderPath = `${parentPath}/${name}`;
      const isCollapsed = collapsed[folderPath];
      return (
        <div key={folderPath}>
          <button
            onClick={() =>
              setCollapsed((prev) => ({
                ...prev,
                [folderPath]: !prev[folderPath],
              }))
            }
            className="w-full flex items-center gap-2 py-1.5 pr-2 text-left text-[11px] font-semibold text-foreground hover:bg-muted rounded-lg transition-all"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            )}
            {isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-blue-400/70" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{name}</span>
          </button>
          {!isCollapsed && renderNode(value, depth + 1, folderPath)}
        </div>
      );
    });
  }

  return (
    <div className="flex flex-col gap-0.5 py-1 px-1">{renderNode(tree)}</div>
  );
}

// ─── Code Viewer ─────────────────────────────────────
function CodeViewer() {
  const { files, activeFilePath } = useWebBuilderStore();
  const [copied, setCopied] = useState(false);
  const file = files[activeFilePath];

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Selecciona un archivo para ver su código
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* File Tab */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-2">
          {getFileIcon(activeFilePath)}
          <span className="text-[11px] font-bold text-foreground">
            {activeFilePath}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Copiar código"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="flex-1 min-h-0 overflow-auto bg-background text-foreground relative">
        <SandpackCodeEditor
          showLineNumbers={true}
          showTabs={false}
          showRunButton={false}
          style={{
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: 0,
            background: "transparent",
            fontSize: "12px",
          }}
        />
      </div>
    </div>
  );
}

// ─── Console Panel ───────────────────────────────────

function ConsolePanel() {
  const { compileLogs, files } = useWebBuilderStore();
  const hasFiles = Object.keys(files).length > 0;
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [compileLogs]);

  if (!hasFiles) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5 min-h-[300px]">
        <Terminal className="w-10 h-10 mb-3 opacity-30 text-primary" />
        <p className="font-semibold text-sm text-foreground">Sin consola activa</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          La consola estará disponible una vez que el proyecto tenga archivos cargados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col bg-[#0B0F19] min-h-0 text-gray-300 font-mono text-[11px] p-4 select-text">
      <div className="flex-1 overflow-auto space-y-1.5 scrollbar-thin">
        {compileLogs.length === 0 ? (
          <div className="text-gray-500 italic">Esperando logs del contenedor...</div>
        ) : (
          compileLogs.map((log, i) => (
            <div key={i} className="leading-relaxed break-all whitespace-pre-wrap">
              {log}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

// ─── Files Panel ───────────────────────────────────
function FilesPanel() {
  const { files, setActiveFile, setSelectedTab } = useWebBuilderStore();
  const fileList = Object.entries(files);

  if (fileList.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5 min-h-[300px]">
        <FolderOpen className="w-10 h-10 mb-3 opacity-30 text-primary animate-pulse" />
        <p className="font-semibold text-sm text-foreground">Sin archivos en el proyecto</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Los agentes de IA generarán los archivos de código aquí una vez que comiences a describir tu plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-background p-6 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">Archivos del Proyecto</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Explora y edita el código fuente de tu aplicación.</p>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
            {fileList.length} archivo{fileList.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fileList.map(([path, file]) => {
            // Defensivo: file.code podría no ser string si el formato del store
            // está corrupto (string plano, undefined, objeto). Nunca debe crashear.
            const codeStr = typeof file?.code === "string" ? file.code : String(file?.code ?? "");
            const charCount = codeStr.length;
            const lineCount = codeStr.split("\n").length;
            return (
              <div
                key={path}
                onClick={() => {
                  setActiveFile(path);
                  setSelectedTab("code");
                }}
                className="group relative p-4 rounded-xl bg-card border border-transparent hover:border-primary/50 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                    {getFileIcon(path)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {path.split("/").pop()}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate font-mono mt-0.5">
                      {path}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-[9px] text-muted-foreground font-medium">
                  <span>{lineCount} líneas</span>
                  <span>{(charCount / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getAgentLineStats(reportContent: string, existingFiles: Record<string, any>) {
  if (!reportContent) return null;
  const artifact = parseArtifact(reportContent);
  if (!artifact || !artifact.actions || artifact.actions.length === 0) return null;

  let addedLines = 0;
  let deletedLines = 0;
  let fileStatus: "creating" | "modifying" = "creating";

  for (const action of artifact.actions) {
    if (action.type === "file") {
      const lineCount = action.content.split("\n").length;
      const fileExists = existingFiles && (existingFiles[action.filePath] || existingFiles["/" + action.filePath] || existingFiles[action.filePath.replace(/^\//, "")]);
      if (fileExists) {
        fileStatus = "modifying";
        const oldLineCount = (fileExists.code || "").split("\n").length;
        addedLines += lineCount;
        deletedLines += oldLineCount;
      } else {
        fileStatus = "creating";
        addedLines += lineCount;
      }
    } else if (action.type === "update") {
      fileStatus = "modifying";
      for (const diff of action.diffs) {
        const searchLines = diff.search.split("\n").length;
        const replaceLines = diff.replace.split("\n").length;
        deletedLines += searchLines;
        addedLines += replaceLines;
      }
    }
  }

  return { addedLines, deletedLines, fileStatus };
}

function SandpackSyncListener() {
  const { sandpack } = useSandpack();
  const { updateFile, files } = useWebBuilderStore();

  useEffect(() => {
    const activeFile = sandpack.activeFile;
    if (!activeFile) return;

    const currentCode = sandpack.files[activeFile]?.code;
    const storeCode = files[activeFile]?.code;

    if (currentCode !== undefined && storeCode !== currentCode) {
      const timeout = setTimeout(() => {
        updateFile(activeFile, currentCode);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [sandpack.files, sandpack.activeFile, files, updateFile]);

  return null;
}

function PremiumSkeletonLoader({ isAiResponding }: { isAiResponding: boolean }) {
  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-8 overflow-hidden select-none">
      {/* Grid pattern with light gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(13,110,253,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,110,253,0.015)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-60 pointer-events-none" />
      
      {/* Neon radial glows */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Default visual mockup loader when compiling or loading */}
        <div className="w-full bg-card/45 border border-border/20 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mb-6 space-y-0 animate-pulse relative">
          {/* Window header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/10">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted/50" />
              <span className="w-2 h-2 rounded-full bg-muted/50" />
              <span className="w-2 h-2 rounded-full bg-muted/50" />
            </div>
            <div className="w-24 h-2 bg-muted/40 rounded-full" />
            <div className="w-3 h-3 bg-muted/40 rounded" />
          </div>
          {/* Mockup dashboard grid */}
          <div className="p-4 flex gap-3 h-40">
            <div className="w-1/4 flex flex-col gap-2.5 border-r border-border/10 pr-3">
              <div className="w-full h-6 bg-muted/50 rounded-lg" />
              <div className="w-5/6 h-4 bg-muted/30 rounded-lg" />
              <div className="w-4/5 h-4 bg-muted/30 rounded-lg" />
            </div>
            <div className="flex-grow flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-muted/40 rounded-lg" />
                <div className="h-8 bg-muted/40 rounded-lg" />
                <div className="h-8 bg-muted/40 rounded-lg" />
              </div>
              <div className="flex-grow bg-muted/20 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-2 bg-muted rounded-full" />
                  <div className="w-6 h-2 bg-muted rounded-full" />
                </div>
                <div className="flex items-end gap-1 h-10 pt-2">
                  <div className="flex-1 bg-primary/10 rounded-t h-1/3" />
                  <div className="flex-1 bg-primary/15 rounded-t h-2/3" />
                  <div className="flex-1 bg-primary/20 rounded-t h-1/2 animate-bounce" />
                  <div className="flex-1 bg-primary/10 rounded-t h-3/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highly Premium Shimmery Loader Badge */}
        <div className="relative group w-full max-w-xs">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-full blur opacity-30 group-hover:opacity-40 transition duration-1000 animate-tilt"></div>
          <div className="relative flex items-center justify-center gap-2.5 bg-card/85 border border-border/30 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            <span className="text-[10px] font-bold tracking-tight text-foreground/80">
              {isAiResponding ? "Agentes programando..." : "Compilando interfaz..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewPanel() {
  const { 
    selectedTab, 
    setSelectedTab, 
    files, 
    cloudSyncEnabled, 
    isSaving, 
    lastSavedAt, 
    isCompiling, 
    activeFilePath,
    undo,
    redo,
    canUndo,
    canRedo,
    isAiResponding,
    activeAgentReports
  } = useWebBuilderStore();
  const chatLoading = useAIChatStore((s) => s.isLoading);
  const { resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // stableFiles: snapshot de archivos que solo cambia cuando la IA NO está
  // respondiendo, para evitar recompilaciones en cada token del stream.
  const [stableFiles, setStableFiles] = useState(files);

  // Sync files to preview only when the AI is NOT responding (to avoid constant reloading)
  useEffect(() => {
    if (!isAiResponding) {
      setStableFiles(files);
    }
  }, [files, isAiResponding]);

  // handleRefresh: con Sandpack, forzar una recompilación del bundler.
  // El iframe del preview se recarga limpio para resetear el estado en memoria.
  const handleRefresh = async () => {
    setIframeKey((prev) => prev + 1);
    toast.success("Vista previa recargada");
  };

  // Determine if this is a React/TS project or plain HTML
  const hasReact = useMemo(() => {
    return Object.keys(stableFiles).some(
      (f) => f.endsWith(".tsx") || f.endsWith(".jsx")
    );
  }, [stableFiles]);

  // Convert our files format to Sandpack format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [path, file] of Object.entries(stableFiles)) {
      result[path] = file.code;
    }

    if (!hasReact && Object.keys(stableFiles).length > 0) {
      const entryPoints = ["/index.ts", "/src/index.ts", "/index.js", "/src/index.js"];
      for (const ep of entryPoints) {
        if (!result[ep]) {
          result[ep] = "// Auto-generated to prevent default entry point crash\n";
        }
      }
    }

    // Inject Inspector Script for React Templates
    if (hasReact && !result["/public/index.html"]) {
      result["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maverlang Preview</title>
    <style>
      .maverlang-inspector-hover {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.1s !important;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      let isInspectorActive = false;
      
      window.addEventListener('message', (e) => {
        if (e.data?.type === 'TOGGLE_INSPECTOR') {
          isInspectorActive = e.data.active;
          if (!isInspectorActive) {
            document.querySelectorAll('.maverlang-inspector-hover').forEach(el => el.classList.remove('maverlang-inspector-hover'));
          }
        }
      });

      document.addEventListener('mouseover', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target !== document.body && e.target !== document.documentElement) {
          e.target.classList.add('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target && e.target.classList) {
          e.target.classList.remove('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('click', (e) => {
        if (!isInspectorActive) return;
        e.preventDefault();
        e.stopPropagation();
        
        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) return;

        el.classList.remove('maverlang-inspector-hover');
        
        const clone = el.cloneNode(false);
        let innerText = el.innerText || '';
        if (innerText.length > 50) innerText = innerText.substring(0, 50) + '...';
        if (innerText) clone.innerText = innerText;
        
        window.parent.postMessage({
          type: 'MAVERLANG_ELEMENT_CLICKED',
          elementHtml: clone.outerHTML,
          tagName: el.tagName,
          className: el.className || ''
        }, '*');
        
        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);
    </script>
  </body>
</html>`;
    }

    return result;
  }, [stableFiles, hasReact]);

  // Sync inspector state with the preview iframe
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Maverlang Preview"]');
    if (iframe && (iframe as HTMLIFrameElement).contentWindow) {
      (iframe as HTMLIFrameElement).contentWindow?.postMessage({ type: 'TOGGLE_INSPECTOR', active: isInspectorActive }, '*');
    }
  }, [isInspectorActive]);

  // Turn off inspector when a click happens (message from iframe)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'MAVERLANG_INSPECTOR_DISABLED') {
        setIsInspectorActive(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const tabs = [
    { id: "preview" as const, label: "Preview", description: "Vista previa interactiva", icon: Monitor },
    { id: "files" as const, label: "Files", description: "Explorador de archivos", icon: FolderOpen },
    { id: "code" as const, label: "Code", description: "Editor de código fuente", icon: Code2 },
    { id: "console" as const, label: "Console", description: "Consola de compilación", icon: Terminal },
  ];

  const hasFiles = Object.keys(files).length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Tab Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-background shrink-0">
          
          {/* Left: Tab selection */}
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
                        isSelected
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {isSelected && <span>{tab.label}</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    {tab.description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

        {/* Center: Viewport & History Controls (Only show if Preview or Code is active) */}
        {(selectedTab === "preview" || selectedTab === "code") && (
          <div className="flex items-center gap-4">
            {/* History */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={undo}
                    disabled={!canUndo()}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                  Deshacer cambio
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={redo}
                    disabled={!canRedo()}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                  Rehacer cambio
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Viewport (Only in Preview) */}
            {selectedTab === "preview" && (
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("desktop")}
                      className={cn("p-1.5 rounded-md transition-all", viewport === "desktop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    Vista de PC
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("tablet")}
                      className={cn("p-1.5 rounded-md transition-all", viewport === "tablet" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    Vista de Tablet
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("mobile")}
                      className={cn("p-1.5 rounded-md transition-all", viewport === "mobile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    Vista de Celular
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Inspector Toggle (Only in Preview) */}
            {selectedTab === "preview" && (
              <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsInspectorActive(!isInspectorActive)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-[11px] font-bold",
                        isInspectorActive
                          ? "bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/30 animate-pulse"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <MousePointer2 className="w-3.5 h-3.5" />
                      {isInspectorActive && <span>Selecciona un elemento</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    Inspeccionar elemento (Click para Editar)
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleRefresh}
                className="flex items-center justify-center w-8 h-8 bg-secondary hover:bg-secondary/85 text-secondary-foreground rounded-full active:scale-95 transition-all duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
              Recargar vista previa
            </TooltipContent>
          </Tooltip>

          {/* Share button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => {
                  toast.success("Enlace de compartición copiado al portapapeles!");
                }}
                className="flex items-center gap-1.5 px-4 h-8 bg-secondary hover:bg-secondary/85 text-secondary-foreground rounded-full text-xs font-bold active:scale-95 transition-all duration-200"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartir
              </button>
            </TooltipTrigger>
            <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
              Copiar enlace para compartir
            </TooltipContent>
          </Tooltip>

          {/* Publish button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => {
                  toast.info("Publicando aplicación en producción...");
                  setTimeout(() => toast.success("Aplicación publicada con éxito en producción!"), 2000);
                }}
                className="flex items-center gap-1.5 px-4 h-8 bg-foreground text-background hover:opacity-90 rounded-full text-xs font-bold active:scale-95 transition-all"
              >
                Publicar
              </button>
            </TooltipTrigger>
            <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
              Publicar a la web en producción
            </TooltipContent>
          </Tooltip>

          {/* Save & Download button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  try {
                    // 1. Generate and download ZIP
                    const zip = new JSZip();
                    const currentFiles = useWebBuilderStore.getState().files;
                    
                    Object.entries(currentFiles).forEach(([path, file]) => {
                      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
                      zip.file(cleanPath, file.code);
                    });
                    
                    const blob = await zip.generateAsync({ type: "blob" });
                    saveAs(blob, "maverlang-project.zip");
                    toast.success("Proyecto descargado en ZIP!");

                    // 2. Sync to cloud as backup
                    await useWebBuilderStore.getState().syncToCloud();
                  } catch (err) {
                    console.error("Error saving project:", err);
                    toast.error("Error al guardar o descargar el proyecto");
                  }
                }}
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 px-4 h-8 bg-foreground text-background hover:opacity-90 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 min-w-[185px]"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Guardando..." : "Guardar y Descargar"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
              Descargar ZIP del código y guardar proyecto
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-h-0 bg-background border border-border/40 rounded-2xl overflow-hidden relative">
        {hasFiles ? (
          <SandpackProvider
            template={hasReact ? "react-ts" : "vanilla-ts"}
            files={sandpackFiles}
            theme={currentTheme}
            className="flex-grow flex flex-col min-h-0 w-full h-full relative bg-transparent border-none"
            style={{
              background: "transparent",
              color: "inherit",
              border: "none",
              borderRadius: 0,
            }}
            customSetup={{
              dependencies: {
                "lucide-react": "latest",
                "recharts": "latest",
                "framer-motion": "latest",
                "react-icons": "latest",
              },
            }}
            options={{
              activeFile: activeFilePath,
              externalResources: [
                "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
              ],
              autorun: true,
              autoReload: true,
            }}
          >
            <SandpackSyncListener />
            {/* Code Editor Tab */}
            {selectedTab === "code" && (
              <div className="flex-grow flex min-h-0 w-full">
                {/* File Explorer Sidebar */}
                <div className="w-48 bg-muted/5 overflow-y-auto hidden-scrollbar shrink-0 border-r border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Archivos
                    </span>
                  </div>
                  <FileTree />
                </div>
                <CodeViewer />
              </div>
            )}

            {/* Files Explorer Tab */}
            {selectedTab === "files" && <FilesPanel />}

            {/* Preview Tab */}
            {selectedTab === "preview" && (
              <div className="flex-grow flex flex-col min-h-0 w-full h-full relative overflow-hidden bg-slate-50 dark:bg-[#07090e] p-4 md:p-5">
                {/* Viewport Frame */}
                {viewport === "desktop" && (
                  <div className="flex-grow flex flex-col min-h-0 w-full h-full relative">
                    {/* Ventana con bordes redondeados estilo plataforma (sin chrome de navegador) */}
                    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0b0f19] rounded-2xl border border-border/40 shadow-xl overflow-hidden transition-all duration-300 ease-in-out relative">
                      {/* Barra superior ligera tipo plataforma */}
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 dark:bg-[#0f1322] border-b border-gray-100 dark:border-border/30 shrink-0">
                        {/* Indicador de estado (punto verde = corriendo) */}
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        </span>
                        {/* Barra URL estilo plataforma */}
                        <div className="flex-grow flex items-center justify-center gap-1.5 px-3 py-1.5 max-w-sm mx-auto bg-white dark:bg-[#07090e]/40 border border-gray-200/50 dark:border-border/10 rounded-lg text-[10px] text-muted-foreground font-mono select-none">
                          <Lock className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                          <span className="truncate">preview.maverlang.app</span>
                        </div>
                        {/* Acciones */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={handleRefresh} className="p-1.5 rounded-md hover:bg-muted/85 text-muted-foreground hover:text-foreground transition-all" title="Recargar preview">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Body de la preview */}
                      <div className="flex-grow min-h-0 relative w-full h-full bg-white dark:bg-background">
                        {(isAiResponding || isCompiling || chatLoading) ? (
                          <PremiumSkeletonLoader isAiResponding={isAiResponding || chatLoading} />
                        ) : (
                          <SandpackPreviewWrapper key={iframeKey} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {viewport === "tablet" && (
                  <div className="flex-grow flex flex-col items-center justify-center overflow-auto min-h-0 w-full h-full relative scrollbar-thin">
                    {/* Marco ligero de tablet (sin bezel pesado): contenedor redondeado adaptativo */}
                    <div className="w-full max-w-[768px] max-h-full aspect-[768/1024] relative flex flex-col bg-white dark:bg-[#0b0f19] rounded-2xl border border-border/40 shadow-xl overflow-hidden shrink-0">
                      <div className="flex-grow min-h-0 relative w-full h-full bg-white dark:bg-background overflow-hidden">
                        {(isAiResponding || isCompiling || chatLoading) ? (
                          <PremiumSkeletonLoader isAiResponding={isAiResponding || chatLoading} />
                        ) : (
                          <SandpackPreviewWrapper key={iframeKey} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {viewport === "mobile" && (
                  <div className="flex-grow flex flex-col items-center justify-center overflow-auto min-h-0 w-full h-full relative scrollbar-thin">
                    {/* Marco ligero de móvil (sin bezel pesado): contenedor redondeado adaptativo */}
                    <div className="w-full max-w-[390px] max-h-full aspect-[390/800] relative flex flex-col bg-white dark:bg-[#0b0f19] rounded-3xl border border-border/40 shadow-xl overflow-hidden shrink-0">
                      <div className="flex-grow min-h-0 relative w-full h-full bg-white dark:bg-background overflow-hidden">
                        {(isAiResponding || isCompiling || chatLoading) ? (
                          <PremiumSkeletonLoader isAiResponding={isAiResponding || chatLoading} />
                        ) : (
                          <SandpackPreviewWrapper key={iframeKey} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Console logs tab */}
            {selectedTab === "console" && <ConsolePanel />}
          </SandpackProvider>
        ) : (
          <>
            {/* Code Editor Tab Empty state */}
            {selectedTab === "code" && (
              <div className="flex-grow flex items-center justify-center p-8 text-center text-muted-foreground bg-muted/5 min-h-[300px]">
                <div className="max-w-xs">
                  <Code2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-primary" />
                  <p className="font-semibold text-sm text-foreground">No hay archivos activos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona un archivo de la pestaña <strong>Files</strong> para inspeccionar o editar su código fuente.
                  </p>
                </div>
              </div>
            )}

            {/* Files Explorer Tab */}
            {selectedTab === "files" && <FilesPanel />}

            {/* Preview Tab Empty state */}
            {selectedTab === "preview" && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center p-6">
                  <Monitor className="w-10 h-10 mx-auto mb-3 opacity-20 text-primary" />
                  <p className="font-semibold text-foreground">Sin proyecto activo</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Envía un primer mensaje en el chat describiendo la plataforma que quieres crear.
                  </p>
                </div>
              </div>
            )}

            {/* Console logs tab Empty state */}
            {selectedTab === "console" && <ConsolePanel />}
          </>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}
