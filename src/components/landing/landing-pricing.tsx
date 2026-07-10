"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Gratuito",
    price: "$0",
    period: "siempre gratis",
    desc: "Para informarse y probar la tecnología de Maverlang.",
    features: [
      "Acceso a preguntas IA (límite básico)",
      "5 audios de noticias al día",
      "Hasta 2 alertas de precio activas",
      "Hasta 5 activos en portafolio",
      "Soporte de la comunidad"
    ],
    popular: false,
    cta: "Comenzar Gratis",
    link: "/auth"
  },
  {
    name: "Pro",
    price: "$22.990",
    period: "al mes",
    desc: "Para inversores y profesionales activos de la información.",
    features: [
      "Mucha más capacidad de preguntas al mes",
      "1.000 créditos de imagen en Flow",
      "50 audios de noticias al mes",
      "5 alertas de precio activas",
      "Hasta 25 activos en portafolio",
      "Lectura 100% sin publicidad",
      "Análisis básico de portafolio",
      "Soporte estándar por email"
    ],
    popular: false,
    cta: "Probar 7 días gratis",
    link: "/suscripcion"
  },
  {
    name: "Max",
    price: "$44.990",
    period: "al mes",
    desc: "Para inversores exigentes que quieren el máximo potencial.",
    features: [
      "Doble de límites de preguntas (x2 límites de Pro)",
      "2.000 créditos de imagen en Flow",
      "150 audios de noticias al mes",
      "15 alertas de precio activas",
      "Hasta 100 activos en portafolio",
      "Análisis avanzado de portafolio",
      "Alertas automáticas por SMS",
      "Informes semanales de portafolio"
    ],
    popular: true,
    cta: "Comenzar prueba gratis",
    link: "/suscripcion"
  },
  {
    name: "Ultra",
    price: "$79.990",
    period: "al mes",
    desc: "El máximo poder analítico con infraestructura dedicada.",
    features: [
      "Límites de preguntas x5 (x5 límites de Pro)",
      "5.000 créditos de imagen en Flow",
      "300 audios de noticias al mes",
      "30 alertas de precio activas",
      "Activos de portafolio ilimitados",
      "Análisis premium de portafolio",
      "IA avanzada con búsqueda web",
      "Soporte dedicado 24/7"
    ],
    popular: false,
    cta: "Elegir plan Ultra",
    link: "/suscripcion"
  }
];

export function LandingPricing() {
  return (
    <section className="pt-10 pb-20 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-sm font-bold tracking-widest text-black uppercase mb-3">
            PLANES FLEXIBLES
          </h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-950">
            Elige el plan ideal para ti
          </p>
          <p className="mt-4 text-slate-500 text-base md:text-lg">
            Desbloquea el poder absoluto de nuestros agentes y toma el control de tus finanzas y conocimientos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col justify-between rounded-2xl p-8 border shadow-sm transition-all hover:shadow-md ${
                plan.popular
                  ? "bg-slate-50/40 border-black shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
                  : "bg-slate-50/50 border-slate-200/60"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Recomendado
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8 text-slate-950">
                  <span className="text-3xl md:text-4xl font-black">{plan.price}</span>
                  <span className="text-xs text-slate-400">/ {plan.period}</span>
                </div>

                <div className="w-full h-px bg-slate-200/60 mb-8" />

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                      <Check className="w-4 h-4 text-black shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.link}
                className={`w-full text-center text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer ${
                  plan.popular
                    ? "bg-black hover:bg-black/90 text-white shadow-lg shadow-black/25"
                    : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Banner Planes para Empresas */}
        <div className="mt-10 max-w-5xl mx-auto rounded-2xl bg-slate-950 text-white p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase bg-[#1890FF] text-white px-2.5 py-1 rounded-full">Empresas</span>
            <p className="text-sm md:text-base font-medium">
              ¿Eres empresa? Planes por asiento, panel de administración y facturación centralizada.
            </p>
          </div>
          <Link
            href="/suscripcion"
            className="inline-flex items-center gap-1.5 bg-white text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition shrink-0"
          >
            Ver planes para empresas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
