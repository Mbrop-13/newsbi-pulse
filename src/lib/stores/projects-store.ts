import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

// ── Tipos ──

export type ProjectType = "web" | "app" | "multiplatform";

export type ProjectStyle =
  | "minimal"
  | "glassmorphism"
  | "brutalist"
  | "neomorphism"
  | "corporate"
  | "playful";

export interface ProjectColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  colorScheme: ProjectColorScheme;
  style: ProjectStyle;
  icon: string;
  chatId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Wizard state ──

export type WizardStep = 1 | 2 | 3;

export interface WizardData {
  projectType: ProjectType | null;
  name: string;
  description: string;
  colorScheme: ProjectColorScheme;
  style: ProjectStyle;
  icon: string;
}

const DEFAULT_COLOR_SCHEME: ProjectColorScheme = {
  primary: "#1890FF",
  secondary: "#6366F1",
  accent: "#10B981",
  background: "#0F1117",
};

const DEFAULT_WIZARD_DATA: WizardData = {
  projectType: null,
  name: "",
  description: "",
  colorScheme: { ...DEFAULT_COLOR_SCHEME },
  style: "minimal",
  icon: "🚀",
};

// ── Store interface ──

interface ProjectsStore {
  // Proyectos cargados
  projects: Project[];
  isLoading: boolean;
  hasLoaded: boolean;
  /** userId del dueño de la lista actual (evita mezclar cuentas) */
  loadedUserId: string | null;

  // Wizard de creación
  isWizardOpen: boolean;
  wizardStep: WizardStep;
  wizardData: WizardData;

  // Wizard actions
  openWizard: () => void;
  closeWizard: () => void;
  setWizardStep: (step: WizardStep) => void;
  updateWizardData: (data: Partial<WizardData>) => void;
  resetWizard: () => void;

  // CRUD actions
  loadProjects: () => Promise<void>;
  clearProjects: () => void;
  createProject: () => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

// Evita cargas concurrentes de loadProjects
let loadProjectsInFlight: Promise<void> | null = null;
let loadProjectsForUser: string | null = null;

// ── Helper: mapea fila de Supabase a nuestro tipo ──

function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name || "Sin nombre",
    description: row.description || "",
    projectType: row.project_type || "web",
    colorScheme: row.color_scheme || { ...DEFAULT_COLOR_SCHEME },
    style: row.style || "minimal",
    icon: row.icon || "🚀",
    chatId: row.chat_id || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Store ──

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: false,
      hasLoaded: false,
      loadedUserId: null,

      // Wizard state
      isWizardOpen: false,
      wizardStep: 1 as WizardStep,
      wizardData: { ...DEFAULT_WIZARD_DATA },

      // ── Wizard actions ──

      openWizard: () =>
        set({
          isWizardOpen: true,
          wizardStep: 1,
          wizardData: { ...DEFAULT_WIZARD_DATA },
        }),

      closeWizard: () =>
        set({
          isWizardOpen: false,
          wizardStep: 1,
          wizardData: { ...DEFAULT_WIZARD_DATA },
        }),

      setWizardStep: (step) => set({ wizardStep: step }),

      updateWizardData: (data) =>
        set((s) => ({
          wizardData: { ...s.wizardData, ...data },
        })),

      resetWizard: () =>
        set({
          wizardStep: 1,
          wizardData: { ...DEFAULT_WIZARD_DATA },
        }),

      clearProjects: () => {
        loadProjectsInFlight = null;
        loadProjectsForUser = null;
        set({
          projects: [],
          isLoading: false,
          hasLoaded: false,
          loadedUserId: null,
        });
      },

      // ── CRUD ──

      loadProjects: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return;

        // Si ya hay un load en curso para el mismo usuario, reutilizarlo
        if (loadProjectsInFlight && loadProjectsForUser === user.id) {
          return loadProjectsInFlight;
        }

        // Usuario distinto → limpiar lista stale de otra cuenta de inmediato
        if (get().loadedUserId && get().loadedUserId !== user.id) {
          set({
            projects: [],
            hasLoaded: false,
            loadedUserId: null,
          });
        }

        set({ isLoading: true });
        loadProjectsForUser = user.id;

