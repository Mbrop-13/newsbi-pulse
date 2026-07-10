"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectsStore, type Project } from "@/lib/stores/projects-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useAuthStore } from "@/lib/stores/auth-store";
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
      return "Web";
    case "app":
      return "App";
    case "multiplatform":
      return "Multiplataforma ∞";
    default:
      return type;
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 8640000);

  if (diffMins < 1) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ── Previsualización de Mockup de Proyecto Dinámico ──

function ProjectMockupPreview({ project }: { project: Project }) {
  const primary = project.colorScheme.primary;
  const secondary = project.colorScheme.secondary;
  const accent = project.colorScheme.accent;
  const bg = project.colorScheme.background || "#0b0f19";

  return (
    <div
      className="w-full h-full p-2.5 flex flex-col justify-between font-sans text-[8px] select-none overflow-hidden relative"
      style={{ backgroundColor: bg }}
    >
      {/* Background glow using project colors */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none blur-2xl"
        style={{
          background: `radial-gradient(circle at 60% 40%, ${primary}, ${secondary} 50%, transparent 100%)`,
        }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      {/* Browser address bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-1.5 z-10 shrink-0">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
        </div>
        <div className="w-24 h-3 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[5px] text-white/30 font-mono tracking-tight px-1 truncate">
          {project.name.toLowerCase().replace(/\s+/g, "-")}.maverlang.cl
        </div>
        <div className="w-3.5 h-3 rounded bg-white/10 flex items-center justify-center" />
      </div>

      {/* Viewport content */}
      <div className="flex-1 flex gap-2 mt-2 items-stretch z-10 min-h-0">
        {/* Mock Sidebar */}
        <div className="w-7 bg-white/5 border border-white/10 rounded p-1 flex flex-col gap-1.5 shrink-0">
          <div className="h-1.5 rounded w-full" style={{ backgroundColor: primary }} />
          <div className="h-1 w-4 bg-white/10 rounded" />
          <div className="h-1 w-3 bg-white/10 rounded" />
          <div className="h-1 w-5 bg-white/10 rounded" />
        </div>

        {/* Mock Canvas Area */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 justify-between">
          <div className="space-y-1">
            <div className="h-2 w-14 rounded" style={{ backgroundColor: primary }} />
            <div className="h-1 w-20 bg-white/20 rounded" />
          </div>

          {/* Graphical widget mock */}
          {project.projectType === "web" ? (
            <div className="flex-1 border border-white/10 bg-white/5 rounded p-1 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-1 w-6 bg-white/30 rounded" />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              </div>
              <div className="flex gap-0.5 items-end h-6 mt-1">
                <div className="w-full h-[40%] rounded-sm" style={{ backgroundColor: primary }} />
                <div className="w-full h-[75%] rounded-sm" style={{ backgroundColor: secondary }} />
                <div className="w-full h-[100%] rounded-sm" style={{ backgroundColor: accent }} />
                <div className="w-full h-[60%] rounded-sm bg-white/10" />
              </div>
            </div>
          ) : project.projectType === "app" ? (
            <div className="flex-1 border border-white/10 bg-white/5 rounded p-1 flex flex-col justify-between items-center">
              <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center mt-0.5">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primary }} />
              </div>
              <div className="h-1.5 w-12 rounded" style={{ backgroundColor: secondary }} />
            </div>
          ) : (
            <div className="flex-grow grid grid-cols-2 gap-1">
              <div className="border border-white/10 bg-white/5 rounded p-1 flex flex-col justify-between">
                <div className="h-1 w-4 bg-white/20 rounded" />
                <div className="h-2 w-full rounded" style={{ backgroundColor: primary }} />
              </div>
              <div className="border border-white/10 bg-white/5 rounded p-1 flex flex-col justify-between">
                <div className="h-1 w-4 bg-white/20 rounded" />
                <div className="h-2 w-full rounded" style={{ backgroundColor: secondary }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mock status line */}
      <div className="mt-1.5 flex justify-between items-center text-[5px] text-white/30 z-10 border-t border-white/5 pt-1">
        <span className="capitalize">{getProjectTypeLabel(project.projectType)} • {project.style}</span>
        <span className="font-mono flex items-center gap-0.5" style={{ color: accent }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          activo
        </span>
      </div>
    </div>
  );
}

// ── Componente Principal ──

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const language = useLanguageStore((s) => s.language);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const user = useAuthStore((s) => s.user);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Generar la inicial del avatar del creador
  const userInitial = user?.name
    ? user.name.slice(0, 1).toUpperCase()
    : user?.email
    ? user.email.slice(0, 1).toUpperCase()
    : "M";

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
          "group relative block rounded-2xl border border-zinc-800 bg-[#16161a] overflow-hidden transition-all duration-300",
          "hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/60",
          "hover:-translate-y-1 active:scale-[0.98]",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {/* Mockup Preview Area at Top */}
        <div className="h-36 relative overflow-hidden border-b border-zinc-800">
          <ProjectMockupPreview project={project} />

          {/* Options menu floating on top right */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="w-6 h-6 rounded-md bg-[#16161a]/80 backdrop-blur-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="w-44 rounded-xl border border-zinc-850 bg-[#16161a] shadow-2xl p-1 text-zinc-300"
                onClick={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRenaming(true);
                  }}
                  className="text-xs rounded-lg cursor-pointer hover:bg-zinc-805 hover:text-white"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Renombrar
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-850" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="text-xs rounded-lg text-red-400 focus:text-red-500 hover:bg-red-950/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card Body: User Avatar + Project metadata stacked vertically */}
        <div className="p-4 bg-[#121215] flex items-center gap-3">
          {/* User Initial Avatar (styled like the image) */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white select-none shrink-0"
            style={{
              background: `linear-gradient(135deg, ${project.colorScheme.primary}, ${project.colorScheme.secondary})`
            }}
          >
            {userInitial}
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
                  className="flex-1 text-xs font-bold text-white bg-transparent border-b border-blue-500 focus:outline-none py-0.5"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRename();
                  }}
                  className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <h3 className="text-[13px] font-bold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
            )}
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Editado {formatRelativeDate(project.updatedAt)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
