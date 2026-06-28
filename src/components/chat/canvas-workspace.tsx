"use client";

import { useState, useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { CanvasPanel } from "./canvas-panel";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full relative overflow-hidden">
        {/* Chat Panel - oculto cuando el canvas está abierto para que no se vea detrás */}
        <div className={cn("flex-1 min-h-0 relative h-full transition-opacity duration-200", isOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
          {chatPanel}
        </div>

        {/* Bottom Sheet for Canvas - se abre de abajo hacia arriba */}
        <Sheet open={isOpen} onOpenChange={(open) => { if (!open) useCanvasStore.getState().closeCanvas(); }}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="!h-[94dvh] w-full p-0 flex flex-col rounded-t-[1.5rem] overflow-hidden border-t border-border bg-white dark:bg-zinc-950 shadow-2xl z-[60] focus:outline-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Grab handle minimalista (sin header duplicado - el CanvasPanel ya tiene su propio header con botón de cerrar) */}
            <div className="flex items-center justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-850 cursor-pointer" />
            </div>

            {/* Canvas Panel content */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              <CanvasPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  if (!isOpen) {
    return <>{chatPanel}</>;
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
