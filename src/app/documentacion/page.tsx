"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Search,
  ChevronRight,
  ChevronLeft,
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
  Menu,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  Rocket,
  Keyboard,
  HelpCircle,
  Clock,
  Tag,
  User,
  CreditCard,
  Wrench,
  Layout,
  Compass,
} from "lucide-react";

/* ============================================================
   TIPOS Y DATOS
   ============================================================ */

interface Article {
  id: string;
  title: string;
  description: string;
  icon: any;
  readTime: string;
  tags?: string[];
  content: string; // markdown
}

interface Category {
  id: string;
  name: string;
  icon: any;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    id: "comenzando",
    name: "Comenzando",
    icon: Rocket,
    articles: [
      {
        id: "introduccion",
        title: "Introducción a Maverlang",
        description: "Conoce qué es Maverlang y cómo aprovechar sus herramientas de IA y análisis.",
        icon: BookOpen,
        readTime: "3 min",
        tags: ["general", "plataforma"],
        content: `
Bienvenido a **Maverlang**, la plataforma integral de análisis de mercados, noticias de impacto global y desarrollo web impulsado por inteligencia artificial.

Maverlang combina el procesamiento de lenguaje natural de última generación con herramientas analíticas financieras avanzadas para que tomes decisiones informadas y construyas código en tiempo real.

## Módulos clave de la plataforma

| Módulo | Descripción |
| --- | --- |
| **Chat de Asistencia IA** | Chat con múltiples agentes inteligentes capaces de buscar en la web, analizar gráficos, comparar activos e interpretar noticias. |
| **Maverlang WebBuilder** | Entorno de desarrollo interactivo sandbox. Genera aplicaciones web completas en React/Tailwind con depuración y guardado automático. |
| **Modo Canvas** | Abre cualquier bloque de código generado por la IA en un panel dedicado para editarlo, copiarlo o previsualizarlo. |
| **Alertas y Portafolios** | Monitorea activos en tiempo real y recibe notificaciones vía email, SMS o push ante movimientos críticos. |

> **Nota:** Esta documentación se actualiza con cada mejora del sistema. Si necesitas soporte adicional, abre un ticket desde **Ajustes → Soporte**.
        `.trim(),
      },
      {
        id: "guia-rapida",
        title: "Guía rápida: tus primeros pasos",
        description: "Cómo enviar tu primer mensaje, crear una app y configurar una alerta en minutos.",
        icon: Zap,
        readTime: "4 min",
        tags: ["inicio", "tutorial"],
        content: `
Entra en acción en menos de 5 minutos. Sigue estos pasos para sacarle el máximo a Maverlang desde el primer momento.

## 1. Envía tu primer mensaje

Abre el chat desde la pantalla de inicio y escribe tu consulta en lenguaje natural. Puedes preguntar sobre mercados, analizar una empresa o pedir que te explique un concepto financiero.

\`\`\`text
"Resume las últimas noticias que afectan a Apple y dime si el sentimiento es positivo"
\`\`\`

## 2. Genera una mini aplicación

Activa el **WebBuilder** y pide una herramienta visual. El código aparecerá como una tarjeta que puedes abrir en el **Canvas**.

\`\`\`text
"Crea una calculadora de interés compuesto con sliders"
\`\`\`

## 3. Configura una alerta de precio

Dile al asistente qué activo vigilar y cuándo avisarte:

\`\`\`text
"Crea una alerta para AAPL cuando cruce los $220 hacia arriba"
\`\`\`

## 4. Personaliza tu asistente

Entra a **Ajustes** y define tu **rol**, **tono** y **temas de interés** para que las respuestas se adapten a tu estilo.
        `.trim(),
      },
      {
        id: "navegacion",
        title: "Navegación por la plataforma",
        description: "Conoce la barra lateral, el chat, los modos WebBuilder y Canvas, y la navegación móvil.",
        icon: Compass,
        readTime: "3 min",
        tags: ["ui", "navegación"],
        content: `
Maverlang está organizado en torno a unas pocas áreas principales que conviene conocer.

## Barra lateral

Contiene el acceso rápido a las secciones: **Noticias**, **Mercados**, **Portafolio**, **Mundo** y tu historial de chats recientes. En la parte inferior está tu perfil y el acceso a **Ajustes**.

## Chat principal

Es el centro de la plataforma. Aquí conversas con la IA, que puede invocar agentes para buscar, calcular, graficar o programar.

## WebBuilder y Canvas

Cuando la IA genera código, aparece una **tarjeta de Canvas**. Al hacer clic se abre el **panel Canvas**:

- **Desktop**: se abre en un panel lateral dividido.
- **Móvil**: se desliza como una hoja inferior de abajo hacia arriba, con un botón **✕** para cerrar.

## Navegación móvil

En celular, la barra lateral se convierte en un menú deslizable. Usa el botón de menú (arriba a la izquierda) para abrirla.

> **Tip:** En móvil, cuando abres el Canvas, el chat se oculta para que el contenido del canvas se vea nítido, sin distracciones.
        `.trim(),
      },
    ],
  },
  {
    id: "cuenta-perfil",
    name: "Cuenta y Perfil",
    icon: User,
    articles: [
      {
        id: "crear-cuenta",
        title: "Crear cuenta e iniciar sesión",
        description: "Cómo registrarte, verificar tu cuenta y recuperar el acceso.",
        icon: ShieldCheck,
        readTime: "3 min",
        tags: ["auth", "cuenta"],
        content: `
Crear una cuenta en Maverlang es rápido y te desbloquea el guardado en la nube, los portafolios y el historial.

## Registro

1. Pulsa **Iniciar sesión** en la esquina superior.
2. Elige **Registrarse** e introduce tu correo y contraseña, o usa el inicio de sesión con Google.
3. Te enviaremos un **código de verificación** a tu correo para confirmar la cuenta.

## Inicio de sesión

Puedes entrar con correo + contraseña o con Google. Si olvidas tu contraseña, usa la opción **¿Olvidaste tu contraseña?** para recibir un enlace de restablecimiento.

> **Importante:** Tu sesión se mantiene activa de forma segura gracias a Supabase Auth. Cerrar sesión no borra tus datos ni proyectos guardados.
        `.trim(),
      },
      {
        id: "planes",
        title: "Planes y suscripción",
        description: "Diferencias entre los tiers Free, Pro, Max y Ultra, y cómo mejorar tu plan.",
        icon: CreditCard,
        readTime: "4 min",
        tags: ["planes", "billing"],
        content: `
Maverlang ofrece varios tiers de suscripción con diferentes capacidades de IA y funciones.

## Comparativa de planes

| Plan | Tokens 5h | Tokens semanales | Tokens mensuales |
| --- | --- | --- | --- |
| **Free** | 10.000 | 25.000 | 50.000 (de por vida) |
| **Pro** | 150.000 | 400.000 | 1.000.000 / mes |
| **Max** | 300.000 | 800.000 | 2.000.000 / mes |
| **Ultra (x5)** | 750.000 | 2.000.000 | 5.000.000 / mes |
| **Ultra (x20)** | 3.000.000 | 8.000.000 | 20.000.000 / mes |

## Cómo mejorar tu plan

Desde el menú de usuario, selecciona **Actualizar plan** para ver las opciones disponibles y gestionar tu suscripción.

> **Promo X2:** Durante promociones activas, todos los límites se duplican automáticamente en el backend y se reflejan en tu tarjeta de consumo.
        `.trim(),
      },
    ],
  },
  {
    id: "asistente-ia",
    name: "Asistente IA",
    icon: Cpu,
    articles: [
      {
        id: "agentes-roles",
        title: "Agentes y roles del asistente",
        description: "Conoce los roles disponibles (Mentor Financiero, Analista, Desarrollador) y cómo cambian las respuestas.",
        icon: Sliders,
        readTime: "4 min",
        tags: ["agentes", "roles"],
        content: `
El asistente de Maverlang es totalmente personalizable. Cada **rol** define las prioridades de procesamiento, las fuentes a buscar y el formato de la respuesta.

## Roles disponibles

### 🧭 Mentor Financiero
Prioriza análisis de carteras, estrategias de inversión a largo plazo y explicaciones didácticas de indicadores bursátiles.

### 📊 Analista de Negocios
Enfocado en métricas operativas de empresas, reportes trimestrales (10-K, 10-Q), tendencias industriales globales y valoración fundamental.

### 💻 Desarrollador de Código
Ajustado para generar algoritmos de trading, scripts de consulta de APIs, plantillas de scraping y depurar código en tiempo real.

## Cómo cambiar el rol

Ve a **Ajustes → Personalizar Asistente** y selecciona el rol que mejor se adapte a tu objetivo del momento. Puedes cambiarlo en cualquier momento.

> **Tip:** El rol **Desarrollador de Código** es ideal cuando vas a usar el WebBuilder, ya que produce código más limpio y modular.
        `.trim(),
      },
      {
        id: "personalizacion",
        title: "Personalización: tono e intereses",
        description: "Configura el tono de respuesta y tus temas/activos de interés.",
        icon: Sparkles,
        readTime: "3 min",
        tags: ["preferencias", "personalización"],
        content: `
Además del rol, puedes ajustar el **tono** y los **temas de interés** para que el asistente hable tu idioma.

## Tono de respuesta

Elige entre opciones como:

- **Analítico** — datos, métricas y razonamiento cuantitativo.
- **Técnico** — terminología precisa y detalle profundo.
- **Conciso** — respuestas directas y al grano.
- **Creativo** — enfoques novedosos y analogías.

## Temas y activos de interés

Puedes añadir hasta **5 temas o activos (Tickers)** de interés. Si tienes cargada tu lista de portafolio, el asistente priorizará las noticias que puedan afectar a tus inversiones activas.

\`\`\`text
"Estate al tanto de TSLA, NVDA y de las noticias sobre tipos de interés"
\`\`\`
        `.trim(),
      },
    ],
  },
  {
    id: "webbuilder-canvas",
    name: "WebBuilder y Canvas",
    icon: Layers,
    articles: [
      {
        id: "webbuilder",
        title: "Qué es el Maverlang WebBuilder",
        description: "Construye aplicaciones web completas e interactivas en React desde lenguaje natural.",
        icon: Layers,
        readTime: "4 min",
        tags: ["webbuilder", "código"],
        content: `
**Maverlang WebBuilder** es un entorno integrado que convierte instrucciones en lenguaje natural en aplicaciones React funcionales e interactivas.

## Flujo de trabajo

1. **Solicitar** — Describe el diseño, paneles, tablas o lógica que necesitas.
2. **Procesar** — Nuestros agentes crean los componentes, importan librerías y arman el código de forma modular.
3. **Previsualizar** — El panel de Canvas ejecuta el código en tiempo real, con soporte para clics e interacciones.

## Librerías soportadas por defecto

El entorno tiene acceso precargado a dependencias clave para dashboards modernos:

\`lucide-react\`, \`framer-motion\`, \`clsx\`, \`tailwind-merge\`, \`canvas-confetti\`, \`recharts\`.

## Guardado en la nube y Auto-Fix

Tus proyectos se guardan automáticamente en Supabase si activas la casilla en **Ajustes → Comportamiento**. Si ocurre un error sintáctico o lógico, el sistema de **Auto-Fix** lee los registros de error e intenta repararlos de forma autónoma.

> **Importante:** El WebBuilder se activa automáticamente cuando la IA detecta que necesitas una aplicación. El resultado aparece como una tarjeta de Canvas en el chat.
        `.trim(),
      },
      {
        id: "modo-canvas",
        title: "Modo Canvas: abrir, editar y cerrar",
        description: "Cómo funciona el panel Canvas en desktop y móvil, y cómo cerrarlo.",
        icon: Layout,
        readTime: "3 min",
        tags: ["canvas", "ui"],
        content: `
El **Modo Canvas** es el panel dedicado donde se abre cualquier bloque de código generado por la IA. Nada más empezar a escribirse el código, aparece una tarjeta en el chat — no tienes que esperar a que termine.

## Abrir el Canvas

Cuando la IA genera código, verás una **tarjeta de Canvas** en el chat (con un indicador "Generando" mientras escribe). Haz clic en ella para abrir el panel.

### En escritorio
El Canvas se abre en un **panel lateral dividido** junto al chat, con pestañas de **Código** y **Vista previa**.

### En móvil
El Canvas se desliza como una **hoja inferior** de abajo hacia arriba, ocupando casi toda la pantalla. Incluye:

- Una **barra de arrastre** superior y un botón **✕** para cerrar.
- El chat se oculta detrás para que el contenido del canvas se vea nítido.

## Cerrar el Canvas

- **Escritorio:** pulsa el botón **✕** del panel.
- **Móvil:** pulsa el botón **✕** de la esquina superior derecha, o desliza la hoja hacia abajo.

## Copiar y reutilizar código

Dentro del Canvas tienes un botón **Copiar** para llevar el código a tu propio proyecto. También puedes pedirle a la IA que lo modifique y se actualizará en tiempo real.

> **Tip:** Si el código tarda en aparecer en móvil, espera al badge "Generando". La tarjeta se actualiza a medida que la IA escribe.
        `.trim(),
      },
    ],
  },
  {
    id: "herramientas-financieras",
    name: "Herramientas Financieras",
    icon: Award,
    articles: [
      {
        id: "alertas",
        title: "Portafolio y alertas de precio",
        description: "Configura alertas de precio push, SMS o email y monitorea activos de interés.",
        icon: Bell,
        readTime: "4 min",
        tags: ["portafolio", "alertas"],
        content: `
Monitorea tus inversiones estructurando tu portafolio personalizado y creando alertas de precio precisas.

## Cómo configurar una alerta

Puedes crear alertas directamente desde el chat en lenguaje natural:

\`\`\`text
"Crea una alerta de precio para AAPL cuando cruce los $220 hacia arriba"
\`\`\`

La IA confirmará la configuración:

\`\`\`text
🔔 Alerta configurada exitosamente:
- Activo: AAPL (Apple Inc.)
- Condición: >= $220.00 USD
- Canal: Notificación Push & Email
\`\`\`

## Canales de notificación

Puedes afinar los canales de contacto desde el panel de ajustes:

- **Push** — alertas instantáneas en el navegador o la app móvil.
- **Email** — resúmenes detallados y alertas a tu buzón.
- **SMS** — mensajes rápidos para eventos extremos.

> **Importante:** Para que las alertas funcionen, asegúrate de tener los activos añadidos a tu portafolio y los canales activados en Ajustes.
        `.trim(),
      },
    ],
  },
  {
    id: "limites-consumo",
    name: "Límites y Consumo",
    icon: Cpu,
    articles: [
      {
        id: "limites",
        title: "Límites de uso de tokens IA",
        description: "Cómo funcionan los consumos de tokens, las ventanas de tiempo y los multiplicadores.",
        icon: Cpu,
        readTime: "5 min",
        tags: ["tokens", "límites"],
        content: `
Para garantizar un servicio estable, Maverlang gestiona el consumo de IA a través de **ventanas temporales móviles** (Rolling Windows).

## Ventanas móviles de consumo

A diferencia de los límites mensuales fijos, Maverlang implementa límites rodantes:

- **Límite de 5 horas** — calcula los tokens consumidos en las últimas 5 horas. A medida que pasa el tiempo, los tokens antiguos salen de la ventana y recuperas capacidad en tiempo real.
- **Límite semanal** — controla el volumen máximo en un lapso móvil de 7 días.
- **Límite mensual / vida** — la bolsa general asignada al mes de facturación, o el total acumulado de por vida en cuentas gratuitas.

## Límites base por tier

| Tier | 5 horas | Semanal | Mensual / Total |
| --- | --- | --- | --- |
| **Free** | 10.000 | 25.000 | 50.000 (vida) |
| **Pro** | 150.000 | 400.000 | 1.000.000 / mes |
| **Max** | 300.000 | 800.000 | 2.000.000 / mes |
| **Ultra (x5)** | 750.000 | 2.000.000 | 5.000.000 / mes |
| **Ultra (x20)** | 3.000.000 | 8.000.000 | 20.000.000 / mes |

## Multiplicadores y promociones

Durante promociones activas (**Promo X2**), todos los límites se duplican automáticamente en el backend y se reflejan en tiempo real en tu tarjeta de consumo.

> **Tip:** Si te quedas sin tokens, espera a que la ventana móvil libere capacidad, o mejora tu plan desde **Ajustes → Plan**.
        `.trim(),
      },
    ],
  },
  {
    id: "atajos-tips",
    name: "Atajos y Tips",
    icon: Keyboard,
    articles: [
      {
        id: "atajos",
        title: "Atajos de teclado",
        description: "Lista de atajos para navegar y operar más rápido en la plataforma.",
        icon: Keyboard,
        readTime: "2 min",
        tags: ["atajos", "productividad"],
        content: `
Aprovecha estos atajos para moverte más rápido por Maverlang.

## Generales

| Atajo | Acción |
| --- | --- |
| \`Ctrl/Cmd + K\` | Abrir búsqueda |
| \`Ctrl/Cmd + ,\` | Abrir Ajustes |
| \`Esc\` | Cerrar diálogos / Canvas |
| \`Ctrl/Cmd + /\` | Abrir documentación |

## Chat

| Atajo | Acción |
| --- | --- |
| \`Enter\` | Enviar mensaje |
| \`Shift + Enter\` | Salto de línea |
| \`Ctrl/Cmd + N\` | Nueva conversación |

> **Tip:** Puedes abrir la documentación en cualquier momento con \`Ctrl/Cmd + /\`.
        `.trim(),
      },
    ],
  },
  {
    id: "ayuda",
    name: "Ayuda",
    icon: HelpCircle,
    articles: [
      {
        id: "faq",
        title: "Preguntas frecuentes",
        description: "Respuestas a las dudas más comunes sobre el uso de la plataforma.",
        icon: HelpCircle,
        readTime: "4 min",
        tags: ["faq", "ayuda"],
        content: `
Las dudas más frecuentes de los usuarios de Maverlang.

## ¿Se guarda mi historial de chats?

Sí. Si tienes la sincronización en la nube activada (**Ajustes → Comportamiento**), tus conversaciones y proyectos se guardan en Supabase y están disponibles en todos tus dispositivos.

## ¿Puedo usar Maverlang sin cuenta?

Puedes explorar la plataforma y el chat inicial, pero para guardar proyectos, configurar alertas y mantener un historial necesitas una cuenta.

## ¿Por qué el código tarda en aparecer en el Canvas?

La tarjeta de Canvas aparece **inmediatamente** cuando la IA empieza a escribir, pero el contenido se va rellenando en tiempo real. El badge "Generando" indica que aún está escribiendo. Al terminar, el código está completo.

## ¿Qué hago si me quedo sin tokens?

Los límites son móviles: espera a que la ventana de 5 horas libere capacidad, o mejora tu plan. Tu tarjeta de consumo en **Ajustes → Plan y Consumo** te muestra cuánto te queda.

## ¿El WebBuilder funciona en móvil?

Sí. En móvil el Canvas se abre como hoja inferior y el código se edita y previsualiza correctamente, adaptado a la pantalla.

## ¿Cómo cambio el idioma?

Desde el menú de usuario, en **Idioma**, puedes elegir español, inglés o dejarlo en automático según tu navegador.
        `.trim(),
      },
      {
        id: "solucion-problemas",
        title: "Solución de problemas",
        description: "Cómo resolver los problemas más comunes (canvas, conexión, tokens).",
        icon: Wrench,
        readTime: "4 min",
        tags: ["troubleshooting", "problemas"],
        content: `
Guía rápida para resolver los problemas más comunes.

## El Canvas no se abre

- Asegúrate de hacer clic en la **tarjeta de Canvas** del chat, no solo esperar.
- En móvil, comprueba que la hoja inferior subió por completo. Usa el botón **✕** si necesitas cerrarla y volver a abrirla.
- Recarga la página si el estado se quedó atascado.

## El código del WebBuilder da error

- El sistema **Auto-Fix** intenta repararlo automáticamente. Si persiste, pídele a la IA "corrige el error".
- Verifica que no pides librerías no soportadas (las soportadas: \`lucide-react\`, \`framer-motion\`, \`clsx\`, \`tailwind-merge\`, \`canvas-confetti\`, \`recharts\`).

## El asistente no responde

- Revisa tu conexión a internet.
- Comprueba tu consumo de tokens en **Ajustes → Plan y Consumo**. Si agotaste la ventana, espera o mejora el plan.

## Las alertas no llegan

- Confirma que tienes los **canales activados** (push/email/SMS) en Ajustes.
- Revisa que el activo esté en tu portafolio y que la condición de la alerta sea correcta.

> **¿Sigues con problemas?** Abre un ticket desde **Ajustes → Soporte** y te ayudaremos.
        `.trim(),
      },
    ],
  },
];

