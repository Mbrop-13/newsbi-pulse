"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { PreviewPanel } from "./preview-panel";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Home } from "lucide-react";

interface WebBuilderWorkspaceProps {
  chatPanel: React.ReactNode;
}

export function WebBuilderWorkspace({ chatPanel }: WebBuilderWorkspaceProps) {
  const { isMobile } = useSidebar();
  const { isSplitView, setSplitView, setWebBuilderMode } = useWebBuilderStore();
  const clearMessages = useAIChatStore((s) => s.clearMessages);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const handleBackToHome = () => {
    setWebBuilderMode(false);
    clearMessages();
  };

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
    <div className="flex h-full w-full">
      {/* Chat Panel - Left side */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: isSplitView ? "35%" : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="h-full min-w-[320px] flex flex-col border-r border-border/20 relative overflow-hidden bg-background"
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
      </motion.div>

      {/* Preview Panel - Right side */}
      <AnimatePresence>
        {isSplitView && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "65%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="h-full flex flex-col overflow-hidden bg-background"
          >
            <PreviewPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
