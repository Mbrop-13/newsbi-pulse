"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useWebBuilderStore, djb2Hash } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { SandpackConsole, SandpackProvider, SandpackCodeEditor, useSandpack } from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SandpackPreviewWrapper } from "./sandpack-preview-wrapper";
import { parseArtifact } from "@/lib/webbuilder-parser";
import { detectDependencies } from "@/lib/webbuilder-deps";
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
  X,
  Lock,
  ClipboardList,
  Sparkles,
} from "lucide-react";

// ─── Inspector Injection Helper ───────────────────
function injectInspectorScript(html: string): string {
  if (html.includes("MAVERLANG_ELEMENT_CLICKED")) return html;

  const styleTag = `
    <style>
      .maverlang-inspector-hover {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.1s !important;
      }

      @media (max-width: 768px) {
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        html, body, #root, #app, * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      }
    </style>
  `;

  const scriptTag = `
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

        // #7 EDICIÓN INLINE: además del HTML, enviamos los estilos computados
        // relevantes para que el popover de edición los muestre como campos
        // editables (texto, color, fondo, tamaño, radius) y el usuario pueda
        // previsualizar y generar un prompt concreto para la IA.
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const computedStyle = {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          margin: cs.margin,
        };
        const editableText = (el.innerText || '').trim();
        const anchor = {
          // Posición relativa al viewport del iframe (lo posiciona el padre).
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
        
        window.parent.postMessage({
          type: 'MAVERLANG_ELEMENT_CLICKED',
          elementHtml: clone.outerHTML,
          tagName: el.tagName,
          className: el.className || '',
          editableText,
          computedStyle,
          anchor,
        }, '*');
        
        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);

      // #7 Aplicar estilo en vivo al elemento seleccionado (mientras el usuario
      // edita en el popover, sin recargar). Identificamos el elemento por un
      // atributo data temporal marcado tras el click.
      window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d) return;
        if (d.type === 'MAVERLANG_MARK_ELEMENT') {
          // Marca el último elemento clickeado para poder referenciarlo.
          // Re-marca quitando marcas previas.
          document.querySelectorAll('[data-maverlang-target]').forEach(n => n.removeAttribute('data-maverlang-target'));
          // No podemos re-obtener el elemento por referencia tras el click (ya
          // se desactivó), así que usamos el anchor para encontrarlo.
          const candidates = document.querySelectorAll('*');
          for (const node of candidates) {
            const r = (node as HTMLElement).getBoundingClientRect();
            if (Math.abs(r.top - d.anchor.top) < 3 && Math.abs(r.left - d.anchor.left) < 3 && Math.abs(r.width - d.anchor.width) < 3) {
              node.setAttribute('data-maverlang-target', '1');
              break;
            }
          }
        } else if (d.type === 'MAVERLANG_APPLY_LIVE_STYLE') {
          const target = document.querySelector('[data-maverlang-target]') as HTMLElement | null;
          if (target) {
            const s = d.style || {};
            if (s.color) target.style.color = s.color;
            if (s.backgroundColor) target.style.backgroundColor = s.backgroundColor;
            if (s.fontSize) target.style.fontSize = s.fontSize;
            if (s.borderRadius) target.style.borderRadius = s.borderRadius;
            if (s.text !== undefined) target.innerText = s.text;
          }
        }
      });

      // Notify parent that the preview is loaded and ready
      window.parent.postMessage({ type: 'MAVERLANG_PREVIEW_LOADED' }, '*');
    </script>
  `;

  let modifiedHtml = html;
  if (modifiedHtml.includes("</head>")) {
    modifiedHtml = modifiedHtml.replace("</head>", styleTag + "</head>");
  } else {
    modifiedHtml = styleTag + modifiedHtml;
  }

  if (modifiedHtml.includes("</body>")) {
    modifiedHtml = modifiedHtml.replace("</body>", scriptTag + "</body>");
  } else {
    modifiedHtml = modifiedHtml + scriptTag;
  }

  return modifiedHtml;
}

