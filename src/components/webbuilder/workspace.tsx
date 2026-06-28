"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { PreviewPanel } from "./preview-panel";
import { CommandPalette } from "./command-palette";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Home } from "lucide-react";

interface WebBuilderWorkspaceProps {
  chatPanel: React.ReactNode;
}

export function WebBuilderWorkspace({ chatPanel }: WebBuilderWorkspaceProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { isSplitView, setSplitView, setWebBuilderMode } = useWebBuilderStore();
  const clearMessages = useAIChatStore((s) => s.clearMessages);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const handleBackToHome = () => {
    setWebBuilderMode(false);
    clearMessages();
    window.location.href = "/ai";
  };

  const { files, isAiResponding, syncToCloud, activeProjectId } = useWebBuilderStore();

  // Auto-save logic
  useEffect(() => {
    if (isAiResponding || !activeProjectId) return;
    
    const timeout = setTimeout(() => {
      syncToCloud();
    }, 3000); // Debounce save by 3 seconds

    return () => clearTimeout(timeout);
  }, [files, isAiResponding, activeProjectId, syncToCloud]);

  const [chatPercent, setChatPercent] = useState(34); // Compact chat (34%) by default
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Ref al contenedor raíz del split view. Antes el resizer calculaba el %
  // sobre window.innerWidth, lo que es incorrecto cuando el workspace no ocupa
  // el 100% del viewport (sidebar abierta, padding, móvil). Medir contra el
  // rect real del contenedor hace que el handle no "salte".
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Soporte táctil: tablet/2-en-1 no disparan mousemove. Antes el divisor no
  // se podía arrastrar en esos dispositivos.
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    // Calcula el % del chat relativo al ANCHO REAL del contenedor del split,
    // no al viewport entero. Devuelve null si no hay contenedor medible.
    const computePercent = (clientX: number): number | null => {
      const container = splitContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return null;
      let p = ((clientX - rect.left) / rect.width) * 100;
      if (p < 20) p = 20;
      if (p > 50) p = 50;
      return p;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const p = computePercent(e.clientX);
      if (p != null) setChatPercent(p);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const p = computePercent(e.touches[0].clientX);
      if (p != null) {
        e.preventDefault();
        setChatPercent(p);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  // On mobile, always show tabs instead of split view
  useEffect(() => {
    if (isMobile) {
      setSplitView(false);
    }
  }, [isMobile, setSplitView]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Mobile Tab Bar */}
        <div className="flex border-b border-border/40 bg-background shrink-0 z-20">
          <button
            onClick={() => setMobileTab("chat")}
            className={cn(
              "flex-1 py-3 text-xs font-bold text-center transition-all",
              mobileTab === "chat"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground"
            )}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={cn(
              "flex-1 py-3 text-xs font-bold text-center transition-all",
              mobileTab === "preview"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground"
            )}
          >
            🖥️ Vista Previa
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {mobileTab === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0"
              >
                {chatPanel}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute inset-0"
              >
                <PreviewPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Desktop: Split view
  return (
    <div ref={splitContainerRef} className="flex h-full w-full overflow-hidden bg-background p-2 gap-1">
      {/* Chat Panel - Left side */}
      <div
        className="h-full flex flex-col relative overflow-hidden bg-transparent shrink-0 rounded-2xl"
        style={{ width: isSplitView ? `${chatPercent}%` : "100%" }}
      >
        {/* Floating back button */}
        <button
          onClick={handleBackToHome}
          className="absolute top-4 left-4 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-background/80 hover:bg-background/95 border border-border/50 text-muted-foreground hover:text-foreground shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Volver al inicio"
        >
          <Home className="w-4 h-4" />
        </button>

        {chatPanel}
      </div>

      {/* Drag Resizer Divider Handle */}
      {isSplitView && (
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "w-2 h-full cursor-col-resize z-50 shrink-0 relative transition-colors duration-150 bg-transparent flex items-center justify-center group touch-none select-none"
          )}
        >
          {/* Inner line indicator (only visible on hover/drag) */}
          <div className={cn(
            "w-[3px] h-[40px] rounded-full transition-all duration-300",
            (isDragging || isHovered) ? "bg-primary scale-y-150" : "bg-transparent"
          )} />
        </div>
      )}

      {/* Preview Panel - Right side */}
      {isSplitView && (
        <div
          className="h-full flex flex-col overflow-hidden flex-1"
        >
          <PreviewPanel />
        </div>
      )}

      {/* Command palette global (Cmd+K acciones / Cmd+P archivos) */}
      <CommandPalette />
    </div>
  );
}
