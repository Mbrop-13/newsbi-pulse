"use client";

import { useEffect, useRef } from "react";
import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { useWebBuilderStore, djb2Hash, hashFiles } from "@/lib/stores/webbuilder-store";
import { attemptAutoFix } from "@/lib/services/auto-fix-service";
import { Loader2 } from "lucide-react";

/**
 * Muestra el estado de "reparando automáticamente" cuando el auto-fix está
 * corriendo. Se mantiene como overlay sobre la preview.
 */
function AutoFixOverlay() {
  const isAutoFixing = useWebBuilderStore((s) => s.isAutoFixing);
  if (!isAutoFixing) return null;
  return (
    <div className="absolute inset-0 bg-[#0B1329]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white select-none">
      <Loader2 className="w-8 h-8 text-[#1890FF] animate-spin mb-4" />
      <p className="text-sm font-semibold tracking-wide">Compilando y optimizando...</p>
      <p className="text-[10px] text-gray-400 mt-1">Reparando detalles automáticamente</p>
    </div>
  );
}

/**
 * Escucha los mensajes del bundler de Sandpack para detectar errores de
 * compilación y disparar el auto-fix.
 *
 * Reemplaza al SandboxErrorListener antiguo que usaba postMessage del
 * WebContainer. Sandpack expone `listen` que emite mensajes del bundler con
 * el tipo de evento y los errores de compilación en `payload`.
 */
function SandpackErrorListener() {
  const { listen } = useSandpack();
  const lastProcessedErrorRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = listen((message) => {
      // Sandpack emite mensajes del bundler. Nos interesan los errores.
      // - message.type === "done" con payload compilado con errores
      // - Algunas versiones emiten "action" con errores de runtime
      let errorMessage = "";

      if (message.type === "done") {
        // message.code puede ser 0 (ok) o 1 (error de compilación)
        if ((message as any).compileError) {
          const ce = (message as any).compileError;
          errorMessage = Array.isArray(ce) ? ce.join("\n") : String(ce);
        }
      } else if ((message as any).type === "error" && (message as any).error) {
        // Errores de ejecución (runtime errors)
        const errObj = (message as any).error;
        errorMessage = errObj.message || String(errObj);
      } else if (message.type === "action") {
        // Errores en runtime (uncaught errors dentro del iframe)
        if ((message as any).action === "show-error") {
          const args = (message as any).args;
          if (args && typeof args === "object") {
            errorMessage = args.message || String(args);
          }
        }
      }

      if (!errorMessage) return;

      const store = useWebBuilderStore.getState();
      if (store.isAiResponding) return;
      if (errorMessage === lastProcessedErrorRef.current) return;

      // Limitar a 2 intentos de auto-fix.
      if (store.autoFixAttempts >= 2) {
        console.warn("[Auto-Fix] Máximo de intentos alcanzado.");
        store.failAutoFix(errorMessage);
        return;
      }

      // Debounce de 2s para no disparar en cada recompilación intermedia.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const currentStore = useWebBuilderStore.getState();
        if (currentStore.isAiResponding) return;

        // Guardia anti-bucle: si ya aplicamos un fix para este (error + snapshot)
        // de archivos, el fix anterior no funcionó y el error reapareció. Abortar
        // en lugar de entrar en un bucle error → fix → mismo error → mismo fix.
        const errHash = djb2Hash(errorMessage);
        const filesHash = hashFiles(currentStore.files);
        if (currentStore.isRepeatingFix(errHash, filesHash)) {
          console.warn("[Auto-Fix] Bucle detectado: el mismo error reapareció tras un fix previo idéntico. Abortando.");
          currentStore.failAutoFix(
            `${errorMessage}\n\n⚠️ Se detectó un bucle de auto-reparación: el error reaparece tras aplicar el mismo fix. Edita el código manualmente con "Abrir en Editor".`
          );
          return;
        }

        lastProcessedErrorRef.current = errorMessage;
        console.log(`[Auto-Fix] Error interceptado: "${errorMessage}". Intento #${currentStore.autoFixAttempts + 1}`);

        currentStore.startAutoFix();

        attemptAutoFix(errorMessage, currentStore.files)
          .then((fixResult) => {
            if (fixResult) {
              console.log("[Auto-Fix] Fix recibido. Aplicando...");
              const formatted: Record<string, { code: string }> = {};
              for (const [path, code] of Object.entries(fixResult.files)) {
                formatted[path] = { code };
              }
              const merged = { ...currentStore.files, ...formatted };
              // Registrar el fix aplicado ANTES de setFiles, para que el hash
              // corresponda al estado previo al fix (que es el que reproduciría
              // el bucle si el fix no sirve).
              useWebBuilderStore.getState().recordAppliedFix(errHash, filesHash);
              useWebBuilderStore.getState().setFiles(merged);
              // Surfacing estilo Aider: si parte del fix no aterrizó (bloque
              // SEARCH no encontrado), lo hacemos visible al usuario en vez de
              // un no-op silencioso. Marca el auto-fix como fallido parcial para
              // que el BuildErrorView lo muestre y el usuario pueda reintentar.
              if (fixResult.warnings.length > 0) {
                const detail = fixResult.warnings
                  .map(w => `${w.filePath}: ${w.reason}`)
                  .join("; ");
                useWebBuilderStore.getState().failAutoFix(
                  `La reparación se aplicó parcialmente, pero ${fixResult.warnings.length} bloque(s) no coincidieron con el código actual (${detail}). Revisa el archivo y vuelve a pedirlo indicando el código exacto.`
                );
              } else {
                useWebBuilderStore.getState().completeAutoFix();
              }
            } else {
              console.warn("[Auto-Fix] No se pudo generar un fix.");
              useWebBuilderStore.getState().failAutoFix(errorMessage);
            }
          })
          .catch((err) => {
            console.error("[Auto-Fix] Error ejecutando el fix:", err);
            useWebBuilderStore.getState().failAutoFix(errorMessage);
          });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [listen]);

  return null;
}

import { PremiumSkeletonLoader } from "./preview-panel";

/**
 * Wrapper de la preview de Sandpack con auto-fix integrado.
 *
 * Reemplaza a SandboxRunner (iframe de WebContainer). Ventajas:
 * - Renderiza en 1-3s (deps pre-empaquetadas, sin npm install).
 * - No pierde estado al recargar la página.
 * - Errores de compilación detectados nativamente vía useSandpack().listen.
 *
 * Nota: debe renderizarse DENTRO de un <SandpackProvider>.
 */
export function SandpackPreviewWrapper() {
  const isCompiling = useWebBuilderStore((s) => s.isCompiling);

  // SandpackPreview maneja su propio estado de carga interno (loader del bundler).
  // No necesitamos un loader personalizado aquí: el PremiumSkeletonLoader del
  // preview-panel ya cubre el caso "IA generando".
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SandpackErrorListener />
        <AutoFixOverlay />
        {isCompiling && <PremiumSkeletonLoader isAiResponding={false} />}
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
          style={{
            height: "100%",
            width: "100%",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}
