"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectsStore, type Project } from "@/lib/stores/projects-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Globe,
  Smartphone,
  Monitor,
  MoreHorizontal,
  Trash2,
  Pencil,
  Clock,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ── Helpers ──

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

function getProjectTypeLabel(type: string): string {
  switch (type) {
    case "web":
      return "Sitio Web";
    case "app":
      return "App Móvil";
    case "multiplatform":
      return "Multiplataforma";
    default:
      return type;
  }
}

function getProjectTypeBadgeColor(type: string): string {
  switch (type) {
    case "web":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "app":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "multiplatform":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

// ── Componente ──

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const language = useLanguageStore((s) => s.language);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const TypeIcon = getProjectTypeIcon(project.projectType);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${project.name}"? Esta acción no se puede deshacer.`)) return;
    setIsDeleting(true);
    await deleteProject(project.id);
    toast.success("Proyecto eliminado");
    setIsDeleting(false);
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === project.name) {
      setIsRenaming(false);
      setRenameValue(project.name);
      return;
    }
    await updateProject(project.id, { name: trimmed });
    setIsRenaming(false);
    toast.success("Nombre actualizado");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.32, 0.72, 0, 1],
      }}
    >
      <Link
        href={`/${language}/proyectos/${project.id}`}
        className={cn(
          "group relative block rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden transition-all duration-300",
          "hover:border-zinc-300/80 dark:hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/[0.03] dark:hover:shadow-black/20",
          "hover:-translate-y-1 active:scale-[0.98]",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {/* Gradient band at top */}
        <div
          className="h-24 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${project.colorScheme.primary}30, ${project.colorScheme.secondary}20, ${project.colorScheme.accent}15)`,
          }}
        >
          {/* Decorative orbs */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
            style={{ backgroundColor: project.colorScheme.primary }}
          />
          <div
            className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
            style={{ backgroundColor: project.colorScheme.accent }}
          />

          {/* Options menu */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 rounded-lg bg-white/60 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="w-44 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-950 shadow-xl p-1"
                onClick={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRenaming(true);
                  }}
                  className="text-xs rounded-lg cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Renombrar
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="text-xs rounded-lg text-red-500 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Type badge */}
          <div className="absolute bottom-2.5 left-3 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md",
                getProjectTypeBadgeColor(project.projectType)
              )}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              {getProjectTypeLabel(project.projectType)}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Icon + Name */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform duration-300">
              {project.icon}
            </div>
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.preventDefault()}
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") {
                        setIsRenaming(false);
                        setRenameValue(project.name);
                      }
                    }}
                    className="flex-1 text-sm font-bold text-foreground bg-transparent border-b border-blue-500/40 focus:outline-none py-0.5"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRename();
                    }}
                    className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500/20 transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsRenaming(false);
                      setRenameValue(project.name);
                    }}
                    className="w-5 h-5 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h3 className="text-sm font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
              )}
              {project.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer: timestamp + colors preview */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(project.updatedAt)}
            </span>
            <div className="flex -space-x-1">
              {Object.values(project.colorScheme)
                .slice(0, 3)
                .map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-white dark:border-zinc-900"
                    style={{ backgroundColor: color }}
                  />
                ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
