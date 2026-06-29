"use client";

import { Building2, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface NoOrgProps {
  onCreate: () => void;
}

export function NoOrg({ onCreate }: NoOrgProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1890FF]/10 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-[#1890FF]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
          Aún no perteneces a una organización
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed">
          Crea una organización para tu equipo, invita miembros y gestiona todo desde un único panel.
          O explora nuestros planes para empresas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1890FF] hover:bg-[#0f7be0] text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-[#1890FF]/20"
          >
            <Plus className="w-4 h-4" />
            Crear organización
          </button>
          <Link
            href="/empresas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-card border border-border hover:bg-accent text-gray-900 dark:text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Ver planes para empresas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}