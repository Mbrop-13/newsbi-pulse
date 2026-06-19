"use client";

import { useState, useEffect, useRef } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { attemptAutoFix } from "@/lib/services/auto-fix-service";
import { WebContainerManager } from "@/lib/services/webcontainer-manager";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function SandboxErrorListener() {
  const store = useWebBuilderStore();
  const lastProcessedErrorRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      let errorMessage = "";
      if (e.data?.type === "MAVERLANG_PREVIEW_ERROR") {
        errorMessage = e.data.error || e.data.message;
      } else if (e.data?.type === "MAVERLANG_COMPILE_ERROR") {
        errorMessage = e.data.error;
      } else {
        return;
      }

      if (!errorMessage) return;
      if (store.isAiResponding) return;
      if (errorMessage === lastProcessedErrorRef.current) return;

      // Limit attempts to max 2
      if (store.autoFixAttempts >= 2) {
        console.warn("[Auto-Fix] Max attempts reached. Displaying error.");
        store.failAutoFix(errorMessage);
        return;
      }

      // Debounce: wait 2 seconds after receiving an error before auto-fixing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (store.isAiResponding) return;

        lastProcessedErrorRef.current = errorMessage;
        console.log(`[Auto-Fix] Intercepted error: "${errorMessage}". Attempt #${store.autoFixAttempts + 1}`);
        
        store.startAutoFix();

        attemptAutoFix(errorMessage, store.files)
          .then((fixedFiles) => {
            if (fixedFiles) {
              console.log("[Auto-Fix] Received code fix. Applying updates...");
              const formatted: any = {};
              for (const [path, code] of Object.entries(fixedFiles)) {
                formatted[path] = { code };
              }
              const merged = { ...store.files, ...formatted };
              store.setFiles(merged);
              store.completeAutoFix();
            } else {
              console.warn("[Auto-Fix] Failed to generate code fix.");
              store.failAutoFix(errorMessage);
            }
          })
          .catch((err) => {
            console.error("[Auto-Fix] Error during auto-fix execution:", err);
            store.failAutoFix(errorMessage);
          });
      }, 2000);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [store.autoFixAttempts, store.isAiResponding, store.files, store.startAutoFix, store.setFiles, store.completeAutoFix, store.failAutoFix]);

  if (store.isAutoFixing) {
    return (
      <div className="absolute inset-0 bg-[#0B1329]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white select-none">
        <Loader2 className="w-8 h-8 text-[#1890FF] animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Compilando y optimizando...</p>
        <p className="text-[10px] text-gray-400 mt-1">Reparando detalles automáticamente</p>
      </div>
    );
  }

  return null;
}

export function SandboxRunner() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  useEffect(() => {
    const manager = WebContainerManager.getInstance();
    const unsubscribe = manager.subscribe((newStatus, newUrl) => {
      setStatus(newStatus);
      setPreviewUrl(newUrl);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SandboxErrorListener />
        
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title="Maverlang Preview"
            style={{
              height: "100%",
              width: "100%",
              border: "none",
              background: "white",
            }}
            allow="cross-origin-isolated; geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
          />
        ) : (
          <div className="flex-1 flex flex-col w-full h-full bg-slate-50 dark:bg-[#07090e] relative overflow-hidden select-none">
            {/* Grid pattern with light gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(13,110,253,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,110,253,0.015)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-60 pointer-events-none" />
            
            {/* Ambient glows */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-pulse pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] animate-pulse pointer-events-none" />

            {/* Skeleton mockup background to represent a dashboard loading */}
            <div className="absolute inset-0 p-6 flex flex-col gap-4 opacity-[0.06] pointer-events-none">
              <div className="w-full h-12 bg-zinc-800 rounded-xl" />
              <div className="flex-grow flex gap-4 min-h-0">
                <div className="w-1/4 h-full bg-zinc-800 rounded-xl" />
                <div className="flex-grow flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-zinc-800 rounded-xl" />
                    <div className="h-20 bg-zinc-800 rounded-xl" />
                    <div className="h-20 bg-zinc-800 rounded-xl" />
                  </div>
                  <div className="flex-grow bg-zinc-800 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Floating glass card with details */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
              <div className="w-full max-w-[270px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-gray-100 dark:border-zinc-800/40 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
                <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                  {/* Glowing thin spinning ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                
                <h4 className="text-xs font-bold text-foreground tracking-wide mb-1 uppercase">
                  {status === "booting" && "Iniciando Entorno"}
                  {status === "installing" && "Instalando dependencias"}
                  {status === "ready" && "Iniciando Servidor"}
                  {status === "error" && "Error de Servidor"}
                  {(!status || status === "idle") && "Preparando Sandbox"}
                </h4>
                
                <p className="text-[10px] text-muted-foreground mb-4 leading-normal">
                  {status === "booting" && "Configurando el contenedor virtual en el navegador..."}
                  {status === "installing" && "Descargando e instalando dependencias de Node.js..."}
                  {status === "ready" && "Compilando ficheros y levantando puerto Vite..."}
                  {status === "error" && "Ocurrió un error al iniciar la preview."}
                  {(!status || status === "idle") && "Reservando recursos del sistema..."}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.4)]",
                      status === "error" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                    )}
                    style={{ 
                      width: status === "booting" ? "25%" : status === "installing" ? "65%" : status === "ready" ? "90%" : status === "error" ? "100%" : "15%"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