        const run = (async () => {
          try {
            const supabase = createClient();

            // Esperar sesión real de Supabase: RLS usa auth.uid(), no el user del store.
            // Sin esto a veces la query devuelve [] o falla de forma intermitente.
            let session = (await supabase.auth.getSession()).data.session;

            // Un reintento corto si el store ya tiene user pero la sesión aún no hidrató
            if (!session?.user?.id) {
              await new Promise((r) => setTimeout(r, 250));
              session = (await supabase.auth.getSession()).data.session;
            }

            if (!session?.user?.id) {
              // No borrar cache local: puede ser un race de hidratación de auth
              set({ isLoading: false });
              return;
            }

            const userId = session.user.id;

            // Alinear store auth vs session (por si divergieron)
            if (userId !== user.id) {
              set({ projects: [], hasLoaded: false, loadedUserId: null });
            }

            const { data, error } = await supabase
              .from("ai_projects")
              .select("*")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false });

            // Si el usuario cambió mientras cargábamos, descartar resultado
            const currentUser = useAuthStore.getState().user;
            if (!currentUser || currentUser.id !== userId) {
              return;
            }

            if (error) {
              console.error("[ProjectsStore] Error loading projects:", error);
              set({ isLoading: false, hasLoaded: true, loadedUserId: userId });
              return;
            }

            const projects = (data || []).map(mapRowToProject);
            set({
              projects,
              isLoading: false,
              hasLoaded: true,
              loadedUserId: userId,
            });
          } catch (err) {
            console.error("[ProjectsStore] Unexpected error loading projects:", err);
            set({ isLoading: false, hasLoaded: true });
          } finally {
            loadProjectsInFlight = null;
            loadProjectsForUser = null;
          }
        })();

        loadProjectsInFlight = run;
        return run;
      },

      createProject: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        const { wizardData } = get();
        if (!wizardData.projectType || !wizardData.name.trim()) return null;

        try {
          const supabase = createClient();

          // Generar un chatId único para vincular al WebBuilder
          const chatId = `proj_${crypto.randomUUID()}`;

          const { data, error } = await supabase
            .from("ai_projects")
            .insert({
              user_id: user.id,
              name: wizardData.name.trim(),
              description: wizardData.description.trim(),
              project_type: wizardData.projectType,
              color_scheme: wizardData.colorScheme,
              style: wizardData.style,
              icon: wizardData.icon,
              chat_id: chatId,
            })
            .select()
            .single();

          if (error) {
            console.error("[ProjectsStore] Error creating project:", error);
            return null;
          }

          const newProject = mapRowToProject(data);
          set((s) => ({
            projects: [newProject, ...s.projects],
            loadedUserId: user.id,
            hasLoaded: true,
            isWizardOpen: false,
            wizardStep: 1,
            wizardData: { ...DEFAULT_WIZARD_DATA },
          }));

          return newProject;
        } catch (err) {
          console.error("[ProjectsStore] Unexpected error creating project:", err);
          return null;
        }
      },

      deleteProject: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const supabase = createClient();

          // Encontrar el proyecto para obtener su chatId (limpiar archivos webbuilder)
          const project = get().projects.find((p) => p.id === id);

          const { error } = await supabase
            .from("ai_projects")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

          if (error) {
            console.error("[ProjectsStore] Error deleting project:", error);
            return;
          }

          // Limpiar archivos de webbuilder asociados
          if (project?.chatId) {
            await supabase
              .from("ai_webbuilder_projects")
              .delete()
              .eq("chat_id", project.chatId)
              .eq("user_id", user.id);
          }

          set((s) => ({
            projects: s.projects.filter((p) => p.id !== id),
          }));
        } catch (err) {
          console.error("[ProjectsStore] Unexpected error deleting project:", err);
        }
      },

      updateProject: async (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          const supabase = createClient();

          const supabaseUpdates: any = {
            updated_at: new Date().toISOString(),
          };
          if (updates.name !== undefined) supabaseUpdates.name = updates.name;
          if (updates.description !== undefined) supabaseUpdates.description = updates.description;
          if (updates.icon !== undefined) supabaseUpdates.icon = updates.icon;
          if (updates.projectType !== undefined) supabaseUpdates.project_type = updates.projectType;
          if (updates.colorScheme !== undefined) supabaseUpdates.color_scheme = updates.colorScheme;
          if (updates.style !== undefined) supabaseUpdates.style = updates.style;

          const { error } = await supabase
            .from("ai_projects")
            .update(supabaseUpdates)
            .eq("id", id)
            .eq("user_id", user.id);

          if (error) {
            console.error("[ProjectsStore] Error updating project:", error);
            return;
          }

          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id
                ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                : p
            ),
          }));
        } catch (err) {
          console.error("[ProjectsStore] Unexpected error updating project:", err);
        }
      },
    }),
    {
      name: "maverlang-projects",
      partialize: (state) => ({
        // Cache local solo si sabemos de qué usuario es (evita mezclar cuentas).
        // hasLoaded NO se persiste: siempre revalidamos contra Supabase al montar.
        projects: state.projects,
        loadedUserId: state.loadedUserId,
      }),
    }
  )
);
