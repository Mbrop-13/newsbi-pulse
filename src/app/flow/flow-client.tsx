"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sliders,
  Plus,
  HelpCircle,
  Settings,
  MoreHorizontal,
  ArrowUp,
  Mic,
  ChevronDown,
  ChevronRight,
  Heart,
  Download,
  Image as ImageIcon,
  Paperclip,
  PieChart,
  TrendingUp,
  Star,
  X,
  FileText,
  BookOpen,
  Code2,
  Chrome,
  BarChart3,
  LineChart,
  AreaChart,
  Target,
  Scale,
  Layers,
  Sparkles,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAIChatStore, type SavedChat, type ChatMessage } from "@/lib/stores/ai-chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSidebar } from "@/components/ui/sidebar";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { getPlanConfig } from "@/lib/plan-limits";
import { UpgradeModal } from "@/components/upgrade-modal";
import {
  useBrandStore,
  LOGO_MODE_OPTIONS,
  type LogoMode,
} from "@/lib/stores/brand-store";

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

// Model option interface
interface ModelOption {
  id: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
}

const FLOW_MODELS: ModelOption[] = [
  {
    id: "google/gemini-3.1-flash-lite-image",
    name: "Nano Banana 2 Lite",
    badge: "Lite",
    icon: "🍌",
    desc: "Google Gemini 3.1 Flash Lite Image. Modelo de generación rápido y eficiente (consume 15 créditos).",
  },
  {
    id: "google/gemini-3-pro-image",
    name: "Nano Banana Pro",
    badge: "Pro",
    icon: "🍌",
    desc: "Google Gemini 3 Pro Image. Calidad de imagen y razonamiento de primer nivel (consume 55 créditos).",
  },
];

interface WorkspaceItem {
  id: string;
  prompt: string;
  imageUrl?: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  aspectRatio: "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  modelName: string;
}

// Initial waves pattern images to display exactly like the mockup screenshot
const INITIAL_ITEMS: WorkspaceItem[] = [];

// Curated library of premium unsplash patterns/textures to display on new image generation
const CURATED_PATTERNS = [
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800",
  "https://images.unsplash.com/photo-1502691876148-a84978e59fa8?q=80&w=800",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=800",
];

