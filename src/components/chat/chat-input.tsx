"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { ModelSelector } from "@/components/chat/model-selector";
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
  TrendingUp,
  Scale,
  Layers,
  FileText,
  BookOpen,
  Chrome,
  Paperclip,
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
  placeholder = "Envía un mensaje",
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
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'charts' | 'analysis'>('main');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

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
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("La transcripción de voz no está soportada en este navegador.");
        return;
      }
      
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "es-ES";
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setValue(prev => prev + (prev ? " " : "") + transcript);
      };
      
      rec.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
      rec.start();
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
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedFiles.length >= MAX_FILES) {
      alert(`Has alcanzado el límite de ${MAX_FILES} archivos para tu plan.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        attachFile({
          id: Date.now().toString(),
          name: file.name,
          content: content.slice(0, 15000),
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("bg-background", "mx-4")}>
      <form
        onSubmit={handleSubmit}
        className={cn("max-w-6xl px-0 pb-0 md:pb-4 mx-auto inset-x-0 pt-0 relative", className)}
      >
        {/* Active Tool Pills & Attachments */}
        {(activeTools.length > 0 || attachedFiles.length > 0 || attachedArticles.length > 0) && (
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

            {/* Attached Files */}
            {attachedFiles.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-green-55 dark:bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-green-500" />
                </div>
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="ml-1 text-gray-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}

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
          "rounded-3xl bg-secondary dark:bg-secondary p-2 shadow-md border transition-all duration-300",
          isListening && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
        )}>
          {/* Textarea area */}
          <div className="flex items-center px-2 bg-transparent relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onInput={() => resizeTextarea()}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Escuchando... habla ahora" : placeholder}
              disabled={Boolean(disabled && !isStreaming)}
              id="chat-input"
              name="input"
              rows={1}
              className={cn(
                "min-h-12 max-h-72 resize-none overflow-y-auto",
                "border-0 bg-secondary dark:bg-secondary shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1",
                "text-[16px] md:text-[16px]"
              )}
            />
          </div>

          {/* Bottom bar with pills and send button */}
          <div className="mt-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {/* Attachments menu */}
              <div className="relative shrink-0">
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
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => { setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} />
                      <motion.div
                        initial={{ opacity: 0, y: isNewChat ? -10 : 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: isNewChat ? -10 : 10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={cn(
                          "absolute left-0 z-40 w-64 flex flex-col max-h-[350px] overflow-hidden rounded-2xl border shadow-2xl",
                          isNewChat ? "top-12" : "bottom-12",
                          "bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-xl border-gray-200/50 dark:border-white/5 shadow-blue-500/5 dark:shadow-blue-900/10"
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
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Feature toggle pills */}
              <Pill
                active={webSearch}
                onClick={() => setWebSearch(prev => !prev)}
                icon={<Globe className="h-4 w-4" />}
                label="Búsqueda web"
              />
              <Pill
                active={image}
                onClick={() => setImage(prev => !prev)}
                icon={<ImageIcon className="h-4 w-4" />}
                label="Generar imagen"
              />
              <Pill
                active={codeInterpreter}
                onClick={() => setCodeInterpreter(prev => !prev)}
                icon={<Terminal className="h-4 w-4" />}
                label="Intérprete de código"
              />
              <Pill
                active={browser}
                onClick={() => setBrowser(prev => !prev)}
                icon={<Chrome className="h-4 w-4" />}
                label="Navegador virtual"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Inline Model Selector */}
              <ModelSelector
                selectedModelId={selectedModel}
                onModelSelect={(model) => setModel(model.id)}
                variant="inline"
              />

              {/* Microphone / Transcribe Button & Equalizer */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isListening && (
                  <div className="flex items-end gap-[3px] h-5 px-1 shrink-0 pb-0.5">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <motion.span
                        key={bar}
                        className="w-[3px] bg-red-500 rounded-full"
                        animate={{
                          height: ["6px", "18px", "6px"],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: bar * 0.12,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleListening}
                      className={cn(
                        "rounded-full h-8 w-8 text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center",
                        isListening && "text-red-500 hover:text-red-650 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.25)] animate-pulse"
                      )}
                      aria-label={isListening ? "Detener grabación" : "Transcribir voz"}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {isListening ? "Deteniendo..." : "Dictar mensaje"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Primary action button */}
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className={cn(
                    "rounded-full h-8 w-8 bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
                  )}
                  aria-label="Detener generación"
                >
                  <div className="h-2.5 w-2.5 bg-current rounded-[1px]" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "rounded-full h-8 w-8 bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
                  )}
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
