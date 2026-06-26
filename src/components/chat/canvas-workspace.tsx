"use client";

import { useState, useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { CanvasPanel } from "./canvas-panel";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface CanvasWorkspaceProps {
  chatPanel: React.ReactNode;
}

export function CanvasWorkspace({ chatPanel }: CanvasWorkspaceProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const { isOpen } = useCanvasStore();
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  const [chatPercent, setChatPercent] = useState(38); // Standard width (38%) by default
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0) return;
      
      let newPercent = ((e.clientX - rect.left) / rect.width) * 100;
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

  // Sync mobile tab and collapse sidebar when canvas is opened/closed
  useEffect(() => {
    if (isOpen) {
      setMobileTab("canvas");
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    } else {
      setMobileTab("chat");
    }
  }, [isOpen, isMobile, setOpen, setOpenMobile]);

  if (!isOpen) {
    return <>{chatPanel}</>;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Mobile Tab Bar */}
        {isOpen && (
          <div className="flex border-b border-sidebar-border dark:border-white/5 bg-background dark:bg-[#0A0A0A] shrink-0 z-20">
            <button
              onClick={() => setMobileTab("chat")}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer",
                mobileTab === "chat"
                  ? "text-zinc-900 dark:text-white border-b-2 border-blue-500"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMobileTab("canvas")}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer",
                mobileTab === "canvas"
                  ? "text-zinc-900 dark:text-white border-b-2 border-blue-500"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              📝 Canvas
            </button>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 min-h-0 relative">
          {!isOpen || mobileTab === "chat" ? (
            <div className="absolute inset-0 bg-background dark:bg-[#0A0A0A]">
              {chatPanel}
            </div>
          ) : (
            <div className="absolute inset-0 p-2 bg-background dark:bg-[#09090b]">
              <CanvasPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Split Layout
  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden bg-[#F8F9FA] dark:bg-[#0A0A0A]">
      {/* Chat Panel - Left side */}
      <div
        className="h-full flex flex-col relative overflow-hidden bg-[#F8F9FA] dark:bg-[#0A0A0A] shrink-0"
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
          className="w-3 mt-8 mb-4 bg-transparent shrink-0 relative flex items-center justify-center cursor-col-resize select-none z-50"
        >
          {/* Central grip handle - only shows 3 dots and only on hover/drag */}
          <div className={cn(
            "flex z-10 justify-center items-center w-6 h-8 transition-all duration-200",
            (isDragging || isHovered) ? "opacity-100 scale-110" : "opacity-0"
          )}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Canvas Panel - Right side: Floating card layout handled by CanvasPanel margins */}
      {isOpen && (
        <div className="h-full flex flex-col overflow-hidden flex-1 bg-[#F8F9FA] dark:bg-[#0A0A0A]">
          <CanvasPanel />
        </div>
      )}
    </div>
  );
}
