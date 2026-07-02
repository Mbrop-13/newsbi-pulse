"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useTheme } from "next-themes"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ModelSelector, type MaverlangModel } from "@/components/chat/model-selector"
import PromptSuggestions from "@/components/chat/prompt-suggestions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAIChatStore, type ChatMessage } from "@/lib/stores/ai-chat-store"

import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"
import { useConversionStore } from "@/lib/stores/conversion-store"
import { getPlanConfig, type PlanTier, getNextTier } from "@/lib/plan-limits"
import { useChat } from "ai/react"
import { ShareChatDialog } from "@/components/assistant/share-chat-dialog"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn, formatDate as fmtDate, getFallbackImage, slugify, getCleanPathname } from "@/lib/utils"
import { useLanguageStore } from "@/lib/stores/language-store"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, Sparkles, Headphones, LineChart, Coins, Landmark, Briefcase, Shield, Lightbulb, Globe, Flame, Calendar, Cpu, ArrowUpRight, ArrowDownRight, MoreHorizontal, Link2, SquarePen, Trash2, FolderOpen, Code2, FileCode2, ChevronRight, Copy, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "@/components/ui/sidebar"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
import { WebBuilderWorkspace } from "@/components/webbuilder/workspace"
import { parseArtifact, actionsToFiles, containsArtifact } from "@/lib/webbuilder-parser"
import { classifyPlanResponse } from "@/lib/webbuilder-plan-utils"
import { CanvasWorkspace } from "@/components/chat/canvas-workspace"
import { useCanvasStore } from "@/lib/stores/canvas-store"
import { useBrowserStore } from "@/lib/stores/browser-store"
import { BrowserWorkspace } from "@/components/chat/browser-workspace"

// Model ID mapping for our API
const MODEL_MAP: Record<string, string> = {
  fast: "fast",
  pro: "pro",
  agent: "agent",
}

interface CreativeCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const CREATIVE_CATEGORIES: CreativeCategory[] = [
  { id: "sitios", label: "Sitios Web & Landings", icon: Globe },
  { id: "simuladores", label: "Simuladores & Calculadoras", icon: Landmark },
  { id: "mini-apps", label: "Mini-aplicaciones", icon: Code2 },
];

interface PreviewItem {
  id: string;
  category: string;
  title: string;
  desc: string;
  mockType: string;
  prompt: string;
  badge?: string;
}

const PREVIEW_ITEMS: PreviewItem[] = [
  // sitios
  {
    id: "stillwater",
    category: "sitios",
    title: "Stillwater Retreat",
    desc: "Landing page de bienestar con tipografía serif, tonos crema y galería interactiva.",
    mockType: "retreat",
    prompt: "Construye una landing page premium para 'Stillwater Retreat', un resort de bienestar y meditación. Usa una paleta de colores beige, crema y piedra con acentos dorados. Incluye una sección de bienvenida, galería de cabañas, un formulario de reserva de retiros interactivo y testimonios con tipografía serif elegante."
  },
  {
    id: "severin",
    category: "sitios",
    title: "Severin Halbe",
    desc: "Portafolio brutalista de arquitectura con alto contraste, títulos serif grandes y minimalismo.",
    mockType: "portfolio",
    prompt: "Crea un sitio web portafolio minimalista y de estilo brutalista para el fotógrafo 'Severin Halbe'. Utiliza un diseño de alto contraste con fondo verde oscuro profundo, tipografía de serif clásica y detalles en oro. Debe incluir una cuadrícula asimétrica para exhibir fotos de proyectos de arquitectura, un menú minimalista y un formulario de contacto directo."
  },
  {
    id: "iron-gym",
    category: "sitios",
    title: "Iron & Steel Gym",
    desc: "Landing de alto rendimiento deportivo con acentos naranja neón y fuentes bold.",
    mockType: "gym",
    prompt: "Diseña una página de aterrizaje de alto rendimiento para el gimnasio 'Iron & Steel Gym'. Utiliza colores oscuros (carbón y negro) con acentos de color naranja neón brillante. Incluye titulares audaces en mayúsculas, una sección con planes de entrenamiento de fuerza y una calculadora para estimar la carga máxima de entrenamiento."
  },
  // simuladores
  {
    id: "compound",
    category: "simuladores",
    title: "Calculadora de Interés Compuesto",
    desc: "Simulador interactivo con sliders de aportes mensuales, tasas de retorno y gráfico exponencial.",
    mockType: "compound",
    prompt: "Construye una calculadora interactiva de interés compuesto en React. El usuario debe poder ajustar el capital inicial, la contribución mensual, los años de plazo y la tasa de interés anual mediante controles deslizantes. Muestra el resultado final de forma visual con un gráfico de crecimiento y una tabla desglosada por años con las ganancias."
  },
  {
    id: "goal",
    category: "simuladores",
    title: "Proyector de Metas de Ahorro",
    desc: "Calcula los años requeridos para jubilarte según tu tasa de ahorro y rentabilidad esperada.",
    mockType: "goal",
    prompt: "Diseña un proyector interactivo de metas de jubilación y libertad financiera. Permite al usuario configurar sus ingresos actuales, gastos mensuales estimados y retorno de inversiones. Muestra un indicador circular de progreso y una proyección de los años necesarios para alcanzar la meta financiera basándose en la regla del 4%."
  },
  {
    id: "mortgage",
    category: "simuladores",
    title: "Simulador de Hipoteca Premium",
    desc: "Desglosa la amortización de principal vs intereses y calcula tu pago mensual neto.",
    mockType: "mortgage",
    prompt: "Crea un simulador interactivo de hipoteca y crédito para vivienda. Permite ingresar el valor de la propiedad, la cuota inicial (%), la tasa de interés anual y el plazo en años. Visualiza mediante un gráfico de barras apiladas la porción mensual dedicada a amortizar el capital frente a los intereses pagados."
  },
  // mini-apps
  {
    id: "pomodoro-planner",
    category: "mini-apps",
    title: "Board Kanban + Pomodoro",
    desc: "Gestor de tareas integrado con temporizador para sesiones enfocadas de desarrollo.",
    mockType: "kanban",
    prompt: "Crea una aplicación de productividad que fusione un tablero Kanban minimalista con un temporizador Pomodoro. Permite agregar, mover y archivar tareas entre columnas (Pendientes, En Proceso, Terminadas). El temporizador debe integrarse con las tareas para contar los ciclos de enfoque dedicados a cada una."
  },
  {
    id: "expense-tracker",
    category: "mini-apps",
    title: "Ledger de Control de Gastos",
    desc: "Registro contable sencillo con etiquetas de categorías y resúmenes de flujos.",
    mockType: "ledger",
    prompt: "Diseña una aplicación tipo Ledger para registrar ingresos y gastos mensuales. Incluye un formulario rápido de entrada, etiquetas personalizables (Comida, Alquiler, Ocio, Inversión), un listado ordenado cronológicamente de transacciones recientes y un bloque superior con el balance neto total y gráficos de barra mensuales."
  },
  {
    id: "code-sandbox",
    category: "mini-apps",
    title: "Editor de Código Interactiva",
    desc: "Entorno sandbox con ventanas de edición y renderizado en vivo de layouts HTML/CSS.",
    mockType: "sandbox",
    prompt: "Desarrolla un sandbox de código interactivo ligero para desarrollo frontend. Debe presentar una pantalla dividida: a la izquierda paneles para escribir código HTML y CSS (con pestañas para cambiar entre ellos), y a la derecha un iframe o contenedor que renderice en tiempo real los cambios visuales aplicados por el usuario."
  }
];

