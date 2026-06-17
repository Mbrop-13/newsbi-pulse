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

  // Convert our files format to Sandpack format
  const sandpackFiles = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [path, file] of Object.entries(files)) {
      result[path] = file.code;
    }
    return result;
  }, [files]);

  // Determine if this is a React/TS project or plain HTML
  const hasReact =
    Object.keys(files).some(
      (f) => f.endsWith(".tsx") || f.endsWith(".jsx")
    );

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
        Esperando archivos del proyecto...
      </div>
    );
  }

  return (
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
        }}
      >
        <SandpackPreview
          style={{
            height: "100%",
            minHeight: "100%",
          }}
          showNavigator={false}
          showRefreshButton={true}
          showOpenInCodeSandbox={false}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
