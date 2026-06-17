import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export interface WebBuilderFile {
  code: string;
}

export interface WebBuilderProject {
  id: string;
  chatId: string;
  files: Record<string, WebBuilderFile>;
  createdAt: Date;
  updatedAt: Date;
}

interface WebBuilderStore {
  // Mode
  isWebBuilderMode: boolean;
  setWebBuilderMode: (active: boolean) => void;

  // Project
  activeProjectId: string | null;
  files: Record<string, WebBuilderFile>;
  activeFilePath: string;
  
  // UI State
  selectedTab: "preview" | "files" | "code" | "console";
  isCompiling: boolean;
  compileLogs: string[];
  isSplitView: boolean;

  // Cloud Sync
  cloudSyncEnabled: boolean;
  setCloudSync: (enabled: boolean) => void;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Actions
  updateFile: (path: string, content: string) => void;
  updateMultipleFiles: (updates: Record<string, string>) => void;
  setFiles: (files: Record<string, WebBuilderFile>) => void;
  deleteFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setSelectedTab: (tab: "preview" | "files" | "code" | "console") => void;
  setCompiling: (val: boolean) => void;
  addCompileLog: (log: string) => void;
  clearCompileLogs: () => void;
  resetProject: () => void;
  initProject: (chatId: string) => void;
  setSplitView: (val: boolean) => void;

  // Cloud Sync Actions
  syncToCloud: () => Promise<void>;
  loadFromCloud: (chatId: string) => Promise<boolean>;
  deleteFromCloud: (chatId: string) => Promise<void>;
}

const DEFAULT_FILES: Record<string, WebBuilderFile> = {
  "/App.tsx": {
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <span className="text-4xl">🚀</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Maverlang <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Builder</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-md mx-auto leading-relaxed">
          Describe lo que quieres construir y la IA lo creará en tiempo real.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-400">
          <span className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10">React</span>
          <span className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10">Tailwind CSS</span>
          <span className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10">TypeScript</span>
        </div>
      </div>
    </div>
  );
}`,
  },
  "/index.tsx": {
    code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
  },
  "/styles.css": {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}`,
  },
};

// Debounce helper for auto-save
let _syncTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSync() {
  if (_syncTimeout) clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(() => {
    const store = useWebBuilderStore.getState();
    if (store.cloudSyncEnabled && store.activeProjectId) {
      store.syncToCloud();
    }
  }, 2000); // 2 second debounce
}

