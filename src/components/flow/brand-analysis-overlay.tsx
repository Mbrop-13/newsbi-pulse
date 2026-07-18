"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Package,
  LayoutGrid,
  Link2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useBrandStore,
  type ItemKind,
  type AgentProgress,
} from "@/lib/stores/brand-store";

function KindIcon({ kind, className }: { kind: ItemKind; className?: string }) {
  switch (kind) {
    case "home":
      return <Globe className={className} />;
    case "product":
      return <Package className={className} />;
    case "catalog":
      return <LayoutGrid className={className} />;
    default:
      return <Link2 className={className} />;
  }
}

function AgentCard({ agent }: { agent: AgentProgress }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border px-4 py-3 flex items-start gap-3 transition-colors",
        agent.status === "running" &&
          "border-[#1890FF]/35 bg-[#1890FF]/5 shadow-sm",
        agent.status === "done" &&
          "border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20",
        agent.status === "failed" &&
          "border-red-200/70 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20",
        agent.status === "pending" &&
          "border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          agent.status === "running" && "bg-[#1890FF]/15 text-[#1890FF]",
          agent.status === "done" && "bg-emerald-500/15 text-emerald-600",
          agent.status === "failed" && "bg-red-500/15 text-red-500",
          agent.status === "pending" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
        )}
      >
        {agent.status === "running" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : agent.status === "done" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : agent.status === "failed" ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <KindIcon kind={agent.kind} className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {agent.name}
          </p>
          <span className="text-[9px] uppercase font-black tracking-wider text-zinc-400 shrink-0">
            {agent.kind}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
          {agent.status === "pending" && "En cola · Maverlang v2.5"}
          {agent.status === "running" && "Analizando página y contexto de marca…"}
          {agent.status === "done" && (agent.summary || "Análisis completado")}
          {agent.status === "failed" && (agent.error || "Error al analizar")}
        </p>
      </div>
    </motion.div>
  );
}

export function BrandAnalysisOverlay() {
  const isOpen = useBrandStore((s) => s.isAnalysisOpen);
  const closeAnalysis = useBrandStore((s) => s.closeAnalysis);
  const agents = useBrandStore((s) => s.agentProgress);
  const complete = useBrandStore((s) => s.analysisComplete);
  const brand = useBrandStore((s) => s.brand);

  const doneCount = agents.filter(
    (a) => a.status === "done" || a.status === "failed"
  ).length;
  const total = agents.length || 1;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#0f1012] shadow-2xl flex flex-col"
          >
            <div className="px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[#1890FF] mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Agentes Maverlang v2.5
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  {complete
                    ? "Marca comprendida"
                    : `Entendiendo ${brand?.name || "tu marca"}`}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {complete
                    ? "Los hallazgos ya están disponibles en el menú Marca."
                    : "Un agente por cada web o producto. Esto puede tardar unos minutos."}
                </p>
              </div>
              {complete && (
                <button
                  type="button"
                  onClick={closeAnalysis}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-5 py-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 mb-1.5">
                <span>
                  {doneCount} / {agents.length} agentes
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#1890FF] to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2.5 hidden-scrollbar">
              {agents.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-zinc-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1890FF]" />
                  <p className="text-xs font-medium">Preparando agentes…</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <AgentCard key={agent.itemId} agent={agent} />
                ))
              )}
            </div>

            <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button
                type="button"
                className={cn(
                  "rounded-xl min-w-[120px]",
                  complete
                    ? "bg-[#1890FF] hover:bg-[#1580e6] text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                )}
                disabled={!complete}
                onClick={closeAnalysis}
              >
                {complete ? "Listo" : "Analizando…"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
