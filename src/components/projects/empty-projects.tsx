"use client";

import { motion } from "framer-motion";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  FolderPlus,
  Globe,
  Smartphone,
  Monitor,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const INSPIRATIONS = [
  {
    icon: Globe,
    title: "Portfolio Personal",
    desc: "Muestra tu trabajo con estilo",
    gradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/15",
  },
  {
    icon: Smartphone,
    title: "App de Finanzas",
    desc: "Controla tus inversiones",
    gradient: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/15",
  },
  {
    icon: Monitor,
    title: "Dashboard SaaS",
    desc: "Panel de control empresarial",
    gradient: "from-emerald-500/10 to-teal-500/10",
    borderColor: "border-emerald-500/15",
  },
];

export function EmptyProjects() {
  const openWizard = useProjectsStore((s) => s.openWizard);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated icon */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative mb-6"
      >
        {/* Glow behind icon */}
        <div className="absolute inset-0 w-24 h-24 bg-blue-500/10 rounded-3xl blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center">
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <FolderPlus className="w-9 h-9 text-blue-500/70" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Floating sparkles */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-4 h-4 text-amber-400/60" />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-3"
          animate={{ rotate: [0, -10, 15, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Sparkles className="w-3 h-3 text-blue-400/40" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-center mb-6 max-w-sm"
      >
        <h2 className="text-lg font-bold text-foreground mb-1.5">
          Aún no tienes proyectos
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Crea tu primer proyecto y la IA construirá la estructura base con tus preferencias de diseño en tiempo real.
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        onClick={openWizard}
        className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 cursor-pointer mb-10"
      >
        <FolderPlus className="w-4.5 h-4.5" />
        Crear mi primer proyecto
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Inspiration cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-lg"
      >
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-3">
          Ideas para inspirarte
        </p>
        <div className="grid grid-cols-3 gap-3">
          {INSPIRATIONS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                onClick={openWizard}
                className={`group/card text-left p-3 rounded-xl border ${item.borderColor} bg-gradient-to-br ${item.gradient} hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer`}
              >
                <Icon className="w-4 h-4 text-muted-foreground mb-2 group-hover/card:text-foreground transition-colors" />
                <span className="text-[11px] font-bold text-foreground block">{item.title}</span>
                <span className="text-[9px] text-muted-foreground block mt-0.5">{item.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
