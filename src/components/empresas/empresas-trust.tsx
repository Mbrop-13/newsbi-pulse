"use client";

import { Lock, Database, RefreshCw, Globe, FileCheck, Server } from "lucide-react";

const PILLARS = [
  {
    icon: Lock,
    title: "Cifrado extremo a extremo",
    desc: "TLS en tránsito y cifrado en reposo para todos los datos de tu organización.",
  },
  {
    icon: Server,
    title: "Row Level Security",
    desc: "Cada organización solo accede a sus datos; aislamiento de tenant a nivel de base de datos.",
  },
  {
    icon: RefreshCw,
    title: "Respaldos automáticos",
    desc: "Backups diarios con point-in-time recovery hasta 30 días hacia atrás.",
  },
  {
    icon: FileCheck,
    title: "Cumplimiento regulatorio",
    desc: "Cumple GDPR/LGPD. Auditoría completa y logs de acciones por usuario.",
  },
  {
    icon: Globe,
    title: "Data residency",
    desc: "Enterprise elige la región de residencia de datos para cumplir requisitos locales.",
  },
  {
    icon: Database,
    title: "Exportación y portabilidad",
    desc: "Exporta todos los datos de tu organización en cualquier momento, sin lock-in.",
  },
];

export function EmpresasTrust() {
  return (
    <section className="bg-[#f7f7f9] text-slate-900 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            Seguridad y cumplimiento
          </h2>
          <p className="text-3xl md:text-4xl font-black tracking-tight">
            Tus datos, protegidos por diseño
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="bg-white rounded-2xl p-7 border border-slate-200/60">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-1.5">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}