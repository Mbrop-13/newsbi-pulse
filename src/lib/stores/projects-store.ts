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
  createProject: () => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Pick<Project, "name" | "description" | "icon">>) => Promise<void>;
}

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

      // ── CRUD ──

      loadProjects: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true });
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("ai_projects")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

          if (error) {
            console.error("[ProjectsStore] Error loading projects:", error);
            set({ isLoading: false, hasLoaded: true });
            return;
          }

          const projects = (data || []).map(mapRowToProject);
          set({ projects, isLoading: false, hasLoaded: true });
        } catch (err) {
          console.error("[ProjectsStore] Unexpected error loading projects:", err);
          set({ isLoading: false, hasLoaded: true });
        }
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

          const { error } = await supabase
            .from("ai_projects")
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
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
        // Solo persistir la lista de proyectos para UX instantánea
        // (luego se re-sincroniza con loadProjects).
        projects: state.projects,
        hasLoaded: state.hasLoaded,
      }),
    }
  )
);
