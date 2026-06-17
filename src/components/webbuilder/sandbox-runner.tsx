"use client";

import { useMemo, useEffect, useRef } from "react";
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

  useEffect(() => {
    const error = sandpack.error;
    if (!error?.message) {
      if (store.lastAutoFixError) {
        store.completeAutoFix();
      }
      return;
    }

    const errorMessage = error.message;
    if (errorMessage === lastProcessedErrorRef.current) return;

    // Limit attempts to max 2
    if (store.autoFixAttempts >= 2) {
      console.warn("[Auto-Fix] Max attempts reached. Displaying error.");
      store.failAutoFix(errorMessage);
      return;
    }

    // Start auto-fix process
    lastProcessedErrorRef.current = errorMessage;
    console.log(`[Auto-Fix] Intercepted error: "${errorMessage}". Attempt #${store.autoFixAttempts + 1}`);
    
    store.startAutoFix();

    // Call service to get a fix
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

  }, [sandpack.error, store.autoFixAttempts]);

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
  const { files } = useWebBuilderStore();

  // Determine if this is a React/TS project or plain HTML
  const hasReact = useMemo(() => {
    return Object.keys(files).some(
      (f) => f.endsWith(".tsx") || f.endsWith(".jsx")
    );
  }, [files]);

  // Convert our files format to Sandpack format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [path, file] of Object.entries(files)) {
      result[path] = file.code;
    }

    if (!hasReact && Object.keys(files).length > 0) {
      const entryPoints = ["/index.ts", "/src/index.ts", "/index.js", "/src/index.js"];
      for (const ep of entryPoints) {
        if (!result[ep]) {
          result[ep] = "// Auto-generated to prevent default entry point crash\n";
        }
      }
    }

    return result;
  }, [files, hasReact]);

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
