"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Bell, 
  Trash2, 
  Mail, 
  Globe, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink 
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const sections = [
  {
    id: "info",
    icon: Database,
    title: "1. Información que Recopilamos",
    content: [
      "**Información de cuenta:** Cuando te registras, recopilamos tu nombre, dirección de correo electrónico y contraseña encriptada. Si inicias sesión con Google, recibimos tu nombre y correo asociado a esa cuenta.",
      "**Datos de uso:** Recopilamos información sobre cómo interactúas con la plataforma, incluyendo las noticias que lees, tus búsquedas, tus preferencias de personalización (modo de vista, tamaño de texto, tema claro/oscuro) y las categorías que sigues.",
      "**Información del dispositivo:** Recopilamos datos técnicos como el tipo de dispositivo, sistema operativo, identificadores únicos de dispositivo y tokens de notificaciones push para poder enviarte alertas.",
      "**Datos de portafolio:** Si usas el seguimiento de portafolio, almacenamos los activos que sigues, tus posiciones (acciones y precio promedio) y tus alertas de precio configuradas.",
      "**Comentarios:** El contenido que publicas en los comentarios de artículos se almacena asociado a tu perfil público.",
    ],
  },
  {
    id: "uso",
    icon: Eye,
    title: "2. Cómo Usamos tu Información",
    content: [
      "**Personalizar tu experiencia:** Adaptamos el feed de noticias, las recomendaciones del asistente IA y las sugerencias según tus intereses y comportamiento de lectura.",
      "**Proporcionar el servicio:** Procesamos tus datos para autenticarte, mantener tu sesión, guardar tus artículos favoritos, lista de lectura y preferencias.",
      "**Asistente IA:** Cuando interactúas con nuestro asistente de inteligencia artificial (Maverlang AI), las consultas que realizas y los artículos que adjuntas se procesan a través de modelos de lenguaje de terceros (OpenRouter / Grok) para generar respuestas. No almacenamos permanentemente el contenido de tus conversaciones con la IA.",
      "**Notificaciones:** Utilizamos tu token de dispositivo para enviarte notificaciones push sobre noticias de alta relevancia, alertas de precio de tus activos y actualizaciones importantes.",
      "**Audio (Text-to-Speech):** Cuando usas la función de audio para escuchar artículos, el texto se procesa a través de Amazon Polly para generar el audio. No almacenamos grabaciones de tu voz.",
      "**Mejora del servicio:** Analizamos datos de uso agregados y anónimos para mejorar la plataforma, corregir errores y desarrollar nuevas funcionalidades.",
    ],
  },
  {
    id: "seguridad",
    icon: Lock,
    title: "3. Cómo Protegemos tu Información",
    content: [
      "Utilizamos **Supabase** como proveedor de infraestructura, que implementa encriptación en tránsito (TLS/SSL) y en reposo para todos los datos almacenados.",
      "Las contraseñas se almacenan utilizando funciones de hash criptográficas seguras (bcrypt) y nunca en texto plano.",
      "El acceso a los datos está protegido por políticas de seguridad a nivel de fila (Row Level Security) en la base de datos, asegurando que cada usuario solo pueda acceder a sus propios datos.",
      "Toda la comunicación entre la aplicación y nuestros servidores se realiza a través de conexiones HTTPS encriptadas.",
      "Realizamos copias de seguridad periódicas de la base de datos para prevenir pérdida de información.",
    ],
  },
  {
    id: "terceros",
    icon: Globe,
    title: "4. Servicios de Terceros",
    content: [
      "**Supabase** (base de datos y autenticación) — [supabase.com/privacy](https://supabase.com/privacy)",
      "**Vercel** (hosting de la plataforma web) — [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)",
      "**Google OAuth** (inicio de sesión con Google) — [policies.google.com/privacy](https://policies.google.com/privacy)",
      "**OpenRouter / xAI Grok** (procesamiento de IA) — Las consultas se procesan en tiempo real y no se almacenan permanentemente por parte nuestra.",
      "**Amazon Web Services (Polly)** (síntesis de voz) — [aws.amazon.com/privacy](https://aws.amazon.com/privacy)",
      "**TradingView** (widgets de mercados financieros) — [tradingview.com/privacy-policy](https://www.tradingview.com/privacy-policy/)",
      "**Firebase Cloud Messaging** (notificaciones push) — [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy)",
      "No vendemos, alquilamos ni compartimos tu información personal con terceros para fines de marketing.",
    ],
  },
  {
    id: "push",
    icon: Bell,
    title: "5. Notificaciones Push",
    content: [
      "Si instalas nuestra aplicación móvil, te solicitaremos permiso para enviarte notificaciones push.",
      "Puedes desactivar las notificaciones push en cualquier momento desde la configuración de tu dispositivo.",
      "Las notificaciones se utilizan exclusivamente para: alertas de noticias de alto impacto (breaking news), alertas de precio de tus activos y actualizaciones importantes del servicio.",
      "No utilizamos las notificaciones push con fines publicitarios de terceros.",
    ],
  },
  {
    id: "derechos",
    icon: Trash2,
    title: "6. Tus Derechos",
    content: [
      "**Acceso:** Puedes acceder a toda tu información personal desde tu perfil en la plataforma.",
      "**Rectificación:** Puedes actualizar tu nombre y preferencias en cualquier momento desde la configuración de tu cuenta.",
      "**Eliminación:** Puedes solicitar la eliminación completa de tu cuenta y todos los datos asociados enviando un correo a nuestro equipo de soporte. Procesaremos tu solicitud en un plazo máximo de 30 días.",
      "**Portabilidad:** Puedes solicitar una copia de tus datos en formato legible por máquina.",
      "**Revocación de consentimiento:** Puedes revocar tu consentimiento para el procesamiento de datos en cualquier momento cerrando tu cuenta.",
    ],
  },
  {
    id: "cookies",
    icon: Shield,
    title: "7. Cookies y Almacenamiento Local",
    content: [
      "Utilizamos **almacenamiento local del navegador** (localStorage) para guardar tus preferencias de personalización (tema, tamaño de texto, modo de vista), artículos guardados y lista de lectura.",
      "Utilizamos **cookies de sesión** proporcionadas por Supabase para mantener tu sesión activa de forma segura.",
      "No utilizamos cookies de rastreo de terceros ni tecnologías de seguimiento publicitario.",
    ],
  },
  {
    id: "contacto",
    icon: Mail,
    title: "8. Contacto y Cambios",
    content: [
      "Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en: **soporte@maverlang.cl**",
      "Nos reservamos el derecho de actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico.",
      "La fecha de la última actualización se indica al inicio de este documento.",
      "Al continuar utilizando Maverlang después de cualquier modificación, aceptas la política actualizada.",
    ],
  },
];

