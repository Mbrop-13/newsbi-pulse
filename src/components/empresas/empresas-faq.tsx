"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Cómo se factura Maverlang Empresas?",
    a: "La facturación es mensual o anual, por asiento activo. Pagas solo por los usuarios que invitas. Recibes una factura electrónica chilena (con RUT si lo configuras) por el monto total de la organización. El ciclo anual incluye 2 meses gratuitos.",
  },
  {
    q: "¿Puedo añadir o quitar asientos en cualquier momento?",
    a: "Sí. Desde el panel de administración puedes ajustar el número de asientos cuando quieras. Al añadir asientos se prorratea automáticamente; al quitar, el cambio se refleja en el próximo ciclo de facturación.",
  },
  {
    q: "¿Qué incluye el período de prueba de 14 días?",
    a: "Todos los planes (Team y Business) incluyen 14 días de prueba con todas las funciones activas y sin tarjeta de crédito. Si no confirmas el pago antes del fin del período, la organización pasa a modo suspendido, sin pérdida de datos.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Toda la información se almacena con cifrado en tránsito (TLS) y en reposo. Utilizamos Row Level Security (RLS) de Supabase para que cada organización solo pueda acceder a sus propios datos. Disponemos de respaldos y políticas de cumplimiento GDPR/LGPD.",
  },
  {
    q: "¿Puedo migrar mi cuenta personal a una organización?",
    a: "Sí. Puedes crear una organización e invitarte con el mismo correo (o transferir). Al aceptar, heredas los beneficios del plan empresarial. Si ya tienes una suscripción individual activa, contáctanos para gestionar el cambio sin cobro duplicado.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "MercadoPago (tarjetas de crédito y débito, transferencias, Webpay). El plan Enterprise admite facturación por transferencia bancaria anual y órdenes de compra para grandes volúmenes.",
  },
  {
    q: "¿Existe soporte y onboarding?",
    a: "Todos los planes incluyen soporte prioritario. Business y Enterprise cuentan con un Customer Success Manager dedicado y sesiones de onboarding guiado para que tu equipo saque el máximo provecho desde el primer día.",
  },
  {
    q: "¿Puedo integrar Maverlang a mis sistemas?",
    a: "Business incluye acceso API básico. Enterprise incluye API completa, SSO SAML/SCIM, elección de región de datos y condiciones contractuales a medida. Contáctanos para ver tu caso.",
  },
];

export function EmpresasFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white text-slate-900 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            Preguntas frecuentes
          </h2>
          <p className="text-3xl md:text-4xl font-black tracking-tight">
            Todo lo que necesitas saber
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-colors ${
                  isOpen ? "border-[#1890FF]/30 bg-[#1890FF]/[0.02]" : "border-slate-200 bg-white"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-sm md:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}