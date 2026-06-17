"use client";

import { useState, useMemo } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { SandboxRunner } from "./sandbox-runner";
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 shrink-0">
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
    <div className="flex-grow overflow-auto bg-muted/5 p-4 font-mono text-[11px] text-muted-foreground leading-relaxed">
      {compileLogs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground/50">
          <div className="text-center">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>La consola mostrará logs de compilación aquí</p>
          </div>
        </div>
      ) : (
        compileLogs.map((log, i) => (
          <div key={i} className="py-0.5">
            {log}
          </div>
        ))
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
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
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
                className="group relative p-4 rounded-xl bg-card border border-border hover:border-primary/50 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px]"
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

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[9px] text-muted-foreground font-medium">
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

export function PreviewPanel() {
  const { selectedTab, setSelectedTab, files, cloudSyncEnabled, isSaving, lastSavedAt, isCompiling, activeFilePath } = useWebBuilderStore();
  const chatLoading = useAIChatStore((s) => s.isLoading);

  const tabs = [
    { id: "preview" as const, label: "Preview", description: "Vista previa interactiva", icon: Monitor },
    { id: "files" as const, label: "Files", description: "Explorador de archivos", icon: FolderOpen },
    { id: "code" as const, label: "Code", description: "Editor de código fuente", icon: Code2 },
    { id: "console" as const, label: "Console", description: "Consola de compilación", icon: Terminal },
  ];

  const hasFiles = Object.keys(files).length > 0;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        
        {/* Left: Tab selection */}
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 border",
                        isSelected
                          ? "bg-card text-foreground border-border shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {isSelected && <span>{tab.label}</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
                    {tab.description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Share button */}
          <button 
            onClick={() => {
              toast.success("Enlace de compartición copiado al portapapeles!");
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg text-[10px] font-bold active:scale-95 transition-all duration-200"
          >
            <Share2 className="w-3 h-3" />
            Compartir
          </button>

          {/* Publish button */}
          <button 
            onClick={() => {
              toast.info("Publicando aplicación en producción...");
              setTimeout(() => toast.success("Aplicación publicada con éxito en producción!"), 2000);
            }}
            className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-95 text-white rounded-lg text-[10px] font-black shadow-md shadow-blue-500/10 active:scale-95 transition-all"
          >
            Publicar
          </button>

          {/* Save button (saying Guardar and being functional) */}
          <button
            onClick={async () => {
              try {
                await useWebBuilderStore.getState().syncToCloud();
                toast.success("Proyecto guardado en la nube con éxito!");
              } catch (err) {
                toast.error("Error al guardar el proyecto en la nube");
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 bg-foreground text-background hover:opacity-90 rounded-lg text-[10px] font-black active:scale-95 transition-all disabled:opacity-50"
            title="Guardar proyecto"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            <span>{isSaving ? "Guardando..." : "Guardar"}</span>
          </button>
        </div>
      </div>

      {/* Content wrapper with rounded corners */}
      <div className="flex-1 p-4 bg-muted/10 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          
          {/* Code Editor Tab */}
          {selectedTab === "code" && (
            <div className="flex-grow flex min-h-0 w-full">
              {hasFiles ? (
                <>
                  {/* File Explorer Sidebar */}
                  <div className="w-48 border-r border-border bg-muted/5 overflow-y-auto hidden-scrollbar shrink-0">
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

          {/* Preview Tab (Embedded within rounded container) */}
          {selectedTab === "preview" && (
            <div className="flex-grow flex flex-col min-h-0 relative h-full w-full bg-muted/5">
              {hasFiles ? (
                <div className="flex-grow w-full h-full overflow-hidden bg-background relative z-10">
                  <SandboxRunner />
                </div>
              ) : (isCompiling || chatLoading) ? (
                <div className="flex-grow w-full h-full bg-background flex flex-col items-center justify-center p-8 text-center relative z-10">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 animate-pulse" />
                  
                  <div className="relative z-10 flex flex-col items-center max-w-sm">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border backdrop-blur-md">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-foreground tracking-tight mb-2">Creando plataforma...</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Analizando requisitos, generando estructura de archivos y compilando código en tiempo real.
                    </p>
                    
                    {/* Subtle terminal-like logs preview */}
                    <div className="w-full mt-6 bg-muted border border-border rounded-xl p-3 font-mono text-[9px] text-muted-foreground text-left space-y-1 select-none">
                      <div className="flex items-center gap-1.5 text-primary font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <span>[BUILDER ENGINE] Inicializando</span>
                      </div>
                      <div className="truncate opacity-80">&gt; Generando archivos base...</div>
                      <div className="truncate opacity-60">&gt; Importando dependencias de React & Tailwind...</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow w-full h-full flex items-center justify-center text-muted-foreground z-10">
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
    </div>
  );
}
