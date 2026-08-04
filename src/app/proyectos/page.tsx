"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectWizard } from "@/components/projects/project-wizard";
import { ChatInput } from "@/components/chat/chat-input";
import {
  FolderKanban,
  Plus,
  Search,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Filtros ──

type ProjectFilter = "all" | "web" | "app" | "multiplatform";

// ── Skeleton para carga ──

function ProjectSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#16161a] overflow-hidden animate-pulse">
      <div className="h-40 bg-zinc-900/60" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-zinc-900 rounded-full w-3/4" />
            <div className="h-2 bg-zinc-900 rounded-full w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──

export default function ProyectosPage() {
  const { user, isAuthenticated, isLoaded } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const {
    projects,
    loadedUserId,
    loadProjects,
    clearProjects,
    openWizard,
    updateWizardData,
  } = useProjectsStore();

  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [search, setSearch] = useState("");
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  // Cargar proyectos solo cuando auth esté listo y haya sesión real del usuario
  useEffect(() => {
    if (!isLoaded) return;

    if (isAuthenticated && user?.id) {
      void loadProjects();
      return;
    }

    // Logout / sin sesión: no dejar proyectos de otra cuenta en pantalla
    clearProjects();
  }, [isLoaded, isAuthenticated, user?.id, loadProjects, clearProjects]);

  // Logotipos adaptativos
  const isDark = themeMounted && resolvedTheme === "dark";
  const chatLogoSrc = isDark ? "/assets/maverlang-logo-white.png" : "/assets/maverlang-logo.png";

  // Acción al enviar mensaje por el chat superior
  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    if (!isAuthenticated) {
      openModal("register");
      return;
    }

    openWizard();
    updateWizardData({
      name: trimmed.slice(0, 30),
      description: trimmed,
    });
    setInput("");
  };

  // Scroll del contenedor principal (no window: evita pelear con el layout)
  const scrollToTop = () => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setTimeout(() => {
      const textarea = document.getElementById("chat-input") as HTMLTextAreaElement | null;
      if (textarea) textarea.focus();
    }, 400);
  };

  // Solo proyectos del usuario actual (nunca cache de otra cuenta)
  const listBelongsToUser = !!user?.id && loadedUserId === user.id;
  const userProjects = listBelongsToUser ? projects : [];

  const filteredProjects = userProjects.filter((p) => {
    const matchesFilter = filter === "all" || p.projectType === filter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Skeleton solo si aún no hay lista confiable de ESTE usuario
  // (si hay cache del mismo user, se muestra y se revalida en background)
  const showLoading =
    !isLoaded || (isAuthenticated && !!user?.id && !listBelongsToUser);

  return (
    <div className="min-h-full w-full max-w-full min-w-0 bg-background relative pb-16 overflow-x-hidden">
      {/* Elementos decorativos de fondo al estilo premium chat */}
      <div className="absolute top-0 left-0 w-[min(500px,100%)] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[min(400px,100%)] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* SECCIÓN 1: Réplica superior del Chat de IA */}
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-[18vh] sm:pt-[25vh] flex flex-col items-center min-w-0">
        {/* Logotipo Centrado */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-6 sm:mb-8 shrink-0 w-full"
        >
          <img
            src={chatLogoSrc}
            alt="Maverlang Logo"
            className="h-12 sm:h-14 w-auto max-w-[min(220px,70vw)] object-contain select-none pointer-events-none mx-auto"
          />
        </motion.div>

        {/* Barra de Chat Identica */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="w-full min-w-0 max-w-full pb-2"
        >
          <ChatInput
            placeholder="Escribe el prompt para tu nuevo proyecto..."
            onSubmit={handleSend}
            disabled={false}
            isStreaming={false}
            isProjectsPage={true}
            onStop={() => {}}
            value={input}
            onChange={setInput}
          />
        </motion.div>
      </div>

      {/* SECCIÓN 2: Panel de Proyectos */}
      <div className="w-full max-w-5xl mx-auto mt-10 sm:mt-16 px-3 sm:px-4 min-w-0">
        <div className="bg-[#18181b] dark:bg-[#0b0c10]/90 border border-zinc-200/10 dark:border-white/[0.04] rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden min-w-0">
          {/* Fondo de patrón de rejilla sutil */}
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Cabecera del Panel */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              {/* Caja de Búsqueda — full width en móvil */}
              <div className="relative flex-1 min-w-0 sm:flex-none sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={language === "en" ? "Search" : "Buscar"}
                  className="pl-9 pr-3 py-2 w-full sm:w-48 max-w-full rounded-full border border-zinc-800 bg-[#121214] text-zinc-200 placeholder:text-zinc-500 text-xs focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              <button
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                }}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer font-semibold shrink-0"
              >
                <span className="hidden xs:inline sm:inline">Browse all</span>
                <span className="sm:hidden">Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filtros: scroll horizontal en móvil, sin desbordar */}
            <div className="w-full min-w-0 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-0.5 px-0.5">
              <div className="flex items-center gap-1.5 w-max max-w-none">
                {(
                  [
                    { id: "all" as const, label: language === "en" ? "All" : "Todos" },
                    { id: "web" as const, label: "Web" },
                    { id: "app" as const, label: "App" },
                    { id: "multiplatform" as const, label: language === "en" ? "Multi" : "Multi" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      filter === tab.id
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow-lg"
                        : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                    )}
                  >
                    {tab.label}
                    {tab.id === "multiplatform" ? " ∞" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido: Rejilla de proyectos */}
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center max-w-sm mx-auto relative z-10 px-1">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <FolderKanban className="w-7 h-7 text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-1.5">Inicia sesión para gestionar tus proyectos</h3>
              <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed">
                Crea interfaces web completas, aplicaciones interactivas y más con asistencia de IA en tiempo real.
              </p>
              <button
                onClick={() => openModal("login")}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-md transition-all cursor-pointer"
              >
                Ingresar ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 relative z-10 min-w-0">
              <div
                onClick={scrollToTop}
                className="group border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-[#121214]/50 hover:border-white/20 transition-all rounded-lg h-[200px] sm:h-[220px] flex flex-col items-center justify-center cursor-pointer select-none bg-zinc-900/5 min-w-0"
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-300">
                  <Plus className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  Nuevo proyecto
                </span>
              </div>

              {showLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <ProjectSkeleton key={i} />
                ))
              ) : filteredProjects.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center p-4 sm:p-6 border border-zinc-800/40 rounded-lg bg-zinc-900/5 min-h-[180px] sm:h-[220px] text-center min-w-0">
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {search || filter !== "all"
                      ? "No se encontraron proyectos con los filtros de búsqueda aplicados."
                      : "Aún no tienes proyectos creados. ¡Escribe un prompt en el chat de arriba para comenzar!"}
                  </p>
                </div>
              ) : (
                filteredProjects.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ProjectWizard />
    </div>
  );
}
