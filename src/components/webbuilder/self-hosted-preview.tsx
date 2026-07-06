"use client";

import { useEffect, useRef, useState } from "react";
import { bundleProject, invalidateBundleCache } from "@/lib/webbuilder-bundle-client";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { PremiumSkeletonLoader } from "./premium-skeleton-loader";

/**
 * Preview autocontenido: reemplaza a SandpackPreview.
 *
 * Bundlea el proyecto en el SERVIDOR (POST /api/webbuilder-bundle, esbuild
 * nativo con node_modules reales) y lo inyecta en un iframe srcdoc.
 *
 * FILOSOFÍA: SIMPLE Y A PRUEBA DE FALLOS.
 * - Si el código compila → muestra el preview. ✅
 * - Si el código NO compila → muestra el error exacto (línea/columna) vía la
 *   pantalla de error del padre (failAutoFix reutilizada solo como canal de
 *   UI, no como LLM). El usuario lo corrige en el editor. ✅
 *
 * NO hay auto-fix (LLM regenerando código): cada editor serio (VS Code,
 * CodeSandbox) te muestra el error y tú lo arreglas.
 */
export function SelfHostedPreview({ stableFiles }: { stableFiles: Record<string, { code: string }> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [bundling, setBundling] = useState(false);
  // forceBundleIdx: incrementar para forzar un re-bundle (botón Reintentar).
  const [forceBundleIdx, setForceBundleIdx] = useState(0);
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
  // el padre (BuildErrorView / botón refresh). Fuerza un re-bundle ignorando el
  // cache (útil tras que el usuario corrija el código o quiera reintentar).
  useEffect(() => {
    const forceRebundle = () => {
      lastKeyRef.current = ""; // invalida el cache local del efecto
      invalidateBundleCache(); // invalida la caché del wrapper del cliente
      setForceBundleIdx((i) => i + 1); // dispara el effect principal
    };
    window.addEventListener("maverlang-force-rebundle", forceRebundle);
    return () => window.removeEventListener("maverlang-force-rebundle", forceRebundle);
  }, []);

  // ── Capturar errores de runtime del iframe ──
  // El iframe inyecta postMessage con type=MAVERLANG_RUNTIME_ERROR cuando
  // el código del usuario falla en runtime (TypeError, ReferenceError, etc.).
  // Sin esto, el preview queda en blanco sin explicación.
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
  // (no en cada re-render). Evita rebundle innecesario. Usar el código completo
  // (no solo .length): cambios de igual longitud (true→false, "foo"→"bar",
  // renombrar vars) NO disparaban re-bundle y el preview quedaba desincronizado.
  const filesKey = JSON.stringify(
    Object.entries(stableFiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, f]) => `${p}::${f?.code ?? ""}`)
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
        const result = await bundleProject(stableFiles);
        if (!isMountedRef.current) return;

        // Si todos los archivos están vacíos o son solo whitespace (suele
        // pasar mientras la IA "crea el plan" y aún no escribió código),
        // ignoramos el error y DESPEJAMOS cualquier error previo para que el
        // preview se quede limpio en vez de mostrar "Could not resolve...".
        const hasRealCode = Object.values(stableFiles).some(
          (f) => (typeof f === "string" ? f : f?.code ?? "").trim().length > 0
        );

        if (result.error && !hasRealCode) {
          const store = useWebBuilderStore.getState();
          if (store.hasBuildError) store.completeAutoFix();
          return;
        }

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
  }, [filesKey, forceBundleIdx]);

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
