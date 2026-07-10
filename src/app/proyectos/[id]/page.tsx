"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useProjectsStore, type Project } from "@/lib/stores/projects-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { ChatLanding } from "@/components/chat/chat-landing";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ArrowLeft,
  FolderKanban,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import Link from "next/link";

function getProjectTypeLabel(type: string): string {
  switch (type) {
    case "web":
      return "Web";
    case "app":
      return "App";
    case "multiplatform":
      return "Multiplataforma ∞";
    default:
      return type;
  }
}

function getProjectTypeIcon(type: string) {
  switch (type) {
    case "web":
      return Globe;
    case "app":
      return Smartphone;
    case "multiplatform":
      return Monitor;
    default:
      return Globe;
  }
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const language = useLanguageStore((s) => s.language);

  const { user, isAuthenticated, isLoaded } = useAuthStore();
  const { openModal } = useAuthModalStore();

  const {
    projects,
    hasLoaded: projectsLoaded,
    loadProjects,
  } = useProjectsStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Encontrar el proyecto
  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  // Cargar proyectos si aún no se han cargado
  useEffect(() => {
    if (isAuthenticated && user && !projectsLoaded) {
      loadProjects();
    }
  }, [isAuthenticated, user, projectsLoaded, loadProjects]);

  // Inicializar WebBuilder cuando el proyecto está disponible
  useEffect(() => {
    if (!project) {
      if (projectsLoaded) {
        setError("Proyecto no encontrado");
        setIsInitializing(false);
      }
      return;
    }

    // Configurar el WebBuilder con el chatId del proyecto
    const wbStore = useWebBuilderStore.getState();
    const chatStore = useAIChatStore.getState();

    // Activar modo WebBuilder
    wbStore.setWebBuilderMode(true);

    // Si el chatId del proyecto es diferente al activo, inicializar
    if (wbStore.activeProjectId !== project.chatId) {
      wbStore.initProject(project.chatId!);

      // Intentar cargar archivos desde la nube
      wbStore.loadFromCloud(project.chatId!).then((success) => {
        if (!success) {
          console.log(
            "[ProjectWorkspace] No existing files found, using defaults"
          );
        }
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }

    // Configurar el chat con el chatId del proyecto
    if (chatStore.currentChatId !== project.chatId) {
      chatStore.clearMessages();
      useAIChatStore.setState({
        currentChatId: project.chatId,
      });
    }

    // Generar el system prompt enriquecido basado en el brief del proyecto.
    // Se guarda en metadata del store para que el API lo recoja.
    const brief = buildProjectBrief(project);
    useAIChatStore.setState({
      // Inyectar contexto del proyecto en metadata del chat para que el
      // endpoint /api/ai-chat lo incluya en el system prompt.
      attachedArticles: [],
      attachedFiles: [],
    });

    // Si no hay mensajes previos, inyectar un mensaje del sistema con el brief
    const msgs = useAIChatStore.getState().messages;
    if (msgs.length === 0) {
      useAIChatStore.getState().addMessage({
        id: `proj-brief-${project.id}`,
        role: "assistant",
        content: brief,
        timestamp: new Date(),
      });
    }

    // Cleanup: no desactivar WebBuilder al desmontar para que
    // el workspace persista si el usuario navega dentro del proyecto.
  }, [project, projectsLoaded]);

  // Gate: auth
  if (isLoaded && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
        <FolderKanban className="w-10 h-10 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">
          Inicia sesión para acceder a tus proyectos
        </h2>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => openModal("login")}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-foreground border border-zinc-200 dark:border-white/10 hover:bg-muted/50 transition-all cursor-pointer"
          >
            Entrar
          </button>
          <button
            onClick={() => openModal("register")}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-md transition-all cursor-pointer"
          >
            Registrarse
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isInitializing || !projectsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">Cargando proyecto...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preparando tu espacio de trabajo
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
        <FolderKanban className="w-10 h-10 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">
          {error || "Proyecto no encontrado"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          El proyecto que buscas no existe o fue eliminado.
        </p>
        <Link href={`/${language}/proyectos`}>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-md transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Volver a Proyectos
          </button>
        </Link>
      </div>
    );
  }

  // Renderizar el ChatLanding que maneja internamente el WebBuilderWorkspace
  return <ChatLanding />;
}

// ── Helper: genera el brief del proyecto para la IA ──

export function buildProjectBrief(project: Project): string {
  const typeLabel = getProjectTypeLabel(project.projectType);
  const colors = project.colorScheme;

  let brief = `🚀 **Proyecto: ${project.name}**\n\n`;
  brief += `Se ha configurado un nuevo proyecto de tipo **${typeLabel}** con las siguientes preferencias:\n\n`;

  if (project.description) {
    brief += `📝 **Descripción:** ${project.description}\n\n`;
  }

  brief += `🎨 **Paleta de colores:**\n`;
  brief += `- Primario: \`${colors.primary}\`\n`;
  brief += `- Secundario: \`${colors.secondary}\`\n`;
  brief += `- Acento: \`${colors.accent}\`\n`;
  brief += `- Fondo: \`${colors.background}\`\n\n`;

  brief += `✨ **Estilo visual:** ${project.style}\n\n`;

  brief += `¿Qué te gustaría construir? Describe tu idea y comenzaré a generar la interfaz usando tus preferencias de diseño.`;

  return brief;
}
