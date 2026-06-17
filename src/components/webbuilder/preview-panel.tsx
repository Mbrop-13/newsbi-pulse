"use client";

import { useState, useMemo } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { SandboxRunner } from "./sandbox-runner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
                ? "bg-blue-500/15 text-blue-300"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
            className="w-full flex items-center gap-2 py-1.5 pr-2 text-left text-[11px] font-semibold text-gray-300 hover:bg-white/5 rounded-lg transition-all"
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#1e1e2e] shrink-0">
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
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        <pre className="p-4 text-[12px] font-mono leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
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
    <div className="flex-1 overflow-auto bg-[#0d1117] p-4 font-mono text-[11px] text-gray-400 leading-relaxed">
      {compileLogs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-600">
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

// ─── Main Preview Panel ──────────────────────────────
export function PreviewPanel() {
  const { selectedTab, setSelectedTab, files, cloudSyncEnabled, isSaving, lastSavedAt, isCompiling } = useWebBuilderStore();
  const chatLoading = useAIChatStore((s) => s.isLoading);

  const tabs = [
    { id: "preview" as const, label: "Vista Previa", icon: Monitor },
    { id: "code" as const, label: "Código", icon: Code2 },
    { id: "console" as const, label: "Consola", icon: Terminal },
  ];

  const hasFiles = Object.keys(files).length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
                selectedTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {cloudSyncEnabled && (
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all select-none",
                isSaving 
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}
              title={lastSavedAt ? `Guardado en la nube: ${lastSavedAt}` : "Sincronizado con la nube"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-2.5 h-2.5" />
                  <span>Guardado</span>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => {
              // Download as ZIP (basic implementation)
              const content = JSON.stringify(files, null, 2);
              const blob = new Blob([content], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "maverlang-project.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
            title="Descargar proyecto"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {selectedTab === "code" && (
          <>
            {/* File Explorer Sidebar */}
            <div className="w-48 border-r border-white/5 bg-[#161b22] overflow-y-auto hidden-scrollbar shrink-0">
              <div className="px-3 py-2 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                  Archivos
                </span>
              </div>
              <FileTree />
            </div>
            <CodeViewer />
          </>
        )}

        {selectedTab === "preview" && (
          <div className="flex-1 bg-white">
            {hasFiles ? (
              <SandboxRunner />
            ) : (isCompiling || chatLoading) ? (
              <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-gray-300 p-8 text-center relative overflow-hidden">
                {/* Visual grid pattern background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
                
                <div className="relative z-10 flex flex-col items-center max-w-sm">
                  <div className="relative mb-6">
                    {/* Pulsing glow behind spinner */}
                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-white tracking-tight mb-2">Creando plataforma...</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Analizando requisitos, generando estructura de archivos y compilando código en tiempo real.
                  </p>
                  
                  {/* Subtle terminal-like logs preview */}
                  <div className="w-full mt-6 bg-[#090d16]/80 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-gray-500 text-left space-y-1 select-none">
                    <div className="flex items-center gap-1.5 text-violet-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                      <span>[BUILDER ENGINE] Inicializando</span>
                    </div>
                    <div className="truncate opacity-80">&gt; Generando archivos base...</div>
                    <div className="truncate opacity-60">&gt; Importando dependencias de React & Tailwind...</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm bg-slate-900/50">
                <div className="text-center">
                  <Monitor className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Sin proyecto activo</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Envía un mensaje para empezar a construir
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "console" && <ConsolePanel />}
      </div>
    </div>
  );
}
