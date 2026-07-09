"use client";

import { useEffect, useRef, useState } from "react";
import { renderProjectToHtml } from "@/lib/webbuilder-canvas-renderer";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";

/**
 * Preview canvas-style: renderiza el proyecto del LLM en un iframe usando
 * React/deps desde esm.sh (importmap) + Babel standalone. SIN bundling, SIN
 * servidor: todo client-side.
 *
 * FILOSOFÍA: SIMPLE Y A PRUEBA DE FALLOS (igual que el modo canvas).
 * - Si el código es válido → muestra el preview. ✅
 * - Si el código tiene error de sintaxis → Babel lanza en runtime dentro del
 *   iframe → se captura como MAVERLANG_RUNTIME_ERROR → se muestra vía failAutoFix.
 * - Si todos los archivos están vacíos (la IA está "creando el plan") → no se
 *   muestra nada, preview limpio.
 *
 * No hay fetch, no hay endpoint, no hay node_modules que resolver. Lo que
 * rompía el enfoque de bundling (React duplicado, "as" residual, Could not
 * resolve en Vercel) es imposible aquí: el importmap con `?external=react`
 * fuerza una sola instancia de React siempre.
 */
export function CanvasPreview({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [forceRenderIdx, setForceRenderIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Escuchar peticiones de "reintentar compilación" / "recargar preview" desde
  // el padre (BuildErrorView / botón refresh). Fuerza un re-render ignorando
  // el cache.
  useEffect(() => {
    const forceRerender = () => {
      lastKeyRef.current = ""; // invalida el cache local
      setForceRenderIdx((i) => i + 1); // dispara el effect principal
    };
    window.addEventListener("maverlang-force-rebundle", forceRerender);
    return () => window.removeEventListener("maverlang-force-rebundle", forceRerender);
  }, []);

  // ── Capturar errores de runtime del iframe ──
  // El iframe inyecta postMessage con type=MAVERLANG_RUNTIME_ERROR cuando
  // el código del usuario falla en runtime (sintaxis, TypeError, etc.).
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "MAVERLANG_RUNTIME_ERROR" && e.data?.message) {
        const errMsg = `Error en tiempo de ejecución: ${e.data.message}` +
          (e.data.lineno ? ` (línea ${e.data.lineno})` : "");
        const store = useWebBuilderStore.getState();
        if (store.lastAutoFixError !== errMsg) {
          store.failAutoFix(errMsg);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Key estable del contenido: cambia SOLO si los archivos realmente cambiaron
  // (no en cada re-render). Evita re-render innecesario.
  const filesKey = JSON.stringify(
    Object.entries(stableFiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, f]) => `${p}::${f?.code ?? ""}`)
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (filesKey === lastKeyRef.current) return;
    lastKeyRef.current = filesKey;

    // No renderizar mientras la IA escribe (código a medio generar).
    if (useWebBuilderStore.getState().isAiResponding) return;

    debounceRef.current = setTimeout(() => {
      setRendering(true);
      try {
        const result = renderProjectToHtml(stableFiles);
        if (!isMountedRef.current) return;

        // Si todos los archivos están vacíos o son solo whitespace (suele
        // pasar mientras la IA "crea el plan" y aún no escribió código),
        // ignoramos cualquier error y DESPEJAMOS errores previos para que el
        // preview se quede limpio.
        const hasRealCode = Object.values(stableFiles).some(
          (f) => (typeof f === "string" ? f : f?.code ?? "").trim().length > 0
        );

        if (result.error && !hasRealCode) {
          const store = useWebBuilderStore.getState();
          if (store.hasBuildError) store.completeAutoFix();
          return;
        }

        if (result.error) {
          const store = useWebBuilderStore.getState();
          if (store.lastAutoFixError !== result.error) {
            store.failAutoFix(result.error);
          }
        } else if (result.html) {
          setHtml(result.html);
          const store = useWebBuilderStore.getState();
          if (store.hasBuildError) {
            store.completeAutoFix();
          }
        }
      } catch (err: any) {
        console.error("[CanvasPreview] Render exception:", err);
        if (isMountedRef.current) {
          const store = useWebBuilderStore.getState();
          if (store.lastAutoFixError !== err?.message) {
            store.failAutoFix(err?.message || String(err));
          }
        }
      } finally {
        if (isMountedRef.current) setRendering(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey, forceRenderIdx]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      {rendering && !html && <PremiumSkeletonLoader isAiResponding={false} />}
      <iframe
        ref={iframeRef}
        title="Maverlang Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        srcDoc={html ?? undefined}
        className="w-full h-full border-none bg-white"
        style={{ minHeight: "100%" }}
      />
    </div>
  );
}
