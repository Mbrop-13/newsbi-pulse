"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ChevronRight, 
  Copy, 
  Check, 
  BookOpen, 
  Cpu, 
  Sliders, 
  Layers, 
  Bell, 
  Award, 
  ArrowLeft, 
  Info, 
  BookMarked,
  Terminal,
  ExternalLink,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

// Categorías y Artículos de Documentación
interface Article {
  id: string;
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
}

interface Category {
  id: string;
  name: string;
  articles: Article[];
}

export default function DocumentacionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState("introduccion");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = useMemo<Category[]>(() => [
    {
      id: "comenzando",
      name: "Comenzando",
      articles: [
        {
          id: "introduccion",
          title: "Introducción a Maverlang",
          description: "Conoce qué es Maverlang y cómo aprovechar sus herramientas de IA y análisis.",
          icon: BookOpen,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                Bienvenido a **Maverlang**, la plataforma integral de análisis de mercados, noticias de impacto global y desarrollo web impulsado por inteligencia artificial. Maverlang combina el procesamiento de lenguaje natural de última generación con herramientas analíticas financieras avanzadas para que tomes decisiones informadas y construyas código en tiempo real.
              </p>

              <div className="p-4 rounded-2xl border border-blue-500/10 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                  <span className="font-black">Nota:</span> Esta documentación se actualiza automáticamente con cada mejora del sistema. Si necesitas soporte adicional, dirígete al canal de soporte en tus ajustes de cuenta.
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-4">Módulos Clave de la Plataforma</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-[#1890FF]" />
                    Chat de Asistencia IA
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Un chat impulsado por múltiples agentes inteligentes capaces de buscar en la web, analizar gráficos, comparar activos financieros e interpretar noticias de impacto en segundos.
                  </p>
                </div>
                
                <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    Maverlang WebBuilder
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Entorno de desarrollo interactivo sandbox. Genera aplicaciones web completas en React/Tailwind con depuración y guardado automático en la nube.
                  </p>
                </div>
                
                <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-rose-500" />
                    Alertas y Portafolios
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Monitorea tus activos en tiempo real y recibe notificaciones vía email, SMS o push en cuanto ocurra una fluctuación de precio crítica o se publique una noticia relevante.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Diamantes y Recompensas
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Un programa de lealtad integrado en la plataforma. Consigue diamantes diarios, invita a tus referidos y multiplica tus recompensas según tu plan de suscripción.
                  </p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "limites-y-consumo",
      name: "Límites y Consumo",
      articles: [
        {
          id: "limites",
          title: "Límites de Uso de Tokens IA",
          description: "Entiende cómo funcionan los consumos de tokens, las ventanas de tiempo (5h/semanal) y los multiplicadores.",
          icon: Cpu,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                Para garantizar un servicio estable y evitar abusos en el procesamiento de modelos LLM avanzados, Maverlang gestiona el consumo de Inteligencia Artificial a través de un sofisticado control de cuotas y ventanas temporales rodantes (Rolling Windows).
              </p>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-2">Ventanas Móviles de Consumo</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                A diferencia de los límites mensuales fijos que se restablecen el día 1 de cada mes, Maverlang implementa límites rodantes a corto y mediano plazo:
              </p>
              
              <ul className="space-y-3 pl-4 list-disc text-xs md:text-sm text-zinc-600 dark:text-zinc-350 font-medium">
                <li><span className="font-extrabold text-gray-900 dark:text-white">Límite de 5 horas:</span> Calcula los tokens que has consumido en las últimas 5 horas exactas. A medida que pasa el tiempo, los tokens más antiguos salen de la ventana y recuperas capacidad de consulta en tiempo real.</li>
                <li><span className="font-extrabold text-gray-900 dark:text-white">Límite Semanal:</span> Controla el volumen máximo que puedes solicitar en un lapso móvil de 7 días.</li>
                <li><span className="font-extrabold text-gray-900 dark:text-white">Límite Mensual / Vida:</span> Corresponde a la bolsa general de tokens asignada al mes de facturación de tu tier, o el total acumulado de por vida en las cuentas de acceso gratuito.</li>
              </ul>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-4">Límites base por Tier de Suscripción</h3>
              
              <div className="overflow-x-auto rounded-2xl border border-gray-200/60 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-zinc-500 font-black">
                      <th className="p-3.5">Tier de Suscripción</th>
                      <th className="p-3.5">Límite de 5 Horas</th>
                      <th className="p-3.5">Límite Semanal</th>
                      <th className="p-3.5">Límite Mensual / Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">Gratuito (Free)</td>
                      <td className="p-3.5">10.000 tokens</td>
                      <td className="p-3.5">25.000 tokens</td>
                      <td className="p-3.5">50.000 tokens (Vida)</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">Plan Pro</td>
                      <td className="p-3.5">150.000 tokens</td>
                      <td className="p-3.5">400.000 tokens</td>
                      <td className="p-3.5">1.000.000 tokens / mes</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">Plan Max</td>
                      <td className="p-3.5">300.000 tokens</td>
                      <td className="p-3.5">800.000 tokens</td>
                      <td className="p-3.5">2.000.000 tokens / mes</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">Plan Ultra (x5)</td>
                      <td className="p-3.5">750.000 tokens</td>
                      <td className="p-3.5">2.000.000 tokens</td>
                      <td className="p-3.5">5.000.000 tokens / mes</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">Plan Ultra x20</td>
                      <td className="p-3.5">3.000.000 tokens</td>
                      <td className="p-3.5">8.000.000 tokens</td>
                      <td className="p-3.5">20.000.000 tokens / mes</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl border border-yellow-500/10 dark:border-yellow-500/20 bg-yellow-50/30 dark:bg-yellow-500/5 flex gap-3 mt-4">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed font-semibold">
                  <span className="font-black">Promociones Activas (Promo X2):</span> Cuando la promoción temporal de duplicado está activa, todos los límites anteriores se duplican automáticamente en el backend y se reflejan en tiempo real en tu tarjeta de consumo.
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "herramientas-ai",
      name: "Herramientas AI",
      articles: [
        {
          id: "asistente-ai",
          title: "Asistente AI y Agentes Especializados",
          description: "Configura las preferencias de respuesta, tonos, roles e interés de tu asistente.",
          icon: Sliders,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                El asistente de Maverlang es totalmente personalizable. Puedes adaptar sus respuestas a tus necesidades específicas y perfilar el comportamiento analítico mediante la pestaña de ajustes.
              </p>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-4">Roles de Asistente Disponibles</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                Cada rol define las prioridades de procesamiento, las fuentes a buscar y el formato final de la respuesta:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs text-[#1890FF] uppercase tracking-wider block mb-1">Mentor Financiero</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Prioriza análisis de carteras, estrategias de inversión a largo plazo y explicaciones didácticas de indicadores bursátiles.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs text-emerald-500 uppercase tracking-wider block mb-1">Analista de Negocios</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Enfocado en métricas operativas de empresas, reportes trimestrales (10-K, 10-Q), tendencias industriales globales y valoración fundamental.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs text-purple-500 uppercase tracking-wider block mb-1">Desarrollador de Código</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Ajustado para generar algoritmos de trading, scripts de consulta de APIs, plantillas estructuradas de scraping y depurar código en tiempo real.
                  </p>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Tono y Temas de Interés</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Adicionalmente, puedes configurar el <span className="font-bold">Tono de Respuesta</span> (ej. *Analítico, Técnico, Conciso, Creativo*) y agregar hasta <span className="font-bold">5 Temas o Activos de Interés</span> (Tickers). Si tienes cargada tu lista de portafolio, el asistente priorizará las noticias más relevantes que puedan afectar a tus inversiones activas al responder.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: "webbuilder",
      name: "WebBuilder",
      articles: [
        {
          id: "webbuilder-info",
          title: "Maverlang WebBuilder",
          description: "Aprende a construir aplicaciones web completas interactivas en React con nuestro entorno de previsualización.",
          icon: Layers,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                **Maverlang WebBuilder** es un potente entorno integrado que te permite convertir instrucciones en lenguaje natural en aplicaciones React funcionales e interactivas utilizando la potencia de Sandpack de CodeSandbox.
              </p>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-4">Flujo de Trabajo del Constructor</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-800 text-center">
                  <span className="font-black text-lg text-gray-900 dark:text-white block mb-1">1. Solicitar</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Describe el diseño, paneles, tablas o lógica que necesitas que tenga tu aplicación.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-800 text-center">
                  <span className="font-black text-lg text-gray-900 dark:text-white block mb-1">2. Procesar</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Nuestros agentes crean los componentes, importan librerías y arman el código de forma modular.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-800 text-center">
                  <span className="font-black text-lg text-gray-900 dark:text-white block mb-1">3. Previsualizar</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">El panel derecho ejecuta el código en tiempo real con soporte interactivo para clics e interacciones.</p>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Librerías Soportadas por Defecto</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                El entorno tiene acceso precargado a dependencias visuales e interactivas clave para dashboards modernos:
              </p>

              <div className="flex flex-wrap gap-2">
                {["lucide-react", "framer-motion", "clsx", "tailwind-merge", "canvas-confetti", "recharts", "@types/canvas-confetti"].map((lib) => (
                  <span key={lib} className="px-3 py-1 text-xs font-bold font-mono bg-gray-100 dark:bg-zinc-800/40 rounded-lg text-zinc-600 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-800">
                    {lib}
                  </span>
                ))}
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Sincronización en la Nube y Depuración Automática</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed leading-relaxed">
                Tus proyectos se guardan automáticamente en Supabase si tienes activada la casilla en **Ajustes &gt; Comportamiento**. Asimismo, si ocurre un error sintáctico o lógico en la ejecución del código, nuestro sistema cuenta con una función de **Auto-Fix** que lee los registros de error de Sandpack e intenta repararlos de forma autónoma mediante parches optimizados de código.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: "portafolio-y-alertas",
      name: "Herramientas Financieras",
      articles: [
        {
          id: "alertas",
          title: "Portafolio y Alertas de Precio",
          description: "Configura alertas de precio push, SMS o por email y monitorea activos de interés.",
          icon: Bell,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                Monitorea el comportamiento de tus inversiones estructurando tu portafolio personalizado y creando alertas de precio precisas.
              </p>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Cómo Configurar una Alerta</h3>
              
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-850 text-white font-mono text-xs overflow-hidden relative">
                <div className="absolute top-2 right-2 flex gap-1.5 select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-zinc-500 border-b border-zinc-850 pb-2 select-none">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Configuración de Alerta IA</span>
                </div>
                <div className="space-y-1 leading-relaxed">
                  <p className="text-zinc-500">// Comando en lenguaje natural al chat</p>
                  <p className="text-white">"Crea una alerta de precio para AAPL cuando cruce los $220 hacia arriba"</p>
                  <p className="text-zinc-500 mt-3">// Respuesta de confirmación del agente financiero</p>
                  <p className="text-emerald-400">🔔 Alerta configurada exitosamente:</p>
                  <p className="pl-4 text-zinc-300">- Activo: AAPL (Apple Inc.)</p>
                  <p className="pl-4 text-zinc-300">- Condición: &gt;= $220.00 USD</p>
                  <p className="pl-4 text-zinc-300">- Canal: Notificación Push & Email</p>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Preferencias de Notificaciones</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                Puedes afinar los canales de contacto a través del panel de ajustes:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs block mb-1">Notificaciones Push</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Alertas instantáneas directo al navegador o app móvil.</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs block mb-1">Notificaciones Email</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Resúmenes detallados y alertas directas a tu buzón.</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                  <span className="font-extrabold text-xs block mb-1">Notificaciones SMS</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Mensajes rápidos al celular para alertar eventos extremos.</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "recompensas",
      name: "Recompensas",
      articles: [
        {
          id: "diamantes",
          title: "Diamantes y Sistema de Recompensas",
          description: "Obtén diamantes, invita a referidos y reclama beneficios exclusivos.",
          icon: Award,
          content: (
            <div className="space-y-6">
              <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                Maverlang recompensa tu fidelidad diaria mediante un sistema gamificado. Acumula diamantes y utilízalos para extender tus capacidades de consulta.
              </p>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Programa de Recompensas Diarias</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Cada 24 horas puedes reclamar tus diamantes de recompensa en el panel del perfil de usuario. El número base de diamantes que recibes diariamente se multiplica directamente según tu tier de suscripción activo:
              </p>

              <ul className="space-y-2.5 pl-4 list-disc text-xs md:text-sm text-zinc-600 dark:text-zinc-350 font-medium">
                <li><span className="font-bold">Plan Free:</span> Multiplicador base (x1)</li>
                <li><span className="font-bold">Plan Pro:</span> Multiplicador Pro (x1)</li>
                <li><span className="font-bold text-gray-900 dark:text-white">Plan Max:</span> Multiplicador Max (x2)</li>
                <li><span className="font-bold text-gray-900 dark:text-white">Plan Ultra (x5):</span> Multiplicador Ultra (x5)</li>
                <li><span className="font-bold text-gray-900 dark:text-white">Plan Ultra x20:</span> Multiplicador Máximo (x20)</li>
              </ul>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-8 mb-3">Sistema de Referidos</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Comparte tu enlace único de referidos con amigos. Cuando un usuario nuevo se registra mediante tu enlace, ambos reciben recompensas:
              </p>
              
              <ul className="space-y-2.5 pl-4 list-disc text-xs md:text-sm text-zinc-600 dark:text-zinc-350 font-medium">
                <li>El invitado recibe un <span className="font-bold text-emerald-500">20% de descuento permanente</span> en cualquiera de nuestros planes de pago.</li>
                <li>Tú recibes un bono de diamantes inmediato en cuanto el invitado valide su cuenta.</li>
              </ul>
            </div>
          )
        }
      ]
    }
  ], []);

  // Buscar coincidencia en títulos o descripciones
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.map((cat) => {
      const matchedArticles = cat.articles.filter(
        (art) =>
          art.title.toLowerCase().includes(query) ||
          art.description.toLowerCase().includes(query)
      );
      return { ...cat, articles: matchedArticles };
    }).filter((cat) => cat.articles.length > 0);
  }, [categories, searchQuery]);

  // Artículo activo
  const activeArticle = useMemo(() => {
    for (const cat of categories) {
      const art = cat.articles.find((a) => a.id === activeArticleId);
      if (art) return art;
    }
    return categories[0].articles[0];
  }, [categories, activeArticleId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 flex flex-col">
      
      {/* Top Header navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-900 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            title="Volver al Chat"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5.5 h-5.5 text-[#1890FF]" />
            <span className="font-black text-sm md:text-base tracking-tight select-none">Maverlang Docs</span>
          </div>
        </div>

        {/* Global Search bar */}
        <div className="relative w-48 sm:w-64 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar en la documentación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-transparent focus:border-gray-300 dark:focus:border-zinc-800 rounded-xl text-xs md:text-sm outline-none transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 md:px-8 py-6 gap-6 relative">
        
        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/85 p-3 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Secciones</span>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            Menú
          </button>
        </div>

        {/* Navigation Sidebar (Desktop & Mobile Drawer) */}
        <aside className={`
          fixed md:sticky top-20 left-4 right-4 md:left-0 md:right-0 z-30 md:z-10
          md:w-64 shrink-0 overflow-y-auto max-h-[calc(100vh-140px)]
          bg-white dark:bg-zinc-950 md:bg-transparent border md:border-0 border-gray-200/80 dark:border-zinc-900 rounded-2xl md:rounded-none p-4 md:p-0
          transition-all duration-300 md:block
          ${mobileMenuOpen ? "block opacity-100 translate-y-0" : "hidden md:block opacity-0 md:opacity-100 -translate-y-4 md:translate-y-0"}
        `}>
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 dark:text-zinc-500">
                <span className="text-xs font-bold block">No hay coincidencias</span>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3">
                    {cat.name}
                  </h4>
                  <ul className="space-y-0.5">
                    {cat.articles.map((art) => {
                      const isActive = art.id === activeArticleId;
                      const Icon = art.icon;
                      return (
                        <li key={art.id}>
                          <button
                            onClick={() => {
                              setActiveArticleId(art.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                              isActive
                                ? "bg-white dark:bg-[#1E293B] border border-gray-200/80 dark:border-white/5 text-[#1890FF] shadow-xs"
                                : "text-zinc-650 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-zinc-900/30"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#1890FF]" : "text-zinc-400"}`} />
                              <span className="line-clamp-1">{art.title}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 text-[#1890FF]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0 bg-white dark:bg-zinc-900/40 border border-gray-200/80 dark:border-zinc-900 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
          {/* Glowing abstract background dot */}
          <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#1890FF]/5 dark:bg-[#1890FF]/2 blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeArticle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                  {activeArticle.title}
                </h1>
                <p className="text-xs md:text-sm text-zinc-550 dark:text-zinc-400 mt-2 font-medium">
                  {activeArticle.description}
                </p>
              </div>

              <div className="border-t border-gray-200/60 dark:border-zinc-800 my-6" />

              {/* Dynamic Content */}
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                {activeArticle.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 dark:border-zinc-900 py-6 px-4 md:px-8 bg-white dark:bg-zinc-950 text-center select-none shrink-0">
        <p className="text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} Maverlang. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