function MockupPreview({ type }: { type: string }) {
  switch (type) {
    case "retreat":
      return (
        <div className="w-full h-full bg-[#fbfaf8] dark:bg-[#1a1917] p-3 flex flex-col justify-between font-serif text-[10px] text-stone-850 dark:text-stone-250 select-none overflow-hidden relative border-b border-border/20">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px]" />
          <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-1.5 z-10">
            <span className="font-semibold tracking-wider text-xs">STILLWATER</span>
            <div className="flex gap-2 text-[7px] font-sans text-stone-500">
              <span>RESORT</span>
              <span>RETIROS</span>
            </div>
          </div>
          <div className="my-auto text-center px-2 py-1 z-10">
            <h4 className="text-[11px] font-medium leading-tight">Encuentra paz en la naturaleza</h4>
            <div className="w-8 h-[1px] bg-amber-600/60 mx-auto my-1.5" />
            <p className="text-[7px] font-sans text-stone-500 leading-normal max-w-[150px] mx-auto line-clamp-1">Un santuario de tranquilidad y renovación mental.</p>
          </div>
          <div className="flex justify-between items-center mt-auto z-10">
            <div className="w-12 h-3 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="w-14 h-4 rounded bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 text-[6px] font-sans flex items-center justify-center font-bold tracking-wide">
              RESERVAR AHORA
            </div>
          </div>
        </div>
      );
    case "portfolio":
      return (
        <div className="w-full h-full bg-[#0d1612] p-3 flex flex-col justify-between font-serif text-[9px] text-[#e3eade] select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center border-b border-white/10 pb-1 z-10">
            <span className="font-bold tracking-widest text-[9px] text-amber-500">SEVERIN HALBE</span>
            <span className="text-[7px] text-[#8e988b]">PORTFOLIO</span>
          </div>
          <div className="flex gap-2 my-auto items-center z-10">
            <div className="w-1/2 aspect-video bg-white/5 border border-white/10 rounded flex items-center justify-center">
              <span className="text-[7px] text-amber-500/60 italic font-sans">BRUTALIST ARCH</span>
            </div>
            <div className="w-1/2 flex flex-col gap-1.5">
              <h4 className="text-[9px] font-bold leading-tight">Estética y Forma</h4>
              <p className="text-[6px] text-[#8e988b] leading-tight line-clamp-2">Exploración visual del concreto expuesto.</p>
            </div>
          </div>
          <div className="flex justify-between items-center text-[7px] text-[#8e988b] mt-auto border-t border-white/10 pt-1 z-10">
            <span>BERLIN, GER</span>
            <span className="text-amber-500 font-sans font-bold">VER PROYECTO ↗</span>
          </div>
        </div>
      );
    case "gym":
      return (
        <div className="w-full h-full bg-[#0a0a0c] p-3 flex flex-col justify-between text-[9px] text-zinc-100 select-none overflow-hidden relative border-b border-border/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="flex justify-between items-center z-10">
            <span className="font-black tracking-tighter text-xs text-orange-500">IRON & STEEL</span>
            <div className="px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[6px] text-zinc-400">GYM</div>
          </div>
          <div className="my-auto z-10 space-y-1">
            <h4 className="text-[10px] font-black tracking-tight leading-none uppercase italic">BUILT BY DISCIPLINE.<br/>FORGED IN IRON.</h4>
            <div className="flex gap-2 items-center text-[7px] text-zinc-400">
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />+500 SOCIOS</span>
              <span>100% COACHES</span>
            </div>
          </div>
          <div className="flex gap-1.5 items-center mt-auto z-10">
            <div className="flex-1 h-4 rounded bg-orange-500 text-black text-[7px] font-black flex items-center justify-center tracking-wider">UNIRSE AL CLUB</div>
            <div className="w-8 h-4 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[8px]">▶</div>
          </div>
        </div>
      );
    case "compound":
      return (
        <div className="w-full h-full bg-[#090d16] p-3 flex flex-col justify-between text-[9px] text-slate-100 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-slate-300">Compound Calculator</span>
            <span className="text-[7px] text-[#1890FF] font-bold bg-[#1890FF]/10 px-1.5 py-0.5 rounded">SIMULATOR</span>
          </div>
          <div className="my-auto flex items-end gap-1.5 h-12 z-10">
            <div className="w-full flex items-end justify-between h-full px-1">
              <div className="w-2.5 h-[15%] bg-slate-800 rounded-t-sm" />
              <div className="w-2.5 h-[22%] bg-slate-800 rounded-t-sm" />
              <div className="w-2.5 h-[32%] bg-slate-700 rounded-t-sm" />
              <div className="w-2.5 h-[48%] bg-[#1890FF]/60 rounded-t-sm" />
              <div className="w-2.5 h-[70%] bg-[#1890FF] rounded-t-sm" />
              <div className="w-2.5 h-[100%] bg-emerald-500 rounded-t-sm" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-auto z-10 border-t border-slate-800 pt-1 text-[7px] text-slate-400">
            <span>Aporte: $250/mes</span>
            <span className="text-emerald-400 font-bold font-mono">+182% Ganado</span>
          </div>
        </div>
      );
    case "goal":
      return (
        <div className="w-full h-full bg-[#05110c] p-3 flex flex-col justify-between text-[9px] text-emerald-100 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-emerald-300">Goal Projector</span>
            <span className="text-[6px] text-emerald-400 font-bold bg-emerald-950 border border-emerald-800/40 px-1 py-0.5 rounded">RULE of 4%</span>
          </div>
          <div className="my-auto flex items-center justify-between gap-2 z-10">
            <div className="w-10 h-10 flex items-center justify-center relative shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-950" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="72, 100" strokeLinecap="round" className="text-emerald-500" />
              </svg>
              <span className="absolute text-[8px] font-bold text-emerald-400">72%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[6px] text-emerald-500 uppercase tracking-wide">Meta Libertad Financiera</span>
              <span className="text-[10px] font-bold text-white">$650K Ahorrado</span>
              <span className="text-[6px] text-emerald-400 font-mono">Restan 4.5 años</span>
            </div>
          </div>
          <div className="mt-auto border-t border-emerald-900/50 pt-1 text-[7px] text-emerald-500 z-10">
            Tasa de ahorro mensual: 45%
          </div>
        </div>
      );
    case "mortgage":
      return (
        <div className="w-full h-full bg-[#110e16] p-3 flex flex-col justify-between text-[9px] text-purple-100 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-purple-300">Mortgage Planner</span>
            <span className="text-[6px] text-purple-400 font-bold bg-purple-950 border border-purple-800/40 px-1 py-0.5 rounded">AMORTIZACIÓN</span>
          </div>
          <div className="my-auto flex gap-3 items-center z-10">
            <div className="flex flex-col gap-1 w-1/2">
              <div className="w-full h-3 rounded bg-zinc-900 border border-zinc-800 p-0.5 flex items-center"><span className="text-[6px] text-zinc-500">Tasa: 4.8%</span></div>
              <div className="w-full h-3 rounded bg-zinc-900 border border-zinc-800 p-0.5 flex items-center"><span className="text-[6px] text-zinc-500">Monto: $300k</span></div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className="flex justify-between text-[6px]">
                <span className="text-blue-400">Principal</span>
                <span className="text-purple-400">Interés</span>
              </div>
              <div className="w-full h-3.5 rounded-sm bg-zinc-900 flex overflow-hidden border border-zinc-800">
                <div className="w-[40%] bg-blue-500" />
                <div className="w-[60%] bg-purple-500" />
              </div>
              <span className="text-[8px] font-bold text-white text-center">$1,574/mes</span>
            </div>
          </div>
          <div className="mt-auto border-t border-purple-900/50 pt-1 text-[7px] text-purple-500 flex justify-between z-10">
            <span>Plazo: 30 Años</span>
            <span className="text-blue-400">Ahorro fiscal: $4k/año</span>
          </div>
        </div>
      );
    case "kanban":
      return (
        <div className="w-full h-full bg-[#0d0f14] p-3 flex flex-col justify-between text-[9px] text-zinc-200 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-zinc-400">Productivity Kanban</span>
            <span className="text-[6px] text-red-400 font-bold bg-red-950/60 border border-red-900 px-1 py-0.5 rounded flex items-center gap-0.5">🍅 POMODORO</span>
          </div>
          <div className="my-auto grid grid-cols-3 gap-1 z-10 w-full">
            <div className="bg-zinc-900/60 rounded p-1 space-y-1 h-12">
              <span className="text-[6px] text-zinc-500 uppercase font-black">TO DO</span>
              <div className="bg-zinc-800 rounded px-1 py-0.5 text-[5px] text-zinc-300 border border-zinc-700/30 truncate">UI Layout</div>
            </div>
            <div className="bg-zinc-900/60 rounded p-1 space-y-1 h-12 border border-blue-500/20">
              <span className="text-[6px] text-blue-400 uppercase font-black">DOING</span>
              <div className="bg-zinc-800 rounded px-1 py-0.5 text-[5px] text-white border border-blue-500/40 truncate font-semibold">Database API</div>
            </div>
            <div className="bg-zinc-900/60 rounded p-1 space-y-1 h-12">
              <span className="text-[6px] text-zinc-500 uppercase font-black">DONE</span>
              <div className="bg-zinc-800 rounded px-1 py-0.5 text-[5px] text-zinc-500 line-through truncate opacity-50">Auth setup</div>
            </div>
          </div>
          <div className="mt-auto border-t border-zinc-850 pt-1 text-[7px] text-zinc-550 z-10 flex justify-between items-center">
            <span>3 Tareas activas</span>
            <span className="text-red-400 font-bold">Sesión: 24:12</span>
          </div>
        </div>
      );
    case "ledger":
      return (
        <div className="w-full h-full bg-[#0a0a0d] p-3 flex flex-col justify-between text-[9px] text-zinc-200 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-zinc-400">Expense Ledger</span>
            <span className="text-[6px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">CASHFLOW</span>
          </div>
          <div className="my-auto space-y-1 z-10 w-full">
            <div className="flex justify-between items-center p-1 rounded bg-zinc-900/50 border border-zinc-800 text-[6px]">
              <span className="text-zinc-300">Amazon Web Services</span>
              <span className="text-red-400 font-bold font-mono">-$45.20</span>
            </div>
            <div className="flex justify-between items-center p-1 rounded bg-zinc-900/50 border border-zinc-800 text-[6px]">
              <span className="text-zinc-300">Nómina Recibida</span>
              <span className="text-emerald-400 font-bold font-mono">+$2,450.00</span>
            </div>
            <div className="flex justify-between items-center p-1 rounded bg-zinc-900/50 border border-zinc-800 text-[6px]">
              <span className="text-zinc-300">Netflix Premium</span>
              <span className="text-red-400 font-bold font-mono">-$15.99</span>
            </div>
          </div>
          <div className="mt-auto border-t border-zinc-850 pt-1 flex justify-between text-[7px] text-zinc-550 z-10">
            <span>Balance del mes</span>
            <span className="text-emerald-400 font-black">+$2,388.81</span>
          </div>
        </div>
      );
    case "sandbox":
      return (
        <div className="w-full h-full bg-[#151922] p-3 flex flex-col justify-between text-[9px] text-slate-300 select-none overflow-hidden relative border-b border-border/20">
          <div className="flex justify-between items-center z-10">
            <span className="font-bold text-slate-400 font-mono">Editor Sandbox</span>
            <span className="text-[6px] text-amber-500 font-bold bg-amber-950/60 border border-amber-900 px-1 py-0.5 rounded">HTML/CSS</span>
          </div>
          <div className="my-auto flex gap-2 items-center z-10 w-full h-12">
            <div className="w-1/2 bg-[#0d1117] rounded border border-slate-800 p-1 flex flex-col font-mono text-[5px] text-slate-450 h-full justify-between overflow-hidden">
              <div>
                <span className="text-purple-400">&lt;div</span> <span className="text-amber-500">class</span>=<span className="text-emerald-400">&quot;btn&quot;</span>&gt;
                <div className="pl-2 text-slate-300">Click me</div>
                <span className="text-purple-400">&lt;/div&gt;</span>
              </div>
            </div>
            <div className="w-1/2 bg-[#090d16] rounded border border-slate-800 flex items-center justify-center h-full">
              <div className="px-2 py-0.5 rounded bg-blue-500 text-white text-[5px] font-bold shadow animate-pulse">Click me</div>
            </div>
          </div>
          <div className="mt-auto border-t border-slate-800 pt-1 text-[7px] text-slate-500 z-10">
            Live Preview activa (120ms latencia)
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-xs select-none">
          Layout Mockup
        </div>
      );
  }
}


