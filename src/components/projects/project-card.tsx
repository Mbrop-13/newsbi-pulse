"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectsStore, type Project } from "@/lib/stores/projects-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { renderProjectToHtml } from "@/lib/webbuilder-canvas-renderer";
import { normalizeFiles } from "@/lib/stores/webbuilder-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Check,
  AlertTriangle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Helpers ──

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

// Cache de previews para no re-fetch al re-renderizar la grilla
const previewCache = new Map<string, { html: string | null; error: string | null }>();

// ── Fallback mockup (sin archivos o cargando fallido) ──

function ProjectMockupPreview({ project }: { project: Project }) {
  const primary = project.colorScheme.primary;
  const secondary = project.colorScheme.secondary;
  const accent = project.colorScheme.accent;
  const bg = project.colorScheme.background || "#0b0f19";

  return (
    <div
      className="w-full h-full p-3 flex flex-col justify-between font-sans text-[8px] select-none overflow-hidden relative"
      style={{ backgroundColor: bg }}
    >
      <div
        className="absolute inset-0 opacity-25 pointer-events-none blur-2xl"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${primary}, ${secondary} 50%, transparent 100%)`,
        }}
      />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      <div className="flex-1 flex gap-2 items-stretch z-10 min-h-0">
        <div className="w-8 bg-white/5 border border-white/10 rounded-md p-1.5 flex flex-col gap-1.5 shrink-0">
          <div className="h-1.5 rounded-sm w-full" style={{ backgroundColor: primary }} />
          <div className="h-1 w-5 bg-white/10 rounded-sm" />
          <div className="h-1 w-4 bg-white/10 rounded-sm" />
          <div className="h-1 w-6 bg-white/10 rounded-sm" />
        </div>
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="h-2 w-16 rounded-sm" style={{ backgroundColor: primary }} />
          <div className="h-1 w-24 bg-white/20 rounded-sm" />
          <div className="flex-1 border border-white/10 bg-white/5 rounded-md p-1.5 flex gap-1 items-end">
            <div className="w-full h-[40%] rounded-sm" style={{ backgroundColor: primary }} />
            <div className="w-full h-[75%] rounded-sm" style={{ backgroundColor: secondary }} />
            <div className="w-full h-[100%] rounded-sm" style={{ backgroundColor: accent }} />
            <div className="w-full h-[55%] rounded-sm bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini error elegante cuando el preview del proyecto falla
function ProjectPreviewError({ project }: { project: Project }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ backgroundColor: project.colorScheme.background || "#0b0f19" }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${project.colorScheme.primary}33, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-400/90" />
        </div>
        <p className="text-[10px] font-semibold text-white/80 leading-tight">
          Preview no disponible
        </p>
        <p className="text-[8px] text-white/40 leading-snug max-w-[140px]">
          Abre el proyecto para repararlo
        </p>
      </div>
    </div>
  );
}

// ── Preview real (iframe escalado del código del proyecto) ──

type PreviewStatus = "idle" | "loading" | "ready" | "empty" | "error";

const PREVIEW_BASE_W = 1280;
const PREVIEW_BASE_H = 800;

function ProjectLivePreview({ project }: { project: Project }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [html, setHtml] = useState<string | null>(null);
  const [scale, setScale] = useState(0.25);

  // Escala al ancho real de la card (preview centrada y a todo el ancho)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_BASE_W);
    };
    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cargar solo cuando la card entra en viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatus((s) => (s === "idle" ? "loading" : s));
          obs.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fetch + render del HTML del proyecto
  useEffect(() => {
    if (status !== "loading") return;

    const userId = useAuthStore.getState().user?.id;
    const cacheKey = `${userId || "anon"}:${project.chatId || project.id}`;
    const cached = previewCache.get(cacheKey);
    if (cached) {
      if (cached.error) {
        setStatus("error");
      } else if (cached.html) {
        setHtml(cached.html);
        setStatus("ready");
      } else {
        setStatus("empty");
      }
      return;
    }

    if (!project.chatId || !userId) {
      previewCache.set(cacheKey, { html: null, error: null });
      setStatus("empty");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        // Asegurar sesión Supabase (RLS) antes de leer archivos del usuario
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          if (!cancelled) setStatus("empty");
          return;
        }

        const { data, error } = await supabase
          .from("ai_webbuilder_projects")
          .select("project_files")
          .eq("chat_id", project.chatId)
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data?.project_files) {
          previewCache.set(cacheKey, { html: null, error: null });
          setStatus("empty");
          return;
        }

        const files = normalizeFiles(data.project_files as Record<string, unknown>);
        const hasCode = Object.values(files).some(
          (f) => (f?.code ?? "").trim().length > 0
        );

        if (!hasCode) {
          previewCache.set(cacheKey, { html: null, error: null });
          setStatus("empty");
          return;
        }

        const result = renderProjectToHtml(files);
        if (cancelled) return;

        if (result.error || !result.html) {
          previewCache.set(cacheKey, { html: null, error: result.error || "error" });
          setStatus("error");
          return;
        }

        previewCache.set(cacheKey, { html: result.html, error: null });
        setHtml(result.html);
        setStatus("ready");
      } catch {
        if (!cancelled) {
          previewCache.set(cacheKey, { html: null, error: null });
          setStatus("empty");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, project.chatId, project.id]);

  // Errores de runtime solo de ESTE iframe → estado local (sin tocar webbuilder store)
  useEffect(() => {
    if (status !== "ready") return;

    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "MAVERLANG_RUNTIME_ERROR") return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      setStatus("error");
      const userId = useAuthStore.getState().user?.id;
      const cacheKey = `${userId || "anon"}:${project.chatId || project.id}`;
      previewCache.set(cacheKey, { html: null, error: e.data?.message || "runtime" });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [status, project.chatId, project.id]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#111113]">
      {status === "ready" && html ? (
        <div className="absolute inset-0 overflow-hidden bg-white">
          <iframe
            ref={iframeRef}
            title={`Preview ${project.name}`}
            srcDoc={html}
            sandbox="allow-scripts"
            className="border-0 pointer-events-none absolute top-0 left-0"
            style={{
              width: PREVIEW_BASE_W,
              height: PREVIEW_BASE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            tabIndex={-1}
            aria-hidden
          />
          {/* Overlay para capturar el click del Link padre */}
          <div className="absolute inset-0 z-[5]" />
        </div>
      ) : status === "error" ? (
        <ProjectPreviewError project={project} />
      ) : status === "loading" || status === "idle" ? (
        <div className="w-full h-full relative">
          <ProjectMockupPreview project={project} />
          <div className="absolute inset-0 bg-black/15 flex items-end justify-center pb-3">
            <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        <ProjectMockupPreview project={project} />
      )}
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      // Invalidar cache del preview de esta tarjeta
      const userId = useAuthStore.getState().user?.id;
      const cacheKey = `${userId || "anon"}:${project.chatId || project.id}`;
      previewCache.delete(cacheKey);
      toast.success(
        project.chatId
          ? "Proyecto y chat eliminados"
          : "Proyecto eliminado"
      );
      setShowDeleteDialog(false);
    } catch {
      toast.error("No se pudo eliminar el proyecto");
    } finally {
      setIsDeleting(false);
    }
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
    <>
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
          "group relative block rounded-lg border border-zinc-800 bg-[#16161a] overflow-hidden transition-all duration-300",
          "hover:border-zinc-700 hover:shadow-xl hover:shadow-black/50",
          "hover:-translate-y-0.5 active:scale-[0.99]",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {/* Live preview del proyecto (o mockup/error si no hay código) */}
        <div className="h-40 relative overflow-hidden border-b border-zinc-800/80 bg-[#111113]">
          <ProjectLivePreview project={project} />

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
                    e.stopPropagation();
                    setShowDeleteDialog(true);
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

    <Dialog open={showDeleteDialog} onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}>
      <DialogContent
        showCloseButton={!isDeleting}
        className="max-w-md rounded-2xl border border-zinc-800 bg-[#16161a] p-6 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Eliminar proyecto
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-400 leading-relaxed text-left">
            ¿Seguro que quieres eliminar{" "}
            <span className="font-semibold text-zinc-200">&ldquo;{project.name}&rdquo;</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {project.chatId && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              También se eliminará el <strong className="font-semibold text-amber-100">chat asociado</strong> a este proyecto, incluida toda su conversación e historial.
            </p>
          </div>
        )}

        <DialogFooter className="mt-2 border-0 bg-transparent p-0 sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => setShowDeleteDialog(false)}
            className="rounded-xl border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Eliminando…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
