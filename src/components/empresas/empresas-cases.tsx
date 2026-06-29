"use client";

import { motion } from "framer-motion";
import { Briefcase, Scale, GraduationCap, Landmark, LineChart, Coins } from "lucide-react";

const CASES = [
  {
    icon: Briefcase,
    sector: "Gestión de fondos",
    title: "Auditoría de portafolio en tiempo real",
    desc: "Un fondo revisa automáticamente la exposición sectorial y detecta riesgos antes que el mercado.",
  },
  {
    icon: LineChart,
    sector: "Corretaje",
    title: "Análisis de sentimiento para clientes",
    desc: "Una firma de corretaje ofrece a sus asesores verificación de noticias y signo de impacto en segundos.",
  },
  {
    icon: Scale,
    sector: "Estudio jurídico",
    title: "Seguimiento regulatorio automatizado",
    desc: "Un estudio legal monitorea cambios normativos y tasas relevantes para sus clientes institucionales.",
  },
  {
    icon: GraduationCap,
    sector: "Universidad",
    title: "Aula de finanzas con datos reales",
    desc: "Cátedras y estudiantes usan la misma infraestructura que los gestores profesionales para investigar.",
  },
  {
    icon: Landmark,
    sector: "Banco",
    title: "Predicción de movimientos del banco central",
    desc: "Equipo de análisis modela escenarios macro con base en noticias verificadas por IA sin sesgos.",
  },
  {
    icon: Coins,
    sector: "Fintech",
    title: "Alertas de activos para usuarios",
    desc: "Una fintech integra alertas y análisis de IA dentro de su propia app para diferenciarse.",
  },
];

export function EmpresasCases() {
  return (
    <section id="casos" className="bg-[#0a0a0f] text-white py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            Casos de uso por sector
          </h2>
          <p className="text-3xl md:text-4xl font-black tracking-tight">
            De fondos a universidades, una sola plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CASES.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 hover:bg-white/[0.06] transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1890FF]/15 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#1890FF]" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#1890FF] mb-1">{c.sector}</p>
                <h3 className="text-base font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}