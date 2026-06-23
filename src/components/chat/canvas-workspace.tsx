"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { CanvasPanel } from "./canvas-panel";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface CanvasWorkspaceProps {
  chatPanel: React.ReactNode;
}

export function CanvasWorkspace({ chatPanel }: CanvasWorkspaceProps) {
  const { isMobile } = useSidebar();
  const { isOpen } = useCanvasStore();
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  const [chatPercent, setChatPercent] = useState(38); // Standard width (38%) by default
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      if (containerWidth === 0) return;
      
      let newPercent = (e.clientX / containerWidth) * 100;
      // Constrain chat sidebar between 20% and 55%
      if (newPercent < 20) newPercent = 20;
      if (newPercent > 55) newPercent = 55;
      
      setChatPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Sync mobile tab when canvas is opened/closed
  useEffect(() => {
    if (isOpen) {
      setMobileTab("canvas");
    } else {
      setMobileTab("chat");
    }
  }, [isOpen]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Mobile Tab Bar */}
        {isOpen && (
          <div className="flex border-b border-border/40 bg-[#0A0A0A] shrink-0 z-20">
            <button
              onClick={() => setMobileTab("chat")}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer",
                mobileTab === "chat"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-zinc-450"
              )}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMobileTab("canvas")}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer",
                mobileTab === "canvas"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-zinc-450"
              )}
            >
              📝 Canvas
            </button>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 min-h-0 relative">
          {!isOpen || mobileTab === "chat" ? (
            <div className="absolute inset-0">
              {chatPanel}
            </div>
          ) : (
            <div className="absolute inset-0 p-1.5 bg-[#000]">
              <CanvasPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Split Layout
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0A0A0A] p-2 gap-1">
      {/* Chat Panel - Left side */}
      <div
        className="h-full flex flex-col relative overflow-hidden bg-transparent shrink-0"
        style={{ width: isOpen ? `${chatPercent}%` : "100%" }}
      >
        {chatPanel}
      </div>

      {/* Drag Resizer Divider Handle */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-2 h-full cursor-col-resize z-50 shrink-0 relative transition-colors duration-150 bg-transparent flex items-center justify-center group"
        >
          {/* Inner line indicator */}
          <div className={cn(
            "w-[3px] h-[40px] rounded-full transition-all duration-300",
            (isDragging || isHovered) ? "bg-blue-500 scale-y-150" : "bg-white/10 group-hover:bg-white/20"
          )} />
        </div>
      )}

      {/* Canvas Panel - Right side */}
      {isOpen && (
        <div className="h-full flex flex-col overflow-hidden flex-1">
          <CanvasPanel />
        </div>
      )}
    </div>
  );
}
