"use client";

import { useEffect, useRef, useState } from "react";
import { bundleProject } from "@/lib/webbuilder-bundler";
import { detectDependencies } from "@/lib/webbuilder-deps";
import { useWebBuilderStore, djb2Hash, hashFiles } from "@/lib/stores/webbuilder-store";
import { attemptAutoFix } from "@/lib/services/auto-fix-service";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";
import { AlertTriangle } from "lucide-react";

/**
 * Preview autocontenido: reemplaza a SandpackPreview.
 *
 * En vez de descargar el bundler de Sandpack desde sandpack.codesandbox.io
 * (worker remoto con bugs + telemetría a csbops.io), aquí bundleamos el
 * proyecto con esbuild-wasm EN EL NAVEGADOR y lo inyectamos en un iframe
 * srcdoc. Cero dependencia de CodeSandbox.
 *
 * Flujo:
 *  1. stableFiles cambia → debounce 300ms (evita rebundle en cada token).
 *  2. bundleProject(files, deps) → { html, error }.
 *  3. Si hay error → dispara el auto-fix (attemptAutoFix): la IA intenta
 *     reparar el código. Si el fix funciona → setFiles → re-bundle. Si falla
 *     (2 intentos o bucle detectado) → failAutoFix → BuildErrorView muestra
 *     el error real con línea/columna exactas. Mensaje limpio, sin worker
 *     colgado.
 *  4. Si OK → seteamos el srcdoc del iframe. El navegador ejecuta el módulo,
 *     react carga desde esm.sh, la app se monta.
 *
 * El inspector (clic en elementos) sigue funcionando porque el bundler
 * inyecta el mismo script del inspector que usaba Sandpack.
 */
