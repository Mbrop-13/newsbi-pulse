import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { FileDiff } from "@/lib/webbuilder-diff";
import { diffFileMaps } from "@/lib/webbuilder-diff";

export interface WebBuilderFile {
  code: string;
}

// Plan pendiente de aprobación (modo Plan del WebBuilder). Lo emite el
// servidor como evento {type:'plan'} y se muestra como tarjeta + vista en el
// preview. Se limpia al aprobar / cancelar / replanificar.
export interface PendingPlanAgent {
  agentName: string;
  role: string;
  task: string;
  filePath: string;
}
export interface PendingPlan {
  planId: string;
  reason: string;
  agents: PendingPlanAgent[];
  originalUserMessage: string;
}

/**
 * Normaliza un mapa de archivos a SIEMPRE { code: string }, con saneamiento
 * extra: rutas con barra inicial, deduplicación (App.tsx vs /App.tsx), descarte
 * de claves vacías y advertencia si un code queda vacío.
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
  for (const [rawPath, raw] of Object.entries(files)) {
    // 1. Clave: descartar paths vacíos o solo-whitespace.
    const trimmedPath = (rawPath ?? "").trim();
    if (!trimmedPath) continue;

    // 2. Garantizar barra inicial (convención del WebBuilder).
    let path = trimmedPath.startsWith("/") ? trimmedPath : "/" + trimmedPath;
    path = path.replace(/^\/src\//, "/");

    // 3. Code: aceptar string | { code } | null | objeto erróneo.
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

    // 4. Deduplicación: si ya existe una entrada para este path normalizado,
    //    preferir la que tenga código no vacío (evita que un /App.tsx vacío
    //    pise uno con contenido real que vino como "App.tsx").
    const existing = result[path];
    if (existing && existing.code && !code) {
      continue; // mantener el no-vacío
    }

    // 5. Advertir si el code resulta vacío (síntoma de datos corruptos).
    if (!code) {
      console.warn(`[normalizeFiles] Archivo "${path}" quedó con code vacío.`);
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
  // Build mode: "plan" (planifica y pide aprobación) o "turbo" (construye directo)
  buildMode: "plan" | "turbo";
  setBuildMode: (mode: "plan" | "turbo") => void;

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

  // Guardia anti-bucle de auto-fix: hashes de (error + snapshot de archivos)
  // tras cada fix aplicado. Si tras aplicar un fix el (error + archivos) vuelve
  // a un estado ya visto, el fix no sirvió y abortamos para no entrar en bucle.
  appliedFixHashes: string[];
  recordAppliedFix: (errorHash: string, filesHash: string) => void;
  isRepeatingFix: (errorHash: string, filesHash: string) => boolean;
  clearAppliedFixHashes: () => void;

  // Active Agent Reports
  activeAgentReports: any[] | null;
  setActiveAgentReports: (reports: any[] | null) => void;

  // Plan pendiente de aprobación (modo Plan)
  pendingPlan: PendingPlan | null;
  setPendingPlan: (plan: PendingPlan | null) => void;
  clearPendingPlan: () => void;

  // ── Build diff (qué cambió en la última generación/actualización de la IA)
  // Se calcula en setFiles/updateMultipleFiles comparando antes vs después,
  // y lo consume la toolbar de la preview para mostrar un mini-diff +/−.
  lastBuildDiff: FileDiff[];
  clearBuildDiff: () => void;

  // ── Multi-tab de archivos abiertos (estilo editor)
  // activeFilePath sigue siendo el archivo visible; openTabs son los que el
  // usuario (o la IA) ha "abierto" en pestañas. Al hacer setActiveFile se añade
  // automáticamente a openTabs si no estaba.
  openTabs: string[];
  openTab: (path: string) => void;
  closeTab: (path: string) => void;

  // Cloud Sync state and actions
  hasPendingSave: boolean;
  syncToCloud: () => Promise<void>;
  loadFromCloud: (chatId: string) => Promise<boolean>;
  deleteFromCloud: (chatId: string) => Promise<void>;
}

const DEFAULT_FILES: Record<string, WebBuilderFile> = {
  "/App.tsx": {
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-8 text-white select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30 pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="relative z-10 text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 shadow-xl">
          <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-gray-200 tracking-wide">Workspace Ready</h2>
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
          Describe lo que quieres construir en el chat. La IA creará y actualizará la interfaz en tiempo real.
        </p>
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

// ── Cloud sync: helper de upsert + reintentos con backoff exponencial ──
//
// syncToCloud puede fallar por errores de red transitorios (Supabase caído,
// perdida de conexión, 502/503). Antes se logueaba y se abandonaba, perdiendo
// el guardado. Ahora reintentamos hasta MAX_SYNC_RETRIES veces con backoff
// exponencial (1s, 2s, 4s). Si aun así falla, dejamos hasPendingSave=true
// para que el siguiente cambio vuelva a disparar el guardado.

const MAX_SYNC_RETRIES = 3;
const SYNC_BACKOFF_BASE_MS = 1000;

/** Espera ms milisegundos. Usado para el backoff entre reintentos. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Realiza el upsert (UPDATE o INSERT) en Supabase. Lanza si hay un error
 * grave (de red o de BBDD) para que el caller pueda reintentar.
 * Devuelve void en éxito.
 */
