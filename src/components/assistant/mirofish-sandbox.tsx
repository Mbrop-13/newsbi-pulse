"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Loader2, RotateCcw, Bot, ChevronLeft, Send, Zap, Plus, Paperclip, Sparkles,
  Users, Brain, Search, ShieldAlert, Play, Pause, SkipForward, SkipBack,
  Activity, FileText, Copy, Download, Check, Settings, Trash2, ChevronRight, X,
  OctagonPause, Share2, Lock
} from "lucide-react";
import { ReactFlowCanvas } from "./react-flow-canvas";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PlanTier, getPlanConfig } from "@/lib/plan-limits";
import { UpgradeModal } from "@/components/upgrade-modal";

// ── Types ──────────────────────────────────────────────────────

interface AgentMessage {
  id: string;
  agentName: string;
  avatar: string;
  role: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  message: string;
  time: string;
}

interface SentimentData {
  label: string;
  value: number;
}

interface SimulationResult {
  dialogue: AgentMessage[];
  summaryReport: string;
  sentiment: SentimentData[];
  articleTitle?: string;
}

interface SavedSimulation {
  id: string;
  title: string;
  timestamp: string;
  simulation: SimulationResult;
  swarmSize: number;
  rounds?: number;
  bias: string;
  distribution: { retail: number; institutional: number; speculators: number };
  agentType?: string;
}

interface CustomAgentConfig {
  id: string;
  agentName: string;
  avatar: string;
  role: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  specialty: string;
}

interface MiroFishSandboxProps {
  selectedSimulation: SavedSimulation | null;
  onClearSelected: () => void;
  onSimulationSaved: () => void;
  onGoBack?: () => void;
  onSimulationActiveChange?: (isActive: boolean) => void;
}

// ── Agent Type Definitions ─────────────────────────────────────

type AgentType = 'general' | 'financial' | 'research' | 'risk' | 'custom';

interface AgentTypeConfig {
  id: AgentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const AGENT_TYPES: AgentTypeConfig[] = [
  {
    id: 'general',
    label: 'Sin Especialidad',
    description: 'Agentes generalistas con acceso completo',
    icon: <Users className="w-4 h-4" />,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'financial',
    label: 'Mesa Financiera',
    description: '4 expertos financieros especializados',
    icon: <Brain className="w-4 h-4" />,
    color: '#1890FF',
    gradient: 'from-[#1890FF] to-blue-600',
  },
  {
    id: 'research',
    label: 'Investigador',
    description: 'Tendencias, sentimiento y datos',
    icon: <Search className="w-4 h-4" />,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'risk',
    label: 'Analista de Riesgo',
    description: 'Volatilidad, cobertura y escenarios',
    icon: <ShieldAlert className="w-4 h-4" />,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'custom',
    label: 'Mesa Personalizada',
    description: 'Diseña tu propio panel de expertos',
    icon: <Settings className="w-4 h-4" />,
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
  },
];

const NODE_POSITIONS = [
  { x: -170, y: -130 }, // top-left
  { x: 170, y: -130 },  // top-right
  { x: -170, y: 130 },  // bottom-left
  { x: 170, y: 130 },   // bottom-right
  { x: 0, y: -180 },    // center-top
  { x: 0, y: 180 },     // center-bottom
];

const PRESET_EMOJIS = ["🤖", "🧠", "📈", "🌐", "🛡️", "📊", "🔍", "💬", "⚡", "🔬", "💡", "💰", "🎯", "⚙️", "⚖️"];

const PRESETS = [
  {
    emoji: "🚀",
    title: "Nvidia lidera el mercado con un crecimiento récord impulsado por chips de IA",
    content: "Nvidia anunció ingresos históricos que superan todas las expectativas de Wall Street. La alta demanda global de chips H100 y Blackwell proyecta márgenes superiores al 75% para los próximos trimestres."
  },
  {
    emoji: "🔌",
    title: "El precio del Litio empuja al alza las acciones bursátiles de mercados emergentes",
    content: "Las cotizaciones de empresas productoras de litio se dispararon un 12% tras un repunte en la demanda internacional para baterías de vehículos eléctricos, liderando las ganancias de fondos cotizados extranjeros hoy."
  },
  {
    emoji: "📊",
    title: "La inflación en EE. UU. se modera y abre la puerta a recortes de tasas por parte de la Fed",
    content: "El índice de precios al consumidor mostró una desaceleración mayor de lo esperado en mayo. Analistas anticipan que la Fed recortará las tasas de interés en 25 puntos básicos en su próxima reunión de política monetaria."
  },
  {
    emoji: "📱",
    title: "El futuro de Apple con la integración de la IA generativa en dispositivos",
    content: "Debatir si la estrategia de Apple de integrar IA en sus dispositivos premium impulsará un superciclo de actualización de hardware o si se quedará atrás frente a sus rivales directos."
  },
  {
    emoji: "🪙",
    title: "Regulación de criptoactivos e impacto en Bitcoin y Ethereum",
    content: "Analizar el impacto de las nuevas directrices regulatorias de las comisiones de valores globales sobre los flujos de ETF al contado de Bitcoin y la volatilidad general."
  },
  {
    emoji: "✨",
    title: "El oro como cobertura patrimonial ante tensiones geopolíticas",
    content: "Debatir la viabilidad del oro y metales preciosos como activos de refugio ante el incremento de tensiones globales y los temores de desdolarización del comercio internacional."
  },
  {
    emoji: "🚗",
    title: "Sobrecapacidad de vehículos eléctricos y márgenes de Tesla",
    content: "Analizar cómo afectará la sobreproducción global de vehículos eléctricos y la guerra de precios en el mercado asiático a los márgenes brutos y rentabilidad a largo plazo de Tesla."
  },
  {
    emoji: "🏢",
    title: "Inversión en bienes raíces comerciales frente al teletrabajo",
    content: "Generar un análisis de riesgo sobre las carteras de deuda y propiedades de REITs de oficinas ante el asentamiento definitivo del trabajo híbrido y la caída en tasas de ocupación."
  },
  {
    emoji: "🌿",
    title: "El hidrógeno verde en la transición energética global",
    content: "Evaluar si el hidrógeno verde es económicamente viable a mediano plazo o si los altos costos de transporte e infraestructura limitarán su adopción comercial masiva."
  },
  {
    emoji: "🇨🇳",
    title: "Recuperación económica en China y materias primas industriales",
    content: "Debatir si el último paquete de estímulos fiscales de China impulsará de forma sostenida la cotización del cobre, mineral de hierro y crudo a nivel internacional."
  },
  {
    emoji: "🔬",
    title: "Geopolítica de semiconductores y vulnerabilidad de TSMC en Taiwán",
    content: "Simular un escenario de interrupción de suministro en el estrecho de Taiwán y evaluar las repercusiones financieras globales en empresas dependientes como AMD, Apple y Qualcomm."
  },
  {
    emoji: "🛡️",
    title: "Ciberseguridad corporativa e inteligencia artificial",
    content: "Analizar el crecimiento del gasto en software de seguridad en la nube impulsado por amenazas automatizadas con IA, y evaluar a las empresas líderes del sector como CrowdStrike y Palo Alto Networks."
  }
];

function sentimentColor(s: string) {
  if (s === 'bullish') return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', hex: '#10b981' };
  if (s === 'bearish') return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', hex: '#ef4444' };
  return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', hex: '#64748b' };
}

// ── Dot Grid SVG Pattern Component (High density grid) ──
function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="0.75" className="fill-gray-450/20 dark:fill-slate-650/15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGrid)" />
    </svg>
  );
}

// ── Agent Card Component (Canvas Node - Draggable) ──
interface AgentCardProps {
  msg: AgentMessage;
  position: { x: number; y: number };
  index: number;
  isActive: boolean;
  isFused?: boolean;
  fusedWith?: AgentMessage[];
  onClick?: () => void;
  thinkingTool?: string | null;
  onDrag?: (delta: { x: number; y: number }) => void;
}

