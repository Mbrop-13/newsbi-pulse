"use client";

import { useRef, useState, useEffect } from "react";
import { useBrowserStore } from "@/lib/stores/browser-store";
import { 
  X, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Lock,
  Loader2,
  Terminal,
  Compass,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BrowserPanel() {
  const { 
    sessionId, 
    currentUrl, 
    pageTitle, 
    screenshot, 
    steps, 
    isLoading, 
    clearSession,
    setLoading
  } = useBrowserStore();

  const imageRef = useRef<HTMLImageElement>(null);
  const mouseDownCoords = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      mouseDownCoords.current = null;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownCoords.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sessionId || isLoading || !screenshot || !mouseDownCoords.current) return;
    
    const deltaX = Math.abs(e.clientX - mouseDownCoords.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownCoords.current.y);
    mouseDownCoords.current = null;
    
    // If mouse moved more than 5px (e.g. dragging or moving cursor), ignore it
    if (deltaX > 5 || deltaY > 5) return;
    
    // Only register primary (left) click
    if (e.button !== 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Scale coordinates back to original browser resolution (1280x800)
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const x = Math.round(clickX * scaleX);
    const y = Math.round(clickY * scaleY);
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/browser/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, x, y }),
      });
      
      const data = await response.json();
      if (!data.success) {
        toast.error("Error al interactuar con el elemento");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) return null;

  const currentStep = steps[steps.length - 1];

  return (
    <div className="h-full w-full bg-white dark:bg-[#0A0A0A] flex flex-col overflow-hidden relative">
      {/* simulated Browser Chrome Header */}
      <div className="px-5 py-3.5 bg-gray-50/50 dark:bg-[#0C0C0C] border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0 select-none gap-4">
        {/* Nav controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-lg mx-auto relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1 text-emerald-500">
            <Lock className="w-3 h-3" />
          </div>
          <div className="w-full h-8 pl-8 pr-8 rounded-lg bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/5 text-xs text-zinc-800 dark:text-gray-300 flex items-center truncate">
            {currentUrl || "Cargando página..."}
          </div>
          {isLoading && (
            <div className="absolute right-3">
              <Loader2 className="w-3.5 h-3.5 text-[#1890FF] animate-spin" />
            </div>
          )}
        </div>

        {/* Close Browser */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[10px] text-zinc-500 dark:text-gray-500 font-bold tracking-wide uppercase truncate max-w-[120px]">
            {pageTitle || "Navegador"}
          </span>
          <button
            onClick={clearSession}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar Navegador"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Browser Viewport Area */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center relative min-h-0 overflow-hidden">
        {screenshot ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={`data:image/jpeg;base64,${screenshot}`}
              alt="Navegador Virtual"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className={cn(
                "w-full h-full object-contain cursor-crosshair transition-all duration-300 selection:bg-transparent select-none",
                isLoading && "brightness-50"
              )}
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 backdrop-blur-[1px] pointer-events-none">
                <Loader2 className="w-8 h-8 text-[#1890FF] animate-spin" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Procesando clic...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg border border-blue-500/10">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">Iniciando Navegador Virtual</h4>
              <p className="text-xs text-gray-400 max-w-[280px]">
                Espere a que el agente conecte con el servicio y cargue la página inicial.
              </p>
            </div>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Steps Logs Timeline */}
      {steps.length > 0 && (
        <div className="border-t border-white/5 bg-[#080808] shrink-0 p-4 flex flex-col select-none max-h-24">
          <div className="flex items-center gap-2 text-gray-400 mb-1.5 shrink-0">
            <Terminal className="w-3.5 h-3.5 text-[#1890FF]" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Actividad del Navegador</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <span className="truncate">{currentStep?.description}</span>
              {currentStep?.status === "running" ? (
                <span className="text-[9px] uppercase font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Ejecutando</span>
              ) : currentStep?.status === "done" ? (
                <span className="text-[9px] uppercase font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Completado</span>
              ) : (
                <span className="text-[9px] uppercase font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">Error</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