// ─── Preview Iframe Selector Helper ───────────────
// #7 Convierte rgb(r, g, b) / rgba(...) a #hex para los inputs color del popover.
function rgbToHex(rgb?: string): string {
  if (!rgb) return "";
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return "";
  const [r, g, b] = m.map(Number);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function getPreviewIframe(): HTMLIFrameElement | null {
  if (typeof document === "undefined") return null;
  // Selectores específicos de Sandpack. Antes el último fallback era
  // document.querySelector("iframe"), que podía capturar CUALQUIER iframe de la
  // página (ads, embeds, auth) e inyectar el inspector en el frame equivocado.
  // Ahora devolvemos null si no hay match claro.
  return (
    document.querySelector("iframe.sp-preview-iframe") ||
    document.querySelector(".sp-preview iframe") ||
    document.querySelector("iframe[src*='codesandbox']") ||
    document.querySelector("iframe[title='Sandpack Preview']") ||
    null
  );
}

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
  const { files, activeFilePath, setActiveFile, openTabs, closeTab } = useWebBuilderStore();
  const [copied, setCopied] = useState(false);
  const file = files[activeFilePath];
  // Ref al contenedor del editor para localizar el CodeMirror interno y poder
  // hacer scroll programático a una línea concreta (goto-line desde errores).
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!file) return;
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Lleva el editor a una línea concreta. SandpackCodeEditor no expone API
  // pública para esto, pero internamente usa CodeMirror 6, que monta la vista
  // en un elemento .cm-editor y la deja accesible vía el.cmView.view.
  // Hacemos dispatch de una selección en esa posición con scrollIntoView: true
  // (CodeMirror 6 soporta este campo en el TransactionSpec), que centra la línea.
  const scrollToLine = useCallback((line: number) => {
    const container = editorContainerRef.current;
    if (!container || line <= 0) return;

    const cmEl = container.querySelector(".cm-editor") as (HTMLElement & {
      cmView?: { view?: any };
}) | null;
    const view = cmEl?.cmView?.view;
    if (!view) return;

    const doc = view.state.doc;
    const targetLine = Math.min(Math.max(line, 1), doc.lines);
    const pos = doc.line(targetLine).from;
    view.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true,
      userEvent: "select.goto",
    });
    // Foco visual sutil para que el usuario note el salto.
    view.focus();
  }, []);

  // Escuchar eventos "saltar a línea" lanzados por BuildErrorView/jumpToError.
  // El editor puede no estar listo justo al cambiar de tab/archivo, así que
  // reintentamos unas cuantas veces con un pequeño delay hasta encontrar .cm-editor.
  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { line: number };
      if (!detail?.line) return;

      const tryScroll = () => {
        if (cancelled) return;
        const container = editorContainerRef.current;
        const cmEl = container?.querySelector(".cm-editor");
        if (cmEl && (cmEl as any).cmView?.view) {
          scrollToLine(detail.line);
        } else if (attempt < 12) {
          attempt++;
          setTimeout(tryScroll, 60);
        }
      };
      attempt = 0;
      // Empezar en el siguiente frame para que el cambio de tab/archivo renderice.
      requestAnimationFrame(tryScroll);
    };

    window.addEventListener("maverlang-goto-line", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("maverlang-goto-line", handler);
    };
  }, [scrollToLine]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Selecciona un archivo para ver su código
      </div>
    );
  }

  // Tabs visibles = openTabs filtrado a los que existen en files (por si se
  // borró un archivo que estaba abierto). Si no hay ninguna abierta, mostramos
  // la activa como tab única.
  const visibleTabs = openTabs.filter((p) => files[p]);
  const tabsToShow = visibleTabs.length > 0 ? visibleTabs : [activeFilePath];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Open Tabs Bar (estilo editor: una tab por archivo abierto, con X) */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 border-b border-border bg-muted/30 shrink-0 overflow-x-auto hidden-scrollbar">
        {tabsToShow.map((path) => {
          const isActive = path === activeFilePath;
          return (
            <div
              key={path}
              className={cn(
                "group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-t-lg text-[10px] font-bold cursor-pointer border-t border-x border-transparent transition-all whitespace-nowrap",
                isActive
                  ? "bg-background text-foreground border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              onClick={() => setActiveFile(path)}
            >
              {getFileIcon(path)}
              <span>{path.split("/").pop()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(path);
                }}
                className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                title="Cerrar pestaña"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {/* Botón copiar al final de la barra de tabs */}
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
      <div ref={editorContainerRef} className="flex-1 relative h-full min-h-0 bg-background text-foreground">
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
  // Mientras la IA responde, el STORE es la fuente de verdad (la IA escribe
  // archivos, no el usuario). Permitir que el bundler reescriba el store aquí
  // generaría un ping-pong: store→Sandpack→aquí→store→Sandpack... que escala
  // a React #185 con el live-preview incremental. Bloqueamos durante streaming.
  const isAiResponding = useWebBuilderStore((s) => s.isAiResponding);

  // Ventana de supresión: cuando SandpackStoreSync empuja código al bundler,
  // emite "maverlang-suppress-sync" con un timestamp hasta el cual debemos
  // IGNORAR las diferencias sandpack.files vs store (son el código que acabamos
  // de inyectar nosotros, no una edición del usuario). Sin esto, el listener
  // re-empujaría ese código al store, disparando otro ciclo store→Sandpack.
  const suppressUntilRef = useRef(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { until: number };
      if (detail?.until) suppressUntilRef.current = detail.until;
    };
    window.addEventListener("maverlang-suppress-sync", handler);
    return () => window.removeEventListener("maverlang-suppress-sync", handler);
  }, []);

  useEffect(() => {
    const activeFile = sandpack.activeFile;
    if (!activeFile) return;

    // Anti-ping-pong: si estamos dentro de la ventana de supresión tras un
    // empuje del store→Sandpack, no reescribimos el store.
    if (Date.now() < suppressUntilRef.current) return;
    // Durante streaming, el store es la fuente de verdad → no reescribir.
    if (useWebBuilderStore.getState().isAiResponding) return;

    const currentCode = sandpack.files[activeFile]?.code;
    const storeCode = files[activeFile]?.code;

    if (currentCode !== undefined && storeCode !== currentCode) {
      const timeout = setTimeout(() => {
        // Doble check dentro del timeout: la supresión pudo activarse tras
        // programar el timeout.
        if (Date.now() < suppressUntilRef.current) return;
        if (useWebBuilderStore.getState().isAiResponding) return;
        updateFile(activeFile, currentCode);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [sandpack.files, sandpack.activeFile, files, updateFile]);

  return null;
}

/**
 * Refleja el estado real del bundler de Sandpack en el store (isCompiling).
 *
 * Antes isCompiling vivía siempre en false porque NADA lo actualizaba, así que
 * el skeleton "Compilando interfaz..." casi nunca aparecía cuando debería.
 * Sandpack expone `sandpack.status`: 'initial' | 'idle' | 'running' | 'done'.
 * Mapeamos 'running'/'initial' -> isCompiling true, el resto -> false.
 */
function SandpackStatusListener() {
  const { sandpack } = useSandpack();
  const setCompiling = useWebBuilderStore((s) => s.setCompiling);
  const status = sandpack.status;

  useEffect(() => {
    const compiling = status === "running" || status === "initial";
    // Solo actualizamos si cambia, para evitar renders innecesarios.
    if (useWebBuilderStore.getState().isCompiling !== compiling) {
      setCompiling(compiling);
    }
  }, [status, setCompiling]);

  return null;
}

/**
 * Sincronización STORE -> Sandpack INCREMENTAL (reemplaza el remontaje del
 * provider en cada fin de respuesta de la IA).
 *
 * Antes, cada vez que la IA terminaba (isAiResponding: true->false) se
 * incrementaba `buildVersion` y se REMONTABA todo el <SandpackProvider>. Eso:
 *   - pierde el estado de runtime de la preview (estado de React, scroll, etc.)
 *   - re-descarga el bundler de Sandpack
 *   - causa un flash visible
 *
 * Ahora este componente empuja solo los archivos que cambiaron vía
 * `sandpack.updateFile()` + un único `sandpack.refresh()` al final.
 *
 * GUARD ANTI-BUCLE (React #185): el bug original ocurría porque el effect
 * dependía de `sandpack.files` (objeto que cambia de referencia tras cada
 * updateFile) y comparaba storeCode !== sandpackCode, que nunca convergía por
 * la asincronía de updateFile -> "Maximum update depth exceeded".
 *
 * Aquí NO dependemos de `sandpack.files`. El effect depende SOLO de
 * `stableFiles` (strings estables) y de un ref local `appliedRef` que registra
 * path->code ya empujado. Solo empujamos cuando stableFiles[path] difiere del
 * ref local. Tras empujar, actualizamos el ref -> el effect converge en 1 paso.
 *
 * Edición del usuario en Sandpack: SandpackSyncListener la empuja al store,
 * stableFiles se actualiza, y este componente re-empuja el mismo código a
 * Sandpack. updateFile con código idéntico es un no-op para el bundler (no
 * recompila), así que converge sin flash ni bucle.
 */
function SandpackStoreSync({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const { sandpack } = useSandpack();
  // Ref local: path -> code que ya empujamos a Sandpack. NO se incluye en el
  // array de deps del effect (es un ref). Es la clave del anti-bucle.
  const appliedRef = useRef<Map<string, string>>(new Map());

  // Guard anti-ping-pong: cuando el usuario edita en Sandpack, SandpackSyncListener
  // empuja ese código al store, lo que dispara este effect y re-empujaría el mismo
  // código de vuelta a Sandpack. Como el código es idéntico, appliedRef ya lo
  // tendría registrado y el bloque de "empujar" no haría nada... PERO el
  // SandpackSyncListener usa updateFile del STORE, que cambia la ref de files y
  // re-deriva stableFiles, y si el usuario editó caracteres, el código sí difiere.
  // En ese caso re-empujar es CORRECTO (es la edición del usuario, ya en el store).
  // El riesgo de ping-pong real es: store→Sandpack → SandpackSyncListener ve
  // sandpack.files[path] !== store[path] y lo empuja al store → effect re-empuja.
  // Para cortarlo, marcamos `suppressUntilRef` justo tras empujar: durante esa
  // ventana, SandpackSyncListener NO debe escribir al store. Lo coordinamos vía
  // un evento global "maverlang-suppress-sync" que ese listener escucha.
  const suppressUntilRef = useRef<number>(0);

  useEffect(() => {
    const applied = appliedRef.current;
    let hasChanges = false;
    const pushedPaths: string[] = [];

    // 1. Empujar archivos nuevos/modificados.
    for (const [path, file] of Object.entries(stableFiles)) {
      const code = file?.code ?? "";
      if (applied.get(path) !== code) {
        // updateFile puede lanzar si el path no es válido; lo protegemos.
        try {
          sandpack.updateFile(path, code);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[SandpackStoreSync] updateFile failed for", path, e);
        }
        applied.set(path, code);
        hasChanges = true;
        pushedPaths.push(path);
      }
    }

    // 2. Eliminar archivos que ya no están en el store.
    for (const path of Array.from(applied.keys())) {
      if (!(path in stableFiles)) {
        try {
          // Sandpack no expone deleteFile público estable; marcar como vacío
          // es más seguro que intentar eliminar (puede romper el bundler).
          sandpack.updateFile(path, "");
        } catch (e) {
          /* noop */
        }
        applied.delete(path);
        hasChanges = true;
        pushedPaths.push(path);
      }
    }

    // 3. Un único refresh al final si hubo cambios (no por archivo).
    //    Sandpack no expone `refresh()` directamente; se dispara vía dispatch.
    if (hasChanges) {
      // Suprimir el SandpackSyncListener durante ~400ms tras empujar, para que
      // no re-empuje de Sandpack→store el mismo código que acabamos de inyectar
      // (ping-pong). 400ms cubre la propagación async de updateFile/refresh.
      // Ventana anti-ping-pong: debe cubrir el timeout de 800ms del
      // SandpackSyncListener (que reescribe al store desde Sandpack). 400ms
      // era insuficiente → el listener disparaba tras la ventana y reescribía
      // el store → stableFiles effect → re-push → bucle (React #185).
      // 1500ms cubre holadamente el timeout del listener + propagación async.
      suppressUntilRef.current = Date.now() + 1500;
      window.dispatchEvent(
        new CustomEvent("maverlang-suppress-sync", {
          detail: { until: suppressUntilRef.current, paths: pushedPaths },
        })
      );
      try {
        // API moderna: dispatch con tipo "refresh" fuerza recompilación.
        const sp = sandpack as any;
        if (typeof sp.refresh === "function") {
          sp.refresh();
        } else if (typeof sp.dispatch === "function") {
          sp.dispatch({ type: "refresh" });
        }
      } catch (e) {
        /* noop */
      }
    }
    // Intencionalmente NO incluimos sandpack en deps (su ref es inestable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFiles]);

  return null;
}

/**
 * Sincronización STORE -> Sandpack.
 *
 * PROBLEMA ORIGINAL: SandpackProvider solo lee la prop `files` en el montaje
 * inicial, así que cuando la IA genera código nuevo el preview se quedaba
 * pegado en los DEFAULT_FILES (la pantalla del 🚀).
 *
 * SOLUCIÓN ANTERIOR (causaba React #185): un componente SandpackFileSync que
 * empujaba cada archivo del store al bundler vía sandpack.updateFile() + un
 * dispatch("refresh"). El effect dependía del objeto `sandpack` entero, que
 * cambia de referencia en cada update; como updateFile es asíncromo, la
 * comparación storeCode !== sandpackCode nunca convergía y el effect se
 * reejecutaba infinitamente -> "Maximum update depth exceeded" -> crasheo del
 * árbol y vuelta a la pantalla predefinida.
 *
 * SOLUCIÓN ACTUAL: remontar <SandpackProvider> con un `key` (buildVersion) que
 * incrementa únicamente cuando la IA termina de responder (isAiResponding
 * true -> false). Al remontar, Sandpack lee la prop `files` fresca (sandpackFiles,
 * derivada de stableFiles) y compila de cero. Sin updateFile manual, sin
 * dispatch, sin loop. La dirección inversa (edición del usuario en Sandpack ->
 * store) la sigue cubriendo SandpackSyncListener, que es auto-limitante.
 */

export function PremiumSkeletonLoader({ isAiResponding }: { isAiResponding: boolean }) {
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

/**
 * Vista del plan en el panel de previsualización (modo Plan).
 * Se muestra en lugar del SandpackPreview mientras hay un pendingPlan:
 * lista los archivos planificados con su agente, rol y tarea. Cuando el
 * usuario aprueba y se construye, pendingPlan se limpia y vuelve Sandpack.
 */
function PlanView({ plan }: { plan: NonNullable<ReturnType<typeof useWebBuilderStore.getState>["pendingPlan"]> }) {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-0 w-full h-full relative overflow-auto preview-container-no-scrollbar p-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* Cabecera del plan */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#1890FF]/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-[#1890FF]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Plan de construcción
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1890FF] bg-[#1890FF]/10 px-2 py-0.5 rounded-full">
                {plan.agents.length} {plan.agents.length === 1 ? "archivo" : "archivos"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {plan.reason || "Revisa el plan antes de construir."}
            </p>
          </div>
        </div>

        {/* Lista de archivos planificados */}
        <div className="space-y-2.5 mb-5">
          {plan.agents.map((agent, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-3.5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1890FF]/10 flex items-center justify-center shrink-0">
                  <FileCode2 className="w-4 h-4 text-[#1890FF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-foreground break-all">
                      {agent.filePath}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-semibold text-foreground">
                      {agent.agentName}
                    </span>
                    <span className="text-[10px] text-[#1890FF] font-medium">
                      · {agent.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {agent.task}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pista de acción */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              ¿Cómo continuar?
            </p>
            <p className="text-[11px] text-amber-600/90 dark:text-amber-200/80 mt-0.5 leading-relaxed">
              Escribe <span className="font-bold">aprobado</span> en el chat para que lo construya, <span className="font-bold">no</span> para cancelar, o descríbeme los cambios que quieres y replanifico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildErrorView({ error }: { error: string }) {
  const resetAutoFixAttempts = useWebBuilderStore((s) => s.resetAutoFixAttempts);
  const setSelectedTab = useWebBuilderStore((s) => s.setSelectedTab);
  const setActiveFile = useWebBuilderStore((s) => s.setActiveFile);

  // Extrae {path, line} del log de error. Cubre formatos comunes de bundlers:
  //   "/App.tsx:5:10"        -> { path: "/App.tsx", line: 5 }
  //   "App.tsx line 5"       -> { path: "/App.tsx", line: 5 }
  //   "./src/App.tsx(5,10)"  -> { path: "/App.tsx", line: 5 }
  //   "/App.tsx:5"           -> { path: "/App.tsx", line: 5 }
  function extractErrorLocation(log: string): { path: string; line: number } | null {
    const match = log.match(/\(?\.?\/?([\w\-./]*\.(?:tsx|ts|jsx|js|css|json))(?::(\d+)(?::\d+)?|[(,](\d+)|\s+line\s+(\d+))/i);
    if (!match) {
      // Sin número de línea: al menos intentamos devolver el archivo.
      const fm = log.match(/\(?\/?([\w\-./]*\.(?:tsx|ts|jsx|js|css|json))\b/);
      if (!fm) return null;
      let p = fm[1];
      if (!p.startsWith("/")) p = "/" + p;
      p = p.replace(/^\/src\//, "/");
      return { path: p, line: 0 };
    }
    let p = match[1];
    if (!p.startsWith("/")) p = "/" + p;
    p = p.replace(/^\/src\//, "/");
    const line = parseInt(match[2] ?? match[3] ?? match[4] ?? "0", 10) || 0;
    return { path: p, line };
  }

  // Abre el editor en el archivo/línea del error (si lo detecta).
  const jumpToError = () => {
    const loc = extractErrorLocation(error);
    const { files } = useWebBuilderStore.getState();
    const target =
      (loc && files[loc.path] && loc.path) ||
      Object.keys(files).find((k) => k.endsWith("/App.tsx")) ||
      Object.keys(files)[0];
    if (target) {
      setActiveFile(target);
      // Emitir evento para que CodeViewer/Sandpack intente posicionar la línea.
      if (loc && loc.line > 0) {
        window.dispatchEvent(
          new CustomEvent("maverlang-goto-line", { detail: { line: loc.line } })
        );
      }
    }
    setSelectedTab("code");
    resetAutoFixAttempts();
  };

  // Reintentar de verdad: limpia el flag Y fuerza un remontaje del SandpackProvider
  // (buildVersion++) para que recompile desde cero. resetAutoFixAttempts() solo
  // borraba el flag y dejaba el preview congelado en la pantalla de error.
  const handleRetry = () => {
    resetAutoFixAttempts();
    // Forzar recompilación completa subiendo buildVersion (remount del provider).
    // Usamos CustomEvent (API moderna) en vez de document.createEvent, que está
    // deprecado. PreviewPanel escucha este evento y sube buildVersion.
    window.dispatchEvent(new CustomEvent("maverlang-retry-build"));
  };

  const handleOpenInEditor = () => {
    jumpToError();
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-0 w-full h-full relative overflow-auto p-6 bg-slate-955 text-white select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.015)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-60 pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto space-y-5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/25">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Error de compilación
              <span className="text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                Build Failed
              </span>
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              El empaquetador de módulos detectó un error al compilar los archivos.
            </p>
          </div>
        </div>

        {/* Error Code Diagnostic */}
        <div className="rounded-2xl border border-red-500/15 bg-red-950/10 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto select-text shadow-inner">
          <span className="text-red-400 font-bold block mb-1">Diagnostic Log:</span>
          <pre className="whitespace-pre-wrap text-gray-300 break-words max-h-40 overflow-y-auto hidden-scrollbar">{error}</pre>
        </div>

        {/* Atajo: saltar al archivo/línea del error si lo detectamos */}
        {(() => {
          const loc = extractErrorLocation(error);
          if (!loc) return null;
          return (
            <button
              onClick={jumpToError}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-300 transition-all active:scale-98"
            >
              <Code2 className="w-3.5 h-3.5" />
              Abrir <span className="font-mono">{loc.path}</span>
              {loc.line > 0 && <span className="opacity-70">:{loc.line}</span>} en el editor
            </button>
          );
        })()}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="flex-grow py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer text-center active:scale-98"
          >
            Reintentar Compilación
          </button>

          <button
            onClick={handleOpenInEditor}
            className="flex-grow py-2.5 px-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-300 transition-all cursor-pointer text-center active:scale-98"
          >
            Abrir en Editor
          </button>
          
          <button
            onClick={() => {
              useWebBuilderStore.getState().resetProject();
            }}
            className="flex-grow py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all cursor-pointer text-center active:scale-98"
          >
            Restaurar Plantilla Limpia
          </button>
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
    isCompiling,
    activeFilePath,
    undo,
    redo,
    canUndo,
    canRedo,
    isAiResponding,
    activeAgentReports,
    pendingPlan,
    lastAutoFixError,
  } = useWebBuilderStore();
  const chatLoading = useAIChatStore((s) => s.isLoading);
  const currentChatId = useAIChatStore((s) => s.currentChatId);
  const { resolvedTheme } = useTheme();
  // ── Sandpack theme custom: el theme nativo "light"/"dark" pinta el editor de
  // blanco/gris neutro que rompe con la paleta de la plataforma. Definimos dos
  // themes custom que usan los exactos de globals.css para que el editor se
  // integre como una extensión natural, no como un widget externo.
  const currentTheme = resolvedTheme === "dark"
    ? {
        colors: {
          surface1: "#0a0a0a",          // fondo del editor (muted dark)
          surface2: "#111114",          // gutters / barra lateral
          surface3: "#161619",          // hover / selección suave
          clickable: "#8B949E",         // muted-foreground
          base: "hsl(var(--foreground))",
          disabled: "#3a3a3f",
          hover: "#161619",
          accent: "#1890FF",            // primary (neon blue)
          error: "#ef4444",
          errorSurface: "#3a1d1d",
        },
        syntax: {
          plain: "#E6E6E6",
          comment: { color: "#6B7280", fontStyle: "italic" as const },
          keyword: "#1890FF",
          definition: "#A78BFA",
          punctuation: "#8B949E",
          property: "#A78BFA",
          static: "#E6E6E6",
          string: "#34D399",
        },
        font: {
          body: '-apple-system, "Segoe UI", "Inter", system-ui, sans-serif',
          mono: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
          size: "12px",
          lineHeight: "20px",
        },
      }
    : {
        colors: {
          surface1: "#FFFFFF",         // card
          surface2: "#F5F5F7",          // background / gutters
          surface3: "#EBEBED",          // muted / hover
          clickable: "#64748B",        // muted-foreground
          base: "#1E293B",              // foreground
          disabled: "#CBD5E1",
          hover: "#EBEBED",
          accent: "#1E293B",            // primary (slate)
          error: "#ef4444",
          errorSurface: "#FEF2F2",
        },
        syntax: {
          plain: "#1E293B",
          comment: { color: "#94A3B8", fontStyle: "italic" as const },
          keyword: "#2563EB",
          definition: "#7C3AED",
          punctuation: "#64748B",
          property: "#7C3AED",
          static: "#1E293B",
          string: "#059669",
        },
        font: {
          body: '-apple-system, "Segoe UI", "Inter", system-ui, sans-serif',
          mono: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
          size: "12px",
          lineHeight: "20px",
        },
      };
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Cache de HTML con inspector ya inyectado, key = hash del HTML original.
  // Evita reconstruir el script del inspector (string building costoso) cuando
  // el HTML no cambió entre renders. El reset del cache va en un effect más
  // abajo (depende de buildVersion, que se declara después).
  const inspectorCacheRef = useRef<Map<string, string>>(new Map());

  // stableFiles: snapshot de archivos que alimenta el SandpackProvider.
  //
  // LIVE PREVIEW INCREMENTAL (la "magia" de Lovable): durante el streaming de la
  // IA, en vez de congelar la preview hasta el final, actualizamos stableFiles
  // periódicamente (debounced) conforme onFileReady va emitiendo archivos nuevos.
  // Así el usuario VE los cambios aparecer en vivo en el iframe, no solo en el
  // editor. Cuando la IA termina, sincronizamos de forma fiable el estado final.
  //
  // El debounce (450ms) evita recompilar en cada token del razonamiento: solo
  // recompila cuando llega un archivo completo (onFileReady) o cada ~0.5s.
  const [stableFiles, setStableFiles] = useState(files);
  const livePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAiResponding) {
      // IA inactiva: snapshot inmediato y definitivo.
      if (livePreviewTimerRef.current) {
        clearTimeout(livePreviewTimerRef.current);
        livePreviewTimerRef.current = null;
      }
      setStableFiles(files);
      return;
    }
    // IA respondiendo: debounce para recompilar el preview en vivo sin agotar
    // el bundler con un refresh por cada token.
    if (livePreviewTimerRef.current) clearTimeout(livePreviewTimerRef.current);
    livePreviewTimerRef.current = setTimeout(() => {
      setStableFiles(files);
    }, 450);
    return () => {
      if (livePreviewTimerRef.current) clearTimeout(livePreviewTimerRef.current);
    };
  }, [files, isAiResponding]);

  // handleRefresh: recarga de verdad la vista previa.
  //
  // ANTES solo subía `iframeKey`, que remonta <SandpackPreviewWrapper> pero NO
  // el <SandpackProvider> (su key es buildVersion). Como el provider reutiliza
  // el bundler ya inicializado, el iframe apenas se tocaba y parecía no hacer
  // nada: la preview no se actualizaba aunque el código del store hubiera
  // cambiado.
  //
  // AHORA subimos `buildVersion`, lo que remonta el <SandpackProvider> entero y
  // recompila desde cero con el estado actual del store (stableFiles). Esto
  // garantiza que la preview refleje el último código generado por la IA, sin
  // depender del sync incremental (SandpackStoreSync) que a veces se queda
  // corto si un empuje falló silenciosamente.
  const handleRefresh = async () => {
    setIframeKey((prev) => prev + 1);
    setBuildVersion((v) => v + 1);
    toast.success("Vista previa recargada");
  };

  // Escuchar peticiones de "reintentar compilación" lanzadas desde BuildErrorView.
  // Subir buildVersion fuerza el remontaje del SandpackProvider y recompila desde
  // cero; resetAutoFixAttempts() solo limpiaba el flag y dejaba el preview muerto.
  useEffect(() => {
    const retryHandler = () => setBuildVersion((v) => v + 1);
    const refreshHandler = async () => {
      setIframeKey((prev) => prev + 1);
      toast.success("Vista previa recargada");
    };

    window.addEventListener("maverlang-retry-build", retryHandler);
    window.addEventListener("maverlang-refresh-preview", refreshHandler);
    return () => {
      window.removeEventListener("maverlang-retry-build", retryHandler);
      window.removeEventListener("maverlang-refresh-preview", refreshHandler);
    };
  }, []);

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

    // Default HTML index files if they do not exist
    if (hasReact && !result["/public/index.html"]) {
      result["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maverlang Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    }

    if (!hasReact && !result["/index.html"] && Object.keys(stableFiles).length > 0) {
      result["/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maverlang Preview</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`;
    }

    // Inject Inspector Script for all HTML files — cacheado por hash para no
    // regenerar el script (string building costoso) cuando el HTML no cambió.
    for (const path of Object.keys(result)) {
      if (path.endsWith(".html")) {
        const original = result[path];
        const key = djb2Hash(original);
        const cached = inspectorCacheRef.current.get(key);
        result[path] = cached ?? injectInspectorScript(original);
        if (!cached) inspectorCacheRef.current.set(key, result[path]);
      }
    }

    return result;
  }, [stableFiles, hasReact]);

  // Detección automática de dependencias: escanea los imports del proyecto y
  // construye el mapa de paquetes para Sandpack. Antes estaban hardcodeadas,
  // así que cualquier lib nueva (axios, zustand, date-fns...) rompía la
  // compilación con "Module not found" y disparaba auto-fixes inútiles.
  const detectedDependencies = useMemo(
    () => detectDependencies(stableFiles),
    [sandpackFiles]
  );

  // buildVersion: incrementa SOLO cuando cambian las DEPENDENCIAS detectadas.
  //
  // ANTES subía en cada fin de respuesta de la IA (isAiResponding: true->false)
  // y se usaba como `key` del <SandpackProvider> para forzar remontaje. Eso
  // perdía estado de runtime, re-descargaba el bundler y causaba flash.
  //
  // AHORA el sync de código es incremental vía <SandpackStoreSync>
  // (updateFile + refresh), así que NO hace falta remontar por cambios de
  // código. El remontaje SOLO es necesario cuando cambia el `customSetup`
  // (dependencias), porque Sandpack no permite actualizar deps en caliente.
  // Por eso comparamos las claves de detectedDependencies y solo subimos
  // buildVersion cuando el SET de paquetes cambia.
  const [buildVersion, setBuildVersion] = useState(0);
  const prevDepsKeyRef = useRef("");
  useEffect(() => {
    const depsKey = Object.keys(detectedDependencies).sort().join(",");
    if (prevDepsKeyRef.current && prevDepsKeyRef.current !== depsKey) {
      setBuildVersion((v) => v + 1);
    }
    prevDepsKeyRef.current = depsKey;
  }, [detectedDependencies]);

  // Reset del cache de inyección del inspector cuando el provider se remonta
  // (buildVersion cambia), porque el HTML se regenera desde cero.
  useEffect(() => {
    inspectorCacheRef.current = new Map();
  }, [buildVersion]);

  // Cuando el provider o el iframe se recrean (buildVersion/iframeKey cambian),
  // el script del inspector dentro del iframe se reinicia desactivado. Para que
  // la UI no quede desincronizada (botón activo pero inspector apagado),
  // forzamos isInspectorActive=false. Si el usuario lo quiere, lo reactiva.
  useEffect(() => {
    setIsInspectorActive(false);
  }, [buildVersion, iframeKey]);

  // #7 EDICIÓN INLINE DEL PREVIEW: estado del popover de edición rápida.
  // Cuando el usuario clica un elemento con el inspector activo, guardamos sus
  // datos (tag, texto, estilos computados, posición) y mostramos un popover
  // flotante sobre el iframe con campos para editar texto/colores/tamaño/radius
  // en vivo. Al "Aplicar" generamos un prompt concreto para la IA.
  const [inlineEditTarget, setInlineEditTarget] = useState<{
    tagName: string;
    className: string;
    editableText: string;
    style: { color: string; backgroundColor: string; fontSize: string; fontWeight: string; borderRadius: string; };
    anchor: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [inlineDraft, setInlineDraft] = useState<{ text: string; color: string; bg: string; fontSize: number; radius: number }>({
    text: "", color: "", bg: "", fontSize: 16, radius: 0,
  });

  // Sync inspector state with the preview iframe
  useEffect(() => {
    const iframe = getPreviewIframe();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'TOGGLE_INSPECTOR', active: isInspectorActive }, '*');
    }
  }, [isInspectorActive]);

  // Turn off inspector when a click happens (message from iframe) or sync on reload
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'MAVERLANG_INSPECTOR_DISABLED') {
        setIsInspectorActive(false);
      } else if (e.data?.type === 'MAVERLANG_ELEMENT_CLICKED') {
        setIsInspectorActive(false);
        // Dispatch custom event for ChatInput to intercept the click (legacy path)
        const event = new CustomEvent("MAVERLANG_ELEMENT_INSPECTED", {
          detail: {
            elementHtml: e.data.elementHtml,
            tagName: e.data.tagName,
            className: e.data.className
          }
        });
        window.dispatchEvent(event);

        // #7 Abrir popover de edición inline si llegaron estilos computados.
        if (e.data.computedStyle && e.data.anchor) {
          const cs = e.data.computedStyle;
          // Marcar el elemento en el iframe para poder aplicarle estilo en vivo.
          const iframe = getPreviewIframe();
          iframe?.contentWindow?.postMessage({ type: 'MAVERLANG_MARK_ELEMENT', anchor: e.data.anchor }, '*');
          setInlineEditTarget({
            tagName: e.data.tagName,
            className: e.data.className || '',
            editableText: e.data.editableText || '',
            style: {
              color: rgbToHex(cs.color) || '#000000',
              backgroundColor: rgbToHex(cs.backgroundColor) || '#ffffff',
              fontSize: cs.fontSize || '16px',
              fontWeight: cs.fontWeight || '400',
              borderRadius: cs.borderRadius || '0px',
            },
            anchor: e.data.anchor,
          });
          setInlineDraft({
            text: e.data.editableText || '',
            color: rgbToHex(cs.color) || '#000000',
            bg: rgbToHex(cs.backgroundColor) || '#ffffff',
            fontSize: parseInt(cs.fontSize) || 16,
            radius: parseInt(cs.borderRadius) || 0,
          });
        }
      } else if (e.data?.type === 'MAVERLANG_PREVIEW_LOADED') {
        // Sync active state when the iframe loads or reloads
        const iframe = getPreviewIframe();
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'TOGGLE_INSPECTOR', active: isInspectorActive }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isInspectorActive]);

  // Aplica el draft actual en vivo al elemento del iframe.
  const applyInlineDraftLive = (draft: typeof inlineDraft) => {
    const iframe = getPreviewIframe();
    iframe?.contentWindow?.postMessage({
      type: 'MAVERLANG_APPLY_LIVE_STYLE',
      style: {
        color: draft.color,
        backgroundColor: draft.bg,
        fontSize: `${draft.fontSize}px`,
        borderRadius: `${draft.radius}px`,
        text: draft.text,
      },
    }, '*');
  };

  // Genera un prompt concreto y lo envía al input del chat (vía evento global).
  const commitInlineEdit = () => {
    if (!inlineEditTarget) return;
    const t = inlineEditTarget;
    const changes: string[] = [];
    if (inlineDraft.text && inlineDraft.text !== t.editableText) {
      changes.push(`cambia el texto a "${inlineDraft.text}"`);
    }
    if (inlineDraft.color && inlineDraft.color !== t.style.color) {
      changes.push(`cambia el color del texto a ${inlineDraft.color}`);
    }
    if (inlineDraft.bg && inlineDraft.bg !== t.style.backgroundColor) {
      changes.push(`cambia el color de fondo a ${inlineDraft.bg}`);
    }
    if (parseInt(String(inlineDraft.fontSize)) !== parseInt(t.style.fontSize)) {
      changes.push(`cambia el tamaño de fuente a ${inlineDraft.fontSize}px`);
    }
    if (parseInt(String(inlineDraft.radius)) !== parseInt(t.style.borderRadius)) {
      changes.push(`cambia el border-radius a ${inlineDraft.radius}px`);
    }
    const instr = changes.length > 0
      ? `Edita este elemento <${t.tagName.toLowerCase()}>${t.className ? ` con clase "${t.className}"` : ''}: ${changes.join(', ')}.`
      : `Edita este elemento <${t.tagName.toLowerCase()}>: ${t.editableText || '(sin texto)'}.`;
    // Enviar al input del chat mediante el evento que ya escucha chat-input.
    window.dispatchEvent(new CustomEvent("MAVERLANG_ELEMENT_INSPECTED", {
      detail: { elementHtml: '', tagName: t.tagName, className: t.className, instruction: instr },
    }));
    setInlineEditTarget(null);
  };

  const tabs = [
    { id: "preview" as const, label: "Preview", description: "Vista previa interactiva", icon: Monitor },
    { id: "files" as const, label: "Files", description: "Explorador de archivos", icon: FolderOpen },
    { id: "code" as const, label: "Code", description: "Editor de código fuente", icon: Code2 },
    { id: "console" as const, label: "Console", description: "Consola de runtime (logs y errores)", icon: Terminal },
  ];

  const hasFiles = Object.keys(files).length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Tab Bar */}
        <div className="flex items-center justify-between gap-2 px-2 sm:px-4 py-2.5 bg-background shrink-0 overflow-x-auto hidden-scrollbar">
          
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
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

            {/* Inspector Toggle (Only in Preview) — oculto en móvil, es avanzado y poco usable en touch */}
            {selectedTab === "preview" && (
              <div className="hidden sm:flex items-center bg-muted/30 rounded-lg p-1 border border-border/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsInspectorActive(!isInspectorActive)}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                        isInspectorActive
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <MousePointer2 className="w-3.5 h-3.5" />
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
                  const shareUrl = currentChatId 
                    ? `${window.location.origin}/share/chat/${currentChatId}` 
                    : window.location.href;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Enlace de compartición copiado al portapapeles!");
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 h-8 bg-secondary hover:bg-secondary/85 text-secondary-foreground rounded-full text-xs font-bold active:scale-95 transition-all duration-200"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            </TooltipTrigger>
            <TooltipContent hideArrow side="bottom" sideOffset={6} className="text-xs bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg font-semibold">
              Copiar enlace para compartir
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
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 bg-foreground text-background hover:opacity-90 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 sm:min-w-[185px]"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="sm:hidden">{isSaving ? "Guardando" : "Guardar"}</span>
                <span className="hidden sm:inline">{isSaving ? "Guardando..." : "Guardar y Descargar"}</span>
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
            key={buildVersion}
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
              dependencies: detectedDependencies,
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
            <SandpackStatusListener />
            <SandpackStoreSync stableFiles={stableFiles} />
            {/* Code Editor Tab */}
            {selectedTab === "code" && (
              <div className="flex-grow flex min-h-0 w-full">
                {/* File Explorer Sidebar — oculto en pantallas muy estrechas para
                    dar todo el ancho al editor; el usuario navega archivos desde
                    la pestaña Files o Cmd+P. */}
                <div className="hidden sm:block w-48 bg-muted/5 overflow-y-auto hidden-scrollbar shrink-0 border-r border-border">
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

            {/* Console Tab — runtime logs del bundler de Sandpack.
                SandpackConsole debe estar dentro de <SandpackProvider>. */}
            {selectedTab === "console" && (
              <div className="flex-grow flex flex-col min-h-0 w-full bg-[#0B1329]">
                <SandpackConsole
                  showHeader={false}
                  showSyntaxError={false}
                  style={{
                    height: "100%",
                    width: "100%",
                    background: "#0B1329",
                    border: "none",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                  }}
                />
              </div>
            )}

            {/* Preview Tab */}
            {selectedTab === "preview" && (
              <div className={cn(
                "flex-grow flex items-center justify-center min-h-0 w-full h-full relative overflow-hidden preview-container-no-scrollbar",
                viewport === "desktop"
                  ? "bg-transparent p-0"
                  : "bg-slate-50 dark:bg-black p-3 sm:p-4 md:p-6"
              )}>
                <style dangerouslySetInnerHTML={{ __html: `
                  .preview-container-no-scrollbar ::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                  }
                  .preview-container-no-scrollbar *::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                  }
                  .preview-container-no-scrollbar,
                  .preview-container-no-scrollbar *,
                  .preview-container-no-scrollbar iframe {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                  }
                `}} />
                <div className={cn(
                  "flex flex-col bg-white dark:bg-black transition-all duration-300 ease-in-out relative",
                  viewport === "desktop" && "w-full h-full rounded-none max-w-full border-none shadow-none",
                  viewport === "tablet" && "w-full max-w-[768px] aspect-[768/1024] max-h-full shrink-0 rounded-2xl border border-border/40 shadow-xl overflow-hidden [&_*::-webkit-scrollbar]:hidden [&_*]:[scrollbar-width:none] [&_*]:[-ms-overflow-style:none] [&_iframe]:[scrollbar-width:none] [&_iframe::-webkit-scrollbar]:hidden",
                  // Frame "mobile": en móvil real el dispositivo ya es estrecho,
                  // así que usamos max-w más generoso y un notch sutil para realismo.
                  // En desktop mantiene el marco de teléfono claro.
                  viewport === "mobile" && "w-full max-w-[390px] aspect-[390/800] max-h-full shrink-0 rounded-[2rem] sm:rounded-3xl border border-border/40 shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 [&_*::-webkit-scrollbar]:hidden [&_*]:[scrollbar-width:none] [&_*]:[-ms-overflow-style:none] [&_iframe]:[scrollbar-width:none] [&_iframe::-webkit-scrollbar]:hidden"
                )}>
                  {/* Notch sutil (solo en viewport mobile) para realismo de teléfono */}
                  {viewport === "mobile" && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-24 h-5 bg-black rounded-b-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-10 h-1 bg-white/20 rounded-full" />
                    </div>
                  )}
                  {/* Body de la preview */}
                  <div className="flex-grow min-h-0 relative w-full h-full bg-white dark:bg-background">
                    {(isAiResponding || chatLoading) ? (
                      <PremiumSkeletonLoader isAiResponding={isAiResponding || chatLoading} />
                    ) : lastAutoFixError ? (
                      <BuildErrorView error={lastAutoFixError} />
                    ) : (
                      <SandpackPreviewWrapper key={iframeKey} />
                    )}

                    {/* #7 POPOVER DE EDICIÓN INLINE: flotante sobre el iframe.
                        Permite editar texto/colores/tamaño/radius en vivo y, al
                        aplicar, genera un prompt concreto para la IA. */}
                    {inlineEditTarget && (
                      <div className="absolute z-40 top-3 right-3 w-[230px] max-h-[calc(100%-24px)] overflow-y-auto hidden-scrollbar rounded-2xl border border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MousePointer2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[10px] font-bold truncate">
                              &lt;{inlineEditTarget.tagName.toLowerCase()}&gt;
                            </span>
                          </div>
                          <button
                            onClick={() => setInlineEditTarget(null)}
                            className="w-5 h-5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Cerrar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="p-3 space-y-2.5">
                          {inlineEditTarget.editableText !== undefined && (
                            <label className="block">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Texto</span>
                              <input
                                type="text"
                                value={inlineDraft.text}
                                onChange={(e) => {
                                  const d = { ...inlineDraft, text: e.target.value };
                                  setInlineDraft(d);
                                  applyInlineDraftLive(d);
                                }}
                                className="mt-1 w-full text-[11px] px-2 py-1.5 rounded-lg bg-background border border-border focus:border-primary outline-none"
                                placeholder="(sin texto editable)"
                              />
                            </label>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Color texto</span>
                              <input
                                type="color"
                                value={inlineDraft.color}
                                onChange={(e) => {
                                  const d = { ...inlineDraft, color: e.target.value };
                                  setInlineDraft(d);
                                  applyInlineDraftLive(d);
                                }}
                                className="mt-1 w-full h-7 rounded-lg bg-background border border-border cursor-pointer"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fondo</span>
                              <input
                                type="color"
                                value={inlineDraft.bg}
                                onChange={(e) => {
                                  const d = { ...inlineDraft, bg: e.target.value };
                                  setInlineDraft(d);
                                  applyInlineDraftLive(d);
                                }}
                                className="mt-1 w-full h-7 rounded-lg bg-background border border-border cursor-pointer"
                              />
                            </label>
                          </div>

                          <label className="block">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Tamaño fuente: {inlineDraft.fontSize}px</span>
                            <input
                              type="range"
                              min={8}
                              max={48}
                              value={inlineDraft.fontSize}
                              onChange={(e) => {
                                const d = { ...inlineDraft, fontSize: parseInt(e.target.value) };
                                setInlineDraft(d);
                                applyInlineDraftLive(d);
                              }}
                              className="mt-1 w-full accent-primary cursor-pointer"
                            />
                          </label>

                          <label className="block">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Border radius: {inlineDraft.radius}px</span>
                            <input
                              type="range"
                              min={0}
                              max={40}
                              value={inlineDraft.radius}
                              onChange={(e) => {
                                const d = { ...inlineDraft, radius: parseInt(e.target.value) };
                                setInlineDraft(d);
                                applyInlineDraftLive(d);
                              }}
                              className="mt-1 w-full accent-primary cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="p-3 pt-1 border-t border-border/60 flex gap-2">
                          <button
                            onClick={() => setInlineEditTarget(null)}
                            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={commitInlineEdit}
                            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors active:scale-95"
                          >
                            Aplicar a la IA
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}



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
          </>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}