export const useWebBuilderStore = create<WebBuilderStore>()(
  persist(
    (set, get) => ({
      isWebBuilderMode: false,
      activeProjectId: null,
      files: {},
      activeFilePath: "/App.tsx",
      selectedTab: "preview",
      isCompiling: false,
      compileLogs: [],
      isSplitView: true,
      cloudSyncEnabled: true,
      isSaving: false,
      lastSavedAt: null,

      setWebBuilderMode: (active) => {
        set({ isWebBuilderMode: active });
        if (active && Object.keys(get().files).length === 0) {
          set({ files: {} });
        }
      },

      setCloudSync: (enabled) => {
        set({ cloudSyncEnabled: enabled });
        // If just enabled, trigger an immediate sync
        if (enabled) {
          const { activeProjectId } = get();
          if (activeProjectId) {
            get().syncToCloud();
          }
        }
      },

      updateFile: (path, content) => {
        set((s) => ({
          files: {
            ...s.files,
            [path]: { code: content },
          },
        }));
        debouncedSync();
      },

      updateMultipleFiles: (updates) => {
        set((s) => {
          const newFiles = { ...s.files };
          for (const [path, content] of Object.entries(updates)) {
            newFiles[path] = { code: content };
          }
          const currentActive = s.activeFilePath;
          const newActive = !currentActive || currentActive === ""
            ? Object.keys(newFiles).find(k => k.endsWith("/App.tsx") || k.endsWith("/App.js")) || Object.keys(newFiles)[0] || ""
            : currentActive;
          return { files: newFiles, activeFilePath: newActive };
        });
        debouncedSync();
      },

      setFiles: (files) => {
        const currentActive = get().activeFilePath;
        const newActive = !currentActive || currentActive === ""
          ? Object.keys(files).find(k => k.endsWith("/App.tsx") || k.endsWith("/App.js")) || Object.keys(files)[0] || ""
          : currentActive;
        set({ files, activeFilePath: newActive });
        debouncedSync();
      },

      deleteFile: (path) => {
        set((s) => {
          const newFiles = { ...s.files };
          delete newFiles[path];
          const newActive =
            s.activeFilePath === path
              ? Object.keys(newFiles)[0] || "/App.tsx"
              : s.activeFilePath;
          return { files: newFiles, activeFilePath: newActive };
        });
        debouncedSync();
      },

      setActiveFile: (path) => set({ activeFilePath: path }),

      setSelectedTab: (tab) => set({ selectedTab: tab }),

      setCompiling: (val) => set({ isCompiling: val }),

      addCompileLog: (log) =>
        set((s) => ({
          compileLogs: [...s.compileLogs, `[${new Date().toLocaleTimeString()}] ${log}`],
        })),

      clearCompileLogs: () => set({ compileLogs: [] }),

      resetProject: () =>
        set({
          activeProjectId: null,
          files: {},
          activeFilePath: "/App.tsx",
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
        }),

      initProject: (chatId) => {
        const state = get();
        if (state.activeProjectId === chatId) return;
        set({
          activeProjectId: chatId,
          files: {},
          activeFilePath: "",
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
        });
      },

      setSplitView: (val) => set({ isSplitView: val }),

      // ── Cloud Sync Actions ──

      syncToCloud: async () => {
        const { files, activeProjectId, cloudSyncEnabled } = get();
        if (!cloudSyncEnabled || !activeProjectId) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isSaving: true });

        try {
          const supabase = createClient();

          // Clean up old projects based on tier (free = 7 days, pro = 15 days of inactivity)
          const tier = user.tier || "free";
          const expirationDays = tier === "free" ? 7 : 15;
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() - expirationDays);

          await supabase
            .from("ai_webbuilder_projects")
            .delete()
            .eq("user_id", user.id)
            .lt("updated_at", expirationDate.toISOString());
          
          // Convert files to plain JSON for storage
          const projectFiles = Object.fromEntries(
            Object.entries(files).map(([path, file]) => [path, file.code])
          );

          // Upsert: insert or update
          const { data: existing } = await supabase
            .from("ai_webbuilder_projects")
            .select("id")
            .eq("chat_id", activeProjectId)
            .eq("user_id", user.id)
            .single();

          if (existing) {
            await supabase
              .from("ai_webbuilder_projects")
              .update({
                project_files: projectFiles,
                updated_at: new Date().toISOString(),
              })
              .eq("chat_id", activeProjectId)
              .eq("user_id", user.id);
          } else {
            await supabase.from("ai_webbuilder_projects").insert({
              chat_id: activeProjectId,
              user_id: user.id,
              project_files: projectFiles,
            });
          }

          const now = new Date().toLocaleTimeString();
          set({ lastSavedAt: now, isSaving: false });
        } catch (error) {
          console.error("WebBuilder cloud sync error:", error);
          set({ isSaving: false });
        }
      },

      loadFromCloud: async (chatId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
          const supabase = createClient();

          // Clean up old projects based on tier (free = 7 days, pro = 15 days of inactivity)
          const tier = user.tier || "free";
          const expirationDays = tier === "free" ? 7 : 15;
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() - expirationDays);

          await supabase
            .from("ai_webbuilder_projects")
            .delete()
            .eq("user_id", user.id)
            .lt("updated_at", expirationDate.toISOString());

          const { data, error } = await supabase
            .from("ai_webbuilder_projects")
            .select("project_files")
            .eq("chat_id", chatId)
            .eq("user_id", user.id)
            .single();

          if (error || !data?.project_files) return false;

          // Convert plain JSON back to WebBuilderFile format
          const files: Record<string, WebBuilderFile> = {};
          for (const [path, code] of Object.entries(data.project_files as Record<string, string>)) {
            files[path] = { code };
          }

          set({
            activeProjectId: chatId,
            files,
            activeFilePath: Object.keys(files).includes("/App.tsx")
              ? "/App.tsx"
              : Object.keys(files)[0] || "/App.tsx",
          });

          return true;
        } catch (error) {
          console.error("WebBuilder load from cloud error:", error);
          return false;
        }
      },

      deleteFromCloud: async (chatId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const supabase = createClient();
          await supabase
            .from("ai_webbuilder_projects")
            .delete()
            .eq("chat_id", chatId)
            .eq("user_id", user.id);
        } catch (error) {
          console.error("WebBuilder delete from cloud error:", error);
        }
      },
    }),
    {
      name: "maverlang-webbuilder",
      partialize: (state) => ({
        isWebBuilderMode: state.isWebBuilderMode,
        activeProjectId: state.activeProjectId,
        files: state.files,
        activeFilePath: state.activeFilePath,
        cloudSyncEnabled: state.cloudSyncEnabled,
      }),
    }
  )
);
