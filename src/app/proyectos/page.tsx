"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectWizard } from "@/components/projects/project-wizard";
import { EmptyProjects } from "@/components/projects/empty-projects";
import {
  FolderKanban,
  Plus,
  Search,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Filtros ──

type ProjectFilter = "all" | "web" | "app" | "multiplatform";

const FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "web", label: "Sitios Web" },
  { id: "app", label: "Apps" },
  { id: "multiplatform", label: "Multiplataforma" },
];

// ── Skeleton para carga ──

function ProjectSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden animate-pulse">
      <div className="h-24 bg-muted/30" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted/40" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted/40 rounded-full w-3/4" />
            <div className="h-2.5 bg-muted/30 rounded-full w-1/2" />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="h-2.5 bg-muted/20 rounded-full w-16" />
          <div className="flex -space-x-1">
            <div className="w-3 h-3 rounded-full bg-muted/30" />
            <div className="w-3 h-3 rounded-full bg-muted/30" />
            <div className="w-3 h-3 rounded-full bg-muted/30" />
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
    isLoading,
    hasLoaded,
    loadProjects,
    openWizard,
  } = useProjectsStore();

  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [search, setSearch] = useState("");

  // Cargar proyectos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects();
    }
  }, [isAuthenticated, user, loadProjects]);

  // Gate: usuario no autenticado
  if (isLoaded && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-7 h-7 text-blue-500/70" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Inicia sesión para ver tus proyectos
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Crea sitios web, aplicaciones y más con la ayuda de IA. Necesitas una cuenta para empezar.
          </p>
          <div className="flex items-center justify-center gap-3">
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
        </motion.div>
      </div>
    );
  }

  // Filtrar proyectos
  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === "all" || p.projectType === filter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const showLoading = !hasLoaded || isLoading;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Proyectos
                </h1>
              </div>
              <p className="text-[13px] text-muted-foreground ml-[42px]">
                Crea y gestiona tus proyectos de desarrollo con IA
              </p>
            </div>

            <button
              onClick={openWizard}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </button>
          </div>
        </motion.div>

        {/* Toolbar: filters + search */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
          >
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-zinc-100/60 dark:bg-white/[0.03] rounded-xl p-1 border border-zinc-200/40 dark:border-white/[0.04]">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer",
                    filter === f.id
                      ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proyecto..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Content */}
        {showLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjects />
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <SlidersHorizontal className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground mb-1">
              No se encontraron proyectos
            </p>
            <p className="text-xs text-muted-foreground/70">
              Intenta cambiar los filtros o la búsqueda
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Wizard modal */}
      <ProjectWizard />
    </div>
  );
}
