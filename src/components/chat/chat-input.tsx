"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useConversionStore } from "@/lib/stores/conversion-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ModelSelector } from "@/components/chat/model-selector";
import { BuildModeSelector } from "@/components/chat/build-mode-selector";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Mic,
  Globe,
  Image as ImageIcon,
  Terminal,
  ArrowUp,
  FileUp,
  Camera,
  X,
  Star,
  PieChart,
  LineChart,
  BarChart3,
  AreaChart,
  Target,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
  TrendingUp,
  Scale,
  Layers,
  FileText,
  BookOpen,
  Chrome,
  Paperclip,
  Code2,
  AlertTriangle,
  Crown,
} from "lucide-react";

const ADVANCED_TOOLS = [
  { id: 'chart_bar', label: 'Gráfico de Barras', icon: BarChart3, category: 'Gráficos' },
  { id: 'chart_line', label: 'Gráfico de Líneas', icon: LineChart, category: 'Gráficos' },
  { id: 'chart_pie', label: 'Gráfico Circular', icon: PieChart, category: 'Gráficos' },
  { id: 'chart_area', label: 'Gráfico de Área', icon: AreaChart, category: 'Gráficos' },
  { id: 'chart_radar', label: 'Gráfico de Radar', icon: Target, category: 'Gráficos' },
  { id: 'analyze_stock', label: 'Análisis Fundamental', icon: TrendingUp, category: 'Análisis' },
  { id: 'compare_stocks', label: 'Comparar Acciones', icon: Scale, category: 'Análisis' },
  { id: 'get_sector_performance', label: 'Rendimiento Sectorial', icon: Layers, category: 'Análisis' },
];

interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isStreaming?: boolean;
  onStop?: () => void;
  onSubmit?: (
    value: string,
    options: {
      webSearch: boolean;
      image: boolean;
      codeInterpreter: boolean;
      browser: boolean;
    }
  ) => void;
}

