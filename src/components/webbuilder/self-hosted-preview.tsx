"use client";

import { useEffect, useRef, useState } from "react";
import { bundleProject } from "@/lib/webbuilder-bundler";
import { detectDependencies } from "@/lib/webbuilder-deps";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";
import { Loader2, AlertTriangle } from "lucide-react";

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
 *  3. Si hay error → failAutoFix(error) → el BuildErrorView del PreviewPanel
 *     lo muestra (no renderizamos nada aquí; el padre ya no nos muestra cuando
 *     hasBuildError). Mensaje limpio, sin worker colgado.
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Skip si el contenido no cambió realmente (misma key).
    if (filesKey === lastKeyRef.current) return;
    lastKeyRef.current = filesKey;

    // Si la IA está respondiendo, no bundleamos todavía (el código está a
    // medio escribir; esperamos a que termine para un bundle definitivo).
    if (useWebBuilderStore.getState().isAiResponding) return;
    // Si ya hay un error de build surficado, no rebundleamos en bucle: el
    // padre (PreviewPanel) gestiona la pantalla de error y el retry.
    if (useWebBuilderStore.getState().hasBuildError) return;

    debounceRef.current = setTimeout(async () => {
      setBundling(true);
      setBundleError(null);
      try {
        const deps = detectDependencies(stableFiles);
        const result = await bundleProject(stableFiles, deps);
        if (result.error) {
          console.warn("[SelfHostedPreview] Bundle error:", result.error);
          setBundleError(result.error);
          // Disparar la pantalla de error del padre (mismo flujo que el auto-fix).
          const store = useWebBuilderStore.getState();
          if (store.lastAutoFixError !== result.error && !store.isAutoFixing) {
            store.failAutoFix(result.error);
          }
        } else if (result.html) {
          setHtml(result.html);
          // Limpiar cualquier error previo si ahora compila.
          const store = useWebBuilderStore.getState();
          if (store.hasBuildError && !store.isAutoFixing) {
            store.completeAutoFix();
          }
        }
      } catch (err: any) {
        console.error("[SelfHostedPreview] Bundle exception:", err);
        setBundleError(err?.message || String(err));
      } finally {
        setBundling(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey]);

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