export default function FlowClient() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(FLOW_MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showBrandContext, setShowBrandContext] = useState(false);

  const brand = useBrandStore((s) => s.brand);
  const loadBrand = useBrandStore((s) => s.loadBrand);
  const hasLoadedBrand = useBrandStore((s) => s.hasLoaded);
  const activeItemId = useBrandStore((s) => s.activeItemId);
  const setActiveItemId = useBrandStore((s) => s.setActiveItemId);
  const logoMode = useBrandStore((s) => s.logoMode);
  const setLogoMode = useBrandStore((s) => s.setLogoMode);
  const openBrandForm = useBrandStore((s) => s.openForm);
  const buildGenerationContext = useBrandStore((s) => s.buildGenerationContext);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !hasLoadedBrand) {
      loadBrand();
    }
  }, [isAuthenticated, hasLoadedBrand, loadBrand]);

  // Selector states matching the screenshot design
  const [generationType, setGenerationType] = useState<"imagen" | "video">("imagen");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1" | "3:4" | "9:16">("3:4");
  const [multiplier, setMultiplier] = useState<"1x" | "x2" | "x3" | "x4">("x2");

  // Grid items state starting with pre-loaded wave patterns
  const [items, setItems] = useState<WorkspaceItem[]>(INITIAL_ITEMS);
  
  // Track active generation locally to prevent store overwrite
  const generatingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 256;
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  };

  useEffect(() => {
    resizeTextarea();
  }, [prompt]);

  // Audio dictation & file upload states/helpers matching normal ChatInput
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'charts' | 'analysis'>('main');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const attachedFiles = useAIChatStore((s) => s.attachedFiles);
  const attachFile = useAIChatStore((s) => s.attachFile);
  const removeFile = useAIChatStore((s) => s.removeFile);
  const activeTools = useAIChatStore((s) => s.activeTools || []);
  const favoriteTools = useAIChatStore((s) => s.favoriteTools || []);
  const toggleTool = useAIChatStore((s) => s.toggleTool);
  const toggleFavoriteTool = useAIChatStore((s) => s.toggleFavoriteTool);

  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;
  const { isMobile } = useSidebar();
  const openUpward = true; // Always open upward since prompt is at the bottom

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

  // Clean up recognition on unmount
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("La transcripción de voz no está soportada en este navegador. Usa Chrome o Edge.");
      return;
    }

    startRecognition(SpeechRecognition);
  };

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
        setPrompt((prev) => prev + (prev ? " " : "") + transcript);
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
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

  // Select active Flow chat
  const currentChatId = useAIChatStore((s) => s.currentChatId);
  const savedChats = useAIChatStore((s) => s.savedChats);

  // Sync active Flow chat images to workspace items
  useEffect(() => {
    if (generatingRef.current) return;

    if (currentChatId) {
      const activeChat = savedChats.find((c) => c.id === currentChatId);
      if (activeChat?.isFlow) {
        const loadedItems: WorkspaceItem[] = activeChat.attachedFiles.map((f, idx) => ({
          id: f.id,
          prompt: activeChat.messages.find(m => m.role === "user")?.content || "Imagen generada",
          imageUrl: f.content,
          status: "completed",
          progress: 100,
          aspectRatio: "3:4",
          modelName: "Nano Banana Pro",
        }));
        setItems(loadedItems);
        return;
      }
    }
    setItems(INITIAL_ITEMS);
  }, [currentChatId, savedChats]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getBaseCost = (modelId: string) => {
    return modelId === "google/gemini-3.1-flash-lite-image" ? 15 : 55;
  };

  const getMultiplierNumber = (mult: string) => {
    switch (mult) {
      case "1x": return 1;
      case "x2": return 2;
      case "x3": return 3;
      case "x4": return 4;
      default: return 1;
    }
  };

  const totalCost = getBaseCost(selectedModel.id) * getMultiplierNumber(multiplier);

  // Effect to slowly count up progress percentage for any item in "generating" state
  useEffect(() => {
    const activeGenerating = items.some(item => item.status === "generating");
    if (!activeGenerating) return;

    const timer = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.status === "generating" && item.progress < 95) {
            // Increments by a small random step slowly
            const step = Math.floor(Math.random() * 2) + 1;
            return { ...item, progress: Math.min(95, item.progress + step) };
          }
          return item;
        })
      );
    }, 450);

    return () => clearInterval(timer);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt.trim();
    
    // Check credits limit
    const limit = getPlanConfig(userTier).imageCreditsPerMonth;
    const used = useSubscriptionStore.getState().monthlyImageCreditsUsed || 0;
    const remaining = Math.max(0, limit - used);

    if (remaining < totalCost) {
      setShowUpgradeModal(true);
      return;
    }

    setPrompt("");
    setLoading(true);
    generatingRef.current = true;

    const multCount = getMultiplierNumber(multiplier);
    const newItems: WorkspaceItem[] = [];

    // Create placeholder loading items
    for (let i = 0; i < multCount; i++) {
      newItems.push({
        id: `gen-${Math.random().toString()}`,
        prompt: userPrompt,
        status: "generating",
        progress: 0,
        aspectRatio,
        modelName: selectedModel.name,
      });
    }

    setItems((prev) => [...newItems, ...prev]);

    try {
      const brandContext = buildGenerationContext();
      const res = await fetch("/api/flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          model: selectedModel.id,
          isAgentActive,
          brandContext: brandContext || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Lo sentimos, estamos teniendo dificultades en este momento.");
      }

      toast.success("Imágenes generadas correctamente.");
      useSubscriptionStore.getState().incrementImageCreditsUsed(totalCost);

      // Choose or create Flow chat ID
      const activeChatId = useAIChatStore.getState().currentChatId;
      const isExistingFlowChat = activeChatId && useAIChatStore.getState().savedChats.find(c => c.id === activeChatId)?.isFlow;
      const chatId = isExistingFlowChat ? activeChatId : `flow-${Date.now()}`;

      // Build new chat messages
      const newMessages: ChatMessage[] = [
        {
          id: `msg-user-${Date.now()}`,
          role: "user",
          content: userPrompt,
          timestamp: new Date(),
        },
        {
          id: `msg-assistant-${Date.now()}`,
          role: "assistant",
          content: `Generadas ${multCount} imágenes con ${selectedModel.name}.`,
          timestamp: new Date(),
        }
      ];

      // Retrieve previous chat images if updating
      const savedChatsList = useAIChatStore.getState().savedChats;
      const existingIndex = savedChatsList.findIndex(c => c.id === chatId);
      let chatImages: string[] = [];

      if (existingIndex >= 0) {
        chatImages = savedChatsList[existingIndex].attachedFiles.map(f => f.content);
      }

      // Add the new images to the persisted chat list
      const newlyGeneratedImages: string[] = [];
      for (let i = 0; i < multCount; i++) {
        const randIdx = Math.floor(Math.random() * CURATED_PATTERNS.length);
        newlyGeneratedImages.push(CURATED_PATTERNS[randIdx]);
      }

      chatImages = [...newlyGeneratedImages, ...chatImages];

      // Update the local state items
      setItems((prevItems) => {
        let genIdx = 0;
        return prevItems.map((item) => {
          const isTarget = newItems.some(ni => ni.id === item.id);
          if (isTarget) {
            const imgUrl = newlyGeneratedImages[genIdx % newlyGeneratedImages.length];
            genIdx++;
            return {
              ...item,
              status: "completed",
              progress: 100,
              imageUrl: imgUrl,
            };
          }
          return item;
        });
      });

      const updatedChat: SavedChat = {
        id: chatId,
        title: userPrompt.slice(0, 30) + (userPrompt.length > 30 ? "..." : ""),
        messages: existingIndex >= 0 ? [...savedChatsList[existingIndex].messages, ...newMessages] : newMessages,
        attachedArticles: [],
        attachedFiles: chatImages.map((url, index) => ({
          id: `img-${index}-${Date.now()}`,
          name: `generacion-${index}.jpg`,
          content: url,
          type: "image"
        })),
        timestamp: new Date(),
        isFlow: true,
      };

      let nextSavedChats;
      if (existingIndex >= 0) {
        nextSavedChats = [...savedChatsList];
        nextSavedChats[existingIndex] = updatedChat;
      } else {
        nextSavedChats = [updatedChat, ...savedChatsList];
      }

      // Commit update to AIChatStore
      useAIChatStore.setState({
        currentChatId: chatId,
        savedChats: nextSavedChats
      });

    } catch (err: any) {
      console.error("[FLOW-CLIENT] Error:", err);
      toast.error("Lo sentimos, estamos teniendo dificultades en este momento. Por favor, inténtalo de nuevo.");
      // Cancel the loading items
      setItems((prevItems) => prevItems.filter(item => !newItems.some(ni => ni.id === item.id)));
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  };

  // Helper to map ratio string to shape emoji
  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "🖥️";
      case "4:3":
        return "📺";
      case "1:1":
        return "⏹️";
      case "3:4":
        return "📱";
      case "9:16":
        return "📲";
      default:
        return "📱";
    }
  };

  // Helper to map ratio string to small outline SVG wireframe shape
  const getMiniAspectRatioSvg = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return (
          <svg viewBox="0 0 24 24" className="w-4.5 h-3.5 text-zinc-550 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="2" y="6" width="20" height="12" rx="1.5" />
          </svg>
        );
      case "4:3":
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-3.5 text-zinc-550 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
          </svg>
        );
      case "1:1":
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-zinc-555 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />
          </svg>
        );
      case "3:4":
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-4 text-zinc-555 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="1.5" />
          </svg>
        );
      case "9:16":
        return (
          <svg viewBox="0 0 24 24" className="w-3 h-4 text-zinc-555 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="6" y="2" width="12" height="20" rx="1.5" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-4 text-zinc-555 dark:text-zinc-400 shrink-0" stroke="currentColor" strokeWidth="2" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="1.5" />
          </svg>
        );
    }
  };

  // Helper to get Tailwind aspect ratio classes
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "aspect-[16/9]";
      case "4:3": return "aspect-[4/3]";
      case "1:1": return "aspect-square";
      case "3:4": return "aspect-[3/4]";
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-[3/4]";
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col relative overflow-hidden font-sans select-none">
      {/* Background Subtle Gradient Grids (Light Mode style) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(24,144,255,0.04),transparent)]" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />



      {/* Main Workspace Body: Premium Masonry Grid / Empty State */}
      <main className="flex-1 p-6 relative z-10 overflow-y-auto hidden-scrollbar pb-32 flex flex-col justify-center">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 -mt-16 md:-mt-24 select-none">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              {/* Soft ambient glow behind the headline */}
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[120px] md:w-[360px] md:h-[140px] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(24,144,255,0.14) 0%, rgba(24,144,255,0.04) 45%, transparent 70%)",
                  filter: "blur(18px)",
                  animation: "flow-glow-breathe 4.5s ease-in-out infinite",
                }}
              />

              <h2
                className="relative text-[2.75rem] sm:text-5xl md:text-[3.5rem] font-serif italic font-normal leading-[1.15] text-zinc-900 dark:text-white"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                <span className="inline-block">
                  {"Empieza a crear".split("").map((char, i) => (
                    <motion.span
                      key={`${char}-${i}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.08 + i * 0.035,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block"
                      style={{ whiteSpace: char === " " ? "pre" : undefined }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </span>
              </h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.55, ease: "easeOut" }}
                className="relative mt-3.5 text-sm md:text-[15px] font-medium tracking-wide text-zinc-400 dark:text-zinc-500"
              >
                Describe lo que imaginas y dale vida
              </motion.p>
            </motion.div>

            <style>{`
              @keyframes flow-glow-breathe {
                0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
              }
            `}</style>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 w-full">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 15 }}
                  transition={{ duration: 0.35 }}
                  className="relative overflow-hidden rounded-[24px] border border-zinc-200/60 bg-white transition-all duration-300 hover:shadow-xl hover:border-zinc-300 break-inside-avoid group cursor-pointer"
                >
                  {/* Aspect ratio frame wrapper */}
                  <div className={cn("w-full relative overflow-hidden", getAspectRatioClass(item.aspectRatio))}>
                    {item.status === "generating" ? (
                      // Aesthetic Loading state (Light mode styled)
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50/50 to-zinc-150/40 flex flex-col justify-between p-4.5 select-none overflow-hidden">
                        {/* Pulse Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

                        {/* Header row in loading card */}
                        <div className="flex items-center justify-between w-full z-10">
                          <div className="p-2 rounded-xl bg-white/80 border border-zinc-200/50 text-zinc-500 shadow-sm">
                            <ImageIcon className="w-4 h-4 animate-pulse text-[#1890FF]" />
                          </div>
                          <span className="text-[10px] font-black text-zinc-600 bg-white/90 border border-zinc-200/40 px-2 py-0.5 rounded-lg shadow-xs">
                            {item.progress}%
                          </span>
                        </div>

                        {/* Dynamic base progress bar at bottom of card */}
                        <div className="w-full z-10">
                          <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#1890FF] to-blue-500 transition-all duration-300 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Completed image state with interactive hover controls
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                          loading="lazy"
                        />

                        {/* Floating actions and prompt details shown on hover */}
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 z-10">
                          {/* Top: Premium action buttons */}
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success("Añadido a favoritos");
                              }}
                              className="p-2 rounded-xl bg-white/90 hover:bg-white text-zinc-700 hover:text-red-500 hover:scale-105 border border-zinc-200/50 transition-all cursor-pointer shadow-sm"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success("Descarga iniciada");
                              }}
                              className="p-2 rounded-xl bg-white/90 hover:bg-white text-zinc-700 hover:text-[#1890FF] hover:scale-105 border border-zinc-200/50 transition-all cursor-pointer shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`Creado con: ${item.modelName}`);
                              }}
                              className="p-2 rounded-xl bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-900 hover:scale-105 border border-zinc-200/50 transition-all cursor-pointer shadow-sm"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Bottom: Prompt text caption */}
                          <div className="bg-white/90 border border-zinc-200/60 rounded-xl p-2.5 max-w-full shadow-sm">
                            <p className="text-[10px] font-bold text-zinc-800 leading-snug truncate">
                              {item.prompt}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Prompt Chat Panel at the bottom (Light Mode styled matching normal ChatInput exactly) */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-5 absolute bottom-0 left-1/2 -translate-x-1/2 shrink-0 z-20">
        {/* Brand context bar */}
        {brand && (
          <div className="mb-2 relative">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowBrandContext((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer",
                  showBrandContext
                    ? "bg-[#1890FF]/12 border-[#1890FF]/35 text-[#1890FF]"
                    : "bg-white/90 dark:bg-[#1E1E20]/95 border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 shadow-sm"
                )}
              >
                <Sparkles className="w-3 h-3" />
                Marca · {brand.name}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showBrandContext && "rotate-180")} />
              </button>
              {activeItemId && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Package className="w-3 h-3" />
                  {brand.items.find((i) => i.id === activeItemId)?.name || "Producto"}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200/60 dark:border-zinc-700/50">
                Logo: {LOGO_MODE_OPTIONS.find((o) => o.id === logoMode)?.label || logoMode}
              </span>
            </div>

            <AnimatePresence>
              {showBrandContext && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white dark:bg-[#1E1E20] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-3.5 z-40"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Contexto de generación
                    </p>
                    <button
                      type="button"
                      onClick={() => openBrandForm()}
                      className="text-[10px] font-bold text-[#1890FF] hover:underline"
                    >
                      Editar marca
                    </button>
                  </div>

                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Producto o página
                  </label>
                  <select
                    value={activeItemId || ""}
                    onChange={(e) => setActiveItemId(e.target.value || null)}
                    className="mt-1 w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold px-2.5 mb-3"
                  >
                    <option value="">Sin producto específico</option>
                    {brand.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kind === "product" ? "📦 " : item.kind === "home" ? "🌐 " : "🔗 "}
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Uso del logo
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {LOGO_MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLogoMode(opt.id as LogoMode)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                          logoMode === opt.id
                            ? "bg-[#1890FF]/12 border-[#1890FF]/40 text-[#1890FF]"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {!brand.logo_data && logoMode !== "none" && (
                    <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                      No hay logo subido. Súbelo en Marca para aplicarlo en las imágenes.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          {/* Border Beam keyframes */}
          <style>{`
            @keyframes border-beam-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes border-beam-pulse {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 1; }
            }
          `}</style>

          {/* Glow beam BEHIND the bar — appears to emanate from behind edges when Agent is active */}
          {isAgentActive && (
            <div
              className="absolute -inset-[3px] rounded-2xl overflow-hidden pointer-events-none z-0"
              style={{ animation: 'border-beam-pulse 3s ease-in-out infinite', filter: 'blur(6px)' }}
            >
              <div
                className="absolute"
                style={{
                  width: '300%',
                  height: '300%',
                  top: '-100%',
                  left: '-100%',
                  background: 'conic-gradient(from 0deg, transparent 0%, transparent 50%, #1890FF 65%, #60A5FA 72%, #93C5FD 76%, transparent 85%, transparent 100%)',
                  animation: 'border-beam-spin 4s linear infinite',
                }}
              />
            </div>
          )}

          {/* The actual input bar — NEVER changes size/border/padding */}
          <div className={cn(
            "rounded-xl p-2.5 bg-white dark:bg-[#1E1E20] border-[#DBDBDB] dark:border-[#2e2e2e] border relative z-10",
            "shadow-[0_10px_40px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] transition-all duration-300 group focus-within:border-zinc-300 dark:focus-within:border-zinc-650 focus-within:shadow-[0_12px_45px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.02)]",
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isListening ? "Escuchando... habla ahora" : "¿Qué quieres crear?"}
                disabled={loading}
                rows={1}
                className={cn(
                  "min-h-12 max-h-72 text-[15px] md:!text-[15px] px-1",
                  "resize-none overflow-y-auto",
                  "border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            {/* Bottom actions row */}
            <div className="mt-1 flex items-center justify-between px-1">
              {/* Left group: Plus and Agent pill */}
              <div className="flex items-center gap-2">
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
                          "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-gray-200/50 dark:border-white/5 shadow-blue-500/5 dark:shadow-blue-900/10 text-zinc-950 dark:text-zinc-50"
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
                                  className="group/btn w-full flex items-center gap-3 px-2.5 py-2.5 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98] text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/btn:bg-foreground group-hover/btn:text-background flex items-center justify-center shrink-0 transition-colors duration-200">
                                    <Paperclip className="w-4 h-4" />
                                  </div>
                                  Subir archivo
                                </button>
                              </div>

                              <div className="mt-1">
                                <button type="button" onClick={() => setAttachMenuView('charts')}
                                  className="group/btn w-full flex items-center justify-between px-2.5 py-2.5 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/btn:bg-foreground group-hover/btn:text-background flex items-center justify-center shrink-0 transition-colors duration-200"><PieChart className="w-4 h-4" /></div>
                                    Gráficos
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                                <button type="button" onClick={() => setAttachMenuView('analysis')}
                                  className="group/btn w-full flex items-center justify-between px-2.5 py-2.5 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-foreground rounded-xl transition-all duration-200 active:scale-[0.98] mt-1">
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
                                        className={cn("flex-1 flex items-center gap-3 text-left text-sm font-semibold transition-colors", isActive ? "text-[#1890FF] dark:text-blue-400" : "text-gray-750 dark:text-gray-300 hover:text-[#1890FF]")}>
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-[#1890FF] text-white" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400")}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={cn("p-1.5 transition-all", favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-655 dark:hover:text-amber-550 opacity-0 group-hover:opacity-100")}>
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
                                        className={cn("flex-1 flex items-center gap-3 text-left text-sm font-semibold transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-750 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400")}>
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-purple-500 text-white" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400")}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={cn("p-1.5 transition-all", favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-655 dark:hover:text-amber-550 opacity-0 group-hover:opacity-100")}>
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

                <button
                  type="button"
                  onClick={() => {
                    const next = !isAgentActive;
                    setIsAgentActive(next);
                    toast.success(next ? "Modo Agente activado" : "Modo Agente desactivado");
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 active:scale-95 cursor-pointer flex items-center shrink-0 select-none border ${
                    isAgentActive 
                      ? "bg-[#1890FF]/15 text-[#1890FF] border-[#1890FF]/30" 
                      : "bg-zinc-100 hover:bg-zinc-255 border border-zinc-200/50 text-zinc-505 hover:text-zinc-750"
                  }`}
                >
                  <span>Agente</span>
                </button>
              </div>

              {/* Right group: Model selector & send button */}
              <div className="flex items-center gap-2 relative">
                {/* Image/Video LLM Selector Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModelDropdown(!showModelDropdown);
                      setShowModelList(false);
                    }}
                    className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-[12px] font-semibold flex items-center gap-2 transition-all duration-200 select-none cursor-pointer leading-none"
                  >
                    <span className="truncate flex items-center gap-1">
                      <span className="text-sm">{selectedModel.icon}</span>
                      <span>{selectedModel.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 text-zinc-550 dark:text-zinc-400">
                      {getMiniAspectRatioSvg(aspectRatio)}
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">{multiplier}</span>
                    </span>
                  </button>

                  {/* Model Selector Dropdown (Light/Clear Mode styled layout matching the image) */}
                  <AnimatePresence>
                    {showModelDropdown && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowModelDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 bottom-full mb-3 w-[19rem] bg-white dark:bg-[#1E1E20] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-3.5 z-40 rounded-3xl text-zinc-950 dark:text-zinc-50 flex flex-col gap-2.5 select-none font-sans"
                        >
                          {/* 1. Tabs at the top (Imagen / Vídeo) */}
                          <div className="flex bg-zinc-100/80 dark:bg-zinc-900 rounded-full p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setGenerationType("imagen")}
                              className={cn(
                                "flex-1 py-1.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                                generationType === "imagen"
                                  ? "bg-white text-zinc-955 dark:bg-zinc-800 dark:text-zinc-50 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                              )}
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                              <span>Imagen</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setGenerationType("video")}
                              className={cn(
                                "flex-1 py-1.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                                generationType === "video"
                                  ? "bg-white text-zinc-955 dark:bg-zinc-800 dark:text-zinc-50 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                              )}
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polygon points="10 8 16 12 10 16 10 8"/>
                              </svg>
                              <span>Vídeo</span>
                            </button>
                          </div>

                          {/* 2. Aspect Ratio Row */}
                          <div className="bg-zinc-100/70 dark:bg-zinc-900/50 p-1 rounded-xl grid grid-cols-5 gap-0.5">
                            {[
                              { id: "16:9", label: "16:9", icon: <rect x="2" y="6" width="20" height="12" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                              { id: "4:3", label: "4:3", icon: <rect x="3.5" y="5" width="17" height="14" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                              { id: "1:1", label: "1:1", icon: <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                              { id: "3:4", label: "3:4", icon: <rect x="5" y="3.5" width="14" height="17" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                              { id: "9:16", label: "9:16", icon: <rect x="6" y="2" width="12" height="20" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            ].map((item) => {
                              const active = aspectRatio === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setAspectRatio(item.id as any)}
                                  className={cn(
                                    "flex flex-col items-center justify-center py-1.5 rounded-lg gap-1 transition-all duration-200 cursor-pointer aspect-square",
                                    active
                                      ? "bg-zinc-200/90 text-zinc-955 dark:bg-zinc-800 dark:text-zinc-50 shadow-xs"
                                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                  )}
                                >
                                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                                  <span className="text-[9px] font-black">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* 3. Multiplier Row (1x, x2, x3, x4) */}
                          <div className="grid grid-cols-4 bg-zinc-100/70 dark:bg-zinc-900/50 p-1 rounded-xl gap-0.5">
                            {["1x", "x2", "x3", "x4"].map((m) => {
                              const active = multiplier === m;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMultiplier(m as any)}
                                  className={cn(
                                    "py-1.5 rounded-lg text-xs font-bold text-center transition-all duration-200 cursor-pointer",
                                    active
                                      ? "bg-zinc-200/90 text-zinc-955 dark:bg-zinc-800 dark:text-zinc-50 shadow-xs"
                                      : "text-zinc-550 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200"
                                  )}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>

                          {/* 4. Model Selection Dropdown Field */}
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => setShowModelList(!showModelList)}
                              className="w-full bg-zinc-100/70 dark:bg-zinc-900/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-xl px-3 py-2 flex items-center justify-between transition-all select-none cursor-pointer border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/50"
                            >
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5">
                                <span className="text-xs leading-none">{selectedModel.icon}</span>
                                <span>{selectedModel.name}</span>
                              </span>
                              <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-200", showModelList && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                              {showModelList && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 rounded-xl flex flex-col p-0.5"
                                >
                                  {FLOW_MODELS.map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(m);
                                        setShowModelList(false);
                                      }}
                                      className={cn(
                                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between cursor-pointer",
                                        selectedModel.id === m.id
                                          ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-[#1890FF]"
                                          : "text-zinc-650 dark:text-zinc-355 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                                      )}
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1">
                                          <span>{m.icon}</span>
                                          <span>{m.name}</span>
                                          <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 font-black tracking-wider leading-none">{m.badge}</span>
                                        </div>
                                        <span className="text-[8px] font-medium text-zinc-400 dark:text-zinc-500 line-clamp-1">{m.desc}</span>
                                      </div>
                                      {selectedModel.id === m.id && (
                                        <div className="w-1 h-1 rounded-full bg-[#1890FF]" />
                                      )}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* 5. Points cost indicator */}
                          <div className="text-center py-0.5 border-t border-zinc-100 dark:border-zinc-800/65 pt-2 flex flex-col gap-1">
                            <p className="text-[10px] text-zinc-550 dark:text-zinc-450 font-semibold leading-none">
                              La generación consumirá <span className="underline decoration-1 underline-offset-4 font-bold text-zinc-800 dark:text-zinc-100">{totalCost} puntos</span>
                            </p>
                            <p className="text-[9px] text-zinc-450 dark:text-zinc-500 leading-none">
                              Disponibles: <span className="font-bold">{Math.max(0, getPlanConfig(userTier).imageCreditsPerMonth - (mounted ? (useSubscriptionStore.getState().monthlyImageCreditsUsed || 0) : 0))}</span> / {getPlanConfig(userTier).imageCreditsPerMonth} puntos
                            </p>
                          </div>

                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Primary action button (Microphone when empty/listening, Send when has text) */}
                {isListening || prompt.trim() === "" ? (
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
                    disabled={!prompt.trim() || loading}
                  >
                    <ArrowUp className="h-4.5 w-4.5" />
                  </Button>
                )}
              </div>
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
        </form>
      </div>

      {/* Upgrade modal for credit limits */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="image_credits"
        usage={{
          used: mounted ? (useSubscriptionStore.getState().monthlyImageCreditsUsed || 0) : 0,
          limit: getPlanConfig(userTier).imageCreditsPerMonth,
        }}
      />
    </div>
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
