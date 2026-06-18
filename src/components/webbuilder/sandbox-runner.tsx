"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { attemptAutoFix } from "@/lib/services/auto-fix-service";
import { Loader2 } from "lucide-react";

function SandboxErrorListener() {
  const { sandpack } = useSandpack();
  const store = useWebBuilderStore();
  const lastProcessedErrorRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const error = sandpack.error;
    if (!error?.message) {
      if (store.lastAutoFixError) {
        store.completeAutoFix();
      }
      // Clear any pending debounce if the error resolved itself
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    // Don't attempt auto-fix while the AI is still generating code
    if (store.isAiResponding) return;

    const errorMessage = error.message;
    if (errorMessage === lastProcessedErrorRef.current) return;

    // Limit attempts to max 2
    if (store.autoFixAttempts >= 2) {
      console.warn("[Auto-Fix] Max attempts reached. Displaying error.");
      store.failAutoFix(errorMessage);
      return;
    }

    // Debounce: wait 2 seconds after AI finishes before auto-fixing
    // This gives Sandpack time to recompile with the final code
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Re-check: error might have been resolved during the debounce
      const currentError = sandpack.error;
      if (!currentError?.message) return;
      if (store.isAiResponding) return;

      lastProcessedErrorRef.current = currentError.message;
      console.log(`[Auto-Fix] Intercepted error: "${currentError.message}". Attempt #${store.autoFixAttempts + 1}`);
      
      store.startAutoFix();

      attemptAutoFix(currentError.message, store.files)
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
            store.failAutoFix(currentError.message);
          }
        })
        .catch((err) => {
          console.error("[Auto-Fix] Error during auto-fix execution:", err);
          store.failAutoFix(currentError.message);
        });
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sandpack.error, store.autoFixAttempts, store.isAiResponding]);

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
  const { files, isAiResponding } = useWebBuilderStore();
  const [stableFiles, setStableFiles] = useState(files);

  // Sync files to preview only when the AI is NOT responding (to avoid constant reloading)
  useEffect(() => {
    if (!isAiResponding) {
      setStableFiles(files);
    }
  }, [files, isAiResponding]);

  // Determine if this is a React/TS project or plain HTML
  const hasReact = useMemo(() => {
    return Object.keys(stableFiles).some(
      (f) => f.endsWith(".tsx") || f.endsWith(".jsx")
    );
  }, [stableFiles]);

  // Convert our files format to Sandpack format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [path, file] of Object.entries(stableFiles)) {
      result[path] = file.code;
    }

    if (!hasReact && Object.keys(stableFiles).length > 0) {
      const entryPoints = ["/index.ts", "/src/index.ts", "/index.js", "/src/index.js"];
      for (const ep of entryPoints) {
        if (!result[ep]) {
          result[ep] = "// Auto-generated to prevent default entry point crash\n";
        }
      }
    }

    // Inject Inspector Script for React Templates
    if (hasReact && !result["/public/index.html"]) {
      result["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maverlang Preview</title>
    <style>
      .maverlang-inspector-hover {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.1s !important;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      let isInspectorActive = false;
      
      window.addEventListener('message', (e) => {
        if (e.data?.type === 'TOGGLE_INSPECTOR') {
          isInspectorActive = e.data.active;
          if (!isInspectorActive) {
            document.querySelectorAll('.maverlang-inspector-hover').forEach(el => el.classList.remove('maverlang-inspector-hover'));
          }
        }
      });

      document.addEventListener('mouseover', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target !== document.body && e.target !== document.documentElement) {
          e.target.classList.add('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target && e.target.classList) {
          e.target.classList.remove('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('click', (e) => {
        if (!isInspectorActive) return;
        e.preventDefault();
        e.stopPropagation();
        
        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) return;

        el.classList.remove('maverlang-inspector-hover');
        
        const clone = el.cloneNode(false);
        let innerText = el.innerText || '';
        if (innerText.length > 50) innerText = innerText.substring(0, 50) + '...';
        if (innerText) clone.innerText = innerText;
        
        window.parent.postMessage({
          type: 'MAVERLANG_ELEMENT_CLICKED',
          elementHtml: clone.outerHTML,
          tagName: el.tagName,
          className: el.className || ''
        }, '*');
        
        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);
    </script>
  </body>
</html>`;
    }

    return result;
  }, [stableFiles, hasReact]);

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
        Esperando archivos del proyecto...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: "1 1 0%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SandpackProvider
          template={hasReact ? "react-ts" : "vanilla-ts"}
          files={sandpackFiles}
          theme="dark"
          customSetup={{
            dependencies: {
              "lucide-react": "latest",
              "recharts": "latest",
              "framer-motion": "latest",
              "react-icons": "latest",
            },
          }}
          options={{
            externalResources: [
              "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
            ],
            autorun: true,
            autoReload: true,
          }}
        >
          <SandboxErrorListener />
          <SandpackLayout
            style={{
              border: "none",
              borderRadius: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column" as const,
            }}
          >
            <SandpackPreview
              style={{
                flex: "1 1 0%",
                height: "100%",
                minHeight: 0,
              }}
              showNavigator={false}
              showRefreshButton={true}
              showOpenInCodeSandbox={false}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
