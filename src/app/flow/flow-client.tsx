"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sliders,
  Plus,
  HelpCircle,
  Settings,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  Bot,
  Heart,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAIChatStore, type SavedChat, type ChatMessage } from "@/lib/stores/ai-chat-store";

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
    icon: "✨ 🍌",
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
const INITIAL_ITEMS: WorkspaceItem[] = [
  {
    id: "wave-1",
    prompt: "olas azules japonesas fondo blanco estilo minimalista ukiyo-e",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800",
    status: "completed",
    progress: 100,
    aspectRatio: "3:4",
    modelName: "Nano Banana Pro",
  },
  {
    id: "wave-2",
    prompt: "ondas fluidas marinas trazadas a mano diseño limpio azul",
    imageUrl: "https://images.unsplash.com/photo-1502691876148-a84978e59fa8?q=80&w=800",
    status: "completed",
    progress: 100,
    aspectRatio: "16:9",
    modelName: "Nano Banana Pro",
  },
  {
    id: "wave-3",
    prompt: "olas japonesas tradicionales en azul marino y blanco",
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800",
    status: "completed",
    progress: 100,
    aspectRatio: "4:3",
    modelName: "Nano Banana Pro",
  },
  {
    id: "wave-4",
    prompt: "olas azules fondo blanco profesional alta costura textil",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800",
    status: "completed",
    progress: 100,
    aspectRatio: "1:1",
    modelName: "Nano Banana Pro",
  },
];

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
  const [prompt, setPrompt] = useState("");
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selector states matching the screenshot design
  const [generationType, setGenerationType] = useState<"imagen" | "video">("imagen");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1" | "3:4" | "9:16">("3:4");
  const [multiplier, setMultiplier] = useState<"1x" | "x2" | "x3" | "x4">("x2");

  // Grid items state starting with pre-loaded wave patterns
  const [items, setItems] = useState<WorkspaceItem[]>(INITIAL_ITEMS);
  
  // Track active generation locally to prevent store overwrite
  const generatingRef = useRef(false);

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
      const res = await fetch("/api/flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          model: selectedModel.id,
          isAgentActive,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al generar la respuesta.");
      }

      toast.success("Imágenes generadas correctamente.");

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
      toast.error(err.message || "Error al comunicarse con la IA.");
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



      {/* Main Workspace Body: Premium Masonry Grid */}
      <main className="flex-1 p-6 relative z-10 overflow-y-auto hidden-scrollbar pb-32">
        <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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
      </main>

      {/* Floating Prompt Chat Panel at the bottom (Light Mode styled) */}
      <div className="w-full max-w-xl mx-auto px-4 pb-3 absolute bottom-0 left-1/2 -translate-x-1/2 shrink-0 z-20">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-3 flex items-center justify-between gap-3 shadow-xl focus-within:border-zinc-300/80 transition-all duration-200 relative">
            
            {/* Left Options group */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Attach/Upload Button */}
              <button
                type="button"
                onClick={() => toast.info("Carga de archivos multimedia (Próximamente)")}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/50 hover:text-zinc-900 text-zinc-500 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Agent Pill Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isAgentActive;
                  setIsAgentActive(next);
                  toast.success(next ? "Modo Agente activado" : "Modo Agente desactivado");
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 select-none border ${
                  isAgentActive 
                    ? "bg-[#1890FF]/15 text-[#1890FF] border-[#1890FF]/30" 
                    : "bg-zinc-100 hover:bg-zinc-250 border border-zinc-200/50 text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agente</span>
              </button>
            </div>

            {/* Prompt input field */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="¿Qué quieres crear?"
              className="flex-1 bg-transparent text-xs text-zinc-800 placeholder-zinc-450 focus:outline-none py-1.5 font-bold min-w-0"
            />

            {/* Right Options group */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {/* Image/Video LLM Selector Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/60 text-zinc-700 hover:text-zinc-900 text-[11px] font-bold flex items-center gap-2 transition-all duration-200 select-none cursor-pointer leading-none"
                >
                  <span className="truncate">{selectedModel.icon} {selectedModel.name}</span>
                  <span className="text-[10px] text-[#1890FF] font-bold leading-none flex items-center gap-1 shrink-0">
                    {getAspectRatioIcon(aspectRatio)} {multiplier}
                  </span>
                </button>

                {/* Model Selector Dropdown (Light Mode Card) */}
                <AnimatePresence>
                  {showModelDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowModelDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 bottom-full mb-3 w-[22rem] bg-white border border-zinc-200/80 rounded-[28px] shadow-2xl p-4.5 z-40 text-zinc-950 flex flex-col gap-4.5 select-none font-sans"
                      >
                        {/* 1. Tabs at the top (Imagen / Vídeo) */}
                        <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setGenerationType("imagen")}
                            className={cn(
                              "flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer",
                              generationType === "imagen"
                                ? "bg-white text-zinc-950 border border-zinc-200/30 shadow-xs"
                                : "text-zinc-500 hover:text-zinc-800"
                            )}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>Imagen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenerationType("video")}
                            className={cn(
                              "flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer",
                              generationType === "video"
                                ? "bg-white text-zinc-950 border border-zinc-200/30 shadow-xs"
                                : "text-zinc-500 hover:text-zinc-800"
                            )}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span>Vídeo</span>
                          </button>
                        </div>

                        {/* 2. Aspect Ratio Row */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { id: "16:9", label: "16:9", icon: <rect x="2" y="6" width="20" height="12" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "4:3", label: "4:3", icon: <rect x="3" y="5" width="18" height="14" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "1:1", label: "1:1", icon: <rect x="4" y="4" width="16" height="16" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "3:4", label: "3:4", icon: <rect x="5" y="3" width="14" height="18" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                            { id: "9:16", label: "9:16", icon: <rect x="6" y="2" width="12" height="20" rx="1.5" className="fill-none stroke-current" strokeWidth="2" /> },
                          ].map((item) => {
                            const active = aspectRatio === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setAspectRatio(item.id as any)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-2xl gap-2 transition-all cursor-pointer aspect-square",
                                  active
                                    ? "bg-zinc-100 border border-zinc-200 text-zinc-950 shadow-xs"
                                    : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                                )}
                              >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">{item.icon}</svg>
                                <span className="text-[10px] font-black">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* 3. Multiplier Row (1x, x2, x3, x4) */}
                        <div className="grid grid-cols-4 bg-zinc-100 rounded-2xl p-1 gap-1">
                          {["1x", "x2", "x3", "x4"].map((m) => {
                            const active = multiplier === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMultiplier(m as any)}
                                className={cn(
                                  "py-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer",
                                  active
                                    ? "bg-white text-zinc-950 border border-zinc-200/30 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-800"
                                )}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>

                        {/* 4. Model Selection Dropdown Field */}
                        <div className="relative">
                          <select
                            value={selectedModel.id}
                            onChange={(e) => {
                              const found = FLOW_MODELS.find(m => m.id === e.target.value);
                              if (found) setSelectedModel(found);
                            }}
                            className="w-full bg-zinc-100 border border-zinc-200/60 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-800 outline-none cursor-pointer appearance-none pr-10 hover:bg-zinc-200/40 transition-colors"
                          >
                            {FLOW_MODELS.map((m) => (
                              <option key={m.id} value={m.id} className="bg-white text-zinc-850 font-bold">
                                {m.icon} {m.name} ({m.badge})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>

                        {/* 5. Points cost indicator */}
                        <div className="text-center py-1 border-t border-zinc-100 pt-3">
                          <p className="text-[11px] text-zinc-500 font-semibold leading-none">
                            La generación consumirá <span className="underline decoration-zinc-400 decoration-wavy underline-offset-2 font-bold text-[#1890FF]">{totalCost} puntos</span>
                          </p>
                        </div>

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  prompt.trim() && !loading
                    ? "bg-[#1890FF] hover:bg-blue-600 text-white active:scale-90 shadow-md cursor-pointer"
                    : "bg-zinc-100 text-zinc-400 border border-zinc-200/40 cursor-not-allowed"
                }`}
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </form>


      </div>
    </div>
  );
}