function AgentCard({ msg, position, index, isActive, isFused, fusedWith, onClick, thinkingTool, onDrag }: AgentCardProps) {
  const sc = sentimentColor(msg.sentiment);

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
      onDrag={(e, info) => onDrag?.(info.delta)}
      initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 22,
        delay: index * 0.05,
      }}
      onClick={onClick}
      className={`absolute cursor-grab active:cursor-grabbing select-none ${
        isActive ? 'z-20' : 'z-10'
      }`}
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* n8n-style circular connector ports (hanging precisely off left/right edges) */}
      {/* Left Input Port */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[4px] w-2.5 h-2.5 rounded-full bg-white dark:bg-[#18191c] border border-gray-300 dark:border-slate-700 flex items-center justify-center z-30 transition-colors shadow-sm hover:border-[#1890FF]"
        title="Input"
      >
        <div className="w-1.2 h-1.2 rounded-full" style={{ backgroundColor: sc.hex }} />
      </div>

      {/* Right Output Port */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[4px] w-2.5 h-2.5 rounded-full bg-white dark:bg-[#18191c] border border-gray-300 dark:border-slate-700 flex items-center justify-center z-30 transition-colors shadow-sm hover:border-[#1890FF]"
        title="Output"
      >
        <div className="w-1.2 h-1.2 rounded-full" style={{ backgroundColor: sc.hex }} />
      </div>

      {/* Node Content Capsule (n8n node structure) */}
      <div className={`w-[190px] h-[52px] rounded-lg border transition-all duration-300 flex items-center overflow-hidden relative bg-white dark:bg-[#18191c] ${
        isActive
          ? `border-[#1890FF] shadow-[0_0_16px_rgba(24,144,255,0.22)] ring-1 ring-[#1890FF]/35`
          : `border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-[#1890FF]/50 hover:shadow-md`
      } ${
        isFused && msg.id === 'fused-consensus'
          ? 'border-amber-500/60 dark:border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.18)]'
          : ''
      }`}>
        {/* Leftmost avatar box */}
        <div className="w-12 h-full flex items-center justify-center shrink-0 border-r border-gray-150 dark:border-slate-800/80 bg-gray-55/60 dark:bg-black/20 rounded-l-lg text-lg select-none">
          {isFused && msg.id === 'fused-consensus' ? '🤝' : msg.avatar}
        </div>

        {/* Right content box */}
        <div className="flex-1 min-w-0 px-2.5 flex flex-col justify-center text-left pr-6">
          <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 truncate leading-tight">
            {isFused && msg.id === 'fused-consensus' ? 'Consenso Multilateral' : msg.agentName}
          </p>
          <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate mt-0.5">
            {isFused && msg.id === 'fused-consensus' ? 'Síntesis Experta' : msg.role}
          </p>
        </div>

        {/* Right Status Dot / Rotating Spinner */}
        {thinkingTool ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
          </div>
        ) : (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.hex, boxShadow: `0 0 8px ${sc.hex}` }} />
          </div>
        )}
      </div>

      {/* Floating Tool Action Badge */}
      <AnimatePresence>
        {thinkingTool && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.9 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[-32px] w-[180px] backdrop-blur-md bg-white/85 dark:bg-black/85 border border-[#1890FF]/30 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-[8.5px] font-bold text-[#1890FF] uppercase shadow-lg select-none z-30"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#1890FF]" />
            <span className="truncate leading-none">{thinkingTool}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const getBasePosition = (idx: number, total: number, isFusedNode: boolean) => {
  if (isFusedNode) {
    return { x: 380, y: 0 };
  }
  
  // Arrange nodes in a beautiful sequential pipeline flow (left-to-right columns)
  // Column width is 240px, row height is 220px.
  // Col 0: idx 0, 1 (Left)
  // Col 1: idx 2, 3 (Middle)
  // Col 2: idx 4, 5 (Right)
  const colWidth = 240;
  const rowHeight = 220;

  const col = Math.floor(idx / 2);
  const row = idx % 2;

  const numCols = Math.ceil(total / 2);
  // Center alignment offset
  const startX = -((numCols - 1) * colWidth) / 2 - 80;

  const x = startX + col * colWidth;
  // Alternate top / bottom
  const y = (row === 0 ? -1 : 1) * (rowHeight / 2 - 10);

  return { x, y };
};

const getCubicBezierPath = (fromX: number, fromY: number, toX: number, toY: number) => {
  const dx = Math.max(Math.abs(toX - fromX) * 0.45, 60);
  return `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
};

// ── MAIN COMPONENT ─────────────────────────────────────────────

export function MiroFishSandbox({ selectedSimulation, onClearSelected, onSimulationSaved, onGoBack, onSimulationActiveChange }: MiroFishSandboxProps) {
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playback Control states
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  // Pan & Zoom states (n8n canvas)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});

  // Settings configuration states (Popover)
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [rounds, setRounds] = useState<number>(5);
  const [agentCount, setAgentCount] = useState<number>(4);
  const [selectedModel, setSelectedModel] = useState<'fast' | 'pro'>('fast');
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType>('financial');

  const user = useAuthStore((s) => s.user);
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free")) as PlanTier;
  const maxAgentsAllowed = useMemo(() => {
    return getPlanConfig(userTier).maxAgents;
  }, [userTier]);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalCustomTitle, setUpgradeModalCustomTitle] = useState<string | undefined>(undefined);
  const [upgradeModalCustomMessage, setUpgradeModalCustomMessage] = useState<string | undefined>(undefined);

  // Warning Modal State (First-time Multi-Agent usage)
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [presets, setPresets] = useState<typeof PRESETS>([]);

  // Pick 3 random general presets on mount
  useEffect(() => {
    const randomGeneral = [...PRESETS].sort(() => 0.5 - Math.random()).slice(0, 3);
    setPresets(randomGeneral);
  }, []);

  useEffect(() => {
    if (user) {
      const supabase = createClient();
      supabase.from("portfolios").select("*").eq("user_id", user.id)
        .then(async ({ data: dbAssets }) => {
          if (dbAssets && dbAssets.length > 0) {
            const symbols = dbAssets.map(a => a.symbol).join(",");
            try {
              const res = await fetch(`/api/finance/portfolio?symbols=${symbols}`);
              if (res.ok) {
                const liveData = await res.json();
                const enriched = dbAssets.map(dbA => {
                  const live = liveData.find((l: any) => l.symbol === dbA.symbol) || {};
                  return {
                    ...dbA,
                    price: live.price || 0,
                    value: (live.price || 0) * (dbA.shares || 0)
                  };
                });
                
                enriched.sort((a, b) => b.value - a.value);
                const topAsset = enriched[0];
                const secondAsset = enriched[1];
                const thirdAsset = enriched[2];

                const dynamicPresets: typeof PRESETS = [];

                if (topAsset) {
                  dynamicPresets.push({
                    emoji: "👑",
                    title: `¿Cómo impactarán las tendencias macroeconómicas a ${topAsset.company_name} (${topAsset.symbol})?`,
                    content: `Iniciar un debate de expertos sobre las perspectivas de crecimiento, múltiplos de valoración y riesgos fundamentales para ${topAsset.company_name} (${topAsset.symbol}), que es la acción con mayor peso en mi portafolio.`
                  });
                  dynamicPresets.push({
                    emoji: "💰",
                    title: `Perspectiva de dividendos y sostenibilidad de caja para ${topAsset.symbol}`,
                    content: `Analizar la generación de flujo de caja libre de ${topAsset.company_name} (${topAsset.symbol}) y evaluar si su política de retribución al accionista es sostenible en el largo plazo.`
                  });
                  dynamicPresets.push({
                    emoji: "📈",
                    title: `Análisis de volatilidad y soporte técnico para ${topAsset.company_name} (${topAsset.symbol})`,
                    content: `Debatir los niveles clave de soporte, resistencia y promedios móviles para las acciones de ${topAsset.symbol} para determinar puntos óptimos de entrada o salida.`
                  });
                }

                if (secondAsset) {
                  dynamicPresets.push({
                    emoji: "⚖️",
                    title: `Análisis comparativo: ${secondAsset.company_name} frente a mi portafolio`,
                    content: `Debatir si es momento de rebalancear mi posición en ${secondAsset.company_name} (${secondAsset.symbol}) o mantener la asignación actual en relación con mi portafolio de activos.`
                  });
                  dynamicPresets.push({
                    emoji: "🔍",
                    title: `¿Debería incrementar posiciones en ${secondAsset.company_name} (${secondAsset.symbol})?`,
                    content: `Simular las ventajas y desventajas de aumentar la exposición en ${secondAsset.symbol} a las cotizaciones actuales de mercado basándose en su potencial de crecimiento de utilidades.`
                  });
                } else if (topAsset) {
                  dynamicPresets.push({
                    emoji: "🛡️",
                    title: `Simulación de cobertura de riesgo para mi portafolio concentrado`,
                    content: `Generar estrategias de cobertura (hedging) frente a la volatilidad del mercado para mi portafolio compuesto principalmente por acciones de ${topAsset.symbol}.`
                  });
                }

                if (thirdAsset) {
                  dynamicPresets.push({
                    emoji: "🔬",
                    title: `Análisis de riesgos competitivos para ${thirdAsset.company_name} (${thirdAsset.symbol})`,
                    content: `Evaluar el foso económico (economic moat) de ${thirdAsset.company_name} frente a sus competidores directos y si corre el riesgo de perder cuota de mercado en los próximos trimestres.`
                  });
                }

                if (enriched.length > 0) {
                  const symbolsStr = enriched.map(a => a.symbol).slice(0, 3).join(", ");
                  dynamicPresets.push({
                    emoji: "📰",
                    title: `Auditoría de noticias de mis activos en cartera: ${symbolsStr}`,
                    content: `Monitorear y debatir las últimas noticias y cotizaciones que afectan directamente a mis activos en cartera (${symbolsStr}). Identificar señales de alerta.`
                  });
                  dynamicPresets.push({
                    emoji: "🌐",
                    title: `Sensibilidad de mi portafolio ante cambios en las tasas de interés`,
                    content: `Evaluar el impacto teórico de un escenario de tasas de interés altas prolongadas frente a un escenario de recortes rápidos sobre la valuación de mis activos: ${enriched.map(a => a.symbol).slice(0, 4).join(", ")}.`
                  });
                }

                // Combine dynamic presets with general presets, shuffle and select 3 randomly
                const combined = [...dynamicPresets, ...PRESETS];
                const shuffled = combined.sort(() => 0.5 - Math.random()).slice(0, 3);
                setPresets(shuffled);
              }
            } catch (err) {
              console.error("Error loading personalized presets:", err);
            }
          }
        });
    }
  }, [user]);

  // View state: 'canvas' | 'report'
  const [activeView, setActiveView] = useState<'canvas' | 'report'>('canvas');
  const [showExportModal, setShowExportModal] = useState(false);

  const [fullSimulation, setFullSimulation] = useState<SimulationResult | null>(null);
  const [visibleDialogue, setVisibleDialogue] = useState<AgentMessage[]>([]);
  const [thinkingAgent, setThinkingAgent] = useState<{ agentName: string; avatar: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!canvasRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width: width || 800, height: height || 600 });
      }
    });
    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Custom agent builder state (Default 4 customizable agents)
  const [customAgents, setCustomAgents] = useState<CustomAgentConfig[]>([
    { id: 'c1', agentName: 'Estratega Alfa', avatar: '🤖', role: 'Análisis Cuantitativo', sentiment: 'bullish', specialty: 'Identifica correlaciones cuantitativas y optimiza la distribución del portafolio.' },
    { id: 'c2', agentName: 'Analista Beta', avatar: '💡', role: 'Valuación Fundamental', sentiment: 'neutral', specialty: 'Estudia balances corporativos, flujo de caja libre, ingresos y múltiplos de valuación.' },
    { id: 'c3', agentName: 'Auditor Gamma', avatar: '🔬', role: 'Investigación Macro', sentiment: 'bearish', specialty: 'Analiza el entorno de tasas de interés de la Fed, inflación y riesgos del mercado global.' },
    { id: 'c4', agentName: 'Gestor Delta', avatar: '⚡', role: 'Cobertura de Riesgo', sentiment: 'bullish', specialty: 'Diseña estrategias con contratos de opciones, coberturas (hedging) y mitigación de volatilidad.' }
  ]);

  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<CustomAgentConfig, 'id'>>({
    agentName: '',
    avatar: '🤖',
    role: '',
    sentiment: 'bullish',
    specialty: ''
  });

  // Briefing steps logs state (for the corporate AI Briefing Card)
  const [briefingSteps, setBriefingSteps] = useState<{ label: string; status: 'pending' | 'running' | 'done' }[]>([]);

  // Canvas state
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [fusionComplete, setFusionComplete] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sidebar drag handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth >= 280 && newWidth <= 650) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setAttachedFile({
          name: file.name,
          content: content.slice(0, 20000)
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag-to-Pan logic for the background canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-bg')) return;
    e.preventDefault();
    const startX = e.clientX - pan.x;
    const startY = e.clientY - pan.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setPan({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Accumulate node drag deltas in real-time
  const handleNodeDrag = (agentName: string, delta: { x: number; y: number }) => {
    setNodeOffsets(prev => {
      const current = prev[agentName] || { x: 0, y: 0 };
      return {
        ...prev,
        [agentName]: {
          x: current.x + delta.x,
          y: current.y + delta.y
        }
      };
    });
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setInputQuery(preset.title);
  };

  // Custom Agent Builder logic
  const handleEditAgent = (agent: CustomAgentConfig) => {
    setEditingAgentId(agent.id);
    setEditForm({
      agentName: agent.agentName,
      avatar: agent.avatar,
      role: agent.role,
      sentiment: agent.sentiment,
      specialty: agent.specialty
    });
  };

  const handleSaveAgent = () => {
    if (!editingAgentId) return;
    setCustomAgents(prev => prev.map(a => a.id === editingAgentId ? { ...a, ...editForm } : a));
    setEditingAgentId(null);
  };

  const handleDeleteAgent = (id: string) => {
    setCustomAgents(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAgent = () => {
    if (customAgents.length >= maxAgentsAllowed) {
      setToastMessage(`Máximo de ${maxAgentsAllowed} expertos en la mesa redonda`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const newId = `c${Date.now()}`;
    const newAgent: CustomAgentConfig = {
      id: newId,
      agentName: `Estratega Nuevo`,
      avatar: '🤖',
      role: 'Analista Técnico',
      sentiment: 'neutral',
      specialty: 'Aporta perspectivas complementarias al debate financiero.'
    };
    setCustomAgents(prev => [...prev, newAgent]);
    handleEditAgent(newAgent);
  };

  // ── Fusion Logic: Group agents by sentiment ──
  const fusionGroups = useMemo(() => {
    if (!fusionComplete || visibleDialogue.length === 0) return null;

    const agentMap = new Map<string, AgentMessage>();
    visibleDialogue.forEach(msg => {
      agentMap.set(msg.agentName, msg);
    });
    const uniqueAgents = Array.from(agentMap.values());

    const groups: Record<string, AgentMessage[]> = {};
    uniqueAgents.forEach(agent => {
      if (!groups[agent.sentiment]) groups[agent.sentiment] = [];
      groups[agent.sentiment].push(agent);
    });

    const fusedGroups: { leader: AgentMessage; members: AgentMessage[]; sentiment: string }[] = [];
    const standalone: AgentMessage[] = [];

    Object.entries(groups).forEach(([sentiment, agents]) => {
      if (agents.length >= 2) {
        fusedGroups.push({
          leader: agents[0],
          members: agents.slice(1),
          sentiment,
        });
      } else {
        standalone.push(...agents);
      }
    });

    return { fusedGroups, standalone };
  }, [fusionComplete, visibleDialogue]);

  // ── Computed: Canvas nodes to render (including drag offsets) ──
  const canvasNodes = useMemo(() => {
    const rawNodes = (() => {
      if (fusionComplete && fusionGroups) {
        const nodes: { msg: AgentMessage; position: { x: number; y: number }; isFused: boolean; fusedWith?: AgentMessage[] }[] = [];
        const uniqueCount = fusionGroups.fusedGroups.length + fusionGroups.standalone.length;
        let idx = 0;

        fusionGroups.fusedGroups.forEach(group => {
          nodes.push({
            msg: group.leader,
            position: getBasePosition(idx, uniqueCount, false),
            isFused: true,
            fusedWith: group.members,
          });
          idx++;
        });

        fusionGroups.standalone.forEach(agent => {
          nodes.push({
            msg: agent,
            position: getBasePosition(idx, uniqueCount, false),
            isFused: false,
          });
          idx++;
        });

        // Append the golden Fused Consenso card on the far right as synthesis
        if (nodes.length > 0) {
          nodes.push({
            msg: {
              id: 'fused-consensus',
              agentName: 'Consenso Multilateral',
              avatar: '🤝',
              role: 'Síntesis Experta AI',
              sentiment: nodes[0].msg.sentiment,
              message: fullSimulation?.summaryReport
                ? fullSimulation.summaryReport.replace(/[\#\*\_]+/g, '').slice(0, 150) + "..."
                : "Se ha alcanzado un consenso multilateral exitoso.",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            position: getBasePosition(idx, uniqueCount, true),
            isFused: true,
            fusedWith: nodes.map(n => n.msg)
          });
        }

        return nodes;
      }

      const agentMap = new Map<string, AgentMessage>();
      visibleDialogue.forEach(msg => {
        agentMap.set(msg.agentName, msg);
      });
      const uniqueAgents = Array.from(agentMap.values()).slice(0, agentCount);
      return uniqueAgents.map((msg, idx) => ({
        msg,
        position: getBasePosition(idx, uniqueAgents.length, false),
        isFused: false,
        fusedWith: undefined,
      }));
    })();

    // Apply drag offsets to the final coordinate output
    return rawNodes.map(node => {
      const offset = nodeOffsets[node.msg.agentName] || { x: 0, y: 0 };
      return {
        ...node,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y
        }
      };
    });
  }, [visibleDialogue, fusionComplete, fusionGroups, agentCount, nodeOffsets, fullSimulation]);

  // ── Computed Sparkline Path for the Agent Inspector ──
  const inspectorAgent = useMemo(() => {
    if (selectedCardIndex === null || canvasNodes.length === 0) return null;
    const node = canvasNodes[selectedCardIndex];
    if (!node) return null;

    const agentName = node.msg.agentName;
    const isFusedNode = node.isFused;
    const allMatchingMessages = visibleDialogue.filter(m => 
      m.agentName === agentName || (isFusedNode && node.fusedWith?.some(f => f.agentName === m.agentName))
    );

    const points = allMatchingMessages.map((m, idx) => {
      const x = idx * 45 + 10;
      const y = m.sentiment === 'bullish' ? 5 : m.sentiment === 'bearish' ? 35 : 20;
      return { x, y };
    });

    let sparklinePath = "";
    if (points.length > 1) {
      sparklinePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    } else if (points.length === 1) {
      sparklinePath = `M 10 ${points[0].y} L 150 ${points[0].y}`;
    } else {
      sparklinePath = `M 10 20 L 150 20`;
    }

    const mockToolsUsed = [
      "Búsqueda en la Web (Noticias frescas)",
      "Cálculo Técnico de CAGR e Indicadores",
      "Modelación Predictiva de Portafolio",
      "Stress Testing del Sector en Escenarios de Crisis"
    ].slice(0, 2 + (agentName.charCodeAt(0) % 3));

    return {
      node,
      messages: allMatchingMessages,
      sparklinePath,
      toolsUsed: mockToolsUsed
    };
  }, [selectedCardIndex, canvasNodes, visibleDialogue]);

  // Sync state when loading a saved simulation
  useEffect(() => {
    if (selectedSimulation) {
      setFullSimulation(selectedSimulation.simulation);
      const dialogues = (selectedSimulation.simulation.dialogue || []).filter(Boolean);
      setVisibleDialogue(dialogues);
      setInputQuery(selectedSimulation.title);
      setSimulationState('completed');
      setSimulationIndex(dialogues.length);
      setFusionComplete(true);
      onSimulationActiveChange?.(true);
      if (selectedSimulation.agentType) {
        setSelectedAgentType(selectedSimulation.agentType as AgentType);
      }
      if (selectedSimulation.rounds) {
        setRounds(selectedSimulation.rounds);
      }
      if (selectedSimulation.swarmSize) {
        setAgentCount(selectedSimulation.swarmSize);
      }
    }
  }, [selectedSimulation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleDialogue, briefingSteps, simulationState, thinkingAgent]);

  // ── Playback Engine State Machine Effect ──
  useEffect(() => {
    if (simulationState !== 'running' || !fullSimulation || !isPlaying || isLoading) return;

    const dialogueList = (fullSimulation.dialogue || []).filter(Boolean).slice(0, agentCount);
    if (dialogueList.length === 0) return;

    if (simulationIndex >= dialogueList.length) {
      setThinkingAgent(null);
      const delay = 1500 / playbackSpeed;
      const timer = setTimeout(() => {
        setFusionComplete(true);
        setSimulationState('completed');
      }, delay);
      return () => clearTimeout(timer);
    }

    const currentMsg = dialogueList[simulationIndex];
    if (!currentMsg) {
      setSimulationIndex(prev => prev + 1);
      return;
    }

    setThinkingAgent({
      agentName: currentMsg.agentName,
      avatar: currentMsg.avatar,
      role: currentMsg.role
    });

    const baseThinkingTime = 1800;
    const basePostingTime = 2200;

    const thinkingTimeout = setTimeout(() => {
      setVisibleDialogue(prev => {
        if (prev.some(m => m.id === currentMsg.id)) return prev;
        return [...prev, currentMsg];
      });
      setThinkingAgent(null);

      const postingTimeout = setTimeout(() => {
        setSimulationIndex(prev => prev + 1);
      }, basePostingTime / playbackSpeed);

    }, baseThinkingTime / playbackSpeed);

    return () => {
      clearTimeout(thinkingTimeout);
    };
  }, [simulationState, fullSimulation, isPlaying, simulationIndex, playbackSpeed, isLoading, agentCount]);

  const handleStepForward = () => {
    if (!fullSimulation) return;
    const dialogueList = (fullSimulation.dialogue || []).filter(Boolean).slice(0, agentCount);
    if (simulationIndex < dialogueList.length) {
      const nextMsg = dialogueList[simulationIndex];
      setVisibleDialogue(prev => {
        if (prev.some(m => m.id === nextMsg.id)) return prev;
        return [...prev, nextMsg];
      });
      setSimulationIndex(prev => prev + 1);
      setThinkingAgent(null);
    }
  };

  const handleStepBackward = () => {
    if (simulationIndex > 0) {
      setVisibleDialogue(prev => prev.slice(0, prev.length - 1));
      setSimulationIndex(prev => prev - 1);
      setThinkingAgent(null);
      setFusionComplete(false);
      if (simulationState === 'completed') {
        setSimulationState('running');
      }
    }
  };

  const handleUserIntervention = () => {
    if (simulationState !== 'running' || !fullSimulation || !inputQuery.trim()) return;
    
    setIsPlaying(false);

    const interventionMessage: AgentMessage = {
      id: `intervention-${Date.now()}`,
      agentName: 'Usuario (Maestro)',
      avatar: '👤',
      role: 'Director de Estrategia',
      sentiment: 'neutral',
      message: inputQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedDialogue = [...(fullSimulation.dialogue || [])];
    updatedDialogue.splice(simulationIndex, 0, interventionMessage);

    setFullSimulation({
      ...fullSimulation,
      dialogue: updatedDialogue
    });

    setVisibleDialogue(prev => [...prev, interventionMessage]);
    setSimulationIndex(prev => prev + 1);
    setInputQuery("");
  };

  const handleTryStartSimulation = () => {
    if (!inputQuery.trim()) return;
    const warningShown = localStorage.getItem("r_swarm_first_time_warning_shown");
    if (!warningShown) {
      setShowWarningModal(true);
    } else {
      startSimulation();
    }
  };

  const handleConfirmWarning = () => {
    localStorage.setItem("r_swarm_first_time_warning_shown", "true");
    setShowWarningModal(false);
    startSimulation();
  };

  const startSimulation = async () => {
    if (!inputQuery.trim()) return;

    setSimulationState('running');
    onSimulationActiveChange?.(true);
    setIsLoading(true);
    setFusionComplete(false);
    setSelectedCardIndex(null);
    setIsPlaying(true);
    setVisibleDialogue([]);
    setSimulationIndex(0);
    setThinkingAgent(null);
    setActiveView('canvas');
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setNodeOffsets({});

    // Initialize progressive briefing steps
    const stepsInitial = [
      { label: "Optimización de consulta con terminología de Wall Street", status: 'running' as const },
      { label: "Consolidación e historial de activos del portafolio", status: 'pending' as const },
      { label: "Sincronización de búsquedas web y cotizaciones en vivo", status: 'pending' as const },
      { label: "Conexión y preparación de la mesa de debate experto", status: 'pending' as const }
    ];
    setBriefingSteps(stepsInitial);

    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    
    stepTimers.push(setTimeout(() => {
      setBriefingSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'running' } : s));
    }, 700));

    stepTimers.push(setTimeout(() => {
      setBriefingSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'running' } : s));
    }, 1400));

    stepTimers.push(setTimeout(() => {
      setBriefingSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'done' } : i === 3 ? { ...s, status: 'running' } : s));
    }, 2100));

    try {
      const res = await fetch("/api/agents/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleTitle: inputQuery,
          articleContent: attachedFile ? attachedFile.content : "",
          modelId: selectedModel,
          rounds: rounds,
          agentType: selectedAgentType,
          customAgents: selectedAgentType === 'custom' ? customAgents : undefined,
          agentCount: selectedAgentType === 'custom' ? customAgents.length : agentCount
        })
      });

      const data = await res.json();
      stepTimers.forEach(t => clearTimeout(t));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to simulate");
      }

      setBriefingSteps(stepsInitial.map(s => ({ ...s, status: 'done' })));
      setFullSimulation(data.simulation);
      setIsLoading(false);

      // Save to localStorage
      let savedList: SavedSimulation[] = [];
      try {
        const loaded = localStorage.getItem("r_swarm_simulations");
        if (loaded) {
          const parsed = JSON.parse(loaded);
          if (Array.isArray(parsed)) {
            savedList = parsed;
          }
        }
      } catch {}
      const newSim: SavedSimulation = {
        id: Date.now().toString(),
        title: inputQuery,
        timestamp: new Date().toISOString(),
        simulation: data.simulation,
        swarmSize: selectedAgentType === 'custom' ? customAgents.length : agentCount,
        rounds: rounds,
        bias: "expert",
        distribution: { retail: 25, institutional: 25, speculators: 50 },
        agentType: selectedAgentType,
      };
      localStorage.setItem("r_swarm_simulations", JSON.stringify([newSim, ...savedList].slice(0, 10)));
      onSimulationSaved();

    } catch (e: any) {
      stepTimers.forEach(t => clearTimeout(t));
      setIsLoading(false);
      setBriefingSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'pending' } : s));
      setToastMessage(`❌ Error en mesa redonda: ${e.message}`);
      setTimeout(() => { setToastMessage(null); resetSandbox(); }, 3000);
    }
  };

  const resetSandbox = () => {
    setSimulationState('idle');
    onSimulationActiveChange?.(false);
    setVisibleDialogue([]);
    setFullSimulation(null);
    setInputQuery("");
    setAttachedFile(null);
    setThinkingAgent(null);
    setBriefingSteps([]);
    setFusionComplete(false);
    setSelectedCardIndex(null);
    setIsPlaying(true);
    setActiveView('canvas');
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setNodeOffsets({});
    onClearSelected();
  };

  const activeThinkingTool = useMemo(() => {
    if (!thinkingAgent) return null;
    const role = thinkingAgent.role.toLowerCase();
    if (role.includes("fundamental")) return "🔍 Buscando balances corporativos e ingresos...";
    if (role.includes("técnico") || role.includes("graficador")) return "📈 Trazando medias móviles y CAGR...";
    if (role.includes("macro") || role.includes("estratega")) return "🌐 Analizando tasas e indicadores globales...";
    if (role.includes("riesgo") || role.includes("cobertura")) return "🛡️ Computando diversificación y hedging...";
    if (role.includes("tendencias") || role.includes("sectorial")) return "📊 Cruzando noticias del sector y demanda...";
    if (role.includes("sentimiento") || role.includes("datos")) return "💬 Evaluando sentimiento y datos predictivos...";
    return "🤖 Procesando asunciones y redactando...";
  }, [thinkingAgent]);

  const activeTypeConfig = AGENT_TYPES.find(t => t.id === selectedAgentType) || AGENT_TYPES[1];

  const handleCopyReport = () => {
    if (!fullSimulation?.summaryReport) return;
    navigator.clipboard.writeText(fullSimulation.summaryReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!fullSimulation?.summaryReport) return;
    const element = document.createElement("a");
    const file = new Blob([fullSimulation.summaryReport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Reporte_Ejecutivo_${inputQuery.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans relative bg-transparent transition-colors overflow-hidden">
      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -32;
          }
        }
        .animate-flow-dash {
          stroke-dasharray: 8 24;
          animation: flowDash 1.2s linear infinite;
        }
        .minimap-vp-drag {
          cursor: grab;
        }
        .minimap-vp-drag:active {
          cursor: grabbing;
        }
      `}</style>
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-black shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/10"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.csv,.json,.ts,.js,.pdf"
      />

      {simulationState === 'idle' ? (
        /* ─── STATE A: BEAUTIFUL WELCOME SCREEN ─── */
        <div className="flex-1 w-full h-full relative flex flex-col bg-gradient-to-b from-[#FAFAFA] to-white dark:from-[#0B0F19] dark:to-[#070b13] overflow-hidden font-medium">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#1890FF]/5 dark:bg-[#1890FF]/3 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/3 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          <div className="flex-1 overflow-y-auto hidden-scrollbar py-8 px-6 flex flex-col items-center justify-center min-h-[85vh] z-10 w-full font-medium">
            <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-7 py-4 font-medium">
              
              <div className="flex flex-col items-center space-y-3 font-medium">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    Mesa Redonda <span className="bg-gradient-to-r from-[#1890FF] to-indigo-500 bg-clip-text text-transparent">Multi-Agente</span>
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto leading-relaxed">
                    Debate con nuestro panel de agentes IA con Mimo v2.5 Flash y búsqueda web en vivo.
                  </p>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="w-full max-w-3xl space-y-2 pt-1 font-medium">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest block text-center">Plantillas de Consulta</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {presets.map((p, idx) => {
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePresetSelect(p)}
                        className="p-4 text-left bg-white dark:bg-white/[0.02] hover:bg-[#1890FF]/5 dark:hover:bg-white/[0.04] border border-gray-250/60 dark:border-white/5 rounded-2xl transition-all flex flex-col gap-2.5 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="w-7 h-7 bg-gray-55 dark:bg-black/30 rounded-lg flex items-center justify-center text-xs border border-gray-150 dark:border-white/5 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                          {p.emoji || "📊"}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-gray-700 dark:text-gray-300 group-hover:text-[#1890FF] transition-colors line-clamp-1 leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-[9px] text-gray-400 dark:text-gray-550 font-semibold mt-1 line-clamp-2 leading-relaxed">
                            {p.content}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Absolute bottom Form Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#070b13] dark:via-[#070b13]/95 pt-8 pb-3 px-4 md:px-8 z-35">
            <div className="w-full max-w-2xl mx-auto relative pointer-events-auto">
              
              <AnimatePresence>
                {attachedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full left-4 mb-2 bg-white dark:bg-[#111827] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md z-45"
                  >
                    <Paperclip className="w-3 h-3 text-[#1890FF]" />
                    <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={(e) => { e.preventDefault(); handleTryStartSimulation(); }}
                className="relative flex items-end gap-2 bg-white dark:bg-[#111827] border border-gray-250/60 dark:border-gray-700/50 rounded-2xl p-1.5 shadow-md focus-within:ring-4 focus-within:ring-[#1890FF]/15 focus-within:border-[#1890FF]/50 transition-all w-full text-left"
              >
                <div className="flex items-center gap-1.5 pb-0.5 pl-1 shrink-0 relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>

                  {/* Settings Trigger Pill */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                      className={`h-9 px-3 flex items-center justify-center gap-1.5 rounded-full transition-colors z-30 border ${
                        showSettingsPopover
                          ? "bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/25 shadow-inner"
                          : "bg-gray-55 dark:bg-white/5 text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-white/10"
                      }`}
                      title="Ajustes de Mesa Multi-Agente"
                    >
                      {selectedModel === 'fast' ? <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />}
                      <span className="text-[10px] font-black hidden sm:inline">
                        Ajustes
                      </span>
                    </button>

                    {/* Popover Settings Panel */}
                    <AnimatePresence>
                      {showSettingsPopover && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setShowSettingsPopover(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute bottom-full left-0 mb-3 w-[290px] bg-white/95 dark:bg-[#0f1420]/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-150 dark:border-white/10 z-50 flex flex-col gap-4 font-sans select-none text-left"
                          >
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2.5">
                              <div className="flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5 text-[#1890FF]" />
                                <span className="text-[10px] font-black text-gray-950 dark:text-white uppercase tracking-widest leading-none">
                                  Configurar Mesa
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-[#1890FF]/10 text-[#1890FF] border border-[#1890FF]/20">
                                {userTier === "free" ? "Gratuito" : `Plan ${userTier.toUpperCase()}`}
                              </span>
                            </div>

                            {/* Model selection */}
                            <div className="space-y-1.5">
                              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Modelo Inteligencia (LLM)</span>
                              <div className="grid grid-cols-2 gap-1.5 bg-gray-50 dark:bg-black/30 p-0.5 rounded-xl border border-gray-100 dark:border-white/5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedModel('fast')}
                                  className={`py-1.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                                    selectedModel === 'fast'
                                      ? 'bg-white dark:bg-[#1c2436] text-[#1890FF] shadow-sm border border-gray-100 dark:border-transparent'
                                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                                  }`}
                                >
                                  Zap Fast
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedModel('pro')}
                                  className={`py-1.5 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                                    selectedModel === 'pro'
                                      ? 'bg-white dark:bg-[#1c2436] text-amber-500 shadow-sm border border-gray-100 dark:border-transparent font-extrabold'
                                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                                  }`}
                                >
                                  Sparkles Pro
                                </button>
                              </div>
                            </div>

                            {/* Rounds slider */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">
                                <span>Rondas de Debate</span>
                                <span className="text-[#1890FF] font-black">{rounds} Rondas</span>
                              </div>
                              <input
                                  type="range"
                                  min="2"
                                  max="10"
                                  value={rounds}
                                  onChange={(e) => setRounds(parseInt(e.target.value))}
                                  className="w-full accent-[#1890FF] h-1 bg-gray-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                              />
                            </div>

                            {/* Agent count slider */}
                            {selectedAgentType !== 'custom' && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">
                                  <span>Cantidad de Agentes</span>
                                  <span className="text-[#1890FF] font-black">{agentCount} / {maxAgentsAllowed}</span>
                                </div>
                                <input
                                  type="range"
                                  min="2"
                                  max={maxAgentsAllowed}
                                  value={agentCount}
                                  onChange={(e) => setAgentCount(parseInt(e.target.value))}
                                  className="w-full accent-[#1890FF] h-1 bg-gray-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                                />
                                <span className="text-[7.5px] font-bold text-gray-400 dark:text-gray-500 block text-right leading-none mt-1">
                                  Tu nivel {userTier.toUpperCase()} te permite hasta {maxAgentsAllowed} agentes.
                                </span>
                              </div>
                            )}

                            {/* Plan limits upsell list */}
                            {userTier !== 'ultra' && (
                              <div className="mt-1 pt-2.5 border-t border-gray-100 dark:border-white/5 space-y-1.5">
                                <span className="text-[8px] font-bold text-gray-450 dark:text-gray-550 uppercase tracking-widest block">Límites por Plan</span>
                                <div className="grid grid-cols-3 gap-1">
                                  {[
                                    { id: 'pro', name: 'Pro', max: 20 },
                                    { id: 'max', name: 'Max', max: 50 },
                                    { id: 'ultra', name: 'Ultra', max: 100 }
                                  ].map((plan) => {
                                    const isLocked = getPlanConfig(userTier).maxAgents < plan.max;
                                    const isActive = userTier === plan.id;
                                    return (
                                      <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => {
                                          if (isLocked) {
                                            setUpgradeModalCustomTitle(`Sube al Plan ${plan.name}`);
                                            setUpgradeModalCustomMessage(`Configura hasta ${plan.max} agentes simultáneos en tu mesa redonda para debates y análisis más exhaustivos. Actualiza tu suscripción ahora.`);
                                            setIsUpgradeModalOpen(true);
                                          }
                                        }}
                                        className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all ${
                                          isActive
                                            ? 'bg-blue-500/5 border-blue-500/20 text-[#1890FF]'
                                            : isLocked
                                            ? 'bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer'
                                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                        }`}
                                      >
                                        <span className="text-[8.5px] font-black flex items-center gap-0.5">
                                          {plan.name}
                                          {isLocked && <Lock className="w-2 h-2 shrink-0 text-gray-400" />}
                                        </span>
                                        <span className="text-[7.5px] font-semibold opacity-75 mt-0.5">{plan.max} Agtes</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                  </div>
                </div>

                <textarea
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTryStartSimulation();
                    }
                  }}
                  placeholder="Escribe tu consulta financiera o tema a debatir..."
                  className="flex-1 bg-transparent text-[13px] py-2.5 px-2.5 max-h-32 min-h-[38px] resize-none outline-none disabled:cursor-not-allowed font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  disabled={isLoading}
                  rows={1}
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputQuery.trim()}
                  className="w-9 h-9 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </form>
              <div className="text-center mt-1">
                <span className="text-[8px] text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">Mesa Redonda Multi-Agente Corporativa</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ─── STATE B: LIVE SIMULATION (SPLIT-SCREEN) ─── */
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col md:flex-row bg-[#FAFAFA] dark:bg-[#0b0f19]">

          {/* ─── LEFT PANEL: Resizable Chat Sidebar ─── */}
          <div
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarWidth : '100%' }}
            className="w-full flex-shrink-0 h-[45dvh] md:h-full flex flex-col bg-white dark:bg-[#0F1117] border-b md:border-b-0 md:border-r border-gray-150 dark:border-white/5 relative z-10 shadow-lg"
          >
            {/* Drag Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="hidden md:block absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#1890FF]/40 active:bg-[#1890FF] z-30 transition-colors group"
            >
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>

            {/* Sidebar Header */}
            <div className="p-3 border-b border-gray-100 dark:border-white/5 shrink-0 flex justify-between items-center bg-white dark:bg-[#0F1117] select-none">
              <div className="flex items-center gap-2.5">
                {onGoBack && (
                  <button
                    type="button"
                    onClick={onGoBack}
                    className="w-7 h-7 rounded-lg bg-gray-55 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeTypeConfig.gradient} flex items-center justify-center shadow-md`}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-wider block leading-none">{activeTypeConfig.label}</span>
                  <span className="text-[8px] text-gray-400 font-bold tracking-wide mt-1 block leading-none">
                    Mesa Experta IA • Live Search
                  </span>
                </div>
              </div>
              <button
                onClick={resetSandbox}
                className="flex items-center gap-1 px-2 py-1 bg-gray-55 hover:bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-gray-200/50 dark:border-white/10"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Nueva
              </button>
            </div>

            {/* Chat Feed */}
            <div className="flex-grow flex flex-col h-full overflow-hidden relative">
              <div className="flex-grow overflow-y-auto hidden-scrollbar p-3.5 pb-24 space-y-3">

                {/* Progressive Briefing Steps Logs inside dialogue feed */}
                <div className="space-y-2.5">
                  
                  {briefingSteps.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-3xl border border-gray-150/60 dark:border-white/5 bg-white dark:bg-[#131924] shadow-sm space-y-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#1890FF]/10 dark:bg-[#1890FF]/20 flex items-center justify-center text-lg text-[#1890FF] shrink-0 border border-[#1890FF]/20 shadow-inner">
                          🎓
                        </div>
                        <div>
                          <span className="text-[10.5px] font-black text-gray-900 dark:text-white leading-none block">Director de Análisis AI</span>
                          <span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Pre-procesador del Swarm</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                        {briefingSteps.map((step, i) => (
                          <div key={i} className="flex items-center justify-between text-[10.5px] font-medium leading-normal gap-2">
                            <span className={step.status === 'done' ? 'text-gray-800 dark:text-gray-300' : 'text-gray-400'}>
                              {step.label}
                            </span>
                            <span className="shrink-0 pl-2 text-[9px] font-bold">
                              {step.status === 'done' ? (
                                <span className="text-emerald-500 font-black flex items-center gap-1">✓ Listo</span>
                              ) : step.status === 'running' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
                              ) : (
                                <span className="text-gray-350 dark:text-gray-600">● Espera</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Dialogue Messages bubble feed */}
                  {visibleDialogue.map((msg, idx) => {
                    if (!msg) return null;
                    const sc = sentimentColor(msg.sentiment);
                    return (
                      <motion.div
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex gap-2.5 p-3 rounded-2xl rounded-tl-lg border bg-white dark:bg-[#131924] shadow-sm cursor-pointer hover:border-[#1890FF]/30 transition-colors ${
                          msg.sentiment === 'bullish' ? 'border-emerald-500/10' :
                          msg.sentiment === 'bearish' ? 'border-red-500/10' :
                          'border-gray-150/50 dark:border-white/5'
                        }`}
                        onClick={() => {
                          const nodeIdx = canvasNodes.findIndex(node => node.msg.agentName === msg.agentName);
                          if (nodeIdx !== -1) {
                            setSelectedCardIndex(nodeIdx);
                            setActiveView('canvas');
                          }
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-55 dark:bg-black/30 flex items-center justify-center shrink-0 border border-gray-150 dark:border-white/5 shadow-inner text-base">
                          {msg.avatar}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black text-gray-900 dark:text-white leading-none block">{msg.agentName}</span>
                              <span className="text-[7.5px] text-gray-400 dark:text-gray-555 font-bold block uppercase mt-0.5 tracking-wider">{msg.role}</span>
                            </div>
                            <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${sc.bg} ${sc.text} ${sc.border}`}>
                              {msg.sentiment}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed mt-2 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Thinking Bubble */}
                  {thinkingAgent && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5 p-3 rounded-2xl rounded-tl-lg border border-[#1890FF]/20 bg-white dark:bg-[#131924] shadow-sm select-none"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-55 dark:bg-black/30 flex items-center justify-center shrink-0 border border-gray-150 dark:border-white/5 shadow-inner text-base">
                        {thinkingAgent.avatar}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-gray-900 dark:text-white leading-none">{thinkingAgent.agentName}</span>
                          <span className="text-[7.5px] text-gray-400 dark:text-gray-555 font-bold uppercase tracking-wider">{thinkingAgent.role}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2 text-gray-500 dark:text-gray-400">
                          <span className="text-[10.5px] font-bold animate-pulse">Redactando postura experta...</span>
                          <span className="flex gap-0.5 mt-0.5">
                            <span className="w-1 h-1 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div ref={chatEndRef} className="h-4" />
              </div>

              {/* Sidebar Input Bar area */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/95 to-transparent pt-12 pb-5 px-5 pointer-events-none z-20">
                <div className="w-full relative pointer-events-auto">
                  <AnimatePresence>
                    {attachedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-full left-4 mb-3 bg-white text-gray-800 border border-gray-200 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md z-45"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#1890FF]" />
                        <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (simulationState === 'running') {
                        handleUserIntervention();
                      } else if (inputQuery.trim()) {
                        startSimulation();
                      }
                    }}
                    className="relative flex flex-col gap-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] focus-within:ring-4 focus-within:ring-[#1890FF]/15 transition-all w-full"
                  >
                    <textarea
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (simulationState === 'running') {
                            handleUserIntervention();
                          } else if (inputQuery.trim()) {
                            startSimulation();
                          }
                        }
                      }}
                      placeholder={simulationState === 'running' ? "Dicta una nueva directiva al equipo..." : "Tema a debatir..."}
                      className="w-full bg-transparent text-[13px] pt-4 px-5 pb-1 max-h-32 min-h-[44px] resize-none outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                      rows={1}
                    />

                    <div className="flex items-center justify-between px-2.5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={simulationState === 'running'}
                          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-5 h-5" />
                        </button>

                        <div className="relative">
                          {simulationState === 'running' ? (
                            <button
                              type="button"
                              onClick={handleUserIntervention}
                              disabled={!inputQuery.trim()}
                              className="h-9 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 flex items-center gap-2 transition-colors font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <OctagonPause className="w-4 h-4" /> Intervenir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                              className={`h-9 px-4 rounded-full transition-all border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                                showSettingsPopover
                                  ? "bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/25 shadow-inner"
                                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-transparent"
                              }`}
                            >
                              <Settings className="w-4 h-4" /> Ajustes
                            </button>
                          )}

                          {/* Frosted settings popover */}
                          <AnimatePresence>
                            {showSettingsPopover && simulationState !== 'running' && (
                              <>
                                <div className="fixed inset-0 z-45" onClick={() => setShowSettingsPopover(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                  transition={{ type: "spring", stiffness: 220, damping: 25 }}
                                  className="absolute bottom-12 left-0 z-50 w-72 bg-white/95 backdrop-blur-2xl border border-gray-200/60 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] space-y-5 text-left font-medium"
                                >
                                  <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                      <Settings className="w-4 h-4 text-[#1890FF]" /> Configuración
                                    </span>
                                    <button type="button" onClick={() => setShowSettingsPopover(false)} className="text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                      <span>Cantidad de Agentes</span>
                                      <span className="text-[#1890FF] font-black">{agentCount} Agentes</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="2"
                                      max="10"
                                      value={agentCount}
                                      onChange={(e) => setAgentCount(parseInt(e.target.value))}
                                      className="w-full accent-[#1890FF] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                      <span>Rondas de Debate</span>
                                      <span className="text-[#1890FF] font-black">{rounds} Rondas</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="2"
                                      max="10"
                                      value={rounds}
                                      onChange={(e) => setRounds(parseInt(e.target.value))}
                                      className="w-full accent-[#1890FF] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                    />
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!inputQuery.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          simulationState === 'running' 
                            ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 shadow-red-500/20' 
                            : 'bg-black text-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT AREA: WORKSPACE VISUAL CANVAS (n8n panning & zooming) ─── */}
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            className="flex-grow h-full relative overflow-hidden bg-[#FAFAFA] flex flex-col cursor-grab active:cursor-grabbing canvas-bg select-none"
          >
            {/* Vignette Overlay (Removed for pure light mode) */}
            <div className="hidden" />
            
            {/* Infinite Zoomable & Panable Grid Wrapper - NOW USING REACT FLOW */}
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <ReactFlowCanvas
                rawNodes={canvasNodes}
                simulationIndex={simulationIndex}
                fusionComplete={fusionComplete}
                isConsensoActive={fusionComplete && canvasNodes.some(n => n.msg.id === 'fused-consensus')}
                onNodeClick={(idx: number) => setSelectedCardIndex(selectedCardIndex === idx ? null : idx)}
                selectedCardIndex={selectedCardIndex}
                thinkingAgent={thinkingAgent}
                activeThinkingTool={activeThinkingTool}
              />
            </div>


            {/* Canvas Header (Static) */}
            <div className="absolute top-4 left-4 right-4 z-35 flex justify-between items-center pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/85 dark:bg-[#131924]/85 backdrop-blur-xl border border-gray-250/60 dark:border-white/5 shadow-md flex items-center gap-2 pointer-events-auto leading-none">
                <div className={`w-2 h-2 rounded-full ${simulationState === 'running' ? 'bg-[#1890FF] animate-pulse' : fusionComplete ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-[9.5px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-none">
                  {simulationState === 'running' ? 'Debate en Progreso' : fusionComplete ? 'Análisis Completado' : 'Mesa de Debate'}
                </span>
              </div>

              {fusionComplete && (
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 pointer-events-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Board-Ready
                </button>
              )}
            </div>

            {/* APPLE PLAYBACK CONTROLLER DECK */}
            <AnimatePresence>
              {simulationState === 'running' && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-gray-205 dark:border-white/5 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-2 select-none w-[240px] pointer-events-auto"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[8px] text-gray-400 dark:text-gray-550 font-extrabold uppercase tracking-widest">Controles de Debate</span>
                    <button
                      onClick={() => setPlaybackSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-[8.5px] font-black text-[#1890FF]"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <button
                      onClick={handleStepBackward}
                      disabled={simulationIndex === 0}
                      className="p-1.5 bg-gray-55 dark:bg-white/5 rounded-lg hover:text-[#1890FF] disabled:opacity-35 transition-colors cursor-pointer"
                      title="Intervención anterior"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={handleStepForward}
                      disabled={!fullSimulation || simulationIndex >= (fullSimulation.dialogue || []).length}
                      className="p-1.5 bg-gray-55 dark:bg-white/5 rounded-lg hover:text-[#1890FF] disabled:opacity-35 transition-colors cursor-pointer"
                      title="Siguiente intervención"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {fullSimulation && (
                    <div className="w-full space-y-1">
                      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden w-full relative">
                        <div
                          className="h-full bg-[#1890FF] transition-all duration-300"
                          style={{ width: `${(simulationIndex / Math.min((fullSimulation.dialogue || []).length, agentCount)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[7px] font-extrabold text-gray-400 tracking-wider">
                        <span>Intervención {simulationIndex}</span>
                        <span>Total: {Math.min((fullSimulation.dialogue || []).length, agentCount)}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Canvas View / Pages View switcher */}
            <AnimatePresence mode="wait">
              {activeView === 'canvas' ? (
                <div className="flex-grow w-full h-full pointer-events-none" />
              ) : (
                <motion.div
                  key="reportView"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="flex-1 w-full h-full overflow-y-auto hidden-scrollbar pt-20 pb-16 px-6 z-20 flex flex-col items-center justify-start pointer-events-auto"
                >
                  <div className="w-full max-w-2xl bg-white dark:bg-[#131924] border border-gray-250/60 dark:border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 text-left relative overflow-hidden font-sans">
                    
                    <div className="flex justify-between items-center border-b border-gray-150 dark:border-white/5 pb-4">
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block mb-1">Informe Corporativo</span>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Reporte Ejecutivo de Inversión</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyReport}
                          className="p-2 bg-gray-55 hover:bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white rounded-xl transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPDF}
                          className="p-2 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-black rounded-xl transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider shadow-md cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </button>
                      </div>
                    </div>

                    <div className="text-[12.5px] leading-relaxed text-gray-800 dark:text-gray-200 prose prose-invert font-medium max-w-none space-y-4">
                      {fullSimulation?.summaryReport ? (
                        fullSimulation.summaryReport.split("\n").map((line, idx) => {
                          const trim = line.trim();
                          if (trim.startsWith("###")) {
                            return <h4 key={idx} className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mt-4">{trim.replace("###", "")}</h4>;
                          }
                          if (trim.startsWith("##")) {
                            return <h3 key={idx} className="text-base font-black text-gray-900 dark:text-white tracking-tight mt-6 border-b border-gray-100 dark:border-white/5 pb-1">{trim.replace("##", "")}</h3>;
                          }
                          if (trim.startsWith("#")) {
                            return <h2 key={idx} className="text-lg font-black text-[#1890FF] tracking-tight mt-8">{trim.replace("#", "")}</h2>;
                          }
                          if (trim.startsWith("-")) {
                            return <li key={idx} className="ml-4 list-disc text-gray-650 dark:text-gray-400 mt-1">{trim.replace("-", "").trim()}</li>;
                          }
                          if (trim.startsWith("|")) {
                            if (trim.includes("---")) return null;
                            const cols = trim.split("|").map(c => c.trim()).filter(Boolean);
                            return (
                              <div key={idx} className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider">
                                {cols.map((col, i) => (
                                  <span key={i} className={i === 0 ? 'text-[#1890FF]' : 'text-gray-550'}>{col}</span>
                                ))}
                              </div>
                            );
                          }
                          return <p key={idx} className="text-gray-600 dark:text-gray-400 font-medium">{line}</p>;
                        })
                      ) : (
                        <p className="text-gray-400 font-bold">Construyendo informe técnico final...</p>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zoom panel removed as requested (native Minimap interaction is used instead) */}

            {/* SLIDE-OVER INSPECTOR SHEET */}
            <AnimatePresence>
              {inspectorAgent && (
                <>
                  <div className="absolute inset-0 bg-transparent pointer-events-auto z-25" onClick={() => setSelectedCardIndex(null)} />
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute top-4 right-4 bottom-4 w-[360px] bg-white/95 backdrop-blur-3xl border border-gray-200/60 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] z-30 overflow-y-auto hidden-scrollbar pointer-events-auto flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-gray-150 pb-4">
                        <div className="flex gap-3 items-center">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${
                            inspectorAgent.node.isFused 
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-500/20 shadow-amber-500/30' 
                              : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 text-gray-700'
                          }`}>
                            {inspectorAgent.node.isFused ? '🤝' : inspectorAgent.node.msg.avatar}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1">
                              {inspectorAgent.node.isFused ? 'Consenso Multilateral' : inspectorAgent.node.msg.agentName}
                            </h4>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">
                              {inspectorAgent.node.isFused ? 'Síntesis de Agentes' : inspectorAgent.node.msg.role}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCardIndex(null)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sentiment Pill Bar Chart - Apple Health / Stocks Style */}
                      <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent rounded-full opacity-60 blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Distribución de Sentimiento</span>
                          <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[8px] font-black uppercase tracking-widest shadow-sm">
                            Volumen
                          </div>
                        </div>

                        <div className="relative z-10 pt-2 flex">
                          <div className="flex-1 relative h-[64px]">
                            {/* Center Axis Line */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />
                            
                            {/* Pills */}
                            {inspectorAgent.messages.map((m, i) => {
                              const total = Math.max(inspectorAgent.messages.length - 1, 1);
                              const leftPercent = (i / total) * 100;
                              
                              if (m.sentiment === 'bullish') {
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: '24px', opacity: 1 }}
                                    transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                                    className="absolute bottom-1/2 w-2.5 rounded-t-full bg-gradient-to-t from-emerald-400 to-emerald-500 shadow-[0_4px_10px_rgba(16,185,129,0.3)] origin-bottom"
                                    style={{ left: `calc(${leftPercent}% - 5px)` }}
                                  />
                                );
                              } else if (m.sentiment === 'bearish') {
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: '24px', opacity: 1 }}
                                    transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                                    className="absolute top-1/2 w-2.5 rounded-b-full bg-gradient-to-b from-red-400 to-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.3)] origin-top"
                                    style={{ left: `calc(${leftPercent}% - 5px)` }}
                                  />
                                );
                              } else {
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-300 border-[1.5px] border-white shadow-sm"
                                    style={{ left: `calc(${leftPercent}% - 5px)` }}
                                  />
                                );
                              }
                            })}
                          </div>

                          {/* Axis Labels */}
                          <div className="flex flex-col justify-between text-[8px] font-black uppercase tracking-wider shrink-0 text-right pl-4 py-1 h-[64px]">
                            <span className="text-emerald-500">BUL</span>
                            <span className="text-slate-400">NEU</span>
                            <span className="text-red-500">BEA</span>
                          </div>
                        </div>
                      </div>

                      {/* Tools Used */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block pl-1">Herramientas Invocadas</span>
                        <div className="space-y-1.5">
                          {inspectorAgent.toolsUsed.map((tool, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-150 text-[10px] font-bold text-gray-700 shadow-sm hover:border-[#1890FF]/30 transition-colors">
                              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Zap className="w-3 h-3 text-[#1890FF]" />
                              </div>
                              <span className="truncate">{tool}</span>
                            </div>
                          ))}
                          {inspectorAgent.toolsUsed.length === 0 && (
                            <div className="text-[10px] font-medium text-gray-400 italic pl-1">No se invocaron herramientas externas.</div>
                          )}
                        </div>
                      </div>

                      {/* Messages History */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block pl-1">Registro de Intervenciones</span>
                        <div className="space-y-3 max-h-[180px] overflow-y-auto hidden-scrollbar pr-2">
                          {inspectorAgent.messages.map((m, i) => (
                            <div key={i} className="relative pl-4">
                              <div className="absolute left-0 top-1.5 bottom-0 w-px bg-gray-200" />
                              <div className="absolute left-[-3.5px] top-1.5 w-2 h-2 rounded-full bg-white border-2 border-gray-300" />
                              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-150 text-[11px] leading-relaxed text-gray-700 font-medium shadow-sm">
                                <p>{m.message}</p>
                                <span className="text-[8px] font-bold text-gray-400 block mt-2 uppercase tracking-wider">{`Intervención ${i + 1}`}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCardIndex(null)}
                      className="w-full py-2.5 mt-6 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Cerrar Inspector
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}

      {/* Board-Ready Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#FAFAFA] w-full max-w-4xl h-[90vh] rounded-[32px] shadow-2xl flex overflow-hidden border border-gray-200/50"
            >
              {/* Left Side - The PDF Preview */}
              <div className="flex-1 bg-white border-r border-gray-200 overflow-y-auto p-12">
                <div className="max-w-2xl mx-auto space-y-8">
                  {/* Header PDF */}
                  <div className="flex justify-between items-end border-b-2 border-gray-900 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[14px] font-black tracking-tight text-black">MiroFish<span className="text-[#1890FF]">.AI</span></span>
                      </div>
                      <h1 className="text-2xl font-black text-gray-900 leading-tight">Síntesis Ejecutiva</h1>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Análisis Multi-Agente</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{new Date().toLocaleDateString()}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Confidencial</span>
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <h2 className="text-[11px] font-black text-[#1890FF] uppercase tracking-widest mb-2">Tema Analizado</h2>
                    <p className="text-lg font-medium text-gray-900 leading-relaxed border-l-4 border-gray-200 pl-4">{fullSimulation?.articleTitle || inputQuery}</p>
                  </div>

                  {/* Consenso Final */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> Consenso Multilateral
                    </h2>
                    <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {canvasNodes.find(n => n.msg.id === 'fused-consensus')?.msg.message || "Esperando síntesis..."}
                    </p>
                  </div>
                  
                  {/* Footer PDF */}
                  <div className="pt-12 border-t border-gray-200 flex justify-between items-center opacity-60">
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Generado automáticamente por Inteligencia Artificial</span>
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Página 1 de 1</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Actions */}
              <div className="w-[300px] bg-[#FAFAFA] p-8 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1890FF] flex items-center justify-center mb-4">
                     <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Reporte Generado</h3>
                  <p className="text-[12px] font-medium text-gray-500 leading-relaxed mb-6">El documento ejecutivo está formateado y listo para ser distribuido a los inversores o directivos.</p>
                  
                  <div className="space-y-3">
                    <button type="button" className="w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                      <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                    <button type="button" className="w-full py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Share2 className="w-4 h-4" /> Compartir Enlace
                    </button>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-3 bg-transparent text-gray-400 hover:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Volver al Lienzo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-time Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0f1420] w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-150/80 dark:border-white/5 relative text-left"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    ¿Iniciar Debate Multi-Agente?
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    Esta herramienta inicia una mesa redonda interactiva con múltiples agentes expertos de IA y búsqueda en tiempo real.
                    <br />
                    <br />
                    <span className="font-bold text-amber-600 dark:text-amber-400">Nota de consumo:</span> Este proceso ejecuta simulaciones complejas que consumen significativamente más tokens de tu plan de IA (y requiere más tiempo de procesamiento) en comparación con un mensaje de chat tradicional.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWarningModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWarning}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#1890FF] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                  >
                    Entendido, iniciar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        customTitle={upgradeModalCustomTitle}
        customMessage={upgradeModalCustomMessage}
      />
    </div>
  );
}