function groupConsecutiveMessages(messages: ChatMessage[]): ChatMessage[] {
  const grouped: ChatMessage[] = [];
  
  for (const msg of messages) {
    const isAssistantLike = msg.role === "assistant" || (msg.role as string) === "tool";
    
    if (grouped.length === 0) {
      grouped.push({ 
        ...msg,
        role: isAssistantLike ? "assistant" : msg.role
      });
      continue;
    }
    
    const lastGrouped = grouped[grouped.length - 1];
    const isLastAssistantLike = lastGrouped.role === "assistant";
    
    if (isAssistantLike && isLastAssistantLike) {
      if (msg.content) {
        lastGrouped.content = lastGrouped.content 
          ? (lastGrouped.content + "\n\n" + msg.content).trim()
          : msg.content;
      }
      
      if (msg.toolInvocations) {
        lastGrouped.toolInvocations = [
          ...(lastGrouped.toolInvocations || []),
          ...msg.toolInvocations
        ];
      }
      
      if (msg.citations && msg.citations.length > 0) {
        lastGrouped.citations = Array.from(new Set([
          ...(lastGrouped.citations || []),
          ...msg.citations
        ]));
      }
      
      if (msg.reasoning) {
        lastGrouped.reasoning = lastGrouped.reasoning 
          ? (lastGrouped.reasoning + "\n" + msg.reasoning).trim()
          : msg.reasoning;
      }
      
      if (msg.thinkingSteps) {
        lastGrouped.thinkingSteps = [
          ...(lastGrouped.thinkingSteps || []),
          ...msg.thinkingSteps
        ];
      }
      
      if (msg.reasoningSteps) {
        lastGrouped.reasoningSteps = [
          ...(lastGrouped.reasoningSteps || []),
          ...msg.reasoningSteps
        ];
      }
      
      if (msg.secondsElapsed) {
        lastGrouped.secondsElapsed = (lastGrouped.secondsElapsed || 0) + msg.secondsElapsed;
      }
    } else {
      grouped.push({ 
        ...msg,
        role: isAssistantLike ? "assistant" : msg.role
      });
    }
  }
  
  return grouped;
}


