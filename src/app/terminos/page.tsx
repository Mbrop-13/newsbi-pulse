"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Scale, 
  CreditCard, 
  Shield, 
  Users, 
  Gavel, 
  Mail, 
  Download, 
  CheckCircle2, 
  ChevronRight 
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const sections = [
  {
    id: "aceptacion",
    icon: Users,
    title: "1. Aceptación de los Términos",
    content: [
      "Al acceder y utilizar la plataforma **Maverlang** (disponible en maverlang.cl y sus aplicaciones móviles), aceptas quedar vinculado por estos Términos y Condiciones de Servicio.",
      "Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.",
      "Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación. El uso continuado de la plataforma constituye la aceptación de los términos modificados.",
    ],
  },
  {
    id: "servicio",
    icon: FileText,
    title: "2. Descripción del Servicio",
    content: [
      "**Maverlang** es una plataforma de noticias financieras y de negocios impulsada por Inteligencia Actorial/Artificial que ofrece:",
      "• Agregación y curación automatizada de noticias de fuentes confiables a nivel global.",
      "• Enriquecimiento de contenido mediante modelos de IA para análisis contextual.",
      "• Asistente de IA (**Maverlang AI**) para consultas financieras, análisis de portafolio y recomendaciones personalizadas.",
      "• Seguimiento de mercados financieros en tiempo real mediante integración con proveedores de datos.",
      "• Gestión de portafolio personal con alertas de precio y análisis fundamental.",
      "• Audio de artículos mediante síntesis de voz (Text-to-Speech).",
    ],
  },
  {
    id: "planes",
    icon: CreditCard,
    title: "3. Planes y Suscripciones",
    content: [
      "**Plan Gratuito:** Acceso limitado a funcionalidades básicas con restricciones de uso (ej. 5 consultas de IA de por vida, 5 audios diarios, 2 alertas activas).",
      "**Planes de Pago (Pro, Max, Ultra):** Ofrecen funcionalidades ampliadas según el nivel contratado. Los precios se muestran en pesos chilenos (CLP) e incluyen IVA donde aplique.",
      "Los pagos se procesan a través de **MercadoPago** u otros proveedores de pago autorizados. Maverlang no almacena datos de tarjetas de crédito.",
      "Las suscripciones se renuevan automáticamente al final de cada período de facturación. Puedes cancelar en cualquier momento desde tu perfil, y mantendrás el acceso hasta el final del período pagado.",
      "Maverlang se reserva el derecho de modificar los precios de los planes con un aviso previo de 30 días a los suscriptores activos.",
    ],
  },
  {
    id: "uso",
    icon: Shield,
    title: "4. Uso Aceptable",
    content: [
      "Al utilizar Maverlang, te comprometes a:",
      "• No utilizar la plataforma para actividades ilegales o fraudulentas.",
      "• No intentar acceder a cookies de otros usuarios ni a datos que no te pertenecen.",
      "• No realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.",
      "• No abusar de las APIs o sistemas de la plataforma mediante automatización excesiva, scraping o ataques de denegación de servicio.",
      "• No publicar contenido ofensivo, difamatorio o que infrinja derechos de terceros en los comentarios.",
      "Maverlang se reserva el derecho de suspender o cancelar cuentas que violen estas condiciones sin previo aviso.",
    ],
  },
  {
    id: "responsabilidad",
    icon: Scale,
    title: "5. Limitación de Responsabilidad",
    content: [
      "**El contenido de Maverlang es informativo y no constituye asesoría financiera, de inversión, legal ni de ningún otro tipo.** Las decisiones de inversión son responsabilidad exclusiva del usuario.",
      "La información y los análisis generados por la IA pueden contener inexactitudes. No garantizamos la precisión, completitud ni actualidad de la información presentada.",
      "Maverlang no se hace responsable por pérdidas financieras, daños directos o indirectos derivados del uso de la plataforma o de la información proporcionada.",
      "Los datos de mercado se obtienen de proveedores externos (TradingView, Yahoo Finance) y pueden tener retrasos. No garantizamos datos en tiempo real absoluto.",
    ],
  },
  {
    id: "propiedad",
    icon: Gavel,
    title: "6. Propiedad Intelectual",
    content: [
      "Todo el contenido original de Maverlang, incluyendo pero no limitado a: diseño, código, logotipos, textos editoriales y funcionalidades de IA, es propiedad de Maverlang y está protegido por las leyes de propiedad intelectual aplicables.",
      "Las noticias agregadas de fuentes externas mantienen los derechos de sus respectivos autores y publicaciones originales. Maverlang actúa como agregador y enriquecedor de contenido.",
      "Los usuarios retienen la propiedad de cualquier contenido que publiquen (comentarios), pero otorgan a Maverlang una licencia no exclusiva para mostrar dicho contenido en la plataforma.",
    ],
  },
  {
    id: "disposiciones",
    icon: Mail,
    title: "7. Disposiciones Generales",
    content: [
      "Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de justicia de Santiago de Chile.",
      "Si alguna disposición de estos términos resulta inválida o inaplicable, las demás disposiciones permanecerán en pleno vigor y efecto.",
      "Para consultas relacionadas con estos términos, puedes contactarnos en: **soporte@maverlang.cl**",
      "La versión vigente de estos Términos y Condiciones siempre estará disponible en esta página.",
    ],
  },
];

