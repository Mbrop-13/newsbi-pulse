"use client";

import { motion } from "framer-motion";
import { Building2, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface NoOrgProps {
  onCreate: () => void;
}

export function NoOrg({ onCreate }: NoOrgProps) {
  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 flex items-center justify-center px-6 py-16 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-lg text-center"
      >
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-7 shadow-sm">
          <Building2 className="w-7 h-7 text-neutral-900 dark:text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          Aún no perteneces a una organización
        </h1>
        <p className="text-neutral-500 dark:text-zinc-400 text-sm md:text-base mb-9 leading-relaxed max-w-md mx-auto">
          Crea una organización para tu equipo, invita miembros y gestiona todo desde un único panel.
          O explora nuestros planes para empresas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-6 py-3.5 rounded-full transition-all hover:gap-3 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Crear organización
          </button>
          <Link
            href="/suscripcion"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800/60 text-neutral-900 dark:text-white font-bold px-6 py-3.5 rounded-full transition-all hover:gap-3"
          >
            Ver planes para empresas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
