// Directrices de calidad de diseño y código compartidas por todos los prompts
// del WebBuilder (path inline + agentes multi-agente).
//
// ANTES estas reglas solo existían en webbuilder-prompt.ts (path inline), así
// que los agentes constructores del orquestador NO las veían y generaban código
// mediocre. Ahora ambos prompts importan este bloque para garantizar calidad
// consistente en cualquier ruta de generación.

export const BUILDER_DESIGN_GUIDELINES = `
DIRECTRICES DE CALIDAD Y DISEÑO (OBLIGATORIO — marca la diferencia entre un resultado mediocre y uno excepcional):

ESTILO VISUAL:
- Diseña interfaces INCREÍBLEMENTE hermosas, modernas y profesionales, al nivel de Linear, Vercel, Stripe o Apple.
- Usa fondos oscuros sofisticados (bg-[#0a0a0a], zinc-950, slate-950) con acentos vibrantes, o fondos claros limpios con buena jerarquía.
- Aplica de forma deliberada: gradientes sutiles (from/to con opacidad baja), sombras suaves (shadow-xl, shadow-2xl con colores semitransparentes), bordes redondeados generosos (rounded-2xl, rounded-3xl), glassmorphism (backdrop-blur-xl + bg-white/5 + border-white/10).
- Añade micro-animaciones: framer-motion para entradas (initial/animate con opacity+y), hover transitions (transition-all duration-300), y estados pulsantes (animate-pulse) en loaders.
- Tipografía con jerarquía clara: títulos font-black/bold grandes, cuerpo font-medium, captions font-medium pequeñas. Usa tracking-wide/tracking-tight estratégicamente.
- Espaciado generoso y consistente (gap-4, gap-6, p-6, p-8). El aire blanco comunica calidad.
- Paleta de color coherente: elige 1 color de marca (azul, violeta, emerald...) + neutros (zinc/slate). No mezcles más de 2 acentos.

ICONOS Y VISUALES:
- Para iconos: import { NombreIcono } from "lucide-react"; (Icon, Heart, TrendingUp, etc.). NUNCA uses emojis como iconos funcionales.
- Para gráficos: import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
- Para animaciones: import { motion, AnimatePresence } from "framer-motion";
- SVG: especifica SIEMPRE width y height explícitos + viewBox. Usa stroke="currentColor" para heredar color.
- Librerías disponibles: SOLO puedes importar estas. Si necesitas otra, pídelo al usuario explícitamente.
  react, react-dom (incluidos por defecto, NO los importes explícitamente), framer-motion, lucide-react, recharts, react-icons (import { FaReact } from "react-icons/fa" o { CiStar } from "react-icons/ci"), clsx, tailwind-merge, class-variance-authority, canvas-confetti (import confetti from "canvas-confetti").

IMÁGENES Y ASSETS:
- NUNCA uses rutas locales relativas (/images/logo.png) ni source.unsplash.com (dado de baja).
- Usa SIEMPRE URLs absolutas: https://picsum.photos/800/600 o https://placehold.co/600x400.
- Usa <img src="..." /> estándar, NUNCA next/image.

ROBUSTEZ Y PREVENCIÓN DE ERRORES:
- Tolerancia a fallos: usa encadenamiento opcional (?.) y valores por defecto (const { items = [] } = props; items?.map(...) ).
- Nunca accedas a propiedades de null/undefined sin guardar. Inicializa arrays/objetos antes de .map/.filter.
- useState siempre con tipo y valor inicial correcto (no undefined suelto).
- Maneja estados de carga y vacío: si los datos aún no llegan, muestra un skeleton/loader en vez de crashear.

INTERACTIVIDAD Y ESTADO:
- Haz las apps INTERACTIVAS: useState para datos y UI, useEffect para efectos, eventos onClick/onChange reales.
- Feedback visual inmediato en cada acción (hover, active:scale-95, transiciones).
- Estados controlados en formularios (value + onChange).

RESPONSIVE Y ACCESIBILIDAD:
- El diseño debe funcionar perfecto en móvil, tablet y desktop. Usa breakpoints (sm:, md:, lg:) y flex/grid responsive.
- Contraste de color suficiente para legibilidad. Botones con tamaño táctil mínimo (min-h-[44px] en móvil).
- Textos que se truncen bien en pantallas pequeñas (truncate, line-clamp-2/3).

COMPLETITUD:
- Código COMPLETO y funcional. Cero placeholders, cero "// TODO", cero comentarios vacíos.
- Exportación por defecto del componente principal en cada archivo React.
- Importaciones correctas y balance de paréntesis/llaves/etiquetas JSX siempre cerrado.
`;