export function ChatInput({
  placeholder: customPlaceholder,
  disabled,
  className,
  isStreaming = false,
  onStop,
  onSubmit,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [image, setImage] = useState(false);
  const [codeInterpreter, setCodeInterpreter] = useState(false);
  const [browser, setBrowser] = useState(false);
  const { isWebBuilderMode, setWebBuilderMode, buildMode } = useWebBuilderStore();
  const { tokenLimitReached, tokenLimitDetails, openModal: openConversionModal, clearTokenLimitReached } = useConversionStore();
  const {
    messages,
    activeTools,
    favoriteTools,
    toggleTool,
    toggleFavoriteTool,
    attachedFiles,
    attachedArticles,
    removeFile,
    removeArticle,
    attachFile,
    selectedModel,
    setModel,
  } = useAIChatStore();
  const isNewChat = messages.length === 0;
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'charts' | 'analysis'>('main');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Rotating/typing placeholder logic
  const placeholders = [
    "Pregúntame lo que quieras...",
    "Analiza mi portafolio...",
    "Analiza esta acción...",
    "Construye una web de...",
    "Crea una alerta de precio para...",
    "Compara Tesla vs Apple...",
    "¿Qué opinas sobre el mercado hoy?...",
    "Construye un clon de Twitter...",
    "Analiza las finanzas de NVIDIA..."
  ];

  const [typewriter, setTypewriter] = useState({
    text: "",
    isDeleting: false,
    index: 0,
  });

  // Reset typewriter when starting a new chat
  useEffect(() => {
    if (isNewChat) {
      setTypewriter({
        text: "",
        isDeleting: false,
        index: 0,
      });
    }
  }, [isNewChat]);

  useEffect(() => {
    if (value || !isNewChat) return;

    let timer: NodeJS.Timeout;
    const fullText = placeholders[typewriter.index];
    const typingSpeed = typewriter.isDeleting ? 30 : 60;
    const delayBetweenWords = 2500;

    if (!typewriter.isDeleting && typewriter.text === fullText) {
      timer = setTimeout(() => {
        setTypewriter((prev) => ({ ...prev, isDeleting: true }));
      }, delayBetweenWords);
    } else if (typewriter.isDeleting && typewriter.text === "") {
      setTypewriter((prev) => ({
        text: "",
        isDeleting: false,
        index: (prev.index + 1) % placeholders.length,
      }));
    } else {
      timer = setTimeout(() => {
        setTypewriter((prev) => {
          const currentFullText = placeholders[prev.index];
          const nextText = prev.isDeleting
            ? currentFullText.substring(0, prev.text.length - 1)
            : currentFullText.substring(0, prev.text.length + 1);
          return {
            ...prev,
            text: nextText,
          };
        });
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [typewriter, value, isNewChat]);

  const displayedPlaceholder = isListening 
    ? "Escuchando... habla ahora" 
    : (value 
        ? "" 
        : (isNewChat ? (typewriter.text || " ") : (customPlaceholder || "Envía un mensaje..."))
      );

  // Click outside listener for attachment menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
        setTimeout(() => setAttachMenuView('main'), 200);
      }
    }
    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachMenu]);

  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  const { isMobile } = useSidebar();
  const openUpward = !isNewChat || isMobile;

  // Auto-resize the textarea as content grows
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 256;
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const handleElementInspected = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { elementHtml, tagName } = customEvent.detail || {};
      if (!tagName) return;

      let preview = elementHtml || "";
      preview = preview.replace(/[\r\n]+/g, ' ').trim();
      if (preview.length > 80) {
        preview = preview.substring(0, 80) + "...";
      }

      const cleanValue = valueRef.current.replace(/^\[Editar\s+[^\]]+\]:\s*/i, "");
      const prefix = `[Editar <${tagName.toLowerCase()}>: "${preview}"]: `;
      setValue(prefix + cleanValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = (prefix + cleanValue).length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
    };

    window.addEventListener("MAVERLANG_ELEMENT_INSPECTED", handleElementInspected);
    return () => {
      window.removeEventListener("MAVERLANG_ELEMENT_INSPECTED", handleElementInspected);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Comprobar soporte de la Web Speech API. Solo Chrome/Edge la soportan
    // (y requiere un contexto seguro: https:// o localhost).
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("La transcripción de voz no está soportada en este navegador. Usa Chrome o Edge.");
      return;
    }

    // IMPORTANTE: NO pre-validar con getUserMedia. webkitSpeechRecognition pide
    // el permiso del micrófono por su cuenta al llamar start(), y pedir permiso
    // antes con getUserMedia es contraproducente: en contextos no seguros
    // (http:// en una IP que no es localhost) getUserMedia lanza sin mostrar el
    // prompt y bloquearía el arranque aunque el reconocimiento sí funcionaría.
    // El permiso real lo gestiona el navegador al hacer start().
    startRecognition(SpeechRecognition);
  };

  // Inicia el reconocimiento de voz. Separado para poder llamarlo tras la
  // comprobación de permisos. Envuelve start() en try/catch porque puede
  // lanzar si el permiso se revoca entre la comprobación y el inicio.
  const startRecognition = (SpeechRecognition: any) => {
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "es-ES";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setValue((prev) => prev + (prev ? " " : "") + transcript);
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
        // Distinguir el tipo de error para dar feedback útil. "aborted" y
        // "no-speech" son esperados al parar / tras silencio y no se muestran.
        const code = err?.error || err?.type;
        if (code === "not-allowed" || code === "service-not-allowed") {
          toast.error("Permiso de micrófono denegado. Haz clic en el icono del candado (o controles del sitio) a la izquierda de la barra de direcciones y cambia 'Micrófono' a 'Permitir'.");
        } else if (code === "network") {
          toast.error("Error de red en el servicio de transcripción. Revisa tu conexión.");
        } else if (code !== "aborted" && code !== "no-speech" && code !== "audio-capture") {
          toast.error("No se pudo transcribir la voz. Inténtalo de nuevo.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (startErr) {
      console.error("Failed to start speech recognition", startErr);
      setIsListening(false);
      toast.error("No se pudo iniciar la transcripción de voz. Inténtalo de nuevo.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed, { webSearch, image, codeInterpreter, browser });
    setValue("");
    requestAnimationFrame(resizeTextarea);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        handleSubmit(e as any);
      }
    }
  };

  const triggerUploadFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (attachedFiles.length >= MAX_FILES) {
        alert(`Has alcanzado el límite de ${MAX_FILES} archivos para tu plan.`);
        return;
      }

      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          attachFile({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content: isImage ? content : content.slice(0, 15000),
            type: isImage ? "image" : file.type.includes("code") || isCode(content) ? "code" : "file",
            size: file.size,
          });
        }
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (isCode(pastedText)) {
      e.preventDefault();
      
      const lang = detectLanguage(pastedText);
      const fileName = `codigo.${lang}`;
      
      attachFile({
        id: Math.random().toString(36).substring(7),
        name: fileName,
        content: pastedText,
        type: "code",
        isPastedCode: true,
        size: pastedText.length,
      });
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="bg-transparent px-2 md:px-0 pb-0 shadow-none !shadow-none">
      <form
        onSubmit={handleSubmit}
        className={cn("w-full max-w-full px-0 pt-0 relative", className)}
      >
        {/* Banner de límite de tokens alcanzado (sobre la barra de input) */}
        <AnimatePresence>
          {tokenLimitReached && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 backdrop-blur-sm">
                <div className="mt-0.5 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Has alcanzado tu límite de tokens de tu plan.
                  </p>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-200/70 mt-0.5">
                    Sube de plan para seguir construyendo y chateando con la IA.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openConversionModal("ai_chat")}
                    className="h-7 gap-1.5 rounded-full bg-amber-500 px-3 text-[11px] font-bold text-white hover:bg-amber-600"
                  >
                    <Crown className="h-3 w-3" />
                    Ver planes
                  </Button>
                  <button
                    type="button"
                    onClick={clearTokenLimitReached}
                    aria-label="Cerrar aviso"
                    className="rounded-full p-1 text-amber-500/70 transition-colors hover:bg-amber-500/10 hover:text-amber-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Tool Pills & Attachments */}
        {(activeTools.length > 0 || attachedArticles.length > 0) && (
          <div className="absolute bottom-full left-4 mb-2.5 flex flex-wrap gap-2 pointer-events-auto">
            {/* Active Tools */}
            {activeTools.map(toolId => {
              const tool = ADVANCED_TOOLS.find(t => t.id === toolId);
              if (!tool) return null;
              return (
                <motion.div
                  key={toolId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-[#1890FF]/10 flex items-center justify-center">
                    <tool.icon className="w-3 h-3 text-[#1890FF]" />
                  </div>
                  {tool.label}
                  <button
                    type="button"
                    onClick={() => toggleTool(toolId, tool.category)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}

            {/* Attached Articles */}
            {attachedArticles.map(article => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-amber-500" />
                </div>
                <span className="max-w-[120px] truncate">{article.title}</span>
                <button
                  type="button"
                  onClick={() => removeArticle(article.id)}
                  className="ml-1 text-gray-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className={cn(
          "rounded-3xl p-2 bg-[#F4F4F0] dark:bg-[#0A0A0A]",
          "shadow-none !shadow-none shadow-transparent border border-gray-200/60 dark:border-white/5 transition-all duration-500 relative group focus-within:border-black/10 dark:focus-within:border-white/10",
          isListening && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
        )}>
          {/* File Previews inside the input box */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 p-3 border-b border-border/20 mb-2">
              {attachedFiles.map(file => {
                const isImage = file.type === "image" || file.content.startsWith("data:image/");
                const isCodeFile = file.type === "code" || file.isPastedCode;
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group w-22 h-22 rounded-2xl overflow-hidden border border-border/40 bg-muted/30 dark:bg-white/[0.02] flex flex-col justify-between p-2 shadow-sm transition-all duration-300 hover:border-border/60"
                  >
                    {/* Delete button floating in the corner */}
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="absolute top-1.5 right-1.5 z-30 h-5 w-5 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-md border border-white/10"
                      aria-label="Eliminar"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    
                    {isImage ? (
                      /* Image preview */
                      <div className="absolute inset-0 z-10 w-full h-full">
                        <img
                          src={file.content}
                          alt={file.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    ) : isCodeFile ? (
                      /* Code preview card */
                      <div className="w-full h-full flex flex-col justify-between font-mono text-[7px] text-muted-foreground select-none leading-normal overflow-hidden p-0.5">
                        <div className="truncate font-bold text-[9px] text-foreground mb-1 border-b border-border/20 pb-0.5 max-w-[80%]">{file.name}</div>
                        <div className="line-clamp-4 break-all opacity-70 mb-1 leading-tight">{file.content}</div>
                        <div className="text-[7px] font-black uppercase text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md self-start tracking-wider">PASTED</div>
                      </div>
                    ) : (
                      /* Regular file preview card */
                      <div className="w-full h-full flex flex-col justify-between p-0.5">
                        <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4.5 h-4.5 text-green-500" />
                        </div>
                        <div className="flex flex-col min-w-0 mt-1">
                          <div className="text-[9px] font-bold truncate text-foreground">{file.name}</div>
                          <div className="text-[7px] text-muted-foreground uppercase mt-0.5">{file.name.split('.').pop() || 'FILE'}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Textarea area */}
          <div className="flex items-center px-2 bg-transparent relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onInput={() => resizeTextarea()}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={displayedPlaceholder}
              disabled={Boolean(disabled && !isStreaming)}
              id="chat-input"
              name="input"
              rows={1}
              className={cn(
                "min-h-12 max-h-72 text-[15px] md:!text-[15px] px-1",
                "resize-none overflow-y-auto",
                "border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              )}
            />
          </div>

          {/* Bottom bar with pills and send button */}
          <div className="mt-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {/* Attachments menu */}
              <div ref={attachMenuRef} className="relative shrink-0">
                <Button
                  type="button"
                  variant={showAttachMenu ? "secondary" : "ghost"}
                  size="icon"
                  className={cn("rounded-full transition-all duration-300", showAttachMenu && "bg-foreground text-background hover:bg-foreground/90 dark:bg-foreground dark:text-background shadow-md")}
                  aria-label="Opciones"
                  onClick={() => setShowAttachMenu(prev => !prev)}
                >
                  <Plus className={cn("h-5 w-5 transition-transform duration-300", showAttachMenu && "rotate-45")} />
                </Button>
                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className={cn(
                        "absolute left-0 z-40 w-64 flex flex-col max-h-[350px] overflow-hidden rounded-2xl border shadow-2xl",
                        openUpward ? "bottom-12" : "top-12",
                        "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-gray-200/50 dark:border-white/5 shadow-blue-500/5 dark:shadow-blue-900/10"
                      )}
                    >
                        <div className="flex-1 overflow-y-auto hidden-scrollbar p-2.5 space-y-3">
                          
                          {attachMenuView === 'main' && (
                            <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                              {/* Archivos */}
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => { setShowAttachMenu(false); triggerUploadFiles(); }}
                                  className="group/btn w-full flex items-center gap-3 px-2.5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98] text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/btn:bg-foreground group-hover/btn:text-background flex items-center justify-center shrink-0 transition-colors duration-200">
                                    <Paperclip className="w-4 h-4" />
                                  </div>
                                  Subir archivo
                                </button>
                              </div>

                              <div className="mt-1">
                                <button type="button" onClick={() => setAttachMenuView('charts')}
                                  className="group/btn w-full flex items-center justify-between px-2.5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/btn:bg-foreground group-hover/btn:text-background flex items-center justify-center shrink-0 transition-colors duration-200"><PieChart className="w-4 h-4" /></div>
                                    Gráficos
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                                <button type="button" onClick={() => setAttachMenuView('analysis')}
                                  className="group/btn w-full flex items-center justify-between px-2.5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98] mt-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/btn:bg-foreground group-hover/btn:text-background flex items-center justify-center shrink-0 transition-colors duration-200"><TrendingUp className="w-4 h-4" /></div>
                                    Análisis
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {attachMenuView === 'charts' && (
                            <motion.div key="charts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                              <button type="button" onClick={() => setAttachMenuView('main')} className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2.5 py-1 mb-2 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Volver
                              </button>
                              <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#1890FF] dark:text-blue-400 mb-1 opacity-80">Gráficos</div>
                              <div className="space-y-1">
                                {ADVANCED_TOOLS.filter(t => t.category === 'Gráficos').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <div key={tool.id} className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all duration-200 group border border-transparent", isActive && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/50")}>
                                      <button type="button" onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} 
                                        className={cn("flex-1 flex items-center gap-3 text-left text-sm font-semibold transition-colors", isActive ? "text-[#1890FF] dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:text-[#1890FF]")}>
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-[#1890FF] text-white" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400")}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={cn("p-1.5 transition-all", favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-655 dark:hover:text-amber-505 opacity-0 group-hover:opacity-100")}>
                                        <Star className={cn("w-4 h-4 transition-transform duration-200 active:scale-125", favoriteTools.includes(tool.id) ? "fill-amber-500 text-amber-500" : "")} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}

                          {attachMenuView === 'analysis' && (
                            <motion.div key="analysis" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                              <button type="button" onClick={() => setAttachMenuView('main')} className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2.5 py-1 mb-2 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Volver
                              </button>
                              <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-1 opacity-80">Análisis</div>
                              <div className="space-y-1">
                                {ADVANCED_TOOLS.filter(t => t.category === 'Análisis').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <div key={tool.id} className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all duration-200 group border border-transparent", isActive && "bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-900/50")}>
                                      <button type="button" onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} 
                                        className={cn("flex-1 flex items-center gap-3 text-left text-sm font-semibold transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400")}>
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-purple-500 text-white" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400")}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={cn("p-1.5 transition-all", favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-655 dark:hover:text-amber-505 opacity-0 group-hover:opacity-100")}>
                                        <Star className={cn("w-4 h-4 transition-transform duration-200 active:scale-125", favoriteTools.includes(tool.id) ? "fill-amber-500 text-amber-500" : "")} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}

                        </div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Feature toggle pills scrollable row */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] select-none flex-nowrap pr-2 max-w-[calc(100vw-180px)] sm:max-w-none">
                {!isStreaming && (
                  <>
                    <WebBuilderPill onActivate={() => { setCodeInterpreter(false); setBrowser(false); }} />
                    {(!isWebBuilderMode || messages.length === 0) && (
                      <>
                        <Pill
                          active={codeInterpreter}
                          onClick={() => {
                            const next = !codeInterpreter;
                            setCodeInterpreter(next);
                            if (next) {
                              setWebBuilderMode(false);
                              setBrowser(false);
                            }
                          }}
                          icon={<Terminal className="h-4 w-4" />}
                          label="Intérprete de código"
                        />
                        <Pill
                          active={browser}
                          onClick={() => {
                            const next = !browser;
                            setBrowser(next);
                            if (next) {
                              setWebBuilderMode(false);
                              setCodeInterpreter(false);
                            }
                          }}
                          icon={<Chrome className="h-4 w-4" />}
                          label="Navegador virtual"
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Build Mode Selector */}
              {isWebBuilderMode && <BuildModeSelector />}

              {/* Inline Model Selector */}
              <ModelSelector
                selectedModelId={selectedModel}
                onModelSelect={(model) => setModel(model.id)}
                variant="inline"
              />

              {/* Primary action button (Microphone when empty/listening, Send when has text) */}
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className="rounded-full h-8 w-8 bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Detener generación"
                >
                  <div className="h-2.5 w-2.5 bg-current rounded-[1px]" />
                </Button>
              ) : (isListening || value.trim() === "") ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={toggleListening}
                  className={cn(
                    "rounded-full h-8 w-8 transition-all cursor-pointer flex items-center justify-center shrink-0",
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse"
                      : "bg-foreground text-background hover:opacity-90"
                  )}
                  aria-label={isListening ? "Detener grabación" : "Dictar mensaje"}
                >
                  {isListening ? (
                    <div className="flex items-center justify-center gap-[2px] h-3.5 w-5 select-none pointer-events-none">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <motion.span
                          key={bar}
                          className="w-[2px] bg-white rounded-full shrink-0"
                          animate={{
                            height: bar === 1 || bar === 5 
                              ? ["4px", "8px", "4px"] 
                              : bar === 2 || bar === 4 
                              ? ["6px", "12px", "6px"] 
                              : ["6px", "15px", "6px"],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: bar * 0.08,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic className="h-4.5 w-4.5" />
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Enviar mensaje"
                  disabled={disabled}
                >
                  <ArrowUp className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </form>
    </div>
  );
}



function Pill({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClick}
          className={cn(
            "rounded-full h-7 px-3 gap-0 transition-colors",
            active ? "!bg-foreground !text-background !border-foreground" : "bg-input/10 dark:bg-input/30",
            disabled ? 'pointer-events-none opacity-50' : ''
          )}
          aria-pressed={active}
          aria-label={label || "Toggle"}
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      {!!label && (
        <TooltipContent side="top" sideOffset={6}>
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

const isCode = (text: string): boolean => {
  if (text.length < 20) return false;
  
  const lines = text.split("\n");
  if (lines.length < 2) {
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html>")) return true;
    return false;
  }

  const indicators = [
    /^\s*(import|export|const|let|var|function|class)\s/m,
    /^\s*(public|private|protected|static|void|int|double|string)\s/m,
    /^\s*(def|class|import|from)\s.*:/m,
    /^\s*<\?php/m,
    /^\s*(using\s+System|namespace|class|public\s+class)/m,
    /^\s*(#include|using\s+namespace|int\s+main)/m,
    /^\s*package\s+main/m,
    /^\s*(select|insert|update|delete)\s+.*\s+from/mi,
    /^\s*<!DOCTYPE html/i,
    /^\s*@import\s+/m,
    /^\s*(interface|type|enum)\s[A-Z]/m,
    /[{}]/m,
  ];

  let matchCount = 0;
  for (const regex of indicators) {
    if (regex.test(text)) {
      matchCount++;
    }
  }

  return matchCount >= 2 || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html>");
};

const detectLanguage = (text: string): string => {
  if (/^\s*<!DOCTYPE html/i.test(text) || /^\s*<html/i.test(text)) return "html";
  if (/^\s*<\?php/i.test(text)) return "php";
  if (/^\s*import\s+.*\s+from\s+['"]/m.test(text) || /const\s+.*\s+=\s+require\(/m.test(text)) return "js";
  if (/^\s*def\s+\w+\(.*\):/m.test(text) || /^\s*import\s+(os|sys|math|pandas|numpy)/m.test(text)) return "py";
  if (/^\s*(public|private|protected)\s+class\s+\w+/m.test(text)) return "java";
  if (/^\s*(#include|using\s+namespace)/m.test(text)) return "cpp";
  if (/^\s*using\s+System/m.test(text)) return "cs";
  if (/^\s*package\s+main/m.test(text)) return "go";
  if (/^\s*(select|insert|update|delete|create)\s+.*\s+from/mi.test(text)) return "sql";
  if (/^\s*@import|body\s*\{|\.\w+\s*\{/m.test(text)) return "css";
  const trimmed = text.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch (_) {}
  }
  return "txt";
};

interface WebBuilderPillProps {
  onActivate?: () => void;
}

function WebBuilderPill({ onActivate }: WebBuilderPillProps) {
  const { isWebBuilderMode, setWebBuilderMode, resetProject } = useWebBuilderStore();
  const messages = useAIChatStore((s) => s.messages);
  const clearMessages = useAIChatStore((s) => s.clearMessages);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const handleToggleBuilder = () => {
    if (!isWebBuilderMode && messages.length > 0) {
      setShowNewChatDialog(true);
    } else {
      const next = !isWebBuilderMode;
      setWebBuilderMode(next);
      if (next) {
        onActivate?.();
      }
    }
  };

  const confirmNewChatBuilder = () => {
    clearMessages();
    resetProject();
    setWebBuilderMode(true);
    onActivate?.();
    setShowNewChatDialog(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleBuilder}
            className={cn(
              "rounded-full h-7 px-3 gap-1.5 transition-all duration-300 shrink-0 cursor-pointer",
              isWebBuilderMode
                ? "bg-black text-white hover:bg-black/95 hover:!text-white dark:bg-white dark:text-black dark:hover:bg-white/95 dark:hover:!text-black font-bold"
                : "bg-input/10 dark:bg-input/30"
            )}
            aria-pressed={isWebBuilderMode}
            aria-label={isWebBuilderMode ? "Desactivar Builder" : "Activar Builder"}
          >
            <Code2 className="h-4 w-4" />
            {isWebBuilderMode && (
              <span className="text-[10px] font-black tracking-wide">
                Builder
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {isWebBuilderMode ? "Desactivar Builder" : "Activar Builder"}
        </TooltipContent>
      </Tooltip>

      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md p-6 rounded-3xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <span className="p-2 bg-violet-500/10 text-violet-500 rounded-xl">🚀</span>
              Iniciar nuevo chat para Builder
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
              Para comenzar a desarrollar aplicaciones o plataformas web con el <strong>Builder</strong>, es necesario iniciar una nueva conversación limpia.
              <br />
              <br />
              ¿Deseas iniciar un nuevo chat y activar el Builder ahora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewChatDialog(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmNewChatBuilder}
              className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:opacity-95"
            >
              Sí, comenzar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


