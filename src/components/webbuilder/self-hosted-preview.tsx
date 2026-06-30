"use client";

import { useEffect, useRef, useState } from "react";
import { bundleProject } from "@/lib/webbuilder-bundler";
import { detectDependencies } from "@/lib/webbuilder-deps";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";

/**
 * Preview autocontenido: reemplaza a SandpackPreview.
 *
 * Bundlea el proyecto con esbuild-wasm EN EL NAVEGADOR (cero dependencia del
 * CDN de CodeSandbox) y lo inyecta en un iframe srcdoc.
 *
 * FILOSOFÍA: SIMPLE Y A PRUEBA DE FALLOS.
 * - Si el código compila → muestra el preview. ✅
 * - Si el código NO compila → muestra el error exacto (línea/columna) vía la
 *   pantalla de error del padre (failAutoFix reutilizada solo como canal de
 *   UI, no como LLM). El usuario lo corrige en el editor. ✅
 *
 * NO hay auto-fix (LLM regenerando código): era la causa de los 504 de
 * /api/webbuilder-fix y de buena parte de los bucles. Cada editor serio
 * (VS Code, CodeSandbox) te muestra el error y tú lo arreglas.
 */
export function SelfHostedPreview({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [bundling, setBundling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Key estable del contenido: cambia SOLO si los archivos realmente cambiaron
  // (no en cada re-render). Evita rebundle innecesario.
  const filesKey = JSON.stringify(
    Object.entries(stableFiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, f]) => `${p}::${(f?.code ?? "").length}`)
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (filesKey === lastKeyRef.current) return;
    lastKeyRef.current = filesKey;

    // No bundlear mientras la IA escribe (código a medio generar).
    if (useWebBuilderStore.getState().isAiResponding) return;

    debounceRef.current = setTimeout(async () => {
      setBundling(true);
      try {
        const deps = detectDependencies(stableFiles);
        const result = await bundleProject(stableFiles, deps);
        if (!isMountedRef.current) return;

        if (result.error) {
          // Mostrar el error exacto en la pantalla de error del padre.
          // NO llamamos a attemptAutoFix ni a ningún LLM: solo mostramos.
          const store = useWebBuilderStore.getState();
          if (store.lastAutoFixError !== result.error) {
            store.failAutoFix(result.error);
          }
        } else if (result.html) {
          setHtml(result.html);
          // Si había un error previo y ahora compila, limpiarlo.
          const store = useWebBuilderStore.getState();
          if (store.hasBuildError) {
            store.completeAutoFix();
          }
        }
      } catch (err: any) {
        console.error("[SelfHostedPreview] Bundle exception:", err);
        if (isMountedRef.current) {
          const store = useWebBuilderStore.getState();
          if (store.lastAutoFixError !== err?.message) {
            store.failAutoFix(err?.message || String(err));
          }
        }
      } finally {
        if (isMountedRef.current) setBundling(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      {bundling && !html && <PremiumSkeletonLoader isAiResponding={false} />}
      <iframe
        ref={iframeRef}
        title="Maverlang Preview"
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        srcDoc={html ?? undefined}
        className="w-full h-full border-none bg-white"
        style={{ minHeight: "100%" }}
      />
    </div>
  );
}
