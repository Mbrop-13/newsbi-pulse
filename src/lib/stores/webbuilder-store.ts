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
  // True cuando el bundler ha reportado un error de compilación (cualquier
  // tipo). El listener de Sandpack (SandpackErrorListener) lo sube cuando
  // detecta un error; el watcher de conexión lo baja cuando se recupera.
  // Sirve para cortar el bucle de reintentos del auto-fix: si ya sabemos que
  // hay un error activo, no disparamos auto-fix de nuevo hasta que el usuario
  // actúe o se recompile.
  hasBuildError: boolean;
  setBuildError: (val: boolean) => void;
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
  // #8 Snapshot ANTERIOR al último setFiles/updateMultipleFiles. Lo guarda el
  // store junto con lastBuildDiff para permitir "revertir este archivo" desde
  // el DiffViewer (rollback granular por archivo, estilo Cursor).
  lastBuildPrevFiles: Record<string, WebBuilderFile>;
  clearBuildDiff: () => void;
  // Revierte UN archivo al estado que tenía antes del último build (si existe).
  revertFileToPrev: (path: string) => boolean;
  // #8 Aplicación en streaming que acumula el diff (no sobrescribe): durante
  // una orquestación multi-agente, cada emisión incremental vía onFileReady
  // llama a esta función. Si reseteásemos lastBuildDiff cada vez, el diff final
  // solo reflejaría la última emisión parcial y se perderían archivos previos.
  // Aquí calculamos el diff contra el estado previo INICIAL conservado por el
  // primer llamado, y lo acumulamos por path (último gana si un mismo archivo
  // se actualiza múltiples veces).
  setFilesStreaming: (files: Record<string, WebBuilderFile>) => void;

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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #07090e 0%, #0d1117 50%, #111827 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "-10%", left: "-5%",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(24,144,255,0.12) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-5%",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Loader card */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
        maxWidth: "380px", textAlign: "center",
      }}>
        {/* Spinner */}
        <div style={{
          width: "48px", height: "48px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
            <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="#1890FF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <h2 style={{
            fontSize: "0.95rem", fontWeight: 700, color: "#e4e7ec",
            letterSpacing: "0.01em", margin: 0,
          }}>
            Preparando tu proyecto
          </h2>
          <p style={{
            fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.4rem",
            lineHeight: 1.5, margin: "0.4rem 0 0 0",
          }}>
            Describe en el chat qué quieres construir y la IA generará la interfaz aquí en tiempo real.
          </p>
        </div>

        {/* Pulse dots */}
        <div style={{ display: "flex", gap: "6px", marginTop: "0.25rem" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#1890FF",
              animation: \`pulse 1.4s ease-in-out \${i * 0.2}s infinite\`,
            }} />
          ))}
        </div>
      </div>

      <style>{\`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      \`}</style>
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

  // Atomic upsert: INSERT or UPDATE in a single query.
  // Requires UNIQUE constraint on (chat_id, user_id) — added in
  // supabase-webbuilder-migration.sql (uq_ai_webbuilder_projects_chat_user).
  const { error } = await supabase
    .from("ai_webbuilder_projects")
    .upsert(
      {
        chat_id: chatId,
        user_id: userId,
        project_files: projectFiles,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chat_id,user_id" }
    );

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
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
      hasBuildError: false,
      setBuildError: (val) => set({ hasBuildError: val }),

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
      setActiveAgentReports: (reports) => {
        // Guard de igualdad: durante el streaming el effect de chat-landing
        // llama setActiveAgentReports en cada tick de data que contiene
        // agentReports. Sin esta comparación, cada tick escribe un array nuevo
        // → re-renders encadenados en preview-panel (que lee el store sin
        // selector) → tormenta de renders → React #185. Comparamos por
        // contenido (filePath + success) para no re-escribir lo mismo.
        const current = get().activeAgentReports;
        const same = current && reports &&
          current.length === reports.length &&
          current.every((c: any, i: number) =>
            c?.filePath === reports[i]?.filePath &&
            c?.success === reports[i]?.success &&
            c?.agentName === reports[i]?.agentName
          );
        if (same) return;
        set({ activeAgentReports: reports });
      },

      // Cloud Sync state
      hasPendingSave: false,

      // Plan pendiente (modo Plan)
      pendingPlan: null,
      setPendingPlan: (plan) => set({ pendingPlan: plan }),
      clearPendingPlan: () => set({ pendingPlan: null }),

      // Build diff
      lastBuildDiff: [],
      lastBuildPrevFiles: {},
      clearBuildDiff: () => set({ lastBuildDiff: [], lastBuildPrevFiles: {} }),
      revertFileToPrev: (path) => {
        const { lastBuildPrevFiles, files } = get();
        const prev = lastBuildPrevFiles[path];
        if (!prev) return false;
        // Si existía antes, restaurar su código; si no existía, eliminarlo.
        const nextFiles = { ...files };
        if (prev.code && prev.code.length > 0) {
          nextFiles[path] = { code: prev.code };
        } else {
          delete nextFiles[path];
        }
        set({ files: nextFiles });
        debouncedSync();
        return true;
      },
      setFilesStreaming: (incoming) => {
        // Normalizar y calcular diff contra el snapshot previo conservado
        // en lastBuildPrevFiles (el estado ANTES de la orquestación).
        const prev = get().lastBuildPrevFiles;
        // Si no hay snapshot previo (primera emisión del ciclo), capturar
        // el estado actual como base de comparación.
        const base = Object.keys(prev).length > 0
          ? prev
          : get().files;
        const normalized = normalizeFiles(incoming as Record<string, unknown>);
        const currentActive = get().activeFilePath;
        const newActive = !currentActive || currentActive === ""
          ? Object.keys(normalized).find(k => k.endsWith("/App.tsx") || k.endsWith("/App.js")) || Object.keys(normalized)[0] || ""
          : currentActive;
        // Sincronizar openTabs: cualquier archivo nuevo que llegó en esta
        // emisión debe abrirse como pestaña visible. Sin esto, el segundo
        // archivo generado por un agente (ej. /components/Foo.tsx o /styles.css)
        // queda en `files` pero no aparece como tab → el usuario cree que falta.
        const currentTabs = get().openTabs;
        const newPaths = Object.keys(normalized).filter(p => !currentTabs.includes(p));
        // Diff acumulado: el snapshot previo es la base inicial; los archivos
        // nuevos en cada emisión se van sumando. Re-calculamos completo desde
        // la base previa al estado final para que todo el ciclo esté reflejado.
        const diff = diffFileMaps(base, normalized);
        // UN SOLO set() con todo: antes había dos set separados (files/active/tabs
        // y luego diff/prevFiles), lo que disparaba 2 notificaciones de Zustand
        // por emisión. Durante el streaming (múltiples agentes en ráfaga) esto
        // duplicaba los re-renders de preview-panel (que lee el store sin selector)
        // y saturaba la cola de React → #185 Maximum update depth exceeded.
        set({
          files: normalized,
          activeFilePath: newActive,
          openTabs: newPaths.length > 0 ? [...currentTabs, ...newPaths] : currentTabs,
          lastBuildDiff: diff,
          lastBuildPrevFiles: base,
        });
        debouncedSync();
      },

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
        // #8 Guardar también el snapshot previo para permitir revertir archivos.
        set({ lastBuildDiff: diff, lastBuildPrevFiles: prevMulti });
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
        // Sincronizar openTabs con los archivos nuevos (mismo motivo que
        // setFilesStreaming: sin esto, archivos nuevos no aparecen como pestaña).
        const currentTabs = get().openTabs;
        const newPaths = Object.keys(normalized).filter(p => !currentTabs.includes(p));
        // Diff entre el snapshot previo y el nuevo (para el mini-diff de la toolbar).
        const diff = diffFileMaps(prev, normalized);
        // UN SOLO set() con todo (mismo motivo que setFilesStreaming: evitar
        // doble notificación de Zustand que duplica re-renders durante streaming).
        set({
          files: normalized,
          activeFilePath: newActive,
          openTabs: newPaths.length > 0 ? [...currentTabs, ...newPaths] : currentTabs,
          lastBuildDiff: diff,
          lastBuildPrevFiles: prev,
        });
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
          lastBuildPrevFiles: {},
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
          lastBuildPrevFiles: {},
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
      // completeAutoFix = un fix se aplicó y compiló bien → limpiar todo.
      completeAutoFix: () => set({ isAutoFixing: false, lastAutoFixError: null, hasBuildError: false }),
      // failAutoFix = el error sigue → hasBuildError permanece true para que la
      // pantalla de BuildErrorView se muestre y el bucle de reintentos se corte.
      failAutoFix: (error) => set({ isAutoFixing: false, lastAutoFixError: error, hasBuildError: true }),
      resetAutoFixAttempts: () => set({ autoFixAttempts: 0, isAutoFixing: false, lastAutoFixError: null, appliedFixHashes: [], hasBuildError: false }),
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
