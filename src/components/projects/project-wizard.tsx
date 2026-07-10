"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectsStore, type ProjectType, type ProjectStyle, type ProjectColorScheme } from "@/lib/stores/projects-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Globe,
  Smartphone,
  Monitor,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Palette,
  Check,
  Loader2,
  Type,
  Layers,
  Wand2,
  Rocket,
} from "lucide-react";

// ── Paletas de colores precuradas ──

interface ColorPalette {
  id: string;
  name: string;
  colors: ProjectColorScheme;
}

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "ocean",
    name: "Océano",
    colors: { primary: "#1890FF", secondary: "#6366F1", accent: "#06B6D4", background: "#0F1117" },
  },
  {
    id: "emerald",
    name: "Esmeralda",
    colors: { primary: "#10B981", secondary: "#059669", accent: "#34D399", background: "#0A1628" },
  },
  {
    id: "sunset",
    name: "Atardecer",
    colors: { primary: "#F59E0B", secondary: "#EF4444", accent: "#F97316", background: "#1A0A00" },
  },
  {
    id: "lavender",
    name: "Lavanda",
    colors: { primary: "#8B5CF6", secondary: "#A855F7", accent: "#C084FC", background: "#0D0A1A" },
  },
  {
    id: "rose",
    name: "Rosa",
    colors: { primary: "#F43F5E", secondary: "#EC4899", accent: "#FB7185", background: "#1A0A10" },
  },
  {
    id: "slate",
    name: "Corporativo",
    colors: { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA", background: "#0F172A" },
  },
  {
    id: "mint",
    name: "Menta",
    colors: { primary: "#2DD4BF", secondary: "#14B8A6", accent: "#5EEAD4", background: "#042F2E" },
  },
  {
    id: "neon",
    name: "Neón",
    colors: { primary: "#A3E635", secondary: "#84CC16", accent: "#FACC15", background: "#0A0A0A" },
  },
];

// ── Tipos de proyecto ──

interface ProjectTypeOption {
  id: ProjectType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  gradient: string;
  borderColor: string;
  features: string[];
}

const PROJECT_TYPES: ProjectTypeOption[] = [
  {
    id: "web",
    title: "Web",
    subtitle: "Landing pages, portafolios, dashboards",
    icon: Globe,
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    borderColor: "border-blue-500/30 hover:border-blue-400/60",
    features: ["React + Tailwind", "Preview en vivo", "Responsive"],
  },
  {
    id: "app",
    title: "App",
    subtitle: "Apps con interfaz nativa y funcionalidad",
    icon: Smartphone,
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    borderColor: "border-purple-500/30 hover:border-purple-400/60",
    features: ["React Native", "iOS & Android", "Componentes nativos"],
  },
  {
    id: "multiplatform",
    title: "Multiplataforma ∞",
    subtitle: "Web + móvil con código compartido",
    icon: Monitor,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60",
    features: ["Web + Mobile", "Código compartido", "Deploy unificado"],
  },
];

// ── Estilos visuales ──

interface StyleOption {
  id: ProjectStyle;
  name: string;
  description: string;
  preview: string; // CSS class for mini preview
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "minimal",
    name: "Minimalista",
    description: "Limpio, tipografía elegante",
    preview: "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Cristal translúcido, blur",
    preview: "bg-white/10 backdrop-blur border-white/20",
  },
  {
    id: "brutalist",
    name: "Brutalista",
    description: "Alto contraste, bold",
    preview: "bg-black border-white border-2",
  },
  {
    id: "neomorphism",
    name: "Neomorfismo",
    description: "Sombras suaves, 3D sutil",
    preview: "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-700/50 shadow-lg",
  },
  {
    id: "corporate",
    name: "Corporativo",
    description: "Profesional, confiable",
    preview: "bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700",
  },
  {
    id: "playful",
    name: "Divertido",
    description: "Colores vibrantes, dinámico",
    preview: "bg-gradient-to-br from-pink-100 to-yellow-100 dark:from-pink-950 dark:to-yellow-950 border-pink-300 dark:border-pink-700",
  },
];

// ── Iconos para proyectos ──

const PROJECT_ICONS = [
  "🚀", "💻", "🌐", "📱", "🎨", "⚡", "🔥", "💎",
  "🏗️", "🛒", "📊", "🎮", "🎵", "📸", "✨", "🌟",
  "💼", "🏢", "🎯", "🧩", "📚", "🍔", "✈️", "🏥",
];

// ── Animaciones ──

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
};

// ── Componente principal ──