export default function PrivacidadPage() {
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

  const downloadUserData = () => {
    if (!mounted) return;
    
    const data = {
      plataforma: "Maverlang",
      fecha_exportacion: new Date().toISOString(),
      perfil: user ? {
        id: user.id,
        nombre: user.name,
        email: user.email,
        tier: user.tier || "free",
        rol: user.role || "user"
      } : {
        nombre: "Usuario Invitado",
        email: "No registrado",
        info: "Inicia sesión en la plataforma para exportar tu información registrada."
      },
      derechos: "Regulado bajo la Ley N° 19.628 sobre protección de la vida privada en Chile y estándares GRPD.",
      licencia: "Acceso y Uso Exclusivo del Titular de la Cuenta"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maverlang-portabilidad-${user?.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'invitado'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tus datos han sido exportados en formato JSON correctamente.");
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent("Solicitud de Eliminación de Cuenta - Maverlang");
    const body = encodeURIComponent(
      `Hola equipo de Maverlang,\n\nSolicito formalmente la eliminación completa de mi cuenta de usuario y todos los datos personales asociados en su base de datos.\n\nDatos de la cuenta:\n- Nombre: ${user?.name || '[Tu Nombre]'}\n- Correo: ${user?.email || '[Tu Correo]'}\n\nEntiendo que esta acción es permanente y no podrá deshacerse.\n\nSaludos cordiales.`
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
              <Shield className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-[#1890FF] uppercase tracking-widest bg-[#1890FF]/8 px-2.5 py-0.5 rounded-md">
              Portal de Transparencia
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Política de Privacidad
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[16px] sm:text-[17px] leading-relaxed max-w-3xl">
            En <strong>Maverlang</strong> nos tomamos tu privacidad como una prioridad absoluta. Esta política
            describe con total transparencia cómo recopilamos, utilizamos y salvaguardamos tu información.
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
            <div className="px-3.5 py-1.5 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cumplimiento Ley 19.628
            </div>
          </div>
        </motion.div>

        {/* 3 Pillars / Highlights Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            {
              title: "Control Total de tus Datos",
              desc: "Accede, exporta en JSON o solicita la eliminación completa de tu perfil y registros de uso sin complicaciones.",
              color: "from-blue-500 to-cyan-500",
              icon: Trash2
            },
            {
              title: "Seguridad Certificada",
              desc: "Infraestructura provista por Supabase con encriptación TLS/SSL y políticas Row Level Security a nivel de base de datos.",
              color: "from-indigo-500 to-purple-500",
              icon: Lock
            },
            {
              title: "Sin Venta de Información",
              desc: "Tus datos jamás serán vendidos ni compartidos con agencias de publicidad. Cero cookies de rastreo de terceros.",
              color: "from-emerald-500 to-teal-500",
              icon: Shield
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
                Índice de la Política
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
                  <Shield className="w-4 h-4 text-[#1890FF]" /> Herramientas de Privacidad
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Ejerce tus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) en tiempo real.
                </p>
              </div>

              {/* Action 1: Export Data */}
              <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-800/50 flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Portabilidad de Datos</span>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Descarga una copia legible por máquina de los datos asociados a tu perfil.
                </p>
                <Button 
                  onClick={downloadUserData}
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121214] border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700/80 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Mis Datos
                </Button>
              </div>

              {/* Action 2: Deletion request */}
              <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-800/50 flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Cancelación de Cuenta</span>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Solicita el borrado completo de tus registros y accesos a nuestra base de datos.
                </p>
                <a href={getMailtoLink()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Solicitar Eliminación
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
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-905 border border-zinc-200/50 dark:border-zinc-800 shrink-0 text-zinc-655 dark:text-zinc-350">
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
                              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#1890FF] hover:underline inline-flex items-center gap-0.5 font-semibold">$1<span class="inline-block"><svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2.5" fill="none" class="shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></a>'),
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
                  <Shield className="w-4 h-4 text-[#1890FF]" /> Herramientas de Privacidad
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Ejerce tus derechos legales de portabilidad y cancelación directamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Portabilidad</span>
                  <Button 
                    onClick={downloadUserData}
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121214] border-zinc-200 hover:bg-zinc-55 hover:border-zinc-350 dark:border-zinc-800 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar Mis Datos
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">Cancelación</span>
                  <a href={getMailtoLink()} className="w-full">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Solicitar Eliminación
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
                <Link href="/terminos" className="hover:text-[#1890FF] hover:underline transition-colors">Términos de Servicio</Link>
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