async function performCloudUpsert(
  projectFiles: Record<string, string>,
  chatId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  // 1. Intentar UPDATE (caso común: el proyecto ya existe).
  const { error: updateError } = await supabase
    .from("ai_webbuilder_projects")
    .update({
      project_files: projectFiles,
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId)
    .eq("user_id", userId);

  if (updateError) {
    // Re-lanzar como error de red para que el caller reintente.
    throw new Error(`UPDATE failed: ${updateError.message}`);
  }

  // 2. Comprobar si el UPDATE afectó alguna fila. Si no, hacer INSERT.
  const { data: existingList, error: selectError } = await supabase
    .from("ai_webbuilder_projects")
    .select("id")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .limit(1);

  if (selectError) {
    throw new Error(`SELECT failed: ${selectError.message}`);
  }

  const existing = existingList && existingList.length > 0 ? existingList[0] : null;

  if (!existing) {
    const { error: insertError } = await supabase
      .from("ai_webbuilder_projects")
      .insert({
        chat_id: chatId,
        user_id: userId,
        project_files: projectFiles,
      });
    if (insertError) {
      throw new Error(`INSERT failed: ${insertError.message}`);
    }
  }
}

const MAX_HISTORY = 20;

/**
 * Hash djb2 (no criptográfico) para la guardia anti-bucle de auto-fix.
 * Suficiente para detectar que (error + archivos) volvió a un estado ya visto.
 */
export function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  // unsigned + base36
  return (hash >>> 0).toString(36);
}