export function ProjectWizard() {
  const router = useRouter();
  const language = useLanguageStore((s) => s.language);

  const {
    isWizardOpen,
    closeWizard,
    wizardStep,
    setWizardStep,
    wizardData,
    updateWizardData,
    createProject,
  } = useProjectsStore();

  const [direction, setDirection] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const goNext = useCallback(() => {
    if (wizardStep < 3) {
      setDirection(1);
      setWizardStep((wizardStep + 1) as 1 | 2 | 3);
    }
  }, [wizardStep, setWizardStep]);

  const goBack = useCallback(() => {
    if (wizardStep > 1) {
      setDirection(-1);
      setWizardStep((wizardStep - 1) as 1 | 2 | 3);
    }
  }, [wizardStep, setWizardStep]);

  const canProceed = useCallback(() => {
    switch (wizardStep) {
      case 1:
        return wizardData.projectType !== null;
      case 2:
        return wizardData.name.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }, [wizardStep, wizardData]);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      const project = await createProject();
      if (project) {
        // Inicializar el webbuilder con el chatId del proyecto
        useWebBuilderStore.getState().setWebBuilderMode(true);
        useWebBuilderStore.getState().initProject(project.chatId!);
        useAIChatStore.setState({ currentChatId: project.chatId });

        toast.success("¡Proyecto creado!", {
          description: `${project.name} está listo para construir.`,
        });

        // Navegar a la página del proyecto
        router.push(`/${language}/proyectos/${project.id}`);
      } else {
        toast.error("Error al crear el proyecto");
      }
    } catch (err) {
      console.error("[ProjectWizard] Create error:", err);
      toast.error("Error inesperado al crear el proyecto");
    } finally {
      setIsCreating(false);
    }
  }, [createProject, router, language]);

  return (
    <Dialog open={isWizardOpen} onOpenChange={(open) => !open && closeWizard()}>
      <DialogContent
        className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white dark:bg-[#0C0E14] border-zinc-200/60 dark:border-white/[0.06] rounded-3xl shadow-2xl"
      >
        <DialogTitle className="sr-only">Crear nuevo proyecto</DialogTitle>

        {/* Header con indicador de pasos */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Nuevo Proyecto</h2>
                <p className="text-[11px] text-muted-foreground">
                  Paso {wizardStep} de 3
                </p>
              </div>
            </div>
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500 ease-out",
                    step === wizardStep
                      ? "w-6 bg-blue-500"
                      : step < wizardStep
                      ? "w-1.5 bg-blue-500/60"
                      : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Steps content */}
        <div className="px-6 pb-2 min-h-[340px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {wizardStep === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <StepProjectType />
              </motion.div>
            )}
            {wizardStep === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <StepConfiguration />
              </motion.div>
            )}
            {wizardStep === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <StepSummary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer con botones de navegación */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between">
          <button
            onClick={wizardStep === 1 ? closeWizard : goBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted/50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {wizardStep === 1 ? "Cancelar" : "Atrás"}
          </button>

          {wizardStep < 3 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                canProceed()
                  ? "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              Siguiente
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  Crear Proyecto
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Paso 1: Tipo de Proyecto ──

function StepProjectType() {
  const { wizardData, updateWizardData } = useProjectsStore();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">¿Qué quieres construir?</h3>
        <p className="text-xs text-muted-foreground">
          Selecciona el tipo de proyecto que deseas desarrollar
        </p>
      </div>

      <div className="grid gap-3">
        {PROJECT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = wizardData.projectType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => updateWizardData({ projectType: type.id })}
              className={cn(
                "relative group text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer",
                isSelected
                  ? `${type.borderColor} ring-1 ring-blue-500/30 dark:ring-blue-400/20`
                  : "border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10"
              )}
            >
              {/* Background gradient */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
                  type.gradient,
                  isSelected && "opacity-100"
                )}
              />

              <div className="relative flex items-start gap-3.5">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    isSelected
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground">{type.title}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4.5 h-4.5 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{type.subtitle}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {type.features.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-foreground/[0.04] dark:bg-white/[0.04] text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 2: Configuración Visual ──

function StepConfiguration() {
  const { wizardData, updateWizardData } = useProjectsStore();
  const [showIcons, setShowIcons] = useState(false);

  return (
    <div className="space-y-5">
      {/* Nombre y descripción */}
      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5 text-muted-foreground" />
            Nombre del Proyecto
          </label>
          <input
            type="text"
            value={wizardData.name}
            onChange={(e) => updateWizardData({ name: e.target.value })}
            placeholder="Mi Proyecto Increíble"
            maxLength={60}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
            Descripción breve
          </label>
          <textarea
            value={wizardData.description}
            onChange={(e) => updateWizardData({ description: e.target.value })}
            placeholder="Describe lo que quieres construir..."
            maxLength={200}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all resize-none"
          />
        </div>
      </div>

      {/* Icono */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">
          Icono
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="w-11 h-11 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-center text-xl hover:border-zinc-300 dark:hover:border-white/10 transition-all cursor-pointer"
          >
            {wizardData.icon}
          </button>
          {showIcons && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-1"
            >
              {PROJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    updateWizardData({ icon });
                    setShowIcons(false);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-muted/60 transition-all cursor-pointer",
                    wizardData.icon === icon && "bg-blue-500/10 ring-1 ring-blue-500/30"
                  )}
                >
                  {icon}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Paleta de colores */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          Paleta de Colores
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PALETTES.map((palette) => {
            const isSelected =
              wizardData.colorScheme.primary === palette.colors.primary;

            return (
              <button
                key={palette.id}
                onClick={() => updateWizardData({ colorScheme: palette.colors })}
                className={cn(
                  "group relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "border-blue-500/40 ring-1 ring-blue-500/20 bg-blue-500/[0.03]"
                    : "border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10"
                )}
              >
                <div className="flex gap-1 mb-1.5 justify-center">
                  {Object.values(palette.colors)
                    .slice(0, 3)
                    .map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground transition-colors block text-center">
                  {palette.name}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="selectedPalette"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estilo visual */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          Estilo Visual
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = wizardData.style === style.id;
            return (
              <button
                key={style.id}
                onClick={() => updateWizardData({ style: style.id })}
                className={cn(
                  "group p-2.5 rounded-xl border text-left transition-all duration-200 relative cursor-pointer",
                  isSelected
                    ? "border-blue-500/40 ring-1 ring-blue-500/20"
                    : "border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-full h-6 rounded-lg mb-1.5 border",
                    style.preview
                  )}
                />
                <span className="text-[10px] font-bold text-foreground block">{style.name}</span>
                <span className="text-[8px] text-muted-foreground block">{style.description}</span>
                {isSelected && (
                  <motion.div
                    layoutId="selectedStyle"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Paso 3: Resumen ──

function StepSummary() {
  const { wizardData } = useProjectsStore();

  const typeInfo = PROJECT_TYPES.find((t) => t.id === wizardData.projectType);
  const styleInfo = STYLE_OPTIONS.find((s) => s.id === wizardData.style);
  const paletteInfo = COLOR_PALETTES.find(
    (p) => p.colors.primary === wizardData.colorScheme.primary
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">Todo listo para crear</h3>
        <p className="text-xs text-muted-foreground">
          Revisa los detalles de tu proyecto antes de comenzar
        </p>
      </div>

      {/* Preview card del proyecto */}
      <div className="relative rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] overflow-hidden">
        {/* Background gradient band */}
        <div
          className="h-20 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${wizardData.colorScheme.primary}40, ${wizardData.colorScheme.secondary}30, ${wizardData.colorScheme.accent}20)`,
          }}
        >
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div
            className="absolute top-3 right-3 w-16 h-16 rounded-full opacity-30 blur-2xl"
            style={{ backgroundColor: wizardData.colorScheme.primary }}
          />
        </div>

        {/* Project info */}
        <div className="px-5 pb-5 -mt-5 relative">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-2xl shadow-lg mb-3">
            {wizardData.icon}
          </div>

          <h4 className="text-lg font-bold text-foreground mb-0.5">
            {wizardData.name || "Sin nombre"}
          </h4>
          {wizardData.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {wizardData.description}
            </p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Tipo
              </span>
              <div className="flex items-center gap-1.5">
                {typeInfo && <typeInfo.icon className="w-3.5 h-3.5 text-foreground" />}
                <span className="text-[11px] font-bold text-foreground">{typeInfo?.title}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Estilo
              </span>
              <span className="text-[11px] font-bold text-foreground">{styleInfo?.name}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Colores
              </span>
              <div className="flex gap-1">
                {Object.values(wizardData.colorScheme)
                  .slice(0, 3)
                  .map((color, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What will happen next */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border border-blue-500/10 dark:border-blue-500/15">
        <Wand2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold text-foreground mb-0.5">
            ¿Qué pasará después?
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            La IA recibirá la configuración de tu proyecto y comenzará a generar la estructura base con tus colores, estilo y tipo de proyecto seleccionados. Podrás editar y refinar en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
