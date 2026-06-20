import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export interface WebBuilderFile {
  code: string;
}

/**
 * Normaliza un mapa de archivos a ALWAYS { code: string }.
 *
 * Causa raíz de `n.code.split is not a function`: el store recibía archivos
 * desde varias fuentes (stream webbuilder_files, loadFromCloud, updateFile,
 * actionsToFiles) con formatos inconsistentes — a veces string plano,
 * a veces { code }, a veces { code: undefined } o un objeto erróneo.
 *
 * Esta función es el PUNTO ÚNICO de normalización: acepta cualquiera de esas
 * formas y devuelve siempre Record<string, { code: string }>.
 */
export function normalizeFiles(
  files: Record<string, unknown>
): Record<string, WebBuilderFile> {
  const result: Record<string, WebBuilderFile> = {};
  for (const [path, raw] of Object.entries(files)) {
    let code: string;
    if (typeof raw === "string") {
      code = raw;
    } else if (raw && typeof raw === "object" && "code" in raw) {
      code = String((raw as any).code ?? "");
    } else if (raw == null) {
      code = "";
    } else {
      // Fallback último: stringify para no perder datos y no crashear.
      code = String(raw);
    }
    result[path] = { code };
  }
  return result;
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

  // History (Undo/Redo)
  history: Record<string, WebBuilderFile>[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Auto-Fix state
  autoFixAttempts: number;
  isAutoFixing: boolean;
  lastAutoFixError: string | null;
  isAiResponding: boolean;
  startAutoFix: () => void;
  completeAutoFix: () => void;
  failAutoFix: (error: string) => void;
  resetAutoFixAttempts: () => void;
  setAiResponding: (val: boolean) => void;

  // Active Agent Reports
  activeAgentReports: any[] | null;
  setActiveAgentReports: (reports: any[] | null) => void;

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

const MAX_HISTORY = 20;
function _pushHistory(files: Record<string, WebBuilderFile>) {
  const store = useWebBuilderStore.getState();
  // Truncate any "redo" entries after current index
  const trimmed = store.history.slice(0, store.historyIndex + 1);
  trimmed.push(files);
  // Keep only last MAX_HISTORY entries
  const clamped = trimmed.length > MAX_HISTORY ? trimmed.slice(trimmed.length - MAX_HISTORY) : trimmed;
  useWebBuilderStore.setState({
    history: clamped,
    historyIndex: clamped.length - 1,
  });
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

      // History
      history: [],
      historyIndex: -1,

      // Auto-Fix default state
      autoFixAttempts: 0,
      isAutoFixing: false,
      lastAutoFixError: null,
      isAiResponding: false,

      // Active Agent Reports
      activeAgentReports: null,
      setActiveAgentReports: (reports) => set({ activeAgentReports: reports }),

      setWebBuilderMode: (active) => {
        set({ isWebBuilderMode: active });
        if (active && Object.keys(get().files).length === 0) {
          set({ files: DEFAULT_FILES });
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
        const prev = get().files;
        _pushHistory(prev);
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
        const prev = get().files;
        if (Object.keys(prev).length > 0) {
          _pushHistory(prev);
        }
        // Normalizar SIEMPRE: los archivos pueden venir como string plano
        // (stream/cloud) o como { code }. Sin esto, .code.split() revienta.
        const normalized = normalizeFiles(files);
        const currentActive = get().activeFilePath;
        const newActive = !currentActive || currentActive === ""
          ? Object.keys(normalized).find(k => k.endsWith("/App.tsx") || k.endsWith("/App.js")) || Object.keys(normalized)[0] || ""
          : currentActive;
        set({ files: normalized, activeFilePath: newActive });
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
          files: DEFAULT_FILES,
          activeFilePath: "/App.tsx",
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
          autoFixAttempts: 0,
          isAutoFixing: false,
          lastAutoFixError: null,
        }),

      initProject: (chatId) => {
        const state = get();
        if (state.activeProjectId === chatId) return;
        set({
          activeProjectId: chatId,
          files: DEFAULT_FILES,
          activeFilePath: "/App.tsx",
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
          autoFixAttempts: 0,
          isAutoFixing: false,
          lastAutoFixError: null,
        });
      },

      setSplitView: (val) => set({ isSplitView: val }),

      // History (Undo/Redo)
      undo: () => {
        const { history, historyIndex, files } = get();
        if (historyIndex < 0 || history.length === 0) return;
        // Save current state as "future" by pushing to end if we're at the latest
        const newHistory = [...history];
        if (historyIndex === history.length - 1) {
          newHistory.push(files);
        }
        const snapshot = newHistory[historyIndex];
        set({ files: snapshot, historyIndex: historyIndex - 1, history: newHistory });
      },
      redo: () => {
        const { history, historyIndex } = get();
        const redoIdx = historyIndex + 2;
        if (redoIdx >= history.length) return;
        const snapshot = history[redoIdx];
        set({ files: snapshot, historyIndex: historyIndex + 1 });
      },
      canUndo: () => {
        const { history, historyIndex } = get();
        return historyIndex >= 0 && history.length > 0;
      },
      canRedo: () => {
        const { history, historyIndex } = get();
        return (historyIndex + 2) < history.length;
      },

      startAutoFix: () => set((s) => ({ isAutoFixing: true, autoFixAttempts: s.autoFixAttempts + 1 })),
      completeAutoFix: () => set({ isAutoFixing: false, lastAutoFixError: null }),
      failAutoFix: (error) => set({ isAutoFixing: false, lastAutoFixError: error }),
      resetAutoFixAttempts: () => set({ autoFixAttempts: 0, isAutoFixing: false, lastAutoFixError: null }),
      setAiResponding: (val) => set({ isAiResponding: val }),

      // ── Cloud Sync Actions ──

      syncToCloud: async () => {
        const { files, activeProjectId, cloudSyncEnabled, isSaving } = get();
        if (!cloudSyncEnabled || !activeProjectId) return;
        // Guard contra llamadas concurrentes: si ya hay un sync en curso,
        // salir para no lanzar peticiones simultáneas que causan
        // AbortError ("Lock broken by steal") y PATCH 500 (lock conflict).
        if (isSaving) return;

        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isSaving: true });

        try {
          const supabase = createClient();

          // Convert files to plain JSON for storage
          const projectFiles = Object.fromEntries(
            Object.entries(files).map(([path, file]) => [path, file.code])
          );

          // Upsert: intentar UPDATE primero (caso común: el proyecto ya existe).
          // Si no actualiza ninguna fila (row no existe), hacer INSERT.
          const { error: updateError } = await supabase
            .from("ai_webbuilder_projects")
            .update({
              project_files: projectFiles,
              updated_at: new Date().toISOString(),
            })
            .eq("chat_id", activeProjectId)
            .eq("user_id", user.id);

          if (updateError) {
            console.error("WebBuilder cloud sync UPDATE error:", updateError);
          }

          // Comprobar si el UPDATE afectó alguna fila. Si no, hacer INSERT.
          // (No podemos usar .single() porque la fila puede no existir.)
          const { data: existingList, error: selectError } = await supabase
            .from("ai_webbuilder_projects")
            .select("id")
            .eq("chat_id", activeProjectId)
            .eq("user_id", user.id)
            .limit(1);

          if (selectError) {
            console.error("WebBuilder cloud sync SELECT error:", selectError);
          }

          const existing = existingList && existingList.length > 0 ? existingList[0] : null;

          if (!existing) {
            // El row no existía: hacer INSERT.
            const { error: insertError } = await supabase
              .from("ai_webbuilder_projects")
              .insert({
                chat_id: activeProjectId,
                user_id: user.id,
                project_files: projectFiles,
              });
            if (insertError) {
              console.error("WebBuilder cloud sync INSERT error:", insertError);
            }
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

          const { data: list, error } = await supabase
            .from("ai_webbuilder_projects")
            .select("project_files")
            .eq("chat_id", chatId)
            .eq("user_id", user.id)
            .limit(1);
          const data = list && list.length > 0 ? list[0] : null;

          if (error || !data?.project_files) return false;

          // Convert plain JSON back to WebBuilderFile format.
          // Uso normalizeFiles por si project_files quedó en formato mixto.
          const files = normalizeFiles(data.project_files as Record<string, unknown>);

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