export default function TerminosPage() {
  const user = useAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220; // offset for triggers
      let currentActive = 0;

      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          currentActive = i;
        }
      }
      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const downloadTermsText = () => {
    if (!mounted) return;
    
    let textContent = `MAVERLANG - TÉRMINOS Y CONDICIONES DE SERVICIO\n`;
    textContent += `Última actualización: ${new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}\n`;
    textContent += `========================================================================\n\n`;
    
    sections.forEach((sect) => {
      textContent += `${sect.title.toUpperCase()}\n`;
      textContent += `------------------------------------------------------------------------\n`;
      sect.content.forEach((para) => {
        textContent += `${para.replace(/\*\*/g, "")}\n\n`;
      });
      textContent += `\n`;
    });
    
    textContent += `========================================================================\n`;
    textContent += `© ${new Date().getFullYear()} Maverlang. Todos los derechos reservados.\n`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "maverlang-terminos-y-condiciones.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Los términos de servicio se han descargado correctamente.");
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent("Consulta sobre Términos y Condiciones - Maverlang");
    const body = encodeURIComponent(
      `Hola equipo de Maverlang,\n\nTengo la siguiente consulta sobre los Términos y Condiciones de Servicio:\n\n[Escribe tu consulta aquí]\n\nSaludos cordiales,\n${user?.name || '[Tu Nombre]'}`
    );
    return `mailto:soporte@maverlang.cl?subject=${subject}&body=${body}`;
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0B0B0C] text-zinc-900 dark:text-zinc-100 pt-28 pb-24 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1890FF]/5 dark:bg-[#1890FF]/3 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#1890FF] dark:hover:text-blue-400 transition-colors"
          >
            ← Volver al Inicio
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-4.5">
            <div className="p-2.5 rounded-2xl bg-[#1890FF]/10 dark:bg-[#1890FF]/15 border border-[#1890FF]/20 text-[#1890FF]">
              <Scale className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-[#1890FF] uppercase tracking-widest bg-[#1890FF]/8 px-2.5 py-0.5 rounded-md">
              Regulaciones Legales
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[16px] sm:text-[17px] leading-relaxed max-w-3xl">
            Estos términos regulan el uso de la plataforma <strong>Maverlang</strong> y todos sus servicios asociados.
            Por favor, léelos atentamente antes de continuar navegando.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 bg-white dark:bg-[#151517] border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl inline-flex items-center gap-2 shadow-xs">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                Última actualización:
              </span>
              <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-200">
                {mounted ? new Date().toLocaleDateString("es-CL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "Julio 2026"}
              </span>
            </div>
            <div className="px-3.5 py-1.5 bg-[#1890FF]/8 text-[#1890FF] border border-[#1890FF]/15 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Versión Oficial
            </div>
          </div>
        </motion.div>

        {/* 3 Pillars / Highlights Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            {
              title: "Uso Exclusivo Informativo",
              desc: "Los análisis, noticias y reportes de la plataforma o IA no constituyen asesoría de inversión ni consejos financieros.",
              color: "from-blue-500 to-cyan-500",
              icon: FileText
            },
            {
              title: "Suscripción sin Ataduras",
              desc: "Los cobros son automáticos según el periodo contratado (mensual/anual) y puedes cancelar cuando gustes en 1 clic.",
              color: "from-indigo-500 to-purple-500",
              icon: CreditCard
            },
            {
              title: "Propiedad Intelectual",
              desc: "El diseño editorial, marcas registradas, motores de IA y algoritmos son propiedad de Maverlang y están protegidos por ley.",
              color: "from-emerald-500 to-teal-500",
              icon: Gavel
            }
          ].map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/65 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                    <CardIcon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-bold text-[15px] text-zinc-900 dark:text-white mb-1.5">{card.title}</h3>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-normal">{card.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Split Content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: Sticky Navigation Sidebar & Actions */}
          <div className="lg:col-span-4 sticky top-28 space-y-6 hidden lg:block">
            
            {/* Outline Index */}
            <div className="bg-white/50 dark:bg-zinc-900/10 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-3xl flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 mb-3 px-1.5">
                Secciones del Contrato
              </span>
              <nav className="flex flex-col gap-1">
                {sections.map((sect, i) => {
                  const active = activeSection === i;
                  return (
                    <button
                      key={sect.id}
                      onClick={() => scrollToSection(sect.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all cursor-pointer ${
                        active 
                          ? "bg-[#1890FF]/8 text-[#1890FF] border-l-2 border-[#1890FF] pl-2" 
                          : "text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <span className="truncate">{sect.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${active ? "text-[#1890FF] opacity-100" : "text-zinc-400"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 dark:from-zinc-900/20 dark:to-zinc-900/5 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 rounded-3xl flex flex-col gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-[#1890FF]" /> Opciones de Accesibilidad
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Descarga una copia local de los términos para tus registros o ponte en contacto directo.
                </p>
              </div>

              {/* Action 1: Export Terms */}
              <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-800/50 flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Copia Física</span>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Descarga el documento de términos y condiciones en formato de texto plano (.txt).
                </p>
                <Button 
                  onClick={downloadTermsText}
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121214] border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700/80 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Copia (.TXT)
                </Button>
              </div>

              {/* Action 2: Contact Legal */}
              <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-800/50 flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Consultas Legales</span>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  ¿Tienes dudas con respecto a algún punto de este contrato?
                </p>
                <a href={getMailtoLink()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#1890FF]" /> Contactar Soporte
                  </Button>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT: Document Sections content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              {sections.map((section, i) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="bg-white dark:bg-[#1E1E20]/45 border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-5 pb-3.5 border-b border-zinc-200/40 dark:border-zinc-850">
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shrink-0 text-zinc-655 dark:text-zinc-350">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h2 className="text-[18px] md:text-[19px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                        {section.title}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {section.content.map((paragraph, j) => (
                        <p
                          key={j}
                          className="text-[14.5px] text-zinc-500 dark:text-zinc-350 leading-relaxed font-normal"
                          dangerouslySetInnerHTML={{
                            __html: paragraph
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-white font-extrabold">$1</strong>')
                              .replace(/•\s*(.*?)$/g, '<span class="pl-2 block">• $1</span>'),
                          }}
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>

            {/* Mobile Actions section (only shows on small screens) */}
            <div className="block lg:hidden bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 dark:from-zinc-900/20 dark:to-zinc-900/5 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 rounded-3xl space-y-5">
              <div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-[#1890FF]" /> Accesibilidad
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Descarga una copia local de los términos o ponte en contacto con nuestro equipo legal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Copia Física</span>
                  <Button 
                    onClick={downloadTermsText}
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121214] border-zinc-200 hover:bg-zinc-55 hover:border-zinc-350 dark:border-zinc-800 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar Copia (.TXT)
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Legal</span>
                  <a href={getMailtoLink()} className="w-full">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#1890FF]" /> Contactar Soporte
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Footer Section */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="pt-10 border-t border-zinc-200/50 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-450 dark:text-zinc-500 font-semibold"
            >
              <p>© {new Date().getFullYear()} Maverlang. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <Link href="/privacidad" className="hover:text-[#1890FF] hover:underline transition-colors">Política de Privacidad</Link>
                <span>•</span>
                <a href="mailto:soporte@maverlang.cl" className="hover:text-[#1890FF] hover:underline transition-colors">Soporte Técnico</a>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
