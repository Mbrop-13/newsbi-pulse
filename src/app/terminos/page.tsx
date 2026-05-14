"use client";

import { motion } from "framer-motion";
import { FileText, Scale, CreditCard, Shield, AlertTriangle, Users, Gavel, Mail } from "lucide-react";

const sections = [
  {
    icon: Users,
    title: "1. Aceptación de los Términos",
    content: [
      "Al acceder y utilizar la plataforma **Reclu** (disponible en reclu.cl y sus aplicaciones móviles), aceptas quedar vinculado por estos Términos y Condiciones de Servicio.",
      "Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.",
      "Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación. El uso continuado de la plataforma constituye la aceptación de los términos modificados.",
    ],
  },
  {
    icon: FileText,
    title: "2. Descripción del Servicio",
    content: [
      "**Reclu** es una plataforma de noticias financieras y de negocios impulsada por Inteligencia Artificial que ofrece:",
      "• Agregación y curación automatizada de noticias de fuentes confiables a nivel global.",
      "• Enriquecimiento de contenido mediante modelos de IA para análisis contextual.",
      "• Asistente de IA (**R-AI**) para consultas financieras, análisis de portafolio y recomendaciones personalizadas.",
      "• Seguimiento de mercados financieros en tiempo real mediante integración con proveedores de datos.",
      "• Sistema de predicciones y apuestas virtuales con diamantes (moneda virtual sin valor monetario real).",
      "• Audio de artículos mediante síntesis de voz (Text-to-Speech).",
    ],
  },
  {
    icon: CreditCard,
    title: "3. Planes y Suscripciones",
    content: [
      "**Plan Gratuito:** Acceso limitado a funcionalidades básicas con restricciones de uso (ej. 5 consultas de IA de por vida, 5 audios diarios, 2 alertas activas).",
      "**Planes de Pago (Pro, Max, Ultra):** Ofrecen funcionalidades ampliadas según el nivel contratado. Los precios se muestran en pesos chilenos (CLP) e incluyen IVA donde aplique.",
      "Los pagos se procesan a través de **MercadoPago** u otros proveedores de pago autorizados. Reclu no almacena datos de tarjetas de crédito.",
      "Las suscripciones se renuevan automáticamente al final de cada período de facturación. Puedes cancelar en cualquier momento desde tu perfil, y mantendrás el acceso hasta el final del período pagado.",
      "Reclu se reserva el derecho de modificar los precios de los planes con un aviso previo de 30 días a los suscriptores activos.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "4. Diamantes y Predicciones",
    content: [
      "Los **diamantes** son una moneda virtual dentro de Reclu que **no tiene valor monetario real** y **no puede ser canjeada, transferida ni retirada** como dinero real.",
      "Los diamantes se obtienen mediante recompensas diarias, referidos y otras actividades dentro de la plataforma.",
      "Los diamantes se utilizan exclusivamente para participar en los **mercados de predicciones** dentro de Reclu, los cuales son de carácter recreativo y educativo.",
      "Reclu se reserva el derecho de ajustar los saldos de diamantes, modificar el sistema de recompensas o descontinuar el sistema de diamantes en cualquier momento.",
    ],
  },
  {
    icon: Shield,
    title: "5. Uso Aceptable",
    content: [
      "Al utilizar Reclu, te comprometes a:",
      "• No utilizar la plataforma para actividades ilegales o fraudulentas.",
      "• No intentar acceder a cuentas de otros usuarios ni a datos que no te pertenecen.",
      "• No realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.",
      "• No abusar de las APIs o sistemas de la plataforma mediante automatización excesiva, scraping o ataques de denegación de servicio.",
      "• No publicar contenido ofensivo, difamatorio o que infrinja derechos de terceros en los comentarios.",
      "Reclu se reserva el derecho de suspender o cancelar cuentas que violen estas condiciones sin previo aviso.",
    ],
  },
  {
    icon: Scale,
    title: "6. Limitación de Responsabilidad",
    content: [
      "**El contenido de Reclu es informativo y no constituye asesoría financiera, de inversión, legal ni de ningún otro tipo.** Las decisiones de inversión son responsabilidad exclusiva del usuario.",
      "La información y los análisis generados por la IA pueden contener inexactitudes. No garantizamos la precisión, completitud ni actualidad de la información presentada.",
      "Reclu no se hace responsable por pérdidas financieras, daños directos o indirectos derivados del uso de la plataforma o de la información proporcionada.",
      "Los datos de mercado se obtienen de proveedores externos (TradingView, Yahoo Finance) y pueden tener retrasos. No garantizamos datos en tiempo real absoluto.",
    ],
  },
  {
    icon: Gavel,
    title: "7. Propiedad Intelectual",
    content: [
      "Todo el contenido original de Reclu, incluyendo pero no limitado a: diseño, código, logotipos, textos editoriales y funcionalidades de IA, es propiedad de Reclu y está protegido por las leyes de propiedad intelectual aplicables.",
      "Las noticias agregadas de fuentes externas mantienen los derechos de sus respectivos autores y publicaciones originales. Reclu actúa como agregador y enriquecedor de contenido.",
      "Los usuarios retienen la propiedad de cualquier contenido que publiquen (comentarios), pero otorgan a Reclu una licencia no exclusiva para mostrar dicho contenido en la plataforma.",
    ],
  },
  {
    icon: Mail,
    title: "8. Disposiciones Generales",
    content: [
      "Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de justicia de Santiago de Chile.",
      "Si alguna disposición de estos términos resulta inválida o inaplicable, las demás disposiciones permanecerán en pleno vigor y efecto.",
      "Para consultas relacionadas con estos términos, puedes contactarnos en: **soporte@reclu.com**",
      "La versión vigente de estos Términos y Condiciones siempre estará disponible en esta página.",
    ],
  },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-[#1890FF]/10">
              <Scale className="w-6 h-6 text-[#1890FF]" />
            </div>
            <span className="text-xs font-bold text-[#1890FF] uppercase tracking-wider">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Estos términos regulan el uso de <strong>Reclu</strong> y sus servicios.
            Por favor, léelos con atención antes de utilizar la plataforma.
          </p>
          <div className="mt-4 px-4 py-2.5 bg-muted/30 border border-border rounded-xl inline-flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Última actualización:
            </span>
            <span className="text-xs font-bold text-foreground">
              {new Date().toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="mt-0.5 p-2 rounded-xl bg-muted/50 border border-border/50 shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground leading-tight pt-1">
                    {section.title}
                  </h2>
                </div>
                <div className="ml-14 space-y-3">
                  {section.content.map((paragraph, j) => (
                    <p
                      key={j}
                      className="text-[15px] text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: paragraph
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>'),
                      }}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Reclu. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
