"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { SandpackConsole } from "@codesandbox/sandpack-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SandboxRunner } from "./sandbox-runner";
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
  ExternalLink,
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
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Selecciona un archivo para ver su código
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* File Tab */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 shrink-0">
        <div className="flex items-center gap-2">
          {getFileIcon(activeFilePath)}
          <span className="text-[11px] font-bold text-gray-300">
            {activeFilePath}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
          title="Copiar código"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-muted/5">
        <pre className="p-4 text-[12px] font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">
          <code>{file.code}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Console Panel ───────────────────────────────────

function ConsolePanel() {
  const { compileLogs } = useWebBuilderStore();

  return (
    <div className="flex-grow flex flex-col bg-muted/5 min-h-0">
      <div className="flex-1 overflow-auto bg-[#1e1e1e] [&_.sp-console]:!bg-transparent [&_.sp-console]:!text-[12px] [&_.sp-console-item]:!border-b-[#333]">
        <SandpackConsole standalone resetOnPreviewRestart={false} />
      </div>
      
      {/* Fallback to custom logs if any exist outside sandpack */}
      {compileLogs.length > 0 && (
        <div className="h-32 border-t border-border/20 p-2 overflow-auto text-[11px] font-mono text-muted-foreground">
          {compileLogs.map((log, i) => (
            <div key={i} className="py-0.5">{log}</div>
          ))}
        </div>
      )}
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
            const charCount = file.code.length;
            const lineCount = file.code.split("\n").length;
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
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isInspectorActive, setIsInspectorActive] = useState(false);

  // Sync inspector state with the preview iframe
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Sandpack Preview"]');
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
                className="flex items-center gap-1.5 px-4 h-8 bg-foreground text-background hover:opacity-90 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
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
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
          
          {/* Code Editor Tab */}
          {selectedTab === "code" && (
            <div className="flex-grow flex min-h-0 w-full">
              {hasFiles ? (
                <>
                  {/* File Explorer Sidebar */}
                  <div className="w-48 bg-muted/5 overflow-y-auto hidden-scrollbar shrink-0">
                    <div className="px-3 py-2 border-b border-border">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Archivos
                      </span>
                    </div>
                    <FileTree />
                  </div>
                  <CodeViewer />
                </>
              ) : (
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
            </div>
          )}

          {/* Files Explorer Tab */}
          {selectedTab === "files" && <FilesPanel />}

          {/* Preview Tab */}
          {selectedTab === "preview" && (
            <div className="flex-1 relative min-h-0 w-full flex items-center justify-center overflow-auto p-4 bg-muted/20 dark:bg-muted/10">
              {(hasFiles && !isAiResponding) ? (
                <div 
                  className={cn(
                    "relative overflow-hidden bg-background transition-all duration-500 ease-in-out border border-black/20 dark:border-white/15 shadow-lg",
                    viewport === "desktop" ? "w-full h-full rounded-2xl" : 
                    viewport === "tablet" ? "w-[768px] h-[1024px] max-h-full rounded-[2rem] border-8 border-neutral-800 shadow-2xl" :
                    "w-[375px] h-[812px] max-h-full rounded-[3rem] border-[12px] border-neutral-800 shadow-2xl"
                  )}
                >
                  <SandboxRunner />
                </div>
              ) : (isAiResponding || isCompiling || chatLoading) ? (
                <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-8 overflow-hidden select-none">
                  {/* Grid pattern with light gradients */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(13,110,253,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,110,253,0.03)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />
                  
                  {/* Neon radial glows */}
                  <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-[80px] animate-pulse pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

                  <div className="relative z-10 flex flex-col items-center max-w-md w-full">
                    {activeAgentReports && activeAgentReports.length > 0 ? (
                      /* Live Agent Progress Box */
                      <div className="w-full bg-card/60 border border-border/40 backdrop-blur-lg rounded-2xl shadow-2xl p-5 mb-6 space-y-4 text-left">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                          <Cpu className="w-4 h-4 text-primary animate-pulse" />
                          <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">
                            Agentes de Desarrollo
                          </h3>
                          <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold ml-auto uppercase tracking-wide">
                            Trabajando...
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {activeAgentReports.map((report: any, idx: number) => {
                            const isSuccess = report.success !== false;
                            const isDone = report.content && report.success;
                            const isFailed = report.success === false || (report.content && !report.success);
                            const stats = getAgentLineStats(report.content, files);
                            
                            return (
                              <div key={idx} className="flex gap-3 items-start">
                                <div className="mt-0.5 shrink-0 flex items-center justify-center">
                                  {isFailed ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  ) : isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                  )}
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground truncate">
                                      {report.agentName}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground font-semibold uppercase tracking-wider">
                                      {report.role}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-normal">
                                    {report.task}
                                  </p>
                                  {report.filePath && (
                                    <div className="text-[9px] font-mono text-primary/80 mt-1 select-all font-semibold bg-muted/30 px-1.5 py-0.5 rounded border border-border/20 w-fit">
                                      {report.filePath}
                                    </div>
                                  )}
                                  {stats && (
                                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-sans">
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]",
                                        stats.fileStatus === "creating" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                      )}>
                                        {stats.fileStatus === "creating" ? "Nuevo" : "Edición"}
                                      </span>
                                      {stats.addedLines > 0 && (
                                        <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                                          +{stats.addedLines} {stats.addedLines === 1 ? 'línea' : 'líneas'}
                                        </span>
                                      )}
                                      {stats.deletedLines > 0 && (
                                        <span className="text-red-500 font-semibold flex items-center gap-0.5">
                                          -{stats.deletedLines} {stats.deletedLines === 1 ? 'línea' : 'líneas'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Default visual mockup loader when no agent reports are streaming yet */
                      <div className="w-full bg-card/65 border border-border/40 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden mb-8 space-y-0 animate-pulse relative">
                        {/* Window header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/20">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                          </div>
                          <div className="w-36 h-3.5 bg-muted/70 rounded-full" />
                          <div className="w-4 h-4 bg-muted/50 rounded" />
                        </div>
                        {/* Mockup dashboard grid */}
                        <div className="p-5 flex gap-4 h-56">
                          <div className="w-1/4 flex flex-col gap-3 border-r border-border/20 pr-4">
                            <div className="w-full h-8 bg-muted rounded-lg" />
                            <div className="w-5/6 h-5 bg-muted/65 rounded-lg" />
                            <div className="w-4/5 h-5 bg-muted/65 rounded-lg" />
                            <div className="w-full h-5 bg-muted/65 rounded-lg" />
                          </div>
                          <div className="flex-grow flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="h-12 bg-muted/70 rounded-xl" />
                              <div className="h-12 bg-muted/70 rounded-xl" />
                              <div className="h-12 bg-muted/70 rounded-xl" />
                            </div>
                            <div className="flex-grow bg-muted/50 rounded-xl p-3 flex flex-col justify-between">
                              <div className="flex justify-between items-center">
                                <div className="w-16 h-3 bg-muted rounded-full" />
                                <div className="w-8 h-3 bg-muted rounded-full" />
                              </div>
                              <div className="flex items-end gap-1.5 h-16 pt-2">
                                <div className="flex-1 bg-primary/10 rounded-t h-1/3" />
                                <div className="flex-1 bg-primary/15 rounded-t h-2/3" />
                                <div className="flex-1 bg-primary/25 rounded-t h-1/2" />
                                <div className="flex-1 bg-primary/20 rounded-t h-4/5 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="flex-1 bg-primary/15 rounded-t h-3/5" />
                                <div className="flex-1 bg-primary/10 rounded-t h-2/5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Highly Premium Shimmery Loader Badge */}
                    <div className="relative group w-full max-w-xs">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                      <div className="relative flex items-center justify-center gap-3 bg-card/90 border border-border/40 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl">
                        <div className="relative flex items-center justify-center shrink-0 w-4.5 h-4.5">
                          <Loader2 className="w-full h-full text-primary animate-spin" />
                        </div>
                        <span className="text-[11px] font-bold tracking-tight text-foreground bg-clip-text">
                          {isAiResponding ? "Agentes programando..." : "Compilando e inicializando la interfaz..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
            </div>
          )}

          {/* Console logs tab */}
          {selectedTab === "console" && <ConsolePanel />}
        </div>
      </div>
    </TooltipProvider>
  );
}
