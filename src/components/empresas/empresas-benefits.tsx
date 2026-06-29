"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  BrainCircuit,
  BellRing,
  Headset,
} from "lucide-react";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Cumplimiento y control de acceso",
    desc: "Roles (propietario, admin, miembro), auditoría de acciones y políticas de acceso. Cumple requisitos regulatorios con un historial de datos completo.",
  },
  {
    icon: Users,
    title: "Workspaces compartidos",
    desc: "Watchlists, alertas de precio y reportes que cualquier miembro del equipo puede ver y editar. Trabajo sincronizado, sin duplicar esfuerzos.",
  },
  {
    icon: LayoutDashboard,
    title: "Panel de administración",
    desc: "Visualiza el uso de IA de cada miembro, gestiona asientos y consulta la facturación centralizada desde un único panel.",
  },
  {
    icon: BrainCircuit,
    title: "Agentes de IA compartidos",
    desc: "Configuraciones de agentes reutilizables por todo el equipo. La memoria institucional del análisis se queda en la organización.",
  },
  {
    icon: BellRing,
    title: "Alertas centralizadas",
    desc: "Canal de alertas de precio y noticias críticas que llega a todo el equipo al instante, con reglas configuradas por rol.",
  },
  {
    icon: Headset,
    title: "SLA y soporte dedicado",
    desc: "Customer Success Manager asignado, onboarding guiado y SLA de respuesta garantizado según el plan contratado.",
  },
];

export function EmpresasBenefits() {
  return (
    <section id="beneficios" className="bg-[#f7f7f9] text-slate-900 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            Por qué los equipos eligen Maverlang
          </h2>
          <p className="text-3xl md:text-4xl font-black tracking-tight">
            Una plataforma financiera, todo el equipo conectado
          </p>
          <p className="mt-4 text-slate-500 text-lg">
            Diseñada para equipos que toman decisiones críticas con datos en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group bg-white rounded-2xl p-7 border border-slate-200/60 hover:border-[#1890FF]/30 hover:shadow-lg hover:shadow-[#1890FF]/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1890FF]/10 flex items-center justify-center mb-5 group-hover:bg-[#1890FF] transition-colors">
                  <Icon className="w-5 h-5 text-[#1890FF] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}