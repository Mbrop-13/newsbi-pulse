"use client";

import { useState, useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { 
  Check, 
  Download,
  FileCode2, 
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sanitizeHtml } from "@/lib/sanitize";

// Motor de Resaltado de Sintaxis
function applySyntaxHighlighting(code: string, language: string): string {
  // Escapar HTML base para evitar renderizado real y vulnerabilidades XSS
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const tokens: string[] = [];
  const pushToken = (content: string, className: string) => {
    const placeholder = `___TOKEN_${tokens.length}___`;
    tokens.push(`<span class="${className}">${content}</span>`);
    return placeholder;
  };

  const lang = language.toLowerCase();

  if (lang === "html" || lang === "xml" || lang === "svg") {
    // 1. Comentarios <!-- ... -->
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (_, match) => 
      pushToken(match, "hk-comment")
    );
    
    // 2. DOCTYPE
    escaped = escaped.replace(/(&lt;!DOCTYPE.*?&gt;)/gi, (_, match) => 
      pushToken(match, "hk-comment")
    );
    
    // 3. Valores de atributos en comillas
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/('(?:[^'\\]|\\.)*')/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    
    // 4. Etiquetas HTML
    escaped = escaped.replace(/(&lt;\/?)([a-zA-Z0-9:-]+)/g, (_, p1, p2) => {
      return p1 + `<span class="hk-tag">${p2}</span>`;
    });
    
    // 5. Atributos
    escaped = escaped.replace(/([a-zA-Z0-9:-]+)=/g, (_, p1) => {
      return `<span class="hk-attr">${p1}</span>=`;
    });
  } else if (lang === "css") {
    // Comentarios
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, (_, match) => 
      pushToken(match, "hk-comment")
    );
    // Cadenas
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/('(?:[^'\\]|\\.)*')/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    // Propiedades
    escaped = escaped.replace(/([a-zA-Z0-9-]+)\s*:/g, (_, p1) => {
      return `<span class="hk-attr">${p1}</span>:`;
    });
    // Reglas @
    escaped = escaped.replace(/(@[a-zA-Z0-9-]+)/g, '<span class="hk-keyword">$1</span>');
  } else if (
    lang === "js" || 
    lang === "javascript" || 
    lang === "ts" || 
    lang === "typescript" || 
    lang === "jsx" || 
    lang === "tsx" || 
    lang === "json"
  ) {
    // Comentarios multilinea
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, (_, match) => 
      pushToken(match, "hk-comment")
    );
    // Comentarios de una linea
    escaped = escaped.replace(/(\/\/.*)/g, (_, match) => 
      pushToken(match, "hk-comment")
    );
    // Cadenas
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/('(?:[^'\\]|\\.)*')/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/(\`(?:[^\`\\]|\\.)*\`)/g, (_, match) => 
      pushToken(match, "hk-string")
    );

    // Palabras clave
    const keywords = [
      "const", "let", "var", "function", "return", "import", "export", 
      "class", "default", "from", "if", "else", "for", "while", "switch", 
      "case", "break", "continue", "try", "catch", "finally", "throw", 
      "new", "async", "await", "yield", "typeof", "instanceof", "in", 
      "of", "extends", "super", "this", "interface", "type", "public", 
      "private", "protected", "readonly", "as", "any", "string", "number", 
      "boolean", "void", "never", "unknown"
    ];
    const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    escaped = escaped.replace(keywordRegex, '<span class="hk-keyword">$1</span>');

    // Nombres de funciones
    escaped = escaped.replace(/\b([a-zA-Z0-9_]+)(?=\s*\()/g, '<span class="hk-function">$1</span>');

    // Números
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="hk-number">$1</span>');

    // Booleanos, null, undefined
    escaped = escaped.replace(/\b(true|false|null|undefined)\b/g, '<span class="hk-boolean">$1</span>');
  } else if (lang === "python" || lang === "py") {
    // Comentarios #
    escaped = escaped.replace(/(#.*)/g, (_, match) => 
      pushToken(match, "hk-comment")
    );
    // Cadenas triples
    escaped = escaped.replace(/(""\"[\s\S]*?""\")/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/(''\'[\s\S]*?''\')/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    // Cadenas simples
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*")/g, (_, match) => 
      pushToken(match, "hk-string")
    );
    escaped = escaped.replace(/('(?:[^'\\]|\\.)*')/g, (_, match) => 
      pushToken(match, "hk-string")
    );

    // Palabras clave
    const keywords = [
      "def", "class", "return", "import", "from", "as", "if", "elif", "else", 
      "for", "while", "break", "continue", "pass", "try", "except", "finally", 
      "raise", "assert", "in", "is", "not", "and", "or", "lambda", "global", 
      "nonlocal", "with", "yield", "del"
    ];
    const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    escaped = escaped.replace(keywordRegex, '<span class="hk-keyword">$1</span>');

    // Funciones
    escaped = escaped.replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance)(?=\s*\()/g, '<span class="hk-keyword">$1</span>');
    escaped = escaped.replace(/\b([a-zA-Z0-9_]+)(?=\s*\()/g, '<span class="hk-function">$1</span>');

    // Números
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="hk-number">$1</span>');

    // Booleanos y None
    escaped = escaped.replace(/\b(True|False|None)\b/g, '<span class="hk-boolean">$1</span>');
  }

  // Restaurar tokens
  for (let i = tokens.length - 1; i >= 0; i--) {
    escaped = escaped.split(`___TOKEN_${i}___`).join(tokens[i]);
  }

  return escaped;
}

function getFileExtension(language: string): string {
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    svg: "svg",
    xml: "xml",
    css: "css",
    js: "js",
    javascript: "js",
    ts: "ts",
    typescript: "ts",
    jsx: "jsx",
    tsx: "tsx",
    json: "json",
    py: "py",
    python: "py",
    md: "md",
    markdown: "md",
  };
  return map[language.toLowerCase()] || "txt";
}

export function CanvasPanel() {
  const { 
    activeFile, 
    closeCanvas,
    updateActiveFileCode,
  } = useCanvasStore();
  const currentChatId = useAIChatStore((s) => s.currentChatId);
  const isLoading = useAIChatStore((s) => s.isLoading);

  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState("");
  const htmlIframeRef = useRef<HTMLIFrameElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Reset editing state and tab when a new file opens
  useEffect(() => {
    setIsEditing(false);
    setEditCode("");
    if (activeFile) {
      setActiveTab("code");
    }
  }, [activeFile?.title]);

  const codeForLines = isEditing ? editCode : (activeFile?.code || "");
  const lines = codeForLines.split("\n");
  const lineNumberWidth = activeFile
    ? `${Math.max(2.5, String(lines.length).length * 0.6 + 1.5)}rem`
    : "2.5rem";
  const langKey = activeFile ? activeFile.language.toLowerCase() : "";
  const isHtml = langKey === "html" || langKey === "htm";
  const isSvg = langKey === "svg";
  const isMarkdown = langKey === "markdown" || langKey === "md";
  const hasPreview = isHtml || isSvg || isMarkdown;

  // Make HTML preview editable when editing mode is active
  useEffect(() => {
    if (!isEditing || activeTab !== "preview" || !isHtml || !htmlIframeRef.current) return;
    const iframe = htmlIframeRef.current;
    let doc: Document | null | undefined = null;
    try {
      doc = iframe.contentDocument || iframe.contentWindow?.document;
    } catch {
      doc = null;
    }
    if (!doc || !doc.body) return;

    doc.body.contentEditable = "true";
    doc.body.style.cursor = "text";
    doc.body.style.outline = "none";

    const handleInput = () => {
      const original = activeFile?.code || "";
      const trimmed = original.trim().toLowerCase();
      const updated = trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")
        ? doc.documentElement.outerHTML
        : doc.body.innerHTML;
      setEditCode(updated);
    };

    doc.body.addEventListener("input", handleInput);
    return () => {
      if (!doc || !doc.body) return;
      doc.body.contentEditable = "false";
      doc.body.style.cursor = "";
      doc.body.style.outline = "";
      doc.body.removeEventListener("input", handleInput);
    };
  }, [isEditing, activeTab, isHtml, activeFile?.code]);

  // Make SVG preview editable when editing mode is active
  useEffect(() => {
    if (!isEditing || activeTab !== "preview" || !isSvg || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgHtmlEl = svgEl as unknown as HTMLElement;

    svgEl.setAttribute("contenteditable", "true");
    svgHtmlEl.style.cursor = "text";
    svgHtmlEl.style.outline = "none";

    const handleInput = () => {
      setEditCode(svgContainerRef.current?.innerHTML || "");
    };

    svgEl.addEventListener("input", handleInput);
    return () => {
      if (!svgEl) return;
      svgEl.removeAttribute("contenteditable");
      svgHtmlEl.style.cursor = "";
      svgHtmlEl.style.outline = "";
      svgEl.removeEventListener("input", handleInput);
    };
  }, [isEditing, activeTab, isSvg]);

  const handleCopy = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(isEditing ? editCode : activeFile.code);
      setIsCopied(true);
      toast.success("Código copiado al portapapeles");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el código");
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const ext = getFileExtension(activeFile.language);
    let filename = activeFile.title;
    if (!filename.includes(".")) {
      filename = `${filename}.${ext}`;
    }
    const blob = new Blob([isEditing ? editCode : activeFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Archivo descargado: ${filename}`);
  };

  const handleStartEditing = () => {
    if (!activeFile) return;
    setEditCode(activeFile.code);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeFile) return;
    let finalCode = editCode;

    // Clean up editing attributes that may have been added during visual editing
    if (activeTab === "preview" && (isHtml || isSvg)) {
      finalCode = editCode
        .replace(/\s*contenteditable="true"/gi, "")
        .replace(/\s*style="([^"]*)cursor:\s*text;?([^"]*)"/gi, (match, before, after) => {
          const cleaned = `${before}${after}`.replace(/;\s*$/, "").trim();
          return cleaned ? ` style="${cleaned}"` : "";
        })
        .replace(/\s*style="([^"]*)outline:\s*none;?([^"]*)"/gi, (match, before, after) => {
          const cleaned = `${before}${after}`.replace(/;\s*$/, "").trim();
          return cleaned ? ` style="${cleaned}"` : "";
        });
    }

    updateActiveFileCode(finalCode);
    setIsEditing(false);
    setEditCode("");
    toast.success("Cambios guardados");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditCode("");
  };

  return (
    <div className="flex-1 w-full min-h-0 flex flex-col border border-[#DBDBDB] dark:border-[#2e2e2e] rounded-xl bg-white dark:bg-[#1E1E1E] shadow-[inset_0_0_1px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.04),0_4px_24px_0_rgba(0,0,0,0.08)] overflow-hidden transition-colors duration-300 md:mt-8 md:mb-4 md:mr-4 mt-1 mb-1 mx-1 md:mx-0 border relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .hk-comment { color: #9ca3af; font-style: italic; }
        .dark .hk-comment { color: #71717a; }
        .hk-string { color: #ea580c; }
        .dark .hk-string { color: #ce9178; }
        .hk-keyword { color: #2563eb; }
        .dark .hk-keyword { color: #569cd6; }
        .hk-function { color: #d97706; }
        .dark .hk-function { color: #dcdcaa; }
        .hk-number { color: #16a34a; }
        .dark .hk-number { color: #b5cea8; }
        .hk-boolean { color: #2563eb; }
        .dark .hk-boolean { color: #569cd6; }
        .hk-tag { color: #2563eb; }
        .dark .hk-tag { color: #569cd6; }
        .hk-attr { color: #0284c7; }
        .dark .hk-attr { color: #9cdcfe; }
      ` }} />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#26282A] shrink-0 select-none">
        
        {/* Grupo Izquierdo: Pestañas (Código / Vista Previa) */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-black/20 rounded-md border border-gray-200/50 dark:border-white/5">
          {/* Botón activo: Código */}
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "w-8 h-6 flex justify-center items-center rounded transition-all cursor-pointer",
              activeTab === "code"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                : "hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400"
            )}
            aria-label="Ver Código"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5" className="w-4 h-4">
              <path d="M5.33398 4.33301L1.33398 8.47707L5.33398 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M10.666 4.33301L14.666 8.47707L10.666 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M9.33333 1.33301L7 14.6663" stroke="currentColor" strokeLinecap="round"></path>
            </svg>
          </button>
          
          {/* Botón inactivo: Vista Previa */}
          <button
            onClick={() => {
              if (hasPreview) {
                setActiveTab("preview");
              }
            }}
            disabled={!hasPreview}
            className={cn(
              "w-8 h-6 flex justify-center items-center rounded transition-all",
              !hasPreview
                ? "text-gray-300 dark:text-zinc-650 cursor-not-allowed opacity-50"
                : activeTab === "preview"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white cursor-pointer"
                  : "hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-pointer"
            )}
            aria-label="Vista Previa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
            </svg>
          </button>
        </div>

        {/* Grupo Derecho: Acciones */}
        <div className="flex items-center gap-1.5">
          {/* Botón Compartir */}
          <button
            disabled={!activeFile}
            onClick={() => {
              if (!activeFile) return;
              const shareUrl = currentChatId 
                ? `${window.location.origin}/share/chat/${currentChatId}` 
                : window.location.href;
              navigator.clipboard.writeText(shareUrl);
              toast.success("Enlace de compartir copiado al portapapeles");
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeFile
                ? "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 cursor-pointer"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-650 cursor-not-allowed opacity-50"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
              <path d="M11.6667 5.33333C12.5871 5.33333 13.3333 4.58713 13.3333 3.66667C13.3333 2.74619 12.5871 2 11.6667 2C10.7462 2 10 2.74619 10 3.66667C10 4.58713 10.7462 5.33333 11.6667 5.33333Z" stroke="currentColor" strokeWidth="1.33333" strokeLinejoin="round" fill="none"></path>
              <path d="M4.3339 9.66683C5.25437 9.66683 6.00057 8.00016 6.00057 8.00016C6.00057 7.0797 5.25437 6.3335 4.3339 6.3335C3.41344 6.3335 2.66724 7.0797 2.66724 8.00016C2.66724 8.92063 3.41344 9.66683 4.3339 9.66683Z" stroke="currentColor" strokeWidth="1.33333" strokeLinejoin="round" fill="none"></path>
              <path d="M10 4.5249L5.77966 7.08187" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M5.7793 8.85449L10.2261 11.4822" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M11.6667 10.6665C12.5871 10.6665 13.3333 11.4127 13.3333 12.3332C13.3333 13.2536 12.5871 13.9998 11.6667 13.9998C10.7462 13.9998 10 13.2536 10 12.3332C10 11.4127 10.7462 10.6665 11.6667 10.6665Z" stroke="currentColor" strokeWidth="1.33333" strokeLinejoin="round" fill="none"></path>
            </svg>
            Compartir
          </button>

          {/* Botón Descargar */}
          <button
            disabled={!activeFile}
            onClick={handleDownload}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              activeFile
                ? "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                : "text-gray-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
            )}
            title="Descargar archivo"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {/* Botón Editar */}
          <button
            disabled={!activeFile || isLoading}
            onClick={() => isEditing ? handleCancelEdit() : handleStartEditing()}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              !activeFile || isLoading
                ? "text-gray-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
                : isEditing
                  ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
            )}
            title={isEditing ? "Cancelar edición" : "Editar"}
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" strokeWidth="1.33">
              <path d="M7.99998 13.3334H14M2 13.3334H3.11636C3.44248 13.3334 3.60554 13.3334 3.75899 13.2966C3.89504 13.2639 4.0251 13.21 4.1444 13.1369C4.27895 13.0545 4.39425 12.9392 4.62486 12.7086L13 4.3334C13.5523 3.78112 13.5523 2.88569 13 2.3334C12.4477 1.78112 11.5523 1.78112 11 2.3334L2.62484 10.7086C2.39424 10.9392 2.27894 11.0545 2.19648 11.189C2.12338 11.3083 2.0695 11.4384 2.03684 11.5744C2 11.7279 2 11.8909 2 12.2171V13.3334Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>

          {/* Botones Guardar/Cancelar (solo en modo edición) */}
          {isEditing && (
            <>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          )}

          {/* Botón Abrir Externo */}
          <button
            disabled={!activeFile}
            onClick={() => {
              if (!activeFile) return;
              const blob = new Blob([isEditing ? editCode : activeFile.code], { type: isHtml ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            }}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              activeFile
                ? "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                : "text-gray-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
            )}
            title="Abrir en pestaña nueva"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" strokeWidth="1.5">
              <path d="M14 6L14 2M14 2H10M14 2L8.66667 7.33333M6.66667 3.33333H5.2C4.0799 3.33333 3.51984 3.33333 3.09202 3.55132C2.71569 3.74307 2.40973 4.04903 2.21799 4.42535C2 4.85318 2 5.41323 2 6.53333V10.8C2 11.9201 2 12.4802 2.21799 12.908C2.40973 13.2843 2.71569 13.5903 3.09202 13.782C3.51984 14 4.0799 14 5.2 14H9.46667C10.5868 14 11.1468 14 11.5746 13.782C11.951 13.5903 12.2569 13.2843 12.4487 12.908C12.6667 12.4802 12.6667 11.9201 12.6667 10.8V9.33333" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>

          {/* Separador vertical */}
          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>

          {/* Botón Cerrar */}
          <button
            onClick={closeCanvas}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-white dark:bg-[#1E1E1E]">
        {!activeFile ? (
          <div className="h-full w-full flex items-center justify-center select-none bg-white dark:bg-[#1E1E1E]">
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
                <h4 className="text-base font-bold text-zinc-800 dark:text-white">Comienza a crear</h4>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pídeme escribir código, scripts o diseñar páginas. Los resultados de ejecución y previsualización aparecerán aquí.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Esperando código...</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {(activeTab === "code" || !hasPreview) && (
          <div className="flex-1 w-full flex bg-white dark:bg-[#1E1E1E] relative min-h-0 overflow-hidden">
            
            {/* Botón flotante "Copy" */}
            <button
              onClick={handleCopy}
              className="absolute top-4 right-6 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 cursor-pointer select-none"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                  <path d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667Z" fill="currentColor"></path>
                  <path d="M18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.165 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667Z" fill="currentColor" fillOpacity="0.3"></path>
                </svg>
              )}
              <span>{isCopied ? "Copiado" : "Copiar"}</span>
            </button>

            {/* Contenedor del Scroll */}
            <div className="flex-1 w-full h-full overflow-auto scrollbar-hide text-[13px] font-mono pb-8 pt-4">
              <div className="flex min-w-full">
                {/* Line numbers */}
                {!isEditing && (
                  <div
                    className="sticky left-0 z-10 flex flex-col text-right px-3 text-gray-400/70 select-none bg-white dark:bg-[#1E1E1E] shrink-0 font-mono text-[13px] leading-6"
                    style={{ width: lineNumberWidth, minWidth: lineNumberWidth, top: 'auto' }}
                  >
                    {lines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                )}
                {/* Code */}
                {isEditing ? (
                  <textarea
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="flex-grow px-4 pr-24 py-0 m-0 bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-300 font-mono text-[13px] leading-6 resize-none border-none focus:outline-none focus:ring-0 min-w-max overflow-hidden"
                    style={{ minHeight: `${lines.length * 1.5}rem` }}
                    spellCheck={false}
                  />
                ) : isLoading ? (
                  <pre className="flex-grow px-4 pr-24 m-0 text-gray-600 dark:text-gray-400 font-mono text-[13px] leading-6 whitespace-pre min-w-max">
                    {activeFile.code}
                  </pre>
                ) : (
                  <pre
                    className="flex-grow px-4 pr-24 m-0 text-gray-800 dark:text-gray-300 font-mono text-[13px] leading-6 whitespace-pre min-w-max"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(applySyntaxHighlighting(activeFile.code, activeFile.language)) }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {hasPreview && activeTab === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-50/50 dark:bg-[#1E1E20]">
            <div className="flex-1 overflow-auto p-3">
              <div className="h-full rounded-xl overflow-hidden border border-zinc-200/60 dark:border-white/[0.04] bg-white dark:bg-[#1E1E1E]">
                {isHtml && (
                  <iframe
                    ref={htmlIframeRef}
                    srcDoc={activeFile.code}
                    title="HTML Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0 bg-white"
                  />
                )}
                {isSvg && (
                  <div className="w-full h-full flex items-center justify-center p-6 overflow-auto bg-white dark:bg-[#1E1E1E]">
                    <div
                      ref={svgContainerRef}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeFile.code) }}
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
          </>
        )}
      </div>
    </div>
  );
}
