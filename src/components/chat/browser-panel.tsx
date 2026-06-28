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
    <div className="w-full h-full bg-white dark:bg-[#16181A] overflow-hidden flex flex-col relative z-10 font-sans">
      {/* --- CABECERA DEL NAVEGADOR --- */}
      <div className="bg-gray-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-5 border-b border-gray-200/60 dark:border-white/10 shrink-0">

        {/* Controles de Ventana (solo desktop) */}
        <div className="hidden md:flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <button className="p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95 hover:text-gray-700 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
          </button>
          <button className="p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95 hover:text-gray-700 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
          </button>
          <button onClick={clearSession} title="Cerrar Navegador" className="p-2 hover:bg-[#FF5F57]/10 rounded-lg transition-all duration-200 active:scale-95 hover:text-[#FF5F57]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Controles de Navegación (compactos en móvil) */}
        <div className="flex items-center gap-0.5 md:gap-2 text-gray-600 dark:text-gray-400 md:pl-2 md:border-l border-gray-200/60 dark:border-white/10 shrink-0">
          <button className="p-1.5 md:p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <button className="p-1.5 md:p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95 text-gray-400 dark:text-gray-600 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 rotate-180"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <button className="p-1.5 md:p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 md:w-4.5 md:h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>
        </div>

        {/* Barra de Direcciones */}
        <div className="flex-1 min-w-0 max-w-2xl bg-white/80 dark:bg-black/50 rounded-lg flex items-center px-2.5 md:px-4 py-1.5 md:py-2 border border-gray-200/80 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-200 group">
          {/* Icono de Seguridad */}
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 animate-spin mr-2 md:mr-3 shrink-0" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400 mr-2 md:mr-3 group-focus-within:text-blue-500 transition-colors shrink-0">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8zm2 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )}

          <input
            type="text"
            className="bg-transparent border-none text-xs md:text-sm text-gray-700 dark:text-gray-300 flex-1 font-medium focus:outline-none placeholder-gray-400 min-w-0"
            value={currentUrl || "Cargando página..."}
            readOnly
          />
        </div>

        {/* Botón de cerrar en móvil + Iconos de Menú en desktop */}
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 shrink-0">
          {/* Cerrar (móvil) */}
          <button onClick={clearSession} title="Cerrar Navegador" className="md:hidden p-1.5 hover:bg-[#FF5F57]/10 rounded-lg transition-all duration-200 active:scale-95 text-gray-500 dark:text-gray-400 hover:text-[#FF5F57]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          {/* Menú (desktop) */}
          <button className="hidden md:flex p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
          </button>
        </div>
      </div>

      {/* --- VIEWPORT --- */}
      <div className="flex-1 bg-gray-50 dark:bg-[#0A0A0A] flex items-center justify-center relative min-h-0 overflow-hidden">
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
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlNTVjNjgiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 dark:opacity-10"></div>
            <div className="text-center z-10 p-8">
              <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200 dark:border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" className="w-12 h-12 text-gray-400 dark:text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2">Navegador Listo</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">El contenido de la página web se cargará y visualizará en esta área.</p>
              {isLoading && (
                <div className="mt-6 flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- TIMELINE DE PASOS --- */}
      {steps.length > 0 && (
        <div className="border-t border-gray-200/60 dark:border-white/5 bg-white dark:bg-[#0A0A0A] shrink-0 px-3 md:px-4 py-2.5 md:py-4 flex flex-col select-none max-h-20 md:max-h-24">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1.5 shrink-0">
            <Terminal className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" />
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider">Actividad</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-semibold text-gray-700 dark:text-gray-200">
              <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <span className="truncate flex-1 min-w-0">{currentStep?.description}</span>
              {currentStep?.status === "running" ? (
                <span className="text-[8px] md:text-[9px] uppercase font-black text-amber-600 dark:text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">Ejecutando</span>
              ) : currentStep?.status === "done" ? (
                <span className="text-[8px] md:text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">Completado</span>
              ) : (
                <span className="text-[8px] md:text-[9px] uppercase font-black text-red-600 dark:text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full shrink-0">Error</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