/** Hashea el contenido de todos los archivos para detectar snapshots repetidos. */
export function hashFiles(files: Record<string, WebBuilderFile>): string {
  // Ordenar claves para que el hash sea estable independientemente del orden.
  const keys = Object.keys(files).sort();
  let acc = "";
  for (const k of keys) {
    acc += k + "\u0000" + (files[k]?.code ?? "") + "\u0001";
  }
  return djb2Hash(acc);
}

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
      buildMode: "plan",
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

      // Guardia anti-bucle de auto-fix
      appliedFixHashes: [],
      recordAppliedFix: (errorHash, filesHash) =>
        set((s) => ({
          appliedFixHashes: [...s.appliedFixHashes, `${errorHash}:${filesHash}`],
        })),
      isRepeatingFix: (errorHash, filesHash) =>
        get().appliedFixHashes.includes(`${errorHash}:${filesHash}`),
      clearAppliedFixHashes: () => set({ appliedFixHashes: [] }),

      // Active Agent Reports
      activeAgentReports: null,
      setActiveAgentReports: (reports) => set({ activeAgentReports: reports }),

      // Cloud Sync state
      hasPendingSave: false,

      // Plan pendiente (modo Plan)
      pendingPlan: null,
      setPendingPlan: (plan) => set({ pendingPlan: plan }),
      clearPendingPlan: () => set({ pendingPlan: null }),

      // Build diff
      lastBuildDiff: [],
      clearBuildDiff: () => set({ lastBuildDiff: [] }),

      // Multi-tab de archivos abiertos
      openTabs: [],
      openTab: (path) =>
        set((s) =>
          s.openTabs.includes(path)
            ? s
            : { openTabs: [...s.openTabs, path] }
        ),
      closeTab: (path) =>
        set((s) => {
          const idx = s.openTabs.indexOf(path);
          const next = s.openTabs.filter((p) => p !== path);
          // Si cerramos el activo, saltar al vecino (siguiente o anterior).
          if (s.activeFilePath === path) {
            const fallback = next[idx] ?? next[idx - 1] ?? next[next.length - 1] ?? "";
            return { openTabs: next, activeFilePath: fallback };
          }
          return { openTabs: next };
        }),

      setWebBuilderMode: (active) => {
        set({ isWebBuilderMode: active });
        if (active && Object.keys(get().files).length === 0) {
          set({ files: DEFAULT_FILES });
        }
      },

      setBuildMode: (mode) => set({ buildMode: mode }),

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
        // Guardar snapshot ANTES de aplicar, para que Undo/Redo funcione también
        // cuando la IA genera/actualiza varios archivos a la vez. Antes no se
        // llamaba _pushHistory aquí, así que el botón Deshacer no revertía nada
        // tras una generación de la IA.
        const prevMulti = get().files;
        if (Object.keys(prevMulti).length > 0) {
          _pushHistory(prevMulti);
        }
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
        // Calcular diff entre el snapshot previo y el nuevo estado.
        const after = get().files;
        const diff = diffFileMaps(prevMulti, after);
        set({ lastBuildDiff: diff });
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
        // Diff entre el snapshot previo y el nuevo (para el mini-diff de la toolbar).
        const diff = diffFileMaps(prev, normalized);
        set({ lastBuildDiff: diff });
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

      setActiveFile: (path) => {
        set({ activeFilePath: path });
        // Abrir automáticamente como tab si no lo está (multi-tab estilo editor).
        const { openTabs } = get();
        if (path && !openTabs.includes(path)) {
          set({ openTabs: [...openTabs, path] });
        }
      },

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
          openTabs: [],
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
          autoFixAttempts: 0,
          isAutoFixing: false,
          lastAutoFixError: null,
          lastBuildDiff: [],
          appliedFixHashes: [],
        }),

      initProject: (chatId) => {
        const state = get();
        if (state.activeProjectId === chatId) return;
        set({
          activeProjectId: chatId,
          files: DEFAULT_FILES,
          activeFilePath: "/App.tsx",
          openTabs: [],
          selectedTab: "preview",
          isCompiling: false,
          compileLogs: [],
          lastSavedAt: null,
          autoFixAttempts: 0,
          isAutoFixing: false,
          lastAutoFixError: null,
          lastBuildDiff: [],
          appliedFixHashes: [],
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
      resetAutoFixAttempts: () => set({ autoFixAttempts: 0, isAutoFixing: false, lastAutoFixError: null, appliedFixHashes: [] }),
      setAiResponding: (val) => set({ isAiResponding: val }),

      // ── Cloud Sync Actions ──

      syncToCloud: async () => {
        const { files, activeProjectId, cloudSyncEnabled, isSaving } = get();
        if (!cloudSyncEnabled || !activeProjectId) return;

        // Guard contra llamadas concurrentes: si ya hay un sync en curso,
        // marcar que hay cambios pendientes para que se guarden al terminar
        // y salir.
        if (isSaving) {
          set({ hasPendingSave: true });
          return;
        }

        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isSaving: true, hasPendingSave: false });

        // Snapshot de los archivos a guardar. Se captura una vez; si llegan
        // cambios nuevos durante el guardado, hasPendingSave se activa y se
        // dispara otro sync al final con la última versión.
        const projectFiles = Object.fromEntries(
          Object.entries(files).map(([path, file]) => [path, file.code])
        );

        let lastError: unknown = null;
        let succeeded = false;

        for (let attempt = 1; attempt <= MAX_SYNC_RETRIES; attempt++) {
          try {
            await performCloudUpsert(projectFiles, activeProjectId, user.id);
            succeeded = true;
            break;
          } catch (error) {
            lastError = error;
            console.error(
              `WebBuilder cloud sync intento ${attempt}/${MAX_SYNC_RETRIES} falló:`,
              error
            );
            // Backoff exponencial: 1s, 2s, 4s... (excepto en el último intento).
            if (attempt < MAX_SYNC_RETRIES) {
              const backoff = SYNC_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
              await delay(backoff);
            }
          }
        }

        if (succeeded) {
          set({ lastSavedAt: new Date().toLocaleTimeString() });
        } else {
          // Todos los reintentos fallaron: dejar hasPendingSave=true para que
          // el siguiente cambio dispare otro intento. No perdemos los datos
          // porque `files` ya está persistido en localStorage por zustand/persist.
          console.error(
            `WebBuilder cloud sync falló tras ${MAX_SYNC_RETRIES} intentos:`,
            lastError
          );
          set({ hasPendingSave: true });
        }

        set({ isSaving: false });
        // Si hubo cambios adicionales mientras guardábamos (o si falló y
        // quedó pendiente), ejecutar otro guardado con la última versión.
        if (get().hasPendingSave) {
          // Pequeño delay para no agotar reintentos en ráfaga si el servidor
          // sigue caído; el siguiente intento también hará backoff.
          setTimeout(() => get().syncToCloud(), 1000);
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
        buildMode: state.buildMode,
        activeProjectId: state.activeProjectId,
        files: state.files,
        activeFilePath: state.activeFilePath,
        cloudSyncEnabled: state.cloudSyncEnabled,
        pendingPlan: state.pendingPlan,
        // Persistir historial para que Undo/Redo sobreviva a recargas.
        // Antes se guardaba `files` pero no el historial, así que tras recargar
        // tenías archivos pero canUndo() siempre devolvía false.
        history: state.history,
        historyIndex: state.historyIndex,
        // Persistir pestañas abiertas para que el editor mantenga el estado de
        // tabs al recargar (consistencia con history/activeFilePath).
        openTabs: state.openTabs,
      }),
    }
  )
);