export function SelfHostedPreview({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [bundling, setBundling] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const bundleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedErrorRef = useRef<string | null>(null);
  // Cache del último hash de stableFiles para no rebundlear si no cambió.
  const lastKeyRef = useRef<string>("");

  // stableFiles puede cambiar de ref sin que el contenido cambie (re-render).
  // Lo serializamos a un key estable para comparar.
  const filesKey = JSON.stringify(
    Object.entries(stableFiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, f]) => `${p}::${(f?.code ?? "").length}`)
  );

  useEffect(() => {
    if (bundleDebounceRef.current) clearTimeout(bundleDebounceRef.current);

    // Skip si el contenido no cambió realmente (misma key).
    if (filesKey === lastKeyRef.current) return;
    lastKeyRef.current = filesKey;

    const store = useWebBuilderStore.getState();
    // Si la IA está respondiendo, no bundleamos (código a medio escribir).
    if (store.isAiResponding) return;
    // Si un auto-fix está corriendo, esperamos a que termine (va a mutar
    // stableFiles y este effect se reejecutará).
    if (store.isAutoFixing) return;

    bundleDebounceRef.current = setTimeout(async () => {
      setBundling(true);
      setBundleError(null);
      try {
        const deps = detectDependencies(stableFiles);
        const result = await bundleProject(stableFiles, deps);
        if (result.error) {
          handleBundleError(result.error);
        } else if (result.html) {
          setHtml(result.html);
          setBundleError(null);
          // Limpiar error previo si ahora compila.
          const s = useWebBuilderStore.getState();
          if (s.hasBuildError && !s.isAutoFixing) {
            s.completeAutoFix();
          }
        }
      } catch (err: any) {
        console.error("[SelfHostedPreview] Bundle exception:", err);
        handleBundleError(err?.message || String(err));
      } finally {
        setBundling(false);
      }
    }, 300);

    return () => {
      if (bundleDebounceRef.current) clearTimeout(bundleDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey]);

  /**
   * Maneja un error de bundling disparando el auto-fix (igual que el viejo
   * SandpackErrorListener): la IA intenta reparar el código. Si falla tras 2
   * intentos o se detecta bucle, failAutoFix muestra la pantalla de error.
   */
  const handleBundleError = (errorMessage: string) => {
    const store = useWebBuilderStore.getState();
    if (store.isAiResponding) return;
    // Evita re-procesar el mismo error exacto.
    if (errorMessage === lastProcessedErrorRef.current) return;

    // Límite de 2 intentos de auto-fix.
    if (store.autoFixAttempts >= 2) {
      console.warn("[SelfHostedPreview] Máximo de intentos de auto-fix alcanzado.");
      store.failAutoFix(errorMessage);
      return;
    }

    // Debounce de 2s para no disparar en cada recompilación intermedia.
    if (autoFixDebounceRef.current) clearTimeout(autoFixDebounceRef.current);
    autoFixDebounceRef.current = setTimeout(() => {
      const currentStore = useWebBuilderStore.getState();
      if (currentStore.isAiResponding) return;

      // Guardia anti-bucle: si ya aplicamos un fix para este (error + snapshot)
      // de archivos y el mismo error reapareció, el fix no sirvió. Abortar.
      const errHash = djb2Hash(errorMessage);
      const filesHash = hashFiles(currentStore.files);
      if (currentStore.isRepeatingFix(errHash, filesHash)) {
        console.warn("[SelfHostedPreview] Bucle detectado: el mismo error reapareció tras un fix idéntico. Abortando.");
        currentStore.failAutoFix(
          `${errorMessage}\n\n⚠️ Se detectó un bucle de auto-reparación: el error reaparece tras aplicar el mismo fix. Edita el código manualmente con "Abrir en Editor".`
        );
        return;
      }

      lastProcessedErrorRef.current = errorMessage;
      console.log(`[SelfHostedPreview] Auto-Fix disparado: "${errorMessage}". Intento #${currentStore.autoFixAttempts + 1}`);

      currentStore.startAutoFix();

      attemptAutoFix(errorMessage, currentStore.files)
        .then((fixResult) => {
          if (fixResult) {
            console.log("[SelfHostedPreview] Fix recibido. Aplicando...");
            const formatted: Record<string, { code: string }> = {};
            for (const [path, code] of Object.entries(fixResult.files)) {
              formatted[path] = { code };
            }
            const merged = { ...currentStore.files, ...formatted };
            useWebBuilderStore.getState().recordAppliedFix(errHash, filesHash);
            useWebBuilderStore.getState().setFiles(merged);
            if (fixResult.warnings.length > 0) {
              const detail = fixResult.warnings
                .map((w) => `${w.filePath}: ${w.reason}`)
                .join("; ");
              useWebBuilderStore.getState().failAutoFix(
                `La reparación se aplicó parcialmente, pero ${fixResult.warnings.length} bloque(s) no coincidieron con el código actual (${detail}). Revisa el archivo y vuelve a pedirlo indicando el código exacto.`
              );
            } else {
              useWebBuilderStore.getState().completeAutoFix();
            }
          } else {
            console.warn("[SelfHostedPreview] No se pudo generar un fix.");
            useWebBuilderStore.getState().failAutoFix(errorMessage);
          }
        })
        .catch((err) => {
          console.error("[SelfHostedPreview] Error ejecutando el fix:", err);
          useWebBuilderStore.getState().failAutoFix(errorMessage);
        });
    }, 2000);
  };

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (autoFixDebounceRef.current) clearTimeout(autoFixDebounceRef.current);
    };
  }, []);

  // Error local de bundling (mostrado solo si no lo tomó el padre).
  if (bundleError && !useWebBuilderStore.getState().hasBuildError) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-0 w-full h-full relative bg-[#0B1329] text-white p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/25">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-bold mb-2">Error al compilar el proyecto</p>
        <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap max-w-md max-h-40 overflow-y-auto text-center">
          {bundleError}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      {bundling && !html && <PremiumSkeletonLoader isAiResponding={false} />}
      <iframe
        ref={iframeRef}
        title="Maverlang Preview"
        // srcdoc ejecuta el HTML completo (importmap + JS + inspector) en un
        // sandbox aislado. allow-scripts para correr React; sin allow-same-origin
        // para que no toque la app principal (el inspector usa postMessage).
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        srcDoc={html ?? undefined}
        className="w-full h-full border-none bg-white"
        style={{ minHeight: "100%" }}
      />
    </div>
  );
}
