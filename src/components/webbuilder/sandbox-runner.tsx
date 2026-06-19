"use client";

import { useState, useEffect, useRef } from "react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { attemptAutoFix } from "@/lib/services/auto-fix-service";
import { WebContainerManager } from "@/lib/services/webcontainer-manager";
import { Loader2 } from "lucide-react";

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
              background: "transparent",
            }}
            allow="cross-origin-isolated; geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted/10 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-semibold">
              {status === "booting" && "Iniciando contenedor..."}
              {status === "installing" && "Instalando dependencias..."}
              {status === "ready" && "Iniciando dev server..."}
              {status === "error" && "Error en el entorno"}
              {(!status || status === "idle") && "Preparando entorno..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
