"use client";

import { useEffect, useRef, useState } from "react";
import { renderProjectToHtml } from "@/lib/webbuilder-canvas-renderer";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";

/**
 * Preview: iframe ESM. Cada archivo del store es un módulo (blob + importmap).
 * Babel transpila TSX por archivo a nivel de módulo — `export type` es legal.
 */
function isIgnorableRuntimeError(message: string, filename?: string): boolean {
  const src = (filename || "").toLowerCase();
  const msg = (message || "").toLowerCase();
  if (src.includes("cdn.tailwindcss.com") || src.includes("tailwindcss")) return true;
  if (src.includes("preview.invalid")) return true;
  if (msg === "script error." || msg === "script error") return true;
  return false;
}

export function CanvasPreview({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [forceRenderIdx, setForceRenderIdx] = useState(0);
  const [runtimeBanner, setRuntimeBanner] = useState<string | null>(null);
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

  const htmlRef = useRef<string | null>(null);

  useEffect(() => {
    htmlRef.current = html;
  }, [html]);

  // ── Capturar errores de runtime del iframe ──
  // El iframe inyecta postMessage con type=MAVERLANG_RUNTIME_ERROR cuando
  // el código del usuario falla en runtime (sintaxis, TypeError, etc.).
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "MAVERLANG_RUNTIME_ERROR" && e.data?.message) {
        const raw = String(e.data.message);
        if (isIgnorableRuntimeError(raw, e.data.filename)) return;
        const errMsg = raw + (e.data.lineno ? ` (línea ${e.data.lineno})` : "");
        setRuntimeBanner(errMsg);
        const isSyntax = /error de sintaxis|syntaxerror/i.test(raw);
        if (isSyntax) {
          const store = useWebBuilderStore.getState();
          const labeled = `Error en tiempo de ejecución: ${errMsg}`;
          if (store.lastAutoFixError !== labeled) {
            store.failAutoFix(labeled);
          }
        }
      } else if (
        e.data?.type === "MAVERLANG_IFRAME_BLOCKED_NAVIGATION" ||
        e.data?.type === "MAVERLANG_PREVIEW_NAVIGATE"
      ) {
        console.warn("[CanvasPreview] Intento de navegación interceptado, restaurando vista previa...");
        if (iframeRef.current && htmlRef.current) {
          iframeRef.current.srcdoc = htmlRef.current;
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
          setRuntimeBanner(null);
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
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
        referrerPolicy="no-referrer"
        srcDoc={html ?? undefined}
        className="w-full h-full border-none bg-white"
        style={{ minHeight: "100%" }}
      />
      {runtimeBanner && (
        <div className="absolute bottom-3 left-3 right-3 z-20 rounded-xl border border-zinc-700 bg-zinc-950/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
          <p className="text-[11px] text-zinc-200 leading-relaxed break-words">
            {runtimeBanner}
          </p>
          <button
            type="button"
            onClick={() => {
              setRuntimeBanner(null);
              lastKeyRef.current = "";
              setForceRenderIdx((i) => i + 1);
            }}
            className="mt-2 text-[10px] font-semibold text-white underline underline-offset-2"
          >
            Reintentar preview
          </button>
        </div>
      )}
    </div>
  );
}