/* ============================================================
   COMPONENTES REUTILIZABLES
   ============================================================ */

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md text-[10px] font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Copiar código"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
      <pre className={`overflow-x-auto rounded-2xl bg-zinc-950 border border-zinc-800 text-white p-4 text-xs md:text-[13px] font-mono leading-relaxed ${className || ""}`}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ============================================================
   PÁGINA
   ============================================================ */

export default function DocumentacionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState("introduccion");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lista plana de artículos (para navegación prev/next)
  const allArticles = useMemo(() => {
    const list: { article: Article; categoryId: string; index: number }[] = [];
    CATEGORIES.forEach((cat) => {
      cat.articles.forEach((art, idx) => {
        list.push({ article: art, categoryId: cat.id, index: idx });
      });
    });
    return list;
  }, []);

  // Buscar coincidencias
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const query = searchQuery.toLowerCase();
    return CATEGORIES.map((cat) => {
      const matchedArticles = cat.articles.filter(
        (art) =>
          art.title.toLowerCase().includes(query) ||
          art.description.toLowerCase().includes(query) ||
          (art.tags || []).some((t) => t.toLowerCase().includes(query))
      );
      return { ...cat, articles: matchedArticles };
    }).filter((cat) => cat.articles.length > 0);
  }, [searchQuery]);

  const totalResults = useMemo(
    () => filteredCategories.reduce((acc, cat) => acc + cat.articles.length, 0),
    [filteredCategories]
  );

  // Artículo activo
  const activeArticle = useMemo(() => {
    for (const cat of CATEGORIES) {
      const art = cat.articles.find((a) => a.id === activeArticleId);
      if (art) return art;
    }
    return CATEGORIES[0].articles[0];
  }, [activeArticleId]);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.articles.some((a) => a.id === activeArticleId)) || CATEGORIES[0],
    [activeArticleId]
  );

  // Navegación prev/next
  const currentFlatIndex = useMemo(
    () => allArticles.findIndex((a) => a.article.id === activeArticleId),
    [allArticles, activeArticleId]
  );
  const prevArticle = currentFlatIndex > 0 ? allArticles[currentFlatIndex - 1].article : null;
  const nextArticle =
    currentFlatIndex >= 0 && currentFlatIndex < allArticles.length - 1
      ? allArticles[currentFlatIndex + 1].article
      : null;

  // Scroll al inicio al cambiar de artículo
  useEffect(() => {
    const main = document.getElementById("docs-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeArticleId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 flex flex-col">
      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-900 px-4 md:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center shrink-0"
            title="Volver al Chat"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1890FF] to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm md:text-base tracking-tight select-none block">Maverlang Docs</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold hidden sm:block">
                Centro de ayuda y documentación
              </span>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative w-44 sm:w-64 md:w-80 shrink-0">
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

      {/* ===================== HERO ===================== */}
      {!searchQuery && activeArticleId === "introduccion" && (
        <section className="px-4 md:px-8 pt-8 pb-2 max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1890FF] to-blue-700 p-6 md:p-10 text-white shadow-xl shadow-blue-500/20"
          >
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold mb-4">
                <Sparkles className="w-3 h-3" />
                Documentación oficial
              </div>
              <h1 className="text-2xl md:text-4xl font-black leading-tight mb-3">
                Aprende a dominar Maverlang
              </h1>
              <p className="text-sm md:text-base text-white/80 max-w-2xl leading-relaxed">
                Guías completas para sacar el máximo provecho de la IA, el WebBuilder, el Canvas y las herramientas financieras.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { id: "guia-rapida", label: "Guía rápida", icon: Zap },
                  { id: "modo-canvas", label: "Modo Canvas", icon: Layout },
                  { id: "limites", label: "Límites", icon: Cpu },
                  { id: "faq", label: "FAQ", icon: HelpCircle },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveArticleId(q.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-bold transition-colors cursor-pointer"
                  >
                    <q.icon className="w-3.5 h-3.5" />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ===================== MAIN CONTAINER ===================== */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 md:px-8 py-6 gap-6 relative">
        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/85 p-3 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Secciones
          </span>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            Menú
          </button>
        </div>

        {/* ===================== SIDEBAR ===================== */}
        <aside
          className={`
          fixed md:sticky top-20 left-4 right-4 md:left-0 md:right-0 z-30 md:z-10
          md:w-64 shrink-0 overflow-y-auto max-h-[calc(100vh-140px)]
          bg-white dark:bg-zinc-950 md:bg-transparent border md:border-0 border-gray-200/80 dark:border-zinc-900 rounded-2xl md:rounded-none p-4 md:p-0
          transition-all duration-300 md:block
          ${mobileMenuOpen ? "block opacity-100 translate-y-0" : "hidden md:block opacity-0 md:opacity-100 -translate-y-4 md:translate-y-0"}
        `}
        >
          <div className="space-y-6">
            {totalResults === 0 && searchQuery ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-bold block">No hay coincidencias</span>
                <span className="text-[10px] text-zinc-400">Prueba con otro término</span>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 flex items-center gap-1.5">
                      <CatIcon className="w-3 h-3" />
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
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-zinc-900/30"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#1890FF]" : "text-zinc-400"}`} />
                                <span className="line-clamp-1">{art.title}</span>
                              </div>
                              {isActive && <ChevronRight className="w-3 h-3 text-[#1890FF] shrink-0" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ===================== CONTENT PANEL ===================== */}
        <main
          id="docs-main"
          className="flex-1 min-w-0 bg-white dark:bg-zinc-900/40 border border-gray-200/80 dark:border-zinc-900 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden"
        >
          {/* Glow background */}
          <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#1890FF]/5 dark:bg-[#1890FF]/2 blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeArticle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative"
            >
              {/* Breadcrumb + meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1890FF]/10 text-[#1890FF] text-[10px] font-bold uppercase tracking-wider">
                  <activeCategory.icon className="w-3 h-3" />
                  {activeCategory.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                  <Clock className="w-3 h-3" />
                  {activeArticle.readTime}
                </span>
                {activeArticle.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] font-mono font-medium"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                {activeArticle.title}
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                {activeArticle.description}
              </p>

              <div className="border-t border-gray-200/60 dark:border-zinc-800 my-6" />

              {/* Markdown content */}
              <article className="prose prose-zinc dark:prose-invert prose-sm md:prose-base max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-p:font-medium prose-p:leading-relaxed prose-li:font-medium prose-li:my-1 prose-strong:text-gray-900 prose-strong:dark:text-white prose-a:text-[#1890FF] prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-100 prose-code:dark:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px] prose-code:font-mono prose-code:text-[#1890FF] prose-table:text-xs prose-th:font-black prose-th:bg-gray-50 prose-th:dark:bg-zinc-900 prose-th:text-zinc-500 prose-blockquote:border-[#1890FF] prose-blockquote:bg-blue-50/40 prose-blockquote:dark:bg-blue-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-zinc-700 prose-blockquote:dark:text-zinc-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return <CodeBlock className={className}>{children}</CodeBlock>;
                    },
                    a({ node, ...props }: any) {
                      return <a target="_blank" rel="noopener noreferrer" {...props} />;
                    },
                  }}
                >
                  {activeArticle.content}
                </ReactMarkdown>
              </article>

              {/* Prev / Next navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 pt-6 border-t border-gray-200/60 dark:border-zinc-800">
                {prevArticle ? (
                  <button
                    onClick={() => setActiveArticleId(prevArticle.id)}
                    className="group flex flex-col items-start text-left p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 hover:border-[#1890FF]/40 dark:hover:border-[#1890FF]/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      <ChevronLeft className="w-3 h-3" />
                      Anterior
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#1890FF] transition-colors">
                      {prevArticle.title}
                    </span>
                  </button>
                ) : (
                  <div />
                )}
                {nextArticle ? (
                  <button
                    onClick={() => setActiveArticleId(nextArticle.id)}
                    className="group flex flex-col items-end text-right p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 hover:border-[#1890FF]/40 dark:hover:border-[#1890FF]/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all cursor-pointer sm:ml-auto sm:w-full"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Siguiente
                      <ChevronRight className="w-3 h-3" />
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#1890FF] transition-colors">
                      {nextArticle.title}
                    </span>
                  </button>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-gray-200/80 dark:border-zinc-900 py-6 px-4 md:px-8 bg-white dark:bg-zinc-950 text-center select-none shrink-0">
        <p className="text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} Maverlang. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
