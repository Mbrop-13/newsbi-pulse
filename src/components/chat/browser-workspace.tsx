"use client";

import { useState, useEffect } from "react";
import { useBrowserStore } from "@/lib/stores/browser-store";
import { BrowserPanel } from "./browser-panel";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface BrowserWorkspaceProps {
  chatPanel: React.ReactNode;
}

export function BrowserWorkspace({ chatPanel }: BrowserWorkspaceProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const { isOpen } = useBrowserStore();

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

  // Collapse sidebar when browser workspace opens
  useEffect(() => {
    if (isOpen) {
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    }
  }, [isOpen, isMobile, setOpen, setOpenMobile]);

  if (!isOpen) {
    return <>{chatPanel}</>;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full relative overflow-hidden">
        {/* Chat Panel - oculto cuando el navegador está abierto para que no se vea detrás */}
        <div className={cn("flex-1 min-h-0 relative h-full transition-opacity duration-200", isOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
          {chatPanel}
        </div>

        {/* Bottom Sheet para el Navegador/Build - se abre de abajo hacia arriba (mismo patrón que el Canvas) */}
        <Sheet open={isOpen} onOpenChange={(open) => { if (!open) useBrowserStore.getState().setOpen(false); }}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="!h-[94dvh] w-full p-0 flex flex-col rounded-t-[1.5rem] overflow-hidden border-t border-border bg-white dark:bg-zinc-950 shadow-2xl z-[60] focus:outline-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Grab handle minimalista (sin header duplicado - el BrowserPanel ya tiene su propia cabecera con botón de cerrar) */}
            <div className="flex items-center justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-850 cursor-pointer" />
            </div>

            {/* Browser Panel content */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              <BrowserPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop Split Layout
  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#0A0A0A]">
      {/* Chat Panel - Left side */}
      <div
        className="h-full flex flex-col relative overflow-hidden bg-white dark:bg-[#0A0A0A] shrink-0"
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
          className={cn(
            "w-1.5 h-full cursor-col-resize z-50 shrink-0 relative transition-colors duration-150 flex items-center justify-center",
            (isDragging || isHovered) ? "bg-gray-150 dark:bg-white/5" : "bg-transparent"
          )}
        >
          {/* Inner line indicator */}
          <div className={cn(
            "w-[2px] h-[30px] rounded-full transition-all duration-300",
            (isDragging || isHovered) ? "bg-blue-500 scale-y-150" : "bg-transparent"
          )} />
        </div>
      )}

      {/* Browser Panel - Right side */}
      {isOpen && (
        <div className="h-full flex flex-col overflow-hidden flex-1 bg-white dark:bg-[#0A0A0A]">
          <BrowserPanel />
        </div>
      )}
    </div>
  );
}
