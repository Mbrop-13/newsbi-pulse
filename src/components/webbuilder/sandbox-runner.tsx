"use client";

import { useMemo } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";

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

    // If it's a plain HTML/JS project, inject empty entry point files
    // to prevent Sandpack's default vanilla template from running
    // scripts that try to write to non-existent <div id="app"></div>
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