function ChatLandingContent() {
  const { isMobile } = useSidebar()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userTier = useAuthStore((s) =>
    s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free")
  ) as PlanTier
  const { openModal: openConversionModal } = useConversionStore()
  // openModal del auth modal store: para abrir el popup de registro/login cuando
  // un usuario no autenticado intenta enviar un mensaje.
  const { openModal: openAuthModal } = useAuthModalStore()

  const {
    messages: storeMessages,
    addMessage,
    isLoading: storeLoading,
    selectedModel,
    setModel,
    clearMessages,
    savedChats,
    attachedArticles,
    attachedFiles,
    activeTools,
    messageFeedback,
    setFeedback,
    currentChatId,
  } = useAIChatStore()

  const language = useLanguageStore((s) => s.language)

  const [activeMenu, setActiveMenu] = useState<'noticias' | 'mercados' | 'portafolio' | 'mundo' | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    // En PC (vista de escritorio) arrancamos con "Sitios Web & Landings"
    // seleccionado para mostrar la galería de inmediato. En móvil, null.
    typeof window !== "undefined" && window.innerWidth >= 768 ? "sitios" : null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Legacy data fetching and activeMenu state have been removed as part of Phase 5 cleanup.

  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({})
  const [shareDialog, setShareDialog] = useState({ isOpen: false, question: "", answer: "" })
  const lastLoadedChatIdRef = useRef<string | null>(null)

  const router = useRouter()

  const chatFiles = useMemo(() => {
    const files: { id: string, title: string, lang: string, code: string }[] = [];
    storeMessages.forEach((msg, mIdx) => {
      if (msg.role === 'assistant' && msg.content) {
        const matches = [...msg.content.matchAll(/```(\w+)\n([\s\S]+?)```/g)];
        matches.forEach((match, idx) => {
          const lang = match[1];
          const codeValue = match[2].trim();
          let title = lang === 'python' ? 'Script de Python' : `Código ${lang.toUpperCase()}`;
          const firstLine = codeValue.split('\n')[0].trim();
          const filenameMatch = firstLine.match(/(?:filename|archivo|title)\s*:\s*([^\s][^\n\r]*)/i) || 
                                firstLine.match(/(?:\/\/\/|\/\/|#|\/\*)\s*([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]+)/i);
          if (filenameMatch) {
            title = filenameMatch[1].replace(/\*\/$/, '').trim();
          } else {
            title = `${title} ${idx + 1}`;
          }
          files.push({ id: `${mIdx}-${idx}`, title, lang, code: codeValue });
        });
      }
    });
    return files.reverse(); // Más recientes primero
  }, [storeMessages]);

  const browserSessionId = useBrowserStore((s) => s.sessionId);
  const isBrowserOpen = useBrowserStore((s) => s.isOpen);
  const isCanvasOpen = useCanvasStore((s) => s.isOpen);
  const updateScreenshot = useBrowserStore((s) => s.updateScreenshot);
  const addStep = useBrowserStore((s) => s.addStep);
  const updateUrl = useBrowserStore((s) => s.updateUrl);
  const clearSession = useBrowserStore((s) => s.clearSession);

  const updateScreenshotRef = useRef(updateScreenshot);
  const addStepRef = useRef(addStep);
  const updateUrlRef = useRef(updateUrl);
  const clearSessionRef = useRef(clearSession);

  useEffect(() => {
    updateScreenshotRef.current = updateScreenshot;
    addStepRef.current = addStep;
    updateUrlRef.current = updateUrl;
    clearSessionRef.current = clearSession;
  });

  useEffect(() => {
    return () => {
      clearSession();
    };
  }, [clearSession]);

  useEffect(() => {
    if (!browserSessionId) return;

    console.log("[Browser SSE] Connecting to session:", browserSessionId);
    const eventSource = new EventSource(`/api/browser/stream?sessionId=${browserSessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("[Browser SSE] Received event type:", parsed.type);
        
        if (parsed.type === "frame" && parsed.image) {
          updateScreenshotRef.current(parsed.image);
        } else if (parsed.type === "step") {
          addStepRef.current({
            action: parsed.action,
            description: parsed.description,
            status: parsed.status,
          });
          if (parsed.action === "navigate" && parsed.status === "done") {
            const urlMatch = parsed.description.match(/Navegó a (https?:\/\/[^\s]+)/);
            if (urlMatch) {
              updateUrlRef.current(urlMatch[1]);
            }
          }
        } else if (parsed.type === "closed") {
          eventSource.close();
          clearSessionRef.current();
          toast.error("La sesión de navegación ha finalizado");
        }
      } catch (e) {
        console.error("[Browser SSE] Error parsing message:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[Browser SSE] Connection error (standard EventSource will attempt reconnect):", err);
    };

    return () => {
      console.log("[Browser SSE] Closing connection for:", browserSessionId);
      eventSource.close();
    };
  }, [browserSessionId]);

  const handleNewChat = () => {
    clearMessages()
    useCanvasStore.getState().clearCanvas()
    useBrowserStore.getState().clearSession()
    useWebBuilderStore.setState({
      isWebBuilderMode: false,
      files: {},
      activeProjectId: null,
      activeFilePath: "/App.tsx",
      pendingPlan: null
    })
    router.push(`/${language}/ai`)
  }

  const handleDeleteCurrentChat = async () => {
    const chatId = currentChatId
    if (chatId) {
      if (confirm("¿Estás seguro de que deseas eliminar esta conversación?")) {
        await useAIChatStore.getState().deleteSavedChat(chatId)
        clearMessages()
        useCanvasStore.getState().clearCanvas()
        useBrowserStore.getState().clearSession()
        useWebBuilderStore.setState({
          isWebBuilderMode: false,
          files: {},
          activeProjectId: null,
          activeFilePath: "/App.tsx",
          pendingPlan: null
        })
        router.push(`/${language}/ai`)
      }
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Enlace del chat copiado al portapapeles")
    }
  }

  const accumulatedReasoningRef = useRef<string>("")
  const accumulatedCitationsRef = useRef<string[]>([]);

  // Track store hydration
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  useEffect(() => {
    setIsStoreHydrated(useAIChatStore.persist.hasHydrated())
    const unsub = useAIChatStore.persist.onFinishHydration(() => setIsStoreHydrated(true))
    return () => unsub()
  }, [])



  // Track theme mounting for dark mode logo swapping
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => {
    setThemeMounted(true)
  }, [])
  const isDark = themeMounted && resolvedTheme === "dark"
  const chatLogoSrc = isDark ? "/assets/maverlang-logo-white.png" : "/assets/maverlang-logo.png"
  const mobileLogoSrc = isDark ? "/assets/Logo 2-Blanco.png" : "/assets/Maverlang Logo-2.png"

  // AI SDK useChat for streaming
  const {
    messages: aiMessages,
    setMessages: setAiMessages,
    append,
    isLoading: aiLoading,
    stop,
    input,
    handleInputChange,
    setInput,
    data,
  } = useChat({
    api: "/api/ai-chat",
    fetch: async (url, options) => {
      const response = await fetch(url, options);
      if (!response.ok) {
        try {
          const clone = response.clone();
          const errData = await clone.json();
          if (errData?.code === "TOKEN_LIMIT_REACHED") {
            // Mostrar el banner sobre la barra de input en lugar de abrir
            // directamente el modal. El botón "Ver planes" del banner abre
            // el modal de upgrade.
            useConversionStore.getState().setTokenLimitReached(errData.details);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      return response;
    },
    onFinish: (message) => {
      try {
        // Find citations & reasoning in streamData (data) or accumulated refs
        let citationsList: string[] = accumulatedCitationsRef.current.length > 0 ? accumulatedCitationsRef.current : []
        let reasoningText = accumulatedReasoningRef.current || ""
        let agentReportsData: any[] = []
        if (citationsList.length === 0 || !reasoningText || agentReportsData.length === 0) {
          if (data && data.length > 0) {
            const citationObj = (data as any[]).find((d: any) => d?.type === 'citations')
            if (citationObj?.urls && citationsList.length === 0) {
              citationsList = citationObj.urls
            }
            const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning')
            const streamReasoning = reasoningChunks.map(c => c.text).join('')
            if (streamReasoning && !reasoningText) reasoningText = streamReasoning
            
            const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports')
            if (reportsObj?.reports) {
              agentReportsData = reportsObj.reports
            }
          }
        }

        // Capturar el plan pendiente (modo Plan) para adjuntarlo a este mensaje
        // y poder renderizar la tarjeta en el chat. Si llegó un plan en este
        // turno, pendingPlan estará set en el store.
        const pendingPlanData = useWebBuilderStore.getState().pendingPlan;
        const messagePendingPlan = pendingPlanData
          ? { planId: pendingPlanData.planId, reason: pendingPlanData.reason, agents: pendingPlanData.agents }
          : undefined;

        // Use requestAnimationFrame to ensure aiMessages state has been flushed by React
        requestAnimationFrame(() => {
          try {
            const latestMessages = aiMessagesRef.current;
            const lastAssistantIdx = [...latestMessages].reverse().findIndex(m => m.role === 'assistant' || m.role === 'tool');
            const targetIdx = lastAssistantIdx !== -1 ? (latestMessages.length - 1 - lastAssistantIdx) : -1;

            const firstMsgText = message.content || "";
            const toolsCalled = message.toolInvocations || [];
            const hasTools = toolsCalled.length > 0;
            const finalContent = (firstMsgText.trim().length > 0)
              ? firstMsgText
              : hasTools
                ? "He procesado los datos financieros solicitados y configurado los paneles interactivos correspondientes. Puedes revisar la información en los widgets de arriba."
                : "Lo siento, la respuesta de la IA se detuvo inesperadamente sin generar texto. Por favor, intenta de nuevo.";

            const currentStoreMessages = useAIChatStore.getState().messages;

            const storeMessages: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
              const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id);
              const isTarget = idx === targetIdx;
              if (isTarget) {
                return {
                  id: message.id,
                  role: "assistant",
                  content: finalContent,
                  timestamp: m.timestamp || new Date(),
                  model: selectedModel === "fast" ? "deepseek" : "grok",
                  toolInvocations: message.toolInvocations || m.toolInvocations,
                  citations: citationsList,
                  reasoning: reasoningText || m.reasoning || undefined,
                  reasoningSteps: agentReportsData.length > 0 ? agentReportsData : m.reasoningSteps || storeMsg?.reasoningSteps || undefined,
                  secondsElapsed: m.secondsElapsed,
                  pendingPlan: messagePendingPlan || storeMsg?.pendingPlan,
                };
              }
              return {
                id: m.id,
                role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
                content: m.content,
                timestamp: storeMsg?.timestamp || m.timestamp || new Date(),
                model: storeMsg?.model || m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
                toolInvocations: m.toolInvocations,
                citations: storeMsg?.citations || m.citations || [],
                reasoning: storeMsg?.reasoning || m.reasoning || undefined,
                reasoningSteps: storeMsg?.reasoningSteps || m.reasoningSteps || undefined,
                secondsElapsed: storeMsg?.secondsElapsed || m.secondsElapsed,
              };
            });

            if (targetIdx === -1) {
              storeMessages.push({
                id: message.id,
                role: "assistant",
                content: finalContent,
                timestamp: new Date(),
                model: selectedModel === "fast" ? "deepseek" : "grok",
                toolInvocations: message.toolInvocations,
                citations: citationsList,
                reasoning: reasoningText || undefined,
                reasoningSteps: agentReportsData.length > 0 ? agentReportsData : undefined,
              });
            }

            useAIChatStore.setState({ messages: storeMessages });
            useAIChatStore.getState().updateCurrentChat();

            // Sync back to useChat's messages state so that reasoningSteps, citations, etc are preserved in aiMessages
            setAiMessages(
              storeMessages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                toolInvocations: m.toolInvocations,
                reasoning: m.reasoning,
                citations: m.citations,
                model: m.model,
                isCollapsed: m.isCollapsed,
                secondsElapsed: m.secondsElapsed,
                reasoningSteps: m.reasoningSteps,
                timestamp: m.timestamp,
                createdAt: m.timestamp ? new Date(m.timestamp) : undefined,
              })) as any
            );
          } catch (e) {
            console.error("Error in onFinish inner state transition:", e);
          } finally {
            // Signal that the AI has finished responding
            useWebBuilderStore.getState().setAiResponding(false);
            useWebBuilderStore.getState().setActiveAgentReports(null);
          }
        });
      } catch (err) {
        console.error("Error in onFinish outer transition block:", err);
        useWebBuilderStore.getState().setAiResponding(false);
        useWebBuilderStore.getState().setActiveAgentReports(null);
      }
    },
    onError: (error) => {
      console.error("[AI Chat] Stream error:", error);
      toast.error(error.message || "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.");
      useWebBuilderStore.getState().setAiResponding(false);
      useWebBuilderStore.getState().setActiveAgentReports(null);
    }
  })

  const searchParams = useSearchParams();

  // Check for auto-start prompt in URL parameters
  useEffect(() => {
    if (!isStoreHydrated) return;
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      // Clear search params to prevent loop on reload/navigation
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);

      // Start new chat with this prompt
      handleNewChat();
      
      // Paste the prompt in the input bar instead of sending automatically
      setTimeout(() => {
        setInput(promptParam);
      }, 150);
    }
  }, [isStoreHydrated, searchParams, setInput]);

  const aiMessagesRef = useRef<any[]>([])
  useEffect(() => {
    aiMessagesRef.current = aiMessages
  }, [aiMessages])

  const lastAutoOpenedRef = useRef<string>("");
  const lastCanvasUpdateRef = useRef<number>(0);

  useEffect(() => {
    lastAutoOpenedRef.current = "";
    lastCanvasUpdateRef.current = 0;
    useCanvasStore.getState().clearCanvas();
  }, [currentChatId]);

  useEffect(() => {
    if (aiMessages.length === 0) {
      lastAutoOpenedRef.current = "";
      return;
    }

    const lastMsg = aiMessages[aiMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    // 1. Check for run_python tool calls
    const runPythonInvocation = lastMsg.toolInvocations?.find(
      (inv: any) => inv.toolName === "run_python"
    );

    if (runPythonInvocation && runPythonInvocation.state === "result") {
      const scriptCode = runPythonInvocation.args?.script || "";
      if (scriptCode && scriptCode !== lastAutoOpenedRef.current) {
        lastAutoOpenedRef.current = scriptCode;
        lastCanvasUpdateRef.current = Date.now();
        
        const result = (runPythonInvocation as any).result;
        useCanvasStore.getState().openCanvas({
          title: "Script de Python",
          code: scriptCode,
          language: "python",
          stdout: result?.stdout || "",
          output: result?.output !== undefined && result?.output !== null ? String(result.output) : undefined,
          error: result?.stderr || result?.error || undefined,
          durationMs: result?.durationMs || 0,
          success: result?.success !== false,
        });
      }
      return;
    }

    // 2. Check for markdown code blocks in content
    const content = lastMsg.content || "";
    if (content) {
      const codeBlockMatch = /```(\w+)\n([\s\S]+?)```/.exec(content);
      if (codeBlockMatch) {
        const lang = codeBlockMatch[1];
        const codeValue = codeBlockMatch[2].trim();

        const now = Date.now();
        const shouldUpdate = !aiLoading || (now - lastCanvasUpdateRef.current > 800);

        if (codeValue && codeValue !== lastAutoOpenedRef.current && shouldUpdate) {
          lastAutoOpenedRef.current = codeValue;
          lastCanvasUpdateRef.current = now;

          // Extract title from comment in the first line
          let title = lang === 'python' ? 'Script de Python' : `Código ${lang.toUpperCase()}`;
          const firstLine = codeValue.split('\n')[0].trim();
          const filenameMatch = firstLine.match(/(?:filename|archivo|title)\s*:\s*([^\s][^\n\r]*)/i) || 
                                firstLine.match(/(?:\/\/\/|\/\/|#|\/\*)\s*([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]+)/i);
          if (filenameMatch) {
            title = filenameMatch[1].replace(/\*\/$/, '').trim();
          }

          useCanvasStore.getState().openCanvas({
            title,
            code: codeValue,
            language: lang,
          });
        }
      }
    }
  }, [aiMessages, aiLoading]);

  // Accumulate citations & reasoning from streamData to prevent them from vanishing during tool execution steps
  useEffect(() => {
    if (data && data.length > 0) {
      const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning');
      const streamReasoning = reasoningChunks.map(c => c.text).join('');
      if (streamReasoning && streamReasoning !== accumulatedReasoningRef.current) {
        accumulatedReasoningRef.current = streamReasoning;
      }

      const citationObj = (data as any[]).find((d: any) => d?.type === 'citations');
      if (citationObj?.urls && citationObj.urls.length > 0) {
        accumulatedCitationsRef.current = Array.from(new Set([
          ...accumulatedCitationsRef.current,
          ...citationObj.urls
        ]));
      }

      const browserSessionObj = (data as any[]).find((d: any) => d?.type === 'browser_session');
      if (browserSessionObj?.sessionId) {
        const currentSessionId = useBrowserStore.getState().sessionId;
        if (currentSessionId !== browserSessionObj.sessionId) {
          useBrowserStore.getState().setSessionId(browserSessionObj.sessionId);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const cleanPath = getCleanPathname(currentPath);
      let cleanTargetPath = '/ai';
      if (currentChatId) {
        const firstUserMsg = storeMessages.find(m => m.role === 'user')?.content || '';
        const title = firstUserMsg.slice(0, 40) || 'Nuevo Chat';
        const slug = slugify(title);
        cleanTargetPath = `/ai/chat/${slug ? `${slug}-` : ''}${currentChatId}`;
      }
      const targetPath = `/${language}${cleanTargetPath}`;
      if ((cleanPath === '/ai' || cleanPath === '/' || cleanPath === '') && targetPath !== currentPath && !currentPath.startsWith('/share/')) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [currentChatId, storeMessages, language]);

  // Listen for click-to-edit events from the Sandpack preview iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'MAVERLANG_ELEMENT_CLICKED') {
        const html = e.data.elementHtml || '';
        if (html) {
          const formattedText = `Modifica este elemento:\n\`\`\`html\n${html}\n\`\`\`\n`;
          setInput(formattedText);
          // Optional: focus the input element here if needed, 
          // but just setting the input is usually enough for the user to see it.
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setInput]);

  // Sync store messages → useChat messages on load/chat switch
  useEffect(() => {
    if (!isStoreHydrated) return
    if (currentChatId) {
      if (currentChatId !== lastLoadedChatIdRef.current) {
        lastLoadedChatIdRef.current = currentChatId
        setAiMessages(
          storeMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolInvocations: m.toolInvocations,
            reasoning: m.reasoning,
            citations: m.citations,
            model: m.model,
            isCollapsed: m.isCollapsed,
            secondsElapsed: m.secondsElapsed,
            reasoningSteps: m.reasoningSteps,
            timestamp: m.timestamp,
            createdAt: m.timestamp ? new Date(m.timestamp) : undefined,
          })) as any
        )
      }
    } else {
      // Reset for New Chat
      lastLoadedChatIdRef.current = null
      setAiMessages([])
    }
  }, [currentChatId, isStoreHydrated, storeMessages, setAiMessages])

  // Sync WebBuilder project files on load or chat reset
  useEffect(() => {
    if (!isStoreHydrated) return
    const wbStore = useWebBuilderStore.getState()
    if (currentChatId) {
      wbStore.initProject(currentChatId)
      wbStore.loadFromCloud(currentChatId)
    } else {
      wbStore.resetProject()
    }
  }, [currentChatId, isStoreHydrated])

  // Save messages to store on unmount (if loading/streaming was interrupted)
  useEffect(() => {
    return () => {
      if (aiMessagesRef.current.length > 0) {
        const latest = aiMessagesRef.current;
        const lastMsg = latest[latest.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
          const storeMessages: ChatMessage[] = latest.map((m: any) => ({
            id: m.id,
            role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp || new Date(),
            model: m.model || (useAIChatStore.getState().selectedModel === "fast" ? "deepseek" : "grok"),
            toolInvocations: m.toolInvocations,
            citations: m.citations || [],
            reasoning: m.reasoning || undefined,
            reasoningSteps: m.reasoningSteps || undefined,
            secondsElapsed: m.secondsElapsed,
          }));
          
          useAIChatStore.setState({ messages: storeMessages });
          useAIChatStore.getState().updateCurrentChat();
        }
      }
    };
  }, []);

  const handleModelSelect = (model: MaverlangModel) => {
    setModel(model.id)
  }

  const handleSend = (
    text: string,
    options: { webSearch: boolean; image: boolean; codeInterpreter: boolean; browser: boolean }
  ) => {
    if (!text.trim() || aiLoading) return

    // Gate de autenticación: si el usuario no ha iniciado sesión, el chat es
    // "no funcional". Al intentar enviar el primer mensaje, abrimos el popup de
    // registro en vez de procesar el envío. Su texto queda en la barra (no se
    // borra) para que, tras autenticarse, pueda reenviarlo.
    if (!isAuthenticated) {
      openAuthModal("register");
      return;
    }

    accumulatedReasoningRef.current = ""
    accumulatedCitationsRef.current = []
    // Ocultar el banner de límite de tokens al iniciar un nuevo envío.
    useConversionStore.getState().clearTokenLimitReached()

    // Check chat limits
    const planConfig = getPlanConfig(userTier)
    const isWB = useWebBuilderStore.getState().isWebBuilderMode
    if (isWB) {
      useWebBuilderStore.getState().resetAutoFixAttempts()
      useWebBuilderStore.getState().setAiResponding(true)
    }
    // Create chat ID if new
    let activeChatId = currentChatId
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    if (!activeChatId) {
      activeChatId = Date.now().toString()
      lastLoadedChatIdRef.current = activeChatId
      useAIChatStore.setState({
        currentChatId: activeChatId,
        messages: [userMsg],
      })
    } else {
      // For existing chat, append the user message to store messages immediately
      const currentMessages = useAIChatStore.getState().messages;
      useAIChatStore.setState({
        messages: [...currentMessages, userMsg],
      })
    }
    useAIChatStore.getState().updateCurrentChat()

    // Modo Plan: si hay un plan pendiente y el usuario responde, clasificar su
    // intención (aprobar / cancelar / cambios) y dar forma al body en consecuencia.
    let planBodyExtras: Record<string, any> = {};
    if (isWB) {
      const wbState = useWebBuilderStore.getState();
      const pending = wbState.pendingPlan;
      if (wbState.buildMode === "plan" && pending) {
        const intent = classifyPlanResponse(text);
        if (intent === "approve") {
          planBodyExtras = {
            approvedPlan: { reason: pending.reason, agents: pending.agents },
            originalUserMessage: pending.originalUserMessage,
          };
          wbState.clearPendingPlan();
        } else if (intent === "reject") {
          planBodyExtras = { cancelPlan: true };
          wbState.clearPendingPlan();
        } else {
          // feedback: replanificar con el texto del usuario como cambios.
          planBodyExtras = {
            replanFeedback: text,
            originalUserMessage: pending.originalUserMessage,
          };
          wbState.clearPendingPlan();
        }
      }
    }

    // Use AI SDK append
    append(
      { role: "user", content: text },
      {
        body: {
          articles: attachedArticles,
          files: attachedFiles,
          modelId: selectedModel,
          activeTools: activeTools,
          webSearch: options.webSearch,
          browser: options.browser,
          codeInterpreter: options.codeInterpreter,
          webBuilder: isWB,
          webBuilderFiles: isWB ? useWebBuilderStore.getState().files : undefined,
          buildMode: isWB ? useWebBuilderStore.getState().buildMode : undefined,
          ...planBodyExtras,
        },
      }
    )

    // Open workspaces immediately if user requested those modes
    if (options.browser) {
      useBrowserStore.getState().setOpen(true);
    }
    if (options.codeInterpreter) {
      useCanvasStore.getState().setOpen(true);
    }

    // If WebBuilder mode is active, ensure split view is shown
    if (isWB) {
      useWebBuilderStore.getState().setSplitView(true)
    }
  }


  const toggleReasoning = (id: string) => {
    setOpenReasoning((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleShare = (question: string, answer: string) => {
    setShareDialog({ isOpen: true, question, answer })
  }

  const hasMessages = storeMessages.length > 0 || aiMessages.length > 0

  // Determine which messages to display, mapping from aiMessages to capture streaming state and fallback to storeMessages when syncing
  const isSyncing = currentChatId !== lastLoadedChatIdRef.current
  const displayMessagesSource = (isSyncing || aiMessages.length === 0) ? storeMessages : aiMessages

  const rawDisplayMessages: ChatMessage[] = displayMessagesSource.map((m, idx) => {
    // Find the message in our Zustand store to retrieve full metadata (like citations, reasoningSteps)
    const storeMsg = storeMessages.find((sm) => sm.id === m.id);
    
    const isLastAssistantLike = (m.role === "assistant" || m.role === "tool") && idx === displayMessagesSource.length - 1;
    
    let reasoningText = storeMsg?.reasoning || (m as any).reasoning;
    let citationsList = storeMsg?.citations || (m as any).citations;
    let reasoningStepsList = storeMsg?.reasoningSteps || (m as any).reasoningSteps;
    
    if (isLastAssistantLike) {
      if (accumulatedReasoningRef.current) {
        reasoningText = accumulatedReasoningRef.current;
      } else if (data && data.length > 0) {
        const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning');
        const streamReasoning = reasoningChunks.map(c => c.text).join('');
        if (streamReasoning) reasoningText = streamReasoning;
      }

      if (accumulatedCitationsRef.current.length > 0) {
        citationsList = accumulatedCitationsRef.current;
      } else if (data && data.length > 0) {
        const citationObj = (data as any[]).find((d: any) => d?.type === 'citations');
        if (citationObj?.urls) {
          citationsList = citationObj.urls;
        }
      }

      if (data && data.length > 0) {
        const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
        if (reportsObj?.reports) {
          reasoningStepsList = reportsObj.reports;
        }
      }
    }

    return {
      id: m.id,
      role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
      timestamp: storeMsg?.timestamp || (m as any).timestamp || new Date(),
      model: storeMsg?.model || selectedModel === "fast" ? "deepseek" : "grok",
      toolInvocations: m.toolInvocations,
      reasoning: reasoningText || undefined,
      citations: citationsList || [],
      isCollapsed: storeMsg?.isCollapsed || (m as any).isCollapsed,
      secondsElapsed: storeMsg?.secondsElapsed || (m as any).secondsElapsed,
      reasoningSteps: reasoningStepsList,
    };
  });

  const displayMessages = groupConsecutiveMessages(rawDisplayMessages);

  // ── WebBuilder unified stream and artifact parser ──
  const isWebBuilderMode = useWebBuilderStore((s) => s.isWebBuilderMode)
  const prevStreamTextRef = useRef<string>("")

  useEffect(() => {
    if (!isWebBuilderMode) return;

    // Helper: compara dos mapas de archivos por CONTENIDO (no por referencia).
    // Sin esto, normalizeFiles crea objetos nuevos cada vez y la comparación
    // por referencia siempre da hasChanged=true → loop infinito (React #185).
    const filesEqual = (
      a: Record<string, { code: string } | string>,
      b: Record<string, { code: string } | string>
    ): boolean => {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(k => {
        const aCode = typeof a[k] === "string" ? a[k] : (a[k] as any)?.code;
        const bCode = typeof b[k] === "string" ? b[k] : (b[k] as any)?.code;
        return aCode === bCode;
      });
    };

    // 1. Process structured streamData (agent reports and webbuilder files)
    if (data && data.length > 0) {
      const store = useWebBuilderStore.getState();

      // Find the plan card (modo Plan): {type:'plan', planId, reason, agents}
      const planObj = (data as any[]).find((d: any) => d?.type === 'plan');
      if (planObj?.agents && planObj.agents.length > 0) {
        // Último mensaje del usuario que originó el plan (para replan/ejecución).
        const lastUserMsg = [...aiMessages].reverse().find(m => m.role === 'user')?.content || "";
        store.setPendingPlan({
          planId: planObj.planId || `plan-${Date.now()}`,
          reason: planObj.reason || "",
          agents: planObj.agents,
          originalUserMessage: lastUserMsg,
        });
      }

      // Find agent reports
      const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
      if (reportsObj?.reports) {
        store.setActiveAgentReports(reportsObj.reports);
        // Si llegan agentReports es que se construyó: limpiar plan pendiente.
        store.clearPendingPlan();
      }

      // Find webbuilder files
      const webBuilderFilesObj = (data as any[]).find((d: any) => d?.type === 'webbuilder_files');
      if (webBuilderFilesObj?.files) {
        const merged = { ...store.files, ...webBuilderFilesObj.files };
        if (!filesEqual(merged, store.files)) {
          // setFilesStreaming (no setFiles): acumula el diff contra el
          // snapshot previo inicial del ciclo en vez de sobrescribirlo en
          // cada emisión incremental. Sin esto, la tarjeta de cambios solo
          // reflejaría la última emisión parcial, perdiendo archivos previos.
          store.setFilesStreaming(merged);
          store.syncToCloud();
        }
      }
    }

    // 2. Parse inline artifacts from the last assistant message
    const lastAssistant = [...aiMessages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant?.content) {
      const text = lastAssistant.content;
      if (text !== prevStreamTextRef.current) {
        prevStreamTextRef.current = text;
        if (containsArtifact(text)) {
          const artifact = parseArtifact(text);
          if (artifact && artifact.actions.length > 0) {
            const store = useWebBuilderStore.getState();
            const { files: newFiles, failedUpdates } = actionsToFiles(artifact.actions, store.files);
            const merged = { ...store.files, ...newFiles };
            if (!filesEqual(merged, store.files)) {
              store.setFiles(merged);
            }
            // Surfacing estilo Aider: log en dev de las ediciones cuyo bloque
            // SEARCH no coincidió. En el path inline no emitimos al stream para
            // no ensuciar el chat simple, pero dejamos rastro para diagnóstico.
            if (failedUpdates.length > 0) {
              console.warn(
                "[WebBuilder] Ediciones no aplicadas (bloque SEARCH no encontrado):",
                failedUpdates.map(f => ({ filePath: f.filePath, reason: f.reason }))
              );
            }
          }
        }
      }
    }
  }, [data, aiMessages, isWebBuilderMode]);

  // Debounced local storage saving during stream
  const localSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aiLoading || aiMessages.length === 0) {
      if (localSaveTimeoutRef.current) {
        clearTimeout(localSaveTimeoutRef.current);
        localSaveTimeoutRef.current = null;
      }
      return;
    }

    if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);

    localSaveTimeoutRef.current = setTimeout(() => {
      const latestMessages = aiMessagesRef.current;
      if (latestMessages.length === 0) return;

      // ⚠️ Anti-bucle (React #185 "Maximum update depth exceeded"):
      // ANTES este effect dependía también de `data` y escribía en el store un
      // snapshot "enriquecido" (citations/reasoning/agentReports) por cada tick
      // del stream. Con la fase 3 (streaming apply live) `data` muta en ráfaga
      // (una emisión webbuilder_files por agente + chunks de reasoning), y como
      // el effect que sincroniza storeMessages→aiMessages (más abajo) reacciona
      // a los cambios del store, se cerraba un bucle:
      //   data cambia → guardado escribe messages → sync escribe aiMessages →
      //   guardado re-escribe messages → ... → React aborta con #185.
      //
      // Ahora NO enriquecemos aquí ni dependemos de `data`: el enriquecimiento
      // (citations/reasoning/agentReports) lo hace `onFinish` una única vez al
      // terminar la respuesta, que es su sitio correcto. Aquí solo persistimos
      // el estado actual de los mensajes (debounced), sin retroalimentar el
      // flujo de render.
      const currentStoreMessages = useAIChatStore.getState().messages;

      const formatted: ChatMessage[] = latestMessages.map((m: any) => {
        const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id);
        return {
          id: m.id,
          role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
          content: m.content,
          timestamp: storeMsg?.timestamp || m.timestamp || new Date(),
          model: storeMsg?.model || m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
          toolInvocations: m.toolInvocations,
          citations: storeMsg?.citations || m.citations || [],
          reasoning: storeMsg?.reasoning || m.reasoning || undefined,
          reasoningSteps: storeMsg?.reasoningSteps || m.reasoningSteps || undefined,
          secondsElapsed: storeMsg?.secondsElapsed || m.secondsElapsed,
        };
      });

      // Solo escribir si el contenido realmente cambió, para no alimentar el
      // effect de sync storeMessages→aiMessages con referencias nuevas idénticas.
      const prevIds = currentStoreMessages.map((m) => m.id).join("|");
      const nextIds = formatted.map((m) => m.id).join("|");
      const lastPrevContent = currentStoreMessages[currentStoreMessages.length - 1]?.content ?? "";
      const lastNextContent = formatted[formatted.length - 1]?.content ?? "";
      if (prevIds === nextIds && lastPrevContent === lastNextContent) return;

      useAIChatStore.setState({ messages: formatted });
      useAIChatStore.getState().updateCurrentChat(true); // localOnly = true
    }, 1000); // Debounce by 1 second

    return () => {
      if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);
    };
  }, [aiMessages, aiLoading, selectedModel]);

  // Reusable category pill for desktop and mobile layouts
  const CategoryPill = ({ cat, isActive, isMobile: mobile }: { cat: CreativeCategory; isActive: boolean; isMobile?: boolean }) => {
    const CatIcon = cat.icon;
    return (
      <button
        onClick={() => setActiveCategory(prev => prev === cat.id ? null : cat.id)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer snap-start",
          mobile && "shrink-0",
          isActive
            ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs"
            : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
        )}
      >
        <CatIcon className="w-3.5 h-3.5" />
        {cat.label}
      </button>
    );
  };

  // Reusable preview card with mobile-optimized overlay visibility
  const PreviewCard = ({ item, isMobile: mobile }: { item: PreviewItem; isMobile?: boolean }) => (
    <div
      className={cn(
        "group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/85 bg-white dark:bg-zinc-900/40 hover:border-[#1890FF]/40 hover:dark:border-[#1890FF]/40 shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer select-none",
        mobile ? "w-[280px] shrink-0 h-[160px] snap-start" : "h-[155px]"
      )}
    >
      {/* Full-width Mockup View */}
      <div className="w-full h-full relative overflow-hidden">
        <MockupPreview type={item.mockType} />
      </div>

      {/* Interactive Hover/Active Overlay with Title, Desc and Action Buttons */}
      <div
        className={cn(
          "absolute inset-0 bg-white/80 dark:bg-black/65 backdrop-blur-xl border border-zinc-200/40 dark:border-white/10 transition-all duration-300 p-4 flex flex-col justify-between shadow-md",
          mobile
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
        )}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">
              {item.title}
            </h3>
            <span className="text-[7px] font-extrabold text-[#1890FF] bg-[#1890FF]/15 border border-[#1890FF]/30 px-1 py-0.5 rounded tracking-wide uppercase shrink-0">
              BUILD
            </span>
          </div>
          <p className="text-[10px] text-zinc-650 dark:text-zinc-200 leading-normal line-clamp-3">
            {item.desc}
          </p>
        </div>

        {/* Buttons inside overlay */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInput(item.prompt);
              setTimeout(() => {
                const textarea = document.getElementById("chat-input") as HTMLTextAreaElement | null;
                if (textarea) {
                  textarea.focus();
                  const len = item.prompt.length;
                  textarea.setSelectionRange(len, len);
                }
              }, 50);
              toast.success("Prompt copiado al chat", {
                description: "Puedes editar o enviar el mensaje directamente.",
                duration: 3000,
              });
            }}
            className="flex-1 py-1.5 rounded-lg border border-zinc-300 dark:border-white/20 hover:bg-zinc-150/50 hover:dark:bg-white/10 text-zinc-800 dark:text-white text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            Copiar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              useWebBuilderStore.getState().setWebBuilderMode(true);
              handleSend(item.prompt, { webSearch: false, image: false, codeInterpreter: false, browser: false });
              toast.success("Iniciando construcción...", {
                description: `Construyendo ${item.title}`,
                duration: 3000,
              });
            }}
            className="flex-1 py-1.5 rounded-lg bg-[#1890FF] hover:bg-[#1890FF]/85 text-white text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-xs"
          >
            <Eye className="w-3 h-3" />
            Ver
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render ──
  const chatContent = (
    <div className="flex flex-col h-full relative flex-1">
      {/* Botones de auth para usuarios no autenticados (esquina superior derecha).
          El chat es "no funcional": al enviar se pide registro, y aquí damos una
          entrada directa a login/registro estilo ChatGPT/OpenAI. */}
      {!isAuthenticated && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => openAuthModal("login")}
            className="text-[13px] sm:text-sm font-semibold text-foreground/80 hover:text-foreground transition-all px-2 py-1.5"
          >
            Entrar
          </button>
          <button
            onClick={() => openAuthModal("register")}
            className="bg-foreground text-background hover:opacity-90 text-[13px] sm:text-sm font-semibold px-3.5 py-2 sm:px-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
          >
            Registrarse
          </button>
        </div>
      )}
      {isAuthenticated && hasMessages && !isBrowserOpen && !isCanvasOpen && (
        <TooltipProvider delayDuration={300}>
          <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 select-none">
            {/* Sheet Menu (Más / Archivos) — oculto en modo build: el explorador
                de archivos y opciones vive en el panel de preview dedicado. */}
            {!isWebBuilderMode && (
            <Sheet>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <SheetTrigger asChild>
                      <button 
                        type="button" 
                        className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                      >
                        <MoreHorizontal className="w-4.5 h-4.5" />
                      </button>
                    </SheetTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold">
                  Archivos y Opciones
                </TooltipContent>
              </Tooltip>

              <SheetContent side="right" className="w-[340px] sm:w-[400px] flex flex-col p-0 border-l border-border/50">
                <SheetHeader className="px-5 py-4 border-b border-border/50 bg-muted/20">
                  <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    Archivos del Chat
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Códigos y artefactos generados en esta conversación.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/10 scrollbar-hide">
                  {chatFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                      <Code2 className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <p className="text-xs text-muted-foreground">No hay archivos ni códigos generados en este chat todavía.</p>
                    </div>
                  ) : (
                    chatFiles.map((file) => (
                      <div 
                        key={file.id}
                        onClick={() => {
                          useCanvasStore.getState().openCanvas({
                            title: file.title,
                            code: file.code,
                            language: file.lang,
                          });
                        }}
                        className="group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileCode2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {file.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                            {file.lang}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors self-center shrink-0" />
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border/50 bg-background">
                  <button 
                    onClick={handleDeleteCurrentChat}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar conversación
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            )}

            {/* Copy link — oculto en modo build */}
            {!isWebBuilderMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  type="button" 
                  onClick={handleCopyLink} 
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                >
                  <Link2 className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Copiar enlace
              </TooltipContent>
            </Tooltip>
            )}

            {/* New Chat — oculto en modo build */}
            {!isWebBuilderMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                >
                  <SquarePen className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Nueva conversación
              </TooltipContent>
            </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}
<div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages ? (
          /* Landing view - logo + input y galería de creaciones.
             Al enviar el primer mensaje, hasMessages pasa a true y el input baja a su
             posición fija en el fondo. */
          isMobile ? (
            /* Mobile landing: logo + categories + preview cards carousel + input at bottom */
            <div className="flex flex-col h-full relative px-4 pt-4 pb-4 overflow-hidden">
              {/* Top area: logo */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full max-w-md mx-auto">
                <div className="text-center mb-5 shrink-0">
                  <img
                    src={mobileLogoSrc}
                    alt="Maverlang Logo"
                    className="h-14 w-auto object-contain select-none pointer-events-none"
                  />
                </div>
              </div>

              {/* Bottom area: horizontal scroll categories + preview cards + input */}
              <div className="relative w-full max-w-md mx-auto shrink-0 space-y-3 mt-5">
                {/* Preview cards horizontal carousel - se superpone sobre el logo
                    (overlay absoluto) para no desplazar el contenido superior */}
                {activeCategory && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 w-full overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory z-20">
                    <div className="flex gap-3 pb-2 justify-center min-w-max mx-auto px-4">
                      {PREVIEW_ITEMS.filter((item) => item.category === activeCategory).map((item) => (
                        <PreviewCard key={item.id} item={item} isMobile />
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories draggable row */}
                <div className="overflow-x-auto scrollbar-hide w-full snap-x snap-mandatory">
                  <div className="flex gap-2 pb-1 justify-center min-w-max mx-auto px-4">
                    {CREATIVE_CATEGORIES.map((cat) => (
                      <CategoryPill key={cat.id} cat={cat} isActive={activeCategory === cat.id} isMobile />
                    ))}
                  </div>
                </div>

                <ChatInput
                  placeholder="Pregúntame lo que quieras..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                  value={input}
                  onChange={setInput}
                />
              </div>
            </div>
          ) : (
            /* Desktop landing: centered logo + input + categories grid.
               overflow-y-auto permite que el overlay de tarjetas (absoluto) se
               despliegue hacia abajo sin mover el logo; el contenido en flujo
               sigue centrado gracias a justify-center. */
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-[14vh] pb-4 relative h-full overflow-x-hidden overflow-y-auto scrollbar-hide">
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center">
                    <img
                      src={chatLogoSrc}
                      alt="Maverlang Logo"
                      className="h-14 w-auto object-contain select-none pointer-events-none"
                    />
                  </div>
                </div>

                <div className="w-full max-w-3xl pb-2">
                  <ChatInput
                    placeholder="Pregúntame lo que quieras..."
                    onSubmit={handleSend}
                    disabled={false}
                    isStreaming={aiLoading}
                    onStop={stop}
                    value={input}
                    onChange={setInput}
                  />
                </div>

                {/* Categorías y Tarjetas de Previsualización */}
                <div className="w-full mt-2 sm:mt-3 flex flex-col items-center relative">
                  {/* Categorías (Pills) - Fixed and Wrapped to prevent clipping */}
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-2xl py-2 px-4 mt-1">
                    {CREATIVE_CATEGORIES.map((cat) => (
                      <CategoryPill key={cat.id} cat={cat} isActive={activeCategory === cat.id} />
                    ))}
                  </div>

                  {/* Grid de Previsualización - overlay absoluto que se superpone
                      hacia abajo sin entrar al flujo, así no desplaza el logo
                      (mismo principio que el overlay móvil con bottom-full). */}
                  {activeCategory && (
                    <div className="absolute top-full left-0 mt-3 w-full max-w-4xl px-2 pb-6 z-20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {PREVIEW_ITEMS.filter((item) => item.category === activeCategory).map((item) => (
                          <PreviewCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        ) : (
          /* Chat view - messages + input at bottom */
          <>
            {(storeLoading && displayMessages.length === 0) ? (
               <div className="flex-grow overflow-y-auto px-4 md:px-6 py-20 relative space-y-8 max-w-3xl mx-auto w-full overflow-hidden select-none">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background pointer-events-none z-10" />
                 
                 {/* Loading bubble timeline */}
                 <div className="space-y-6">
                   {/* User message skeleton */}
                   <div className="flex justify-end">
                     <div className="max-w-[70%] w-60 h-11 bg-secondary rounded-2xl rounded-tr-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                   </div>

                   {/* AI response skeleton 1 */}
                   <div className="flex gap-4 items-start max-w-[85%]">
                     <div className="w-9 h-9 rounded-xl bg-muted shrink-0 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                     <div className="flex-grow space-y-2.5 pt-1.5">
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-full relative overflow-hidden" />
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[92%] relative overflow-hidden" />
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[65%] relative overflow-hidden" />
                     </div>
                   </div>

                   {/* User message skeleton 2 */}
                   <div className="flex justify-end">
                     <div className="max-w-[70%] w-48 h-11 bg-secondary rounded-2xl rounded-tr-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                   </div>

                   {/* AI response skeleton 2 (Dashboard layout simulation) */}
                   <div className="flex gap-4 items-start max-w-[90%]">
                     <div className="w-9 h-9 rounded-xl bg-muted shrink-0 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                     <div className="flex-grow space-y-4 pt-1.5">
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[80%] relative overflow-hidden" />
                       
                       {/* Nested mock widget card */}
                       <div className="border border-border/40 bg-card rounded-2xl p-4 space-y-3 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                         <div className="h-4 bg-muted rounded-full w-[40%]" />
                         <div className="h-8 bg-muted rounded-xl w-[90%]" />
                         <div className="h-3 bg-muted rounded-full w-[25%]" />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ) : (
               <ChatMessages
                 messages={displayMessages}
                 isLoading={aiLoading || storeLoading}
                 streamData={data}
                 onFeedback={setFeedback}
                 onRetry={() => {
                   // Re-send the last user message
                   const lastUserMsg = [...displayMessages].reverse().find(m => m.role === 'user')
                   if (lastUserMsg) {
                     handleSend(lastUserMsg.content, { webSearch: false, image: false, codeInterpreter: false, browser: false })
                   }
                 }}
                 onShare={handleShare}
                 messageFeedback={messageFeedback}
                 openReasoning={openReasoning}
                 onToggleReasoning={toggleReasoning}
               />
             )}

            <div className="absolute bottom-4 left-0 right-0 z-10 bg-transparent px-4 pb-0 md:relative md:bottom-auto md:px-4 md:pb-5 md:pt-0">
              <div className={cn("w-full transition-all", (isBrowserOpen || isCanvasOpen || isWebBuilderMode) ? "max-w-full" : "max-w-3xl mx-auto")}>
                <ChatInput
                  placeholder="Envía un mensaje..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                  value={input}
                  onChange={setInput}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share dialog */}
      <ShareChatDialog
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })}
        question={shareDialog.question}
        answer={shareDialog.answer}
      />


    </div>
  )

  // If WebBuilder mode is active and we have messages, wrap in the split-screen workspace
  if (isWebBuilderMode && storeMessages.length > 0) {
    return (
      <WebBuilderWorkspace chatPanel={chatContent} />
    )
  }

  // Wrap in Canvas/Browser workspace (will render split-pane if active)
  return (
    <BrowserWorkspace chatPanel={
      <CanvasWorkspace chatPanel={chatContent} />
    } />
  )
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  chile: { name: 'Chile', flag: '🇨🇱' },
  argentina: { name: 'Argentina', flag: '🇦🇷' },
  colombia: { name: 'Colombia', flag: '🇨🇴' },
  brasil: { name: 'Brasil', flag: '🇧🇷' },
  ecuador: { name: 'Ecuador', flag: '🇪🇨' },
  mexico: { name: 'México', flag: '🇲🇽' },
};

function MenuLink({ 
  href, 
  icon: Icon, 
  title, 
  desc 
}: { 
  href: string; 
  icon: React.ComponentType<any>; 
  title: string; 
  desc: string 
}) {
  return (
    <Link 
      href={href}
      className="group/menu-link flex items-start gap-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] transition-all duration-200 active:scale-[0.98]"
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/menu-link:bg-foreground group-hover/menu-link:text-background flex items-center justify-center shrink-0 transition-colors duration-200">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 transition-colors">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 line-clamp-2">
          {desc}
        </span>
      </div>
    </Link>
  )
}

function StockLogo({ symbol, className }: { symbol: string; className?: string }) {
  const [error, setError] = useState(false);
  const sym = symbol.toUpperCase();
  
  const logoUrl = sym === 'BTC' || sym === 'ETH' || sym === 'SOL'
    ? `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.toLowerCase()}.png`
    : `https://images.financialmodelingprep.com/symbol/${sym}.png`;

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-orange-400 to-red-600',
      'from-cyan-400 to-blue-600',
      'from-pink-400 to-rose-600'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (error) {
    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br shrink-0 shadow-sm uppercase",
        getGradient(sym),
        className
      )}>
        {sym.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={sym}
      onError={() => setError(true)}
      className={cn("w-8 h-8 rounded-full object-cover shrink-0 bg-white p-0.5 border border-gray-100 dark:border-white/10 shadow-sm", className)}
    />
  );
}

export function ChatLanding() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 text-[#1890FF] animate-spin border-2 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <ChatLandingContent />
    </Suspense>
  );
}
