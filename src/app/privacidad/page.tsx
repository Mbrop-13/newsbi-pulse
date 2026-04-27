"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Bell, Trash2, Mail, Globe } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "1. Información que Recopilamos",
    content: [
      "**Información de cuenta:** Cuando te registras, recopilamos tu nombre, dirección de correo electrónico y contraseña encriptada. Si inicias sesión con Google, recibimos tu nombre y correo asociado a esa cuenta.",
      "**Datos de uso:** Recopilamos información sobre cómo interactúas con la plataforma, incluyendo las noticias que lees, tus búsquedas, tus preferencias de personalización (modo de vista, tamaño de texto, tema claro/oscuro) y las categorías que sigues.",
      "**Información del dispositivo:** Recopilamos datos técnicos como el tipo de dispositivo, sistema operativo, identificadores únicos de dispositivo y tokens de notificaciones push para poder enviarte alertas.",
      "**Datos de predicciones:** Si participas en los mercados de predicciones, almacenamos tus apuestas, historial de transacciones y saldo de diamantes.",
      "**Comentarios:** El contenido que publicas en los comentarios de artículos se almacena asociado a tu perfil público.",
    ],
  },
  {
    icon: Eye,
    title: "2. Cómo Usamos tu Información",
    content: [
      "**Personalizar tu experiencia:** Adaptamos el feed de noticias, las recomendaciones del asistente IA y las sugerencias según tus intereses y comportamiento de lectura.",
      "**Proporcionar el servicio:** Procesamos tus datos para autenticarte, mantener tu sesión, guardar tus artículos favoritos, lista de lectura y preferencias.",
      "**Asistente IA:** Cuando interactúas con nuestro asistente de inteligencia artificial (R-ai), las consultas que realizas y los artículos que adjuntas se procesan a través de modelos de lenguaje de terceros (OpenRouter / Grok) para generar respuestas. No almacenamos permanentemente el contenido de tus conversaciones con la IA.",
      "**Notificaciones:** Utilizamos tu token de dispositivo para enviarte notificaciones push sobre noticias de alta relevancia, resultados de predicciones y actualizaciones importantes.",
      "**Audio (Text-to-Speech):** Cuando usas la función de audio para escuchar artículos, el texto se procesa a través de Amazon Polly para generar el audio. No almacenamos grabaciones de tu voz.",
      "**Mejora del servicio:** Analizamos datos de uso agregados y anónimos para mejorar la plataforma, corregir errores y desarrollar nuevas funcionalidades.",
    ],
  },
  {
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
    icon: Bell,
    title: "5. Notificaciones Push",
    content: [
      "Si instalas nuestra aplicación móvil, te solicitaremos permiso para enviarte notificaciones push.",
      "Puedes desactivar las notificaciones push en cualquier momento desde la configuración de tu dispositivo.",
      "Las notificaciones se utilizan exclusivamente para: alertas de noticias de alto impacto (breaking news), resultados de tus predicciones y actualizaciones importantes del servicio.",
      "No utilizamos las notificaciones push con fines publicitarios de terceros.",
    ],
  },
  {
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
    icon: Shield,
    title: "7. Cookies y Almacenamiento Local",
    content: [
      "Utilizamos **almacenamiento local del navegador** (localStorage) para guardar tus preferencias de personalización (tema, tamaño de texto, modo de vista), artículos guardados y lista de lectura.",
      "Utilizamos **cookies de sesión** proporcionadas por Supabase para mantener tu sesión activa de forma segura.",
      "No utilizamos cookies de rastreo de terceros ni tecnologías de seguimiento publicitario.",
    ],
  },
  {
    icon: Mail,
    title: "8. Contacto y Cambios",
    content: [
      "Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en: **soporte@reclu.com**",
      "Nos reservamos el derecho de actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico.",
      "La fecha de la última actualización se indica al inicio de este documento.",
      "Al continuar utilizando Reclu después de cualquier modificación, aceptas la política actualizada.",
    ],
  },
];

export default function PrivacidadPage() {
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
              <Shield className="w-6 h-6 text-[#1890FF]" />
            </div>
            <span className="text-xs font-bold text-[#1890FF] uppercase tracking-wider">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            En <strong>Reclu</strong> nos tomamos tu privacidad muy en serio. Esta política
            describe cómo recopilamos, usamos y protegemos tu información personal.
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
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#1890FF] hover:underline">$1</a>'),
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
