import { notFound } from "next/navigation";
import { Sparkles, Brain, Clock, ShieldCheck, ArrowRight, ExternalLink, Globe, Building, Bot, Bell, Folder, BookOpen, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { UseCasePreview } from "@/components/chat/use-case-preview";
import { UseCasePrompt } from "@/components/chat/use-case-prompt";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Footer } from "@/components/footer";

interface UseCaseData {
  title: string;
  desc: string;
  brand: string;
  gradient: string;
  challenge: string;
  solution: string;
  products: string[];
  region: string;
  industry: string;
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
  metrics: { value: string; label: string; sublabel: string }[];
  demoTitle?: string;
  demoPrompt?: string;
  demoCode?: string;
  demoCodeOverride?: string;
}

const USE_CASE_MAP: Record<string, UseCaseData> = {
  "auditoria-corporativa": {
    title: "Análisis logístico geopolítico con Maverlang AI",
    brand: "Caso de Éxito: Auditoría",
    desc: "Cómo un líder de logística global utilizó Maverlang AI para predecir cuellos de botella y desviar rutas en tiempo real.",
    gradient: "from-[#1890FF] to-blue-800",
    challenge: "Monitorear múltiples variables geopolíticas y logísticas de ejemplo sin saturar los analistas.",
    solution: "La IA escaneó flujos internacionales de forma autónoma en una simulación de ejemplo.",
    products: ["Asistente de IA (Maverlang AI)", "Análisis Logístico", "Maverlang 2.5 Flash"],
    region: "Global (Ejemplo)",
    industry: "Logística y Transporte (Ejemplo)",
    quote: "Este ejemplo ilustra cómo el escaneo geopolítico constante de la IA previene pérdidas operativas sustanciales.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Gestor Logístico",
    metrics: [
      { value: "0", label: "Retrasos Críticos", sublabel: "Gracias al desvío anticipado" },
      { value: "100%", label: "Rutas Monitoreadas", sublabel: "Seguimiento global de puertos" },
      { value: "3h+", label: "Ventaja Informativa", sublabel: "Tiempo de preaviso promedio" }
    ]
  },
  "educacion-financiera": {
    title: "Ejemplo de Uso: Simulación y Educación en Laboratorios Académicos",
    brand: "Ejemplo de Uso: Educación",
    desc: "Guía ilustrativa sobre cómo facultades de economía integran herramientas de análisis con IA.",
    gradient: "from-purple-600 to-pink-500",
    challenge: "Una universidad desea capacitar a sus alumnos con herramientas modernas de análisis.",
    solution: "Al incorporar Maverlang AI en las aulas, los estudiantes acceden a una plataforma moderna.",
    products: ["Asistente de IA (Maverlang AI)", "Análisis de Portafolio", "Feed de Noticias", "Maverlang 2.5 Flash"],
    region: "Global (Ejemplo)",
    industry: "Educación y Academia (Ejemplo)",
    quote: "Este ejemplo demuestra la utilidad de una interfaz intuitiva con explicaciones didácticas de IA.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Docente Universitario",
    metrics: [
      { value: "100%", label: "Adopción Estudiantil", sublabel: "Uso integrado en talleres" },
      { value: "-60%", label: "Reducción de Costos", sublabel: "Frente a suscripciones tradicionales" },
      { value: "1.2k+", label: "Usuarios Simulados", sublabel: "Operando de forma concurrente" }
    ]
  },
  "sitio-web": {
    title: `Vestra — Plataforma de Inversión Social`,
    brand: `Caso de Éxito: Sitio Web`,
    desc: `Landing page premium para una plataforma de inversión social y trading de acciones, generada en un solo prompt.`,
    gradient: `from-blue-600 to-indigo-850`,
    challenge: `Diseñar una interfaz financiera que transmita confianza, transparencia y empoderamiento, evitando el caos visual típico de las apps de trading tradicionales.`,
    solution: `Maverlang AI estructuró el panel completo en un prompt, integrando tickers en vivo, gráficos dinámicos de rendimiento y tarjetas de CopyTrading.`,
    products: ["Diseñador Web IA (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `LatAm & España`,
    industry: `Fintech / Trading`,
    quote: `La armonía visual y la animación de los gráficos de velas superó por completo nuestras expectativas de maquetación.`,
    quoteAuthor: `Sandra Ortega`,
    quoteRole: `VP of Product, Vestra`,
    metrics: [{"value":"800ms","label":"Tiempo de Carga","sublabel":"Optimización extrema del código de salida"},{"value":"100%","label":"Responsivo","sublabel":"Ajuste perfecto a resoluciones móviles y de escritorio"},{"value":"1 Prompt","label":"Generación Única","sublabel":"Código fuente y diseño generados en un solo paso"}],
    demoTitle: `Vestra — Plataforma de Inversión Social`,
    demoPrompt: `Diseña una página de inicio para una plataforma de inversión social y trading de acciones que transmite confianza, transparencia y empoderamiento financiero: el antídoto a las aplicaciones de trading caóticas, opacas e intimidantes.

Estrategia visual:

Imágenes: Dashboards limpios, gráficos ascendentes, personas jóvenes y diversos analizando mercados en tabletas y monitores minimalistas, visualizaciones de datos abstractos en 3D, conexiones entre perfiles de usuarios.
  Fotografía: Iluminación de estudio con toques de luz neón sutil, alto contraste controlado, enfoque nítido en pantallas y expresiones faciales de concentración tranquila.
    Composición: Diseño de cuadrícula modular, líneas de escaneo diagonales sobre los gráficos, espacio negativo equilibrado con bloques de información densa pero jerarquizada.
Paleta de colores:

Colores primarios: Azul marino profundo(confianza institucional), blanco puro(claridad), gris carbón.
Colores de acento: Verde esmeralda(crecimiento / utilidades), rojo coral suave(pérdidas, no agresivo), cian eléctrico(datos en tiempo real).
  Fondo: Degradados oscuros profundos en la parte superior transicionando a fondos blancos puros hacia las secciones educativas.Textura sutil de vidrio esmerilado(glassmorphism) en las tarjetas.
    Tipografía:

Encabezados: Sans - serif geométrica, peso audaz y moderno(estilo Inter o Satoshi).
Texto del cuerpo: Sans - serif limpia y de alta legibilidad.
  Datos: Fuente monoespaciada(tabular) para todos los números, tickers y porcentajes, asegurando alineación perfecta.
    Diseño: Tarjetas flotantes con sombras paralelas muy suaves; jerarquía visual marcada entre titulares y datos financieros; uso de microiconografía lineal para navegación.

Estructura de la página:

Sección principal: Un ticker de mercado en vivo en la parte superior + titular potente("Invierte como un experto, rodeado de expertos") + un gráfico de velas dinámicas de fondo + llamada a la acción para crear cuenta gratis.
Activos destacados: Acciones / Criptomonedas / ETFs / Materias primas(con mini - gráficos de chispa o sparklines y rendimiento a 24h).
  CopyTrading(Social Trading): Visualización de la función estrella.Perfiles de "Top Inversores" con su ROI histórico y un botón de "Copiar" slimente.
Listado de inversores populares: Tarjetas con foto, nivel de riesgo, número de copiadores y asignación de activos.
Seguridad y Regulación: Logos de comisiones financieras, cifrado de datos, protección de saldos.
Oferta de bienvenida: Formulario de registro en dos pasos destacados con la promesa de "Cuenta demo con $100,000 virtuales".
Detalles de interacción:

Los números y porcentajes del ticker superior parpadean sutilmente en verde o rojo con cada actualización simulada del mercado.
Los gráficos de líneas se "dibujan" de izquierda a derecha con una animación fluida de 800 ms al entrar en la pantalla.
Al pasar el cursor sobre una acción, se despliega una mini - ventana(tooltip) con el precio exacto y un botón rápido de "Comprar/Vender".
El botón principal de "Copiar Trader" tiene un efecto de onda expansiva(ripple) al hacer clic.
El fondo de la sección principal tiene un efecto parallax 3D sutil; los gráficos se mueven ligeramente más lento que el texto al desplazarse.
Las tarjetas de los inversores se inclinan ligeramente en 3D siguiendo el movimiento del cursor(efecto giroscopio).
Las filas de la tabla de activos se resaltan con un fondo azul muy tenue al pasar el cursor por encima.
Ambiente general: Sofisticado, dinámico, confiable, tecnológico, accesible.`,
    demoCode: `<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vestra — Invierte como un experto, rodeado de expertos</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
                  <style>
                    :root {
                      --navy-900: #060b14;
                    --navy-850: #080f1c;
                    --navy-800: #0a1628;
                    --navy-700: #0f1f38;
                    --navy-600: #162a47;
                    --navy-500: #1f3a5f;
                    --carbon: #14181f;
                    --carbon-2: #1c2230;
                    --line: rgba(255,255,255,0.08);
                    --line-strong: rgba(255,255,255,0.15);
                    --line-cyan: rgba(34,211,238,0.18);
                    --white: #ffffff;
                    --muted: #8a9bb4;
                    --muted-2: #5d6b85;
                    --emerald: #00c896;
                    --emerald-bright: #00e8a8;
                    --emerald-dim: rgba(0,200,150,0.15);
                    --coral: #ff6b7d;
                    --coral-bright: #ff8a9a;
                    --coral-dim: rgba(255,107,125,0.15);
                    --cyan: #22d3ee;
                    --cyan-bright: #06e0ff;
                    --cyan-dim: rgba(34,211,238,0.12);
                    --ink: #0a1628;
                    --ink-2: #1a2942;
  }

                    * {-webkit - font - smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

                    body {
                      font - family: 'Manrope', sans-serif;
                    background: var(--navy-900);
                    color: var(--white);
                    overflow-x: hidden;
  }

                    .font-display {font - family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; }
                    .font-mono {font - family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
                    .tabular {font - variant - numeric: tabular-nums; }

                    /* ===== Ticker ===== */
                    .ticker-track {
                      display: inline-flex;
                    animation: ticker-scroll 80s linear infinite;
                    white-space: nowrap;
  }
                    @keyframes ticker-scroll {
                      from {transform: translateX(0); }
                    to {transform: translateX(-50%); }
  }
                    .ticker-item .change {transition: color 0.4s; }
                    .ticker-item.flash-up .change {color: var(--emerald-bright) !important; text-shadow: 0 0 12px rgba(0,232,168,0.6); }
                    .ticker-item.flash-down .change {color: var(--coral-bright) !important; text-shadow: 0 0 12px rgba(255,138,154,0.6); }
                    .ticker-item.flash-up .price {color: var(--emerald-bright); }
                    .ticker-item.flash-down .price {color: var(--coral-bright); }

                    /* ===== Glass cards ===== */
                    .glass {
                      background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
                    backdrop-filter: blur(24px) saturate(140%);
                    -webkit-backdrop-filter: blur(24px) saturate(140%);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 18px;
                    box-shadow: 0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  }
                    .glass-strong {
                      background: linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
                    backdrop-filter: blur(28px) saturate(150%);
                    -webkit-backdrop-filter: blur(28px) saturate(150%);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 18px;
                    box-shadow: 0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
  }

                    /* ===== Background patterns ===== */
                    .grid-bg {
                      background - image:
                    linear-gradient(rgba(34,211,238,0.045) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34,211,238,0.045) 1px, transparent 1px);
                    background-size: 64px 64px;
                    mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  }
                    .diagonal-lines {
                      background - image: repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 10px,
                    rgba(34,211,238,0.025) 10px,
                    rgba(34,211,238,0.025) 11px
                    );
  }

                    /* ===== Buttons ===== */
                    .btn-primary {
                      position: relative;
                    background: linear-gradient(135deg, var(--emerald) 0%, var(--cyan) 100%);
                    color: var(--navy-900);
                    font-weight: 700;
                    overflow: hidden;
                    transition: transform 0.25s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s;
                    box-shadow: 0 8px 24px -8px rgba(0,200,150,0.5);
  }
                    .btn-primary:hover {
                      transform: translateY(-2px);
                    box-shadow: 0 16px 40px -8px rgba(0,232,168,0.6);
  }
                    .btn-primary::before {
                      content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, var(--cyan-bright) 0%, var(--emerald-bright) 100%);
                    opacity: 0;
                    transition: opacity 0.3s;
  }
                    .btn-primary:hover::before {opacity: 1; }
  .btn-primary > * {position: relative; z-index: 1; }

                    .btn-ghost {
                      border: 1px solid var(--line-strong);
                    background: rgba(255,255,255,0.02);
                    transition: all 0.25s;
  }
                    .btn-ghost:hover {
                      border - color: rgba(34,211,238,0.4);
                    background: rgba(34,211,238,0.06);
                    color: var(--cyan-bright);
  }

                    /* ===== Ripple ===== */
                    .ripple-btn {position: relative; overflow: hidden; }
                    .ripple {
                      position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    transform: scale(0);
                    animation: ripple-anim 0.7s ease-out;
                    pointer-events: none;
  }
                    @keyframes ripple-anim {
                      to {transform: scale(4); opacity: 0; }
  }

                    /* ===== Asset row ===== */
                    .asset-row {
                      transition: background 0.25s;
                    position: relative;
                    cursor: pointer;
  }
                    .asset-row:hover {
                      background: linear-gradient(90deg, rgba(34,211,238,0.07), transparent);
  }
                    .asset-row::before {
                      content: '';
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 2px;
                    background: var(--cyan-bright);
                    transform: scaleY(0);
                    transform-origin: top;
                    transition: transform 0.25s;
  }
                    .asset-row:hover::before {transform: scaleY(1); }

                    .asset-tooltip {
                      opacity: 0;
                    transform: translateY(6px);
                    transition: all 0.25s;
                    pointer-events: none;
  }
                    .asset-row:hover .asset-tooltip {
                      opacity: 1;
                    transform: translateY(0);
  }

                    /* ===== Tilt cards ===== */
                    .tilt-card {
                      transition: transform 0.18s ease-out, box-shadow 0.3s;
                    transform-style: preserve-3d;
                    will-change: transform;
  }
                    .tilt-card .tilt-layer-1 {transform: translateZ(30px); }
                    .tilt-card .tilt-layer-2 {transform: translateZ(50px); }
                    .tilt-card .tilt-layer-3 {transform: translateZ(70px); }

                    /* ===== Sparkline ===== */
                    .sparkline path.line {
                      stroke - dasharray: 600;
                    stroke-dashoffset: 600;
                    transition: stroke-dashoffset 0.9s cubic-bezier(0.2,0.8,0.2,1);
  }
                    .sparkline.in-view path.line {stroke - dashoffset: 0; }
                    .sparkline path.area {
                      opacity: 0;
                    transition: opacity 0.6s 0.5s;
  }
                    .sparkline.in-view path.area {opacity: 1; }

                    /* ===== Pulse dot ===== */
                    .pulse-dot {
                      width: 8px; height: 8px;
                    background: var(--emerald-bright);
                    border-radius: 50%;
                    position: relative;
                    box-shadow: 0 0 12px rgba(0,232,168,0.6);
  }
                    .pulse-dot::after {
                      content: '';
                    position: absolute;
                    inset: -5px;
                    border-radius: 50%;
                    border: 1px solid var(--emerald-bright);
                    animation: pulse 2.2s ease-out infinite;
  }
                    @keyframes pulse {
                      0 % { transform: scale(0.5); opacity: 1; }
    100% {transform: scale(2.4); opacity: 0; }
  }

                    /* ===== Gradient text ===== */
                    .gradient-text {
                      background: linear-gradient(120deg, var(--emerald-bright) 0%, var(--cyan-bright) 60%, var(--emerald-bright) 100%);
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: gradient-shift 8s ease-in-out infinite;
  }
                    @keyframes gradient-shift {
                      0 %, 100 % { background- position: 0% 50%; }
                    50% {background - position: 100% 50%; }
  }

                    /* ===== Float animation ===== */
                    @keyframes float-y {
                      0 %, 100 % { transform: translateY(0); }
    50% {transform: translateY(-10px); }
  }
                    .float-1 {animation: float-y 7s ease-in-out infinite; }
                    .float-2 {animation: float-y 9s ease-in-out infinite 1s; }
                    .float-3 {animation: float-y 8s ease-in-out infinite 2s; }

                    /* ===== Reveal ===== */
                    .reveal {
                      opacity: 0;
                    transform: translateY(28px);
                    transition: opacity 0.9s cubic-bezier(0.2,0.8,0.2,1), transform 0.9s cubic-bezier(0.2,0.8,0.2,1);
  }
                    .reveal.in-view {
                      opacity: 1;
                    transform: translateY(0);
  }

                    /* ===== Scan line ===== */
                    .scan-line {
                      position: absolute;
                    left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--cyan-bright) 50%, transparent);
                    opacity: 0.5;
                    animation: scan 5s linear infinite;
                    pointer-events: none;
  }
                    @keyframes scan {
                      0 % { top: 0 %; opacity: 0; }
    10% {opacity: 0.6; }
                    90% {opacity: 0.6; }
                    100% {top: 100%; opacity: 0; }
  }

                    /* ===== Parallax ===== */
                    .parallax-layer {
                      will - change: transform;
  }

                    /* ===== Section light ===== */
                    .section-light {
                      background: #f7f9fc;
                    color: var(--ink);
  }
                    .section-light h2,
                    .section-light h3 {color: var(--ink); }
                    .section-light p {color: #4a5568; }

                    /* ===== Custom checkbox ===== */
                    .check-custom {
                      width: 22px; height: 22px;
                    border: 1.5px solid var(--line-strong);
                    border-radius: 6px;
                    background: rgba(255,255,255,0.02);
                    transition: all 0.2s;
                    position: relative;
                    cursor: pointer;
                    flex-shrink: 0;
  }
                    .check-custom.checked {
                      background: var(--emerald);
                    border-color: var(--emerald);
  }
                    .check-custom.checked::after {
                      content: '';
                    position: absolute;
                    left: 7px; top: 3px;
                    width: 6px; height: 11px;
                    border: solid var(--navy-900);
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
  }

                    /* ===== Input ===== */
                    .input-styled {
                      background: rgba(255,255,255,0.04);
                    border: 1px solid var(--line-strong);
                    border-radius: 12px;
                    transition: all 0.2s;
  }
                    .input-styled:focus {
                      outline: none;
                    border-color: var(--cyan);
                    background: rgba(34,211,238,0.05);
                    box-shadow: 0 0 0 4px rgba(34,211,238,0.1);
  }
                    .input-light {
                      background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.2s;
  }
                    .input-light:focus {
                      outline: none;
                    border-color: var(--cyan);
                    box-shadow: 0 0 0 4px rgba(34,211,238,0.12);
  }

                    /* ===== Scrollbar ===== */
                    ::-webkit-scrollbar {width: 10px; height: 10px; }
                    ::-webkit-scrollbar-track {background: var(--navy-900); }
                    ::-webkit-scrollbar-thumb {background: var(--navy-600); border-radius: 5px; }
                    ::-webkit-scrollbar-thumb:hover {background: var(--navy-500); }

                    /* ===== Glow border on hover ===== */
                    .glow-border {
                      position: relative;
                    transition: transform 0.3s;
  }
                    .glow-border::before {
                      content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: inherit;
                    padding: 1px;
                    background: linear-gradient(135deg, transparent, var(--cyan), transparent);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.3s;
  }
                    .glow-border:hover::before {opacity: 1; }
                    .glow-border:hover {transform: translateY(-4px); }

                    /* ===== Allocation bar ===== */
                    .alloc-bar {
                      height: 6px;
                    border-radius: 3px;
                    background: rgba(255,255,255,0.06);
                    overflow: hidden;
                    display: flex;
  }
  .alloc-bar > div {transition: width 0.8s cubic-bezier(0.2,0.8,0.2,1); }

                    /* ===== Toast ===== */
                    .toast {
                      position: fixed;
                    bottom: 32px;
                    right: 32px;
                    z-index: 100;
                    transform: translateY(120%);
                    transition: transform 0.4s cubic-bezier(0.2,0.8,0.2,1);
  }
                    .toast.show {transform: translateY(0); }

                    /* ===== Tab ===== */
                    .tab-btn {
                      position: relative;
                    transition: color 0.2s;
  }
                    .tab-btn.active {color: var(--white); }
                    .tab-btn::after {
                      content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 2px;
                    background: var(--cyan-bright);
                    transform: scaleX(0);
                    transition: transform 0.25s;
  }
                    .tab-btn.active::after {transform: scaleX(1); }

                    /* ===== Step indicator ===== */
                    .step-dot {
                      width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 600;
                    transition: all 0.3s;
  }
                    .step-dot.active {
                      background: linear-gradient(135deg, var(--emerald), var(--cyan));
                    color: var(--navy-900);
                    box-shadow: 0 0 24px rgba(0,232,168,0.4);
  }
                    .step-dot.done {
                      background: var(--emerald-dim);
                    color: var(--emerald-bright);
                    border: 1px solid var(--emerald);
  }
                    .step-dot.pending {
                      background: rgba(255,255,255,0.04);
                    color: var(--muted-2);
                    border: 1px solid var(--line);
  }

                    /* ===== Hero chart canvas ===== */
                    #heroChart {
                      width: 100%;
                    height: 100%;
                    display: block;
  }

                    /* ===== Trust logo style ===== */
                    .trust-logo {
                      font - family: 'Space Grotesk', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--muted-2);
                    transition: color 0.3s;
                    opacity: 0.55;
  }
                    .trust-logo:hover {color: var(--cyan-bright); opacity: 1; }

                    @media (max-width: 768px) {
    .hide - mobile {display: none; }
  }
                  </style>
                </head>
                <body>

                  <!-- ===== TOP LIVE TICKER ===== -->
                  <div class="relative z-50 bg-[var(--navy-850)] border-b border-[var(--line)] overflow-hidden">
                    <div class="flex items-center">
                      <div class="flex items-center gap-2 px-4 py-2.5 border-r border-[var(--line)] bg-[var(--navy-800)] shrink-0 z-10">
                        <span class="pulse-dot"></span>
                        <span class="text-[11px] font-semibold tracking-[0.15em] text-white/90 font-mono">LIVE</span>
                      </div>
                      <div class="overflow-hidden flex-1 py-2">
                        <div class="ticker-track" id="tickerTrack">
                          <!-- ticker items injected by JS -->
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ===== NAVIGATION ===== -->
                  <nav class="sticky top-0 z-40 bg-[var(--navy-900)]/85 backdrop-blur-xl border-b border-[var(--line)]">
                    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                      <a href="#" class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" class="w-5 h-5 text-[var(--navy-900)]" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M3 17l6-6 4 4 8-8" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M14 7h7v7" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </div>
                        <span class="font-display text-2xl font-bold tracking-tight">Vestra</span>
                      </a>
                      <div class="hidden lg:flex items-center gap-9 text-sm font-medium">
                        <a href="#markets" class="text-white/70 hover:text-white transition">Mercados</a>
                        <a href="#copy" class="text-white/70 hover:text-white transition">CopyTrading</a>
                        <a href="#investors" class="text-white/70 hover:text-white transition">Inversores</a>
                        <a href="#security" class="text-white/70 hover:text-white transition">Seguridad</a>
                        <a href="#learn" class="text-white/70 hover:text-white transition">Academia</a>
                      </div>
                      <div class="flex items-center gap-3">
                        <button class="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition">Iniciar sesión</button>
                        <button class="btn-primary px-5 py-2.5 rounded-lg text-sm" onclick="showToast('Bienvenido a Vestra. Creando tu cuenta demo...')">Crea tu cuenta</button>
                      </div>
                    </div>
                  </nav>

                  <!-- ===== HERO ===== -->
                  <section class="relative min-h-[92vh] bg-[var(--navy-900)] overflow-hidden">
                    <!-- background layers -->
                    <div class="absolute inset-0 grid-bg opacity-60"></div>
                    <div class="absolute inset-0 diagonal-lines opacity-50"></div>

                    <!-- candlestick chart canvas (parallax) -->
                    <div class="absolute inset-0 parallax-layer" data-speed="0.15" id="heroBg">
                      <canvas id="heroChart"></canvas>
                    </div>

                    <!-- gradient overlays -->
                    <div class="absolute inset-0 bg-gradient-to-b from-[var(--navy-900)]/30 via-transparent to-[var(--navy-900)]"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-[var(--navy-900)] via-[var(--navy-900)]/70 to-transparent"></div>

                    <!-- scan line -->
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                      <div class="scan-line"></div>
                    </div>

                    <div class="relative max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-24">
                      <div class="grid lg:grid-cols-12 gap-12 items-center">
                        <!-- LEFT: copy -->
                        <div class="lg:col-span-7 parallax-layer" data-speed="-0.08">
                          <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[var(--emerald)]/30 bg-[var(--emerald-dim)] mb-8">
                            <span class="pulse-dot"></span>
                            <span class="text-xs font-semibold text-[var(--emerald-bright)] font-mono tracking-wide">182.450 inversores activos ahora mismo</span>
                          </div>
                          <h1 class="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[0.95] mb-7">
                            Invierte como<br>un experto,<br>
                              <span class="gradient-text">rodeado de expertos.</span>
                            </h1>
                              <p class="text-lg lg:text-xl text-white/65 max-w-xl mb-10 leading-relaxed">
                                Métricas verificadas, comisiones que se ven y una comunidad real compartiendo cada operación en tiempo real. Adiós al caos. Hola a la claridad.
                              </p>
                              <div class="flex flex-col sm:flex-row gap-4 mb-12">
                                <button class="btn-primary px-8 py-4 rounded-xl text-base flex items-center justify-center gap-2" onclick="document.getElementById('signup').scrollIntoView({behavior:'smooth'})">
                                  <span>Crea tu cuenta gratis</span>
                                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                </button>
                                <button class="btn-ghost px-8 py-4 rounded-xl text-base font-medium text-white/90 flex items-center justify-center gap-2" onclick="showToast('Reproduciendo demo de la plataforma...')">
                                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                  <span>Ver demo en vivo</span>
                                </button>
                              </div>
                              <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/55">
                                <div class="flex items-center gap-2">
                                  <svg class="w-4 h-4 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  <span>Regulado por CNMV</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <svg class="w-4 h-4 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                  <span>Fondos protegidos hasta €500K</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <svg class="w-4 h-4 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  <span>Sin comisiones ocultas</span>
                                </div>
                              </div>
                            </div>

                            <!-- RIGHT: floating dashboard cards -->
                            <div class="lg:col-span-5 relative h-[560px] hidden lg:block">
                              <!-- Main portfolio card -->
                              <div class="glass-strong p-6 absolute top-0 right-0 w-[340px] float-1">
                                <div class="flex items-center justify-between mb-4">
                                  <div>
                                    <div class="text-[11px] text-white/50 font-mono tracking-widest mb-1">MI PORTAFOLIO</div>
                                    <div class="font-mono text-3xl font-bold">€45.238,92</div>
                                  </div>
                                  <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--emerald-dim)]">
                                    <svg class="w-3 h-3 text-[var(--emerald-bright)]" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z" /></svg>
                                    <span class="text-xs font-mono font-semibold text-[var(--emerald-bright)]">+2.81%</span>
                                  </div>
                                </div>
                                <div class="flex items-baseline gap-2 mb-5">
                                  <span class="font-mono text-sm text-[var(--emerald-bright)]">+€1.234,56</span>
                                  <span class="text-xs text-white/40">hoy</span>
                                </div>
                                <!-- mini chart -->
                                <svg viewBox="0 0 280 80" class="w-full h-20 mb-5 sparkline in-view" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                                      <stop offset="0%" stop-color="#00e8a8" stop-opacity="0.4" />
                                      <stop offset="100%" stop-color="#00e8a8" stop-opacity="0" />
                                    </linearGradient>
                                  </defs>
                                  <path class="area" d="M0,60 L20,55 L40,58 L60,45 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,25 L220,18 L240,15 L260,10 L280,8 L280,80 L0,80 Z" fill="url(#g1)" />
                                  <path class="line" d="M0,60 L20,55 L40,58 L60,45 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,25 L220,18 L240,15 L260,10 L280,8" fill="none" stroke="#00e8a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                                  <div>
                                    <div class="text-[10px] text-white/40 font-mono mb-1">ACCIONES</div>
                                    <div class="text-sm font-mono font-semibold">62%</div>
                                  </div>
                                  <div>
                                    <div class="text-[10px] text-white/40 font-mono mb-1">CRYPTO</div>
                                    <div class="text-sm font-mono font-semibold">23%</div>
                                  </div>
                                  <div>
                                    <div class="text-[10px] text-white/40 font-mono mb-1">ETFs</div>
                                    <div class="text-sm font-mono font-semibold">15%</div>
                                  </div>
                                </div>
                              </div>

                              <!-- Top investor card -->
                              <div class="glass p-4 absolute top-[280px] left-0 w-[260px] float-2">
                                <div class="flex items-center gap-3 mb-3">
                                  <img src="https://picsum.photos/seed/investor1/80/80.jpg" class="w-10 h-10 rounded-full ring-2 ring-[var(--emerald)]/40" alt="">
                                    <div class="flex-1">
                                      <div class="text-sm font-semibold">Elena Márquez</div>
                                      <div class="text-[11px] text-white/50 font-mono">@elena_inv · Riesgo Medio</div>
                                    </div>
                                </div>
                                <div class="flex items-end justify-between mb-3">
                                  <div>
                                    <div class="text-[10px] text-white/40 font-mono">ROI 12M</div>
                                    <div class="font-mono text-xl font-bold text-[var(--emerald-bright)]">+147.3%</div>
                                  </div>
                                  <div class="text-right">
                                    <div class="text-[10px] text-white/40 font-mono">Copiadores</div>
                                    <div class="font-mono text-sm font-semibold">8.234</div>
                                  </div>
                                </div>
                                <button class="btn-primary ripple-btn w-full py-2 rounded-lg text-xs font-semibold" onclick="showToast('Ahora estás copiando a Elena Márquez')">Copiar trader</button>
                              </div>

                              <!-- Live trade notification -->
                              <div class="glass p-3.5 absolute top-[120px] right-[260px] w-[220px] float-3">
                                <div class="flex items-center gap-2 mb-2">
                                  <div class="w-2 h-2 rounded-full bg-[var(--cyan-bright)] animate-pulse"></div>
                                  <span class="text-[10px] text-white/50 font-mono tracking-wider">NUEVA OPERACIÓN</span>
                                </div>
                                <div class="text-sm font-semibold mb-1">Carlos Vidal compró</div>
                                <div class="flex items-center justify-between">
                                  <span class="font-mono text-lg font-bold">AAPL</span>
                                  <span class="font-mono text-sm text-white/70">× 25 acciones</span>
                                </div>
                                <div class="text-[11px] text-white/40 mt-1 font-mono">@ $178.45 · hace 3s</div>
                              </div>

                              <!-- Sparkline badge -->
                              <div class="glass p-3 absolute bottom-0 right-[100px] w-[180px] float-2">
                                <div class="flex items-center justify-between mb-2">
                                  <span class="text-[10px] text-white/50 font-mono tracking-wider">BTC/USD</span>
                                  <span class="text-[10px] font-mono text-[var(--emerald-bright)]">+2.45%</span>
                                </div>
                                <svg viewBox="0 0 160 40" class="w-full h-10 sparkline in-view" preserveAspectRatio="none">
                                  <path class="line" d="M0,30 L16,28 L32,32 L48,22 L64,25 L80,18 L96,20 L112,12 L128,15 L144,8 L160,5" fill="none" stroke="#22d3ee" stroke-width="1.5" />
                                </svg>
                                <div class="font-mono text-sm font-bold mt-1">$67.234</div>
                              </div>
                            </div>
                        </div>
                      </div>

                      <!-- scroll indicator -->
                      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs">
                        <span class="font-mono tracking-widest">DESLIZA</span>
                        <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </div>
                  </section>

                  <!-- ===== STATS STRIP ===== -->
                  <section class="relative bg-[var(--navy-850)] border-y border-[var(--line)] py-10">
                    <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
                      <div class="reveal">
                        <div class="font-mono text-4xl font-bold gradient-text mb-1">€2.4B+</div>
                        <div class="text-sm text-white/50">Volumen mensual negociado</div>
                      </div>
                      <div class="reveal">
                        <div class="font-mono text-4xl font-bold gradient-text mb-1">182K</div>
                        <div class="text-sm text-white/50">Inversores activos</div>
                      </div>
                      <div class="reveal">
                        <div class="font-mono text-4xl font-bold gradient-text mb-1">4.8/5</div>
                        <div class="text-sm text-white/50">Valoración en App Store</div>
                      </div>
                      <div class="reveal">
                        <div class="font-mono text-4xl font-bold gradient-text mb-1">99.98%</div>
                        <div class="text-sm text-white/50">Uptime de plataforma</div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== FEATURED ASSETS ===== -->
                  <section id="markets" class="relative py-24 bg-[var(--navy-900)] overflow-hidden">
                    <div class="absolute inset-0 diagonal-lines opacity-30"></div>
                    <div class="relative max-w-7xl mx-auto px-6">
                      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 reveal">
                        <div>
                          <div class="text-xs font-mono tracking-[0.2em] text-[var(--cyan-bright)] mb-3">// MERCADOS EN TIEMPO REAL</div>
                          <h2 class="font-display text-4xl lg:text-5xl font-bold leading-tight mb-3">Todos los activos,<br>una sola pantalla.</h2>
                          <p class="text-white/55 max-w-xl">Acciones, criptomonedas, ETFs y materias primas con datos verificados en tiempo real. Sin saltar entre apps.</p>
                        </div>
                        <!-- tabs -->
                        <div class="flex items-center gap-1 border-b border-[var(--line)] overflow-x-auto">
                          <button class="tab-btn active px-5 py-3 text-sm font-medium text-white/60 whitespace-nowrap" data-tab="stocks">Acciones</button>
                          <button class="tab-btn px-5 py-3 text-sm font-medium text-white/60 whitespace-nowrap" data-tab="crypto">Criptomonedas</button>
                          <button class="tab-btn px-5 py-3 text-sm font-medium text-white/60 whitespace-nowrap" data-tab="etf">ETFs</button>
                          <button class="tab-btn px-5 py-3 text-sm font-medium text-white/60 whitespace-nowrap" data-tab="commodities">Materias primas</button>
                        </div>
                      </div>

                      <!-- Asset grid -->
                      <div class="glass-strong overflow-hidden reveal">
                        <!-- header row -->
                        <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--line)] text-[11px] font-mono tracking-wider text-white/40">
                          <div class="col-span-3">ACTIVO</div>
                          <div class="col-span-2 text-right">PRECIO</div>
                          <div class="col-span-2 text-right">24H</div>
                          <div class="col-span-3">TENDENCIA 7D</div>
                          <div class="col-span-2 text-right">ACCIÓN</div>
                        </div>
                        <div id="assetList">
                          <!-- asset rows injected by JS -->
                        </div>
                      </div>

                      <div class="mt-6 flex items-center justify-between text-sm">
                        <div class="text-white/40 font-mono text-xs">// Datos en vivo · Última actualización: <span id="updateTime">--:--:--</span></div>
                        <button class="text-[var(--cyan-bright)] hover:underline font-medium flex items-center gap-1.5" onclick="showToast('Cargando los 4.500+ activos disponibles...')">
                          Ver los 4.500+ activos
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </button>
                      </div>
                    </div>
                  </section>

                  <!-- ===== COPYTRADING FEATURE ===== -->
                  <section id="copy" class="relative py-32 bg-[var(--navy-850)] overflow-hidden">
                    <div class="absolute inset-0 grid-bg opacity-40"></div>
                    <div class="absolute top-0 left-1/4 w-96 h-96 bg-[var(--emerald)] rounded-full filter blur-[140px] opacity-15"></div>
                    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--cyan)] rounded-full filter blur-[140px] opacity-15"></div>

                    <div class="relative max-w-7xl mx-auto px-6">
                      <div class="grid lg:grid-cols-2 gap-16 items-center">
                        <div class="reveal">
                          <div class="text-xs font-mono tracking-[0.2em] text-[var(--emerald-bright)] mb-3">// COPYTRADING</div>
                          <h2 class="font-display text-4xl lg:text-6xl font-bold leading-[1.05] mb-6">
                            Copia cada movimiento.<br>
                              <span class="gradient-text">Aprende cada decisión.</span>
                          </h2>
                          <p class="text-lg text-white/60 mb-10 leading-relaxed">
                            Elige inversores verificados con historial auditable. Cada operación que ellos abren, se replica en tu portafolio automáticamente. Tú decides cuánto invertir y cuándo parar.
                          </p>

                          <div class="space-y-5 mb-10">
                            <div class="flex gap-4">
                              <div class="w-10 h-10 rounded-lg bg-[var(--emerald-dim)] border border-[var(--emerald)]/30 flex items-center justify-center shrink-0">
                                <svg class="w-5 h-5 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                <div class="font-semibold mb-1">Historial 100% verificable</div>
                                <div class="text-sm text-white/55">Sin curvas manipuladas. Cada operación tiene timestamp y precio de ejecución público.</div>
                              </div>
                            </div>
                            <div class="flex gap-4">
                              <div class="w-10 h-10 rounded-lg bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 flex items-center justify-center shrink-0">
                                <svg class="w-5 h-5 text-[var(--cyan-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              </div>
                              <div>
                                <div class="font-semibold mb-1">Replicación en &lt;200ms</div>
                                <div class="text-sm text-white/55">La operación se ejecuta en tu cuenta instantáneamente, al mismo precio que el trader original.</div>
                              </div>
                            </div>
                            <div class="flex gap-4">
                              <div class="w-10 h-10 rounded-lg bg-[var(--emerald-dim)] border border-[var(--emerald)]/30 flex items-center justify-center shrink-0">
                                <svg class="w-5 h-5 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                              </div>
                              <div>
                                <div class="font-semibold mb-1">Control total del riesgo</div>
                                <div class="text-sm text-white/55">Define stop-loss, límite por operación y retira tus fondos cuando quieras. Sin permanencias.</div>
                              </div>
                            </div>
                          </div>

                          <button class="btn-primary px-7 py-3.5 rounded-xl text-sm flex items-center gap-2" onclick="document.getElementById('investors').scrollIntoView({behavior:'smooth'})">
                            Explorar traders destacados
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                          </button>
                        </div>

                        <!-- Visualization -->
                        <div class="relative h-[600px] reveal">
                          <!-- center: you -->
                          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div class="glass-strong p-5 w-[200px] text-center">
                              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center font-display text-2xl font-bold text-[var(--navy-900)]">TÚ</div>
                              <div class="text-sm font-semibold mb-1">Tu portafolio</div>
                              <div class="font-mono text-xs text-white/50">Replicando 4 traders</div>
                              <div class="font-mono text-lg font-bold text-[var(--emerald-bright)] mt-2">+24.7%</div>
                            </div>
                          </div>

                          <!-- 4 surrounding trader cards with connection lines -->
                          <svg class="absolute inset-0 w-full h-full" style="z-index: 1;">
                            <defs>
                              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#00e8a8" stop-opacity="0.7" />
                                <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.2" />
                              </linearGradient>
                            </defs>
                            <line x1="50%" y1="50%" x2="20%" y2="15%" stroke="url(#line-grad)" stroke-width="1.5" stroke-dasharray="4 4">
                              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
                            </line>
                            <line x1="50%" y1="50%" x2="80%" y2="15%" stroke="url(#line-grad)" stroke-width="1.5" stroke-dasharray="4 4">
                              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.2s" repeatCount="indefinite" />
                            </line>
                            <line x1="50%" y1="50%" x2="20%" y2="85%" stroke="url(#line-grad)" stroke-width="1.5" stroke-dasharray="4 4">
                              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.4s" repeatCount="indefinite" />
                            </line>
                            <line x1="50%" y1="50%" x2="80%" y2="85%" stroke="url(#line-grad)" stroke-width="1.5" stroke-dasharray="4 4">
                              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.1s" repeatCount="indefinite" />
                            </line>
                          </svg>

                          <!-- trader cards -->
                          <div class="absolute top-[5%] left-[5%] glass p-3 w-[150px] float-1">
                            <div class="flex items-center gap-2 mb-2">
                              <img src="https://picsum.photos/seed/trader2/60/60.jpg" class="w-8 h-8 rounded-full" alt="">
                                <div class="text-xs font-semibold">Carlos V.</div>
                            </div>
                            <div class="font-mono text-sm font-bold text-[var(--emerald-bright)]">+98.6%</div>
                            <div class="text-[10px] text-white/40 font-mono">12.4K copiadores</div>
                          </div>

                          <div class="absolute top-[5%] right-[5%] glass p-3 w-[150px] float-2">
                            <div class="flex items-center gap-2 mb-2">
                              <img src="https://picsum.photos/seed/trader3/60/60.jpg" class="w-8 h-8 rounded-full" alt="">
                                <div class="text-xs font-semibold">Aiko T.</div>
                            </div>
                            <div class="font-mono text-sm font-bold text-[var(--emerald-bright)]">+215.8%</div>
                            <div class="text-[10px] text-white/40 font-mono">4.5K copiadores</div>
                          </div>

                          <div class="absolute bottom-[5%] left-[5%] glass p-3 w-[150px] float-3">
                            <div class="flex items-center gap-2 mb-2">
                              <img src="https://picsum.photos/seed/trader4/60/60.jpg" class="w-8 h-8 rounded-full" alt="">
                                <div class="text-xs font-semibold">Marcus R.</div>
                            </div>
                            <div class="font-mono text-sm font-bold text-[var(--emerald-bright)]">+82.4%</div>
                            <div class="text-[10px] text-white/40 font-mono">6.7K copiadores</div>
                          </div>

                          <div class="absolute bottom-[5%] right-[5%] glass p-3 w-[150px] float-1">
                            <div class="flex items-center gap-2 mb-2">
                              <img src="https://picsum.photos/seed/trader5/60/60.jpg" class="w-8 h-8 rounded-full" alt="">
                                <div class="text-xs font-semibold">Sofia A.</div>
                            </div>
                            <div class="font-mono text-sm font-bold text-[var(--emerald-bright)]">+124.7%</div>
                            <div class="text-[10px] text-white/40 font-mono">9.1K copiadores</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== POPULAR INVESTORS ===== -->
                  <section id="investors" class="relative py-24 bg-[var(--navy-900)] overflow-hidden">
                    <div class="absolute inset-0 diagonal-lines opacity-30"></div>
                    <div class="relative max-w-7xl mx-auto px-6">
                      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 reveal">
                        <div>
                          <div class="text-xs font-mono tracking-[0.2em] text-[var(--cyan-bright)] mb-3">// TOP TRADERS VERIFICADOS</div>
                          <h2 class="font-display text-4xl lg:text-5xl font-bold leading-tight mb-3">Los mejores, de frente.</h2>
                          <p class="text-white/55 max-w-xl">Sin filtros de marketing. Solo inversores con historial auditado de más de 12 meses y drawdown controlado.</p>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-white/60">
                          <svg class="w-4 h-4 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>Métricas verificadas por auditores independientes</span>
                        </div>
                      </div>

                      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="investorGrid">
                        <!-- investor cards injected by JS -->
                      </div>

                      <div class="mt-10 text-center reveal">
                        <button class="btn-ghost px-7 py-3 rounded-xl text-sm font-medium" onclick="showToast('Cargando 248 traders verificados...')">Ver los 248 traders completos</button>
                      </div>
                    </div>
                  </section>

                  <!-- ===== SECURITY (LIGHT SECTION) ===== -->
                  <section id="security" class="relative section-light py-28 overflow-hidden">
                    <div class="absolute inset-0" style="background-image: linear-gradient(rgba(15,31,56,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,31,56,0.04) 1px, transparent 1px); background-size: 48px 48px;"></div>

                    <div class="relative max-w-7xl mx-auto px-6">
                      <div class="grid lg:grid-cols-2 gap-16 items-start mb-16">
                        <div class="reveal">
                          <div class="text-xs font-mono tracking-[0.2em] text-[var(--cyan)] mb-3">// SEGURIDAD Y REGULACIÓN</div>
                          <h2 class="font-display text-4xl lg:text-6xl font-bold leading-[1.05] mb-6" style="color: var(--ink);">
                            Tu dinero,<br>
                              <span style="background: linear-gradient(120deg, var(--emerald) 0%, var(--cyan) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">protegido por ley.</span>
                          </h2>
                          <p class="text-lg leading-relaxed" style="color: #4a5568;">
                            Operamos bajo regulación europea MiFID II. Tus fondos están segregados en cuentas custodias de Barclays y separados del balance de Vestra. Si algo nos pasara, tu dinero sigue siendo tuyo.
                          </p>
                        </div>

                        <div class="grid grid-cols-2 gap-4 reveal">
                          <div class="p-6 bg-white rounded-2xl border border-gray-200">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style="background: rgba(0,200,150,0.1);">
                              <svg class="w-5 h-5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div class="font-display font-bold text-2xl mb-1" style="color: var(--ink);">€500K</div>
                            <div class="text-sm" style="color: #4a5568;">Fondo de compensación al cliente</div>
                          </div>
                          <div class="p-6 bg-white rounded-2xl border border-gray-200">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style="background: rgba(34,211,238,0.1);">
                              <svg class="w-5 h-5" style="color: var(--cyan);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div class="font-display font-bold text-2xl mb-1" style="color: var(--ink);">256-bit</div>
                            <div class="text-sm" style="color: #4a5568;">Cifrado AES nivel bancario</div>
                          </div>
                          <div class="p-6 bg-white rounded-2xl border border-gray-200">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style="background: rgba(0,200,150,0.1);">
                              <svg class="w-5 h-5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div class="font-display font-bold text-2xl mb-1" style="color: var(--ink);">100%</div>
                            <div class="text-sm" style="color: #4a5568;">Fondos en cuentas segregadas</div>
                          </div>
                          <div class="p-6 bg-white rounded-2xl border border-gray-200">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style="background: rgba(34,211,238,0.1);">
                              <svg class="w-5 h-5" style="color: var(--cyan);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div class="font-display font-bold text-2xl mb-1" style="color: var(--ink);">7/24</div>
                            <div class="text-sm" style="color: #4a5568;">Monitoreo antifraude en vivo</div>
                          </div>
                        </div>
                      </div>

                      <!-- Regulator logos -->
                      <div class="pt-12 border-t border-gray-200 reveal">
                        <div class="text-center mb-8">
                          <div class="text-xs font-mono tracking-[0.2em] mb-2" style="color: #94a3b8;">REGULADO Y AUDITADO POR</div>
                        </div>
                        <div class="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
                          <div class="trust-logo text-2xl" style="color: #475569;">CNMV</div>
                          <div class="trust-logo text-2xl" style="color: #475569;">FCA</div>
                          <div class="trust-logo text-2xl" style="color: #475569;">BaFin</div>
                          <div class="trust-logo text-2xl" style="color: #475569;">AMF</div>
                          <div class="trust-logo text-2xl" style="color: #475569;">CySEC</div>
                          <div class="trust-logo text-xl" style="color: #475569;">MiFID II</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== WELCOME OFFER ===== -->
                  <section id="signup" class="relative section-light py-24 overflow-hidden" style="background: #f7f9fc;">
                    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-30"></div>

                    <div class="relative max-w-6xl mx-auto px-6">
                      <div class="grid lg:grid-cols-2 gap-12 items-center">
                        <!-- LEFT: offer -->
                        <div class="reveal">
                          <div class="text-xs font-mono tracking-[0.2em] mb-3" style="color: var(--cyan);">// OFERTA DE BIENVENIDA</div>
                          <h2 class="font-display text-4xl lg:text-6xl font-bold leading-[1.05] mb-6" style="color: var(--ink);">
                            Empieza con<br>
                              <span style="background: linear-gradient(120deg, var(--emerald) 0%, var(--cyan) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">$100.000 virtuales.</span>
                          </h2>
                          <p class="text-lg leading-relaxed mb-8" style="color: #4a5568;">
                            Crea tu cuenta demo en 90 segundos. Practica con dinero virtual, copia traders reales y, cuando estés listo, pasa a una cuenta real sin perder tu configuración.
                          </p>

                          <div class="space-y-4 mb-8">
                            <div class="flex items-center gap-3">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: var(--emerald);">
                                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span style="color: #1a2942;">Cuenta demo con $100.000 virtuales</span>
                            </div>
                            <div class="flex items-center gap-3">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: var(--emerald);">
                                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span style="color: #1a2942;">Acceso a 4.500+ activos globales</span>
                            </div>
                            <div class="flex items-center gap-3">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: var(--emerald);">
                                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span style="color: #1a2942;">CopyTrading ilimitado sin comisiones</span>
                            </div>
                            <div class="flex items-center gap-3">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: var(--emerald);">
                                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span style="color: #1a2942;">Academia Vestra con 200+ lecciones</span>
                            </div>
                          </div>

                          <div class="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background: rgba(0,200,150,0.12);">
                              <svg class="w-5 h-5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                              <div class="font-semibold text-sm" style="color: var(--ink);">Promoción por tiempo limitado</div>
                              <div class="text-xs" style="color: #64748b;">$20 de bonus al hacer tu primer depósito de €100</div>
                            </div>
                          </div>
                        </div>

                        <!-- RIGHT: 2-step form -->
                        <div class="reveal">
                          <div class="rounded-3xl p-8 shadow-2xl" style="background: linear-gradient(160deg, #0a1628 0%, #0f1f38 100%); border: 1px solid rgba(34,211,238,0.15);">
                            <!-- step indicator -->
                            <div class="flex items-center justify-between mb-8">
                              <div class="flex items-center gap-3">
                                <div class="step-dot active" id="step1-dot">1</div>
                                <div class="w-10 h-px bg-white/15"></div>
                                <div class="step-dot pending" id="step2-dot">2</div>
                              </div>
                              <div class="text-xs font-mono text-white/40">PASO <span id="stepNum">1</span> DE 2</div>
                            </div>

                            <!-- step 1 -->
                            <div id="step1">
                              <h3 class="font-display text-2xl font-bold mb-2">Crea tu cuenta demo</h3>
                              <p class="text-sm text-white/55 mb-6">Sin verificación de identidad. Sin tarjeta de crédito.</p>

                              <div class="space-y-4">
                                <div>
                                  <label class="block text-xs font-mono tracking-wider text-white/50 mb-2">CORREO ELECTRÓNICO</label>
                                  <input type="email" placeholder="tu@correo.com" class="input-styled w-full px-4 py-3.5 text-white placeholder-white/30 text-sm font-mono" id="emailInput">
                                </div>
                                <div>
                                  <label class="block text-xs font-mono tracking-wider text-white/50 mb-2">PAÍS DE RESIDENCIA</label>
                                  <select class="input-styled styled w-full px-4 py-3.5 text-white text-sm font-mono appearance-none" id="countrySelect">
                                    <option style="background: #0a1628;">España</option>
                                    <option style="background: #0a1628;">México</option>
                                    <option style="background: #0a1628;">Argentina</option>
                                    <option style="background: #0a1628;">Colombia</option>
                                    <option style="background: #0a1628;">Chile</option>
                                    <option style="background: #0a1628;">Alemania</option>
                                    <option style="background: #0a1628;">Francia</option>
                                    <option style="background: #0a1628;">Italia</option>
                                  </select>
                                </div>
                                <div class="flex items-start gap-3 pt-2">
                                  <div class="check-custom checked" id="termsCheck" onclick="this.classList.toggle('checked')"></div>
                                  <label class="text-xs text-white/55 leading-relaxed cursor-pointer" onclick="document.getElementById('termsCheck').click()">Acepto los <a href="#" class="text-[var(--cyan-bright)] underline">Términos</a> y la <a href="#" class="text-[var(--cyan-bright)] underline">Política de Privacidad</a> de Vestra.</label>
                                </div>
                                <button class="btn-primary w-full py-4 rounded-xl text-sm font-semibold ripple-btn" onclick="goToStep2()">Continuar →</button>
                              </div>

                              <div class="mt-6 flex items-center justify-center gap-4 text-xs text-white/40">
                                <span>🔒 Conexión cifrada</span>
                                <span>·</span>
                                <span>✓ Sin spam</span>
                              </div>
                            </div>

                            <!-- step 2 (hidden initially) -->
                            <div id="step2" class="hidden">
                              <h3 class="font-display text-2xl font-bold mb-2">Personaliza tu experiencia</h3>
                              <p class="text-sm text-white/55 mb-6">Esto nos ayuda a mostrarte traders relevantes.</p>

                              <div class="space-y-4">
                                <div>
                                  <label class="block text-xs font-mono tracking-wider text-white/50 mb-2">NOMBRE</label>
                                  <input type="text" placeholder="Tu nombre" class="input-styled w-full px-4 py-3.5 text-white placeholder-white/30 text-sm">
                                </div>
                                <div>
                                  <label class="block text-xs font-mono tracking-wider text-white/50 mb-2">NIVEL DE EXPERIENCIA</label>
                                  <div class="grid grid-cols-3 gap-2">
                                    <button class="exp-btn active py-3 rounded-lg text-xs font-medium border border-[var(--cyan)] bg-[var(--cyan-dim)] text-white" data-exp="novato">Principiante</button>
                                    <button class="exp-btn py-3 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:border-white/30" data-exp="intermedio">Intermedio</button>
                                    <button class="exp-btn py-3 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:border-white/30" data-exp="avanzado">Avanzado</button>
                                  </div>
                                </div>
                                <div>
                                  <label class="block text-xs font-mono tracking-wider text-white/50 mb-2">PERFIL DE RIESGO</label>
                                  <div class="grid grid-cols-3 gap-2">
                                    <button class="risk-btn py-3 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:border-white/30" data-risk="bajo">Conservador</button>
                                    <button class="risk-btn active py-3 rounded-lg text-xs font-medium border border-[var(--cyan)] bg-[var(--cyan-dim)] text-white" data-risk="medio">Equilibrado</button>
                                    <button class="risk-btn py-3 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:border-white/30" data-risk="alto">Audaz</button>
                                  </div>
                                </div>
                                <button class="btn-primary w-full py-4 rounded-xl text-sm font-semibold ripple-btn mt-2" onclick="finishSignup()">Activar mi cuenta demo →</button>
                                <button class="w-full py-3 text-xs text-white/40 hover:text-white/70 transition" onclick="goToStep1()">← Volver al paso anterior</button>
                              </div>
                            </div>
                          </div>

                          <div class="flex items-center justify-center gap-6 mt-6 text-xs" style="color: #64748b;">
                            <span class="flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              90 segundos
                            </span>
                            <span class="flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              Sin tarjeta
                            </span>
                            <span class="flex items-center gap-1.5">
                              <svg class="w-3.5 h-3.5" style="color: var(--emerald);" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              Borrable en 1 clic
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ===== FOOTER ===== -->
                  <footer class="relative bg-[var(--navy-900)] pt-20 pb-10 border-t border-[var(--line)] overflow-hidden">
                    <div class="absolute inset-0 grid-bg opacity-30"></div>
                    <div class="relative max-w-7xl mx-auto px-6">
                      <div class="grid lg:grid-cols-5 gap-12 mb-16">
                        <div class="lg:col-span-2">
                          <div class="flex items-center gap-2.5 mb-6">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--emerald)] to-[var(--cyan)] flex items-center justify-center">
                              <svg viewBox="0 0 24 24" class="w-5 h-5 text-[var(--navy-900)]" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 17l6-6 4 4 8-8" stroke-linecap="round" stroke-linejoin="round" /><path d="M14 7h7v7" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </div>
                            <span class="font-display text-2xl font-bold tracking-tight">Vestra</span>
                          </div>
                          <p class="text-white/55 max-w-sm mb-6 leading-relaxed">La plataforma de inversión social donde la transparencia es la regla, no la excepción.</p>
                          <div class="flex gap-3">
                            <a href="#" class="w-10 h-10 rounded-lg border border-[var(--line-strong)] flex items-center justify-center text-white/60 hover:text-[var(--cyan-bright)] hover:border-[var(--cyan)]/40 transition">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" /></svg>
                            </a>
                            <a href="#" class="w-10 h-10 rounded-lg border border-[var(--line-strong)] flex items-center justify-center text-white/60 hover:text-[var(--cyan-bright)] hover:border-[var(--cyan)]/40 transition">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                            </a>
                            <a href="#" class="w-10 h-10 rounded-lg border border-[var(--line-strong)] flex items-center justify-center text-white/60 hover:text-[var(--cyan-bright)] hover:border-[var(--cyan)]/40 transition">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                            </a>
                          </div>
                        </div>
                        <div>
                          <div class="text-xs font-mono tracking-wider text-white/40 mb-4">PLATAFORMA</div>
                          <ul class="space-y-3 text-sm">
                            <li><a href="#" class="text-white/70 hover:text-white">Mercados</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">CopyTrading</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Academia</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Calculadora</a></li>
                          </ul>
                        </div>
                        <div>
                          <div class="text-xs font-mono tracking-wider text-white/40 mb-4">EMPRESA</div>
                          <ul class="space-y-3 text-sm">
                            <li><a href="#" class="text-white/70 hover:text-white">Sobre Vestra</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Regulación</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Carreras</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Prensa</a></li>
                          </ul>
                        </div>
                        <div>
                          <div class="text-xs font-mono tracking-wider text-white/40 mb-4">LEGAL</div>
                          <ul class="space-y-3 text-sm">
                            <li><a href="#" class="text-white/70 hover:text-white">Términos</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Privacidad</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Cookies</a></li>
                            <li><a href="#" class="text-white/70 hover:text-white">Avisos legales</a></li>
                          </ul>
                        </div>
                      </div>

                      <div class="pt-8 border-t border-[var(--line)] flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                        <div class="text-xs text-white/40 leading-relaxed max-w-3xl">
                          Vestra Capital S.L. — CIF B-12345678, registrada en la CNMV con número 3xxx. Invertir implica riesgo de pérdida. El rendimiento pasado no garantiza resultados futuros. Las operaciones de copy trading son ejecutadas automáticamente y pueden generar pérdidas.
                        </div>
                        <div class="text-xs font-mono text-white/40 whitespace-nowrap">© 2025 Vestra · v3.2.1</div>
                      </div>
                    </div>
                  </footer>

                  <!-- Toast -->
                  <div id="toast" class="toast glass-strong px-5 py-4 flex items-center gap-3 max-w-sm">
                    <div class="w-8 h-8 rounded-full bg-[var(--emerald-dim)] flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-[var(--emerald-bright)]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div class="text-sm font-medium" id="toastMsg">Listo.</div>
                  </div>

                  <script>
// ============ DATA ============
                    const tickerData = [
                    {sym: 'AAPL', price: 178.45, change: 1.24 },
                    {sym: 'TSLA', price: 245.67, change: -0.82 },
                    {sym: 'BTC', price: 67234.00, change: 2.45 },
                    {sym: 'ETH', price: 3456.78, change: 1.89 },
                    {sym: 'NVDA', price: 925.34, change: 3.12 },
                    {sym: 'MSFT', price: 412.78, change: 0.67 },
                    {sym: 'GOOGL', price: 156.89, change: -0.45 },
                    {sym: 'SP500', price: 5234.56, change: 0.45 },
                    {sym: 'XAU', price: 2156.78, change: -0.23 },
                    {sym: 'WTI', price: 78.45, change: 1.34 },
                    {sym: 'SOL', price: 178.45, change: 4.23 },
                    {sym: 'META', price: 489.23, change: 1.56 }
                    ];

                    const assetsData = {
                      stocks: [
                    {ticker: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 1.24, trend: 'up' },
                    {ticker: 'TSLA', name: 'Tesla Inc.', price: 245.67, change: -0.82, trend: 'down' },
                    {ticker: 'NVDA', name: 'NVIDIA Corp.', price: 925.34, change: 3.12, trend: 'up' },
                    {ticker: 'MSFT', name: 'Microsoft Corp.', price: 412.78, change: 0.67, trend: 'up' },
                    {ticker: 'GOOGL', name: 'Alphabet Inc.', price: 156.89, change: -0.45, trend: 'down' },
                    {ticker: 'META', name: 'Meta Platforms', price: 489.23, change: 1.56, trend: 'up' }
                    ],
                    crypto: [
                    {ticker: 'BTC', name: 'Bitcoin', price: 67234.00, change: 2.45, trend: 'up' },
                    {ticker: 'ETH', name: 'Ethereum', price: 3456.78, change: 1.89, trend: 'up' },
                    {ticker: 'SOL', name: 'Solana', price: 178.45, change: 4.23, trend: 'up' },
                    {ticker: 'BNB', name: 'BNB', price: 412.56, change: -1.23, trend: 'down' },
                    {ticker: 'XRP', name: 'Ripple', price: 0.6234, change: 0.89, trend: 'up' },
                    {ticker: 'ADA', name: 'Cardano', price: 0.567, change: -2.34, trend: 'down' }
                    ],
                    etf: [
                    {ticker: 'VOO', name: 'Vanguard S&P 500', price: 478.23, change: 0.45, trend: 'up' },
                    {ticker: 'QQQ', name: 'Invesco QQQ Trust', price: 456.78, change: 0.92, trend: 'up' },
                    {ticker: 'ARKK', name: 'ARK Innovation ETF', price: 48.23, change: -1.34, trend: 'down' },
                    {ticker: 'SPY', name: 'SPDR S&P 500', price: 523.45, change: 0.41, trend: 'up' },
                    {ticker: 'EEM', name: 'iShares MSCI Emerging', price: 41.67, change: -0.56, trend: 'down' },
                    {ticker: 'XLF', name: 'Financial Select Sector', price: 38.92, change: 0.78, trend: 'up' }
                    ],
                    commodities: [
                    {ticker: 'XAU', name: 'Oro', price: 2156.78, change: -0.23, trend: 'down' },
                    {ticker: 'WTI', name: 'Petróleo WTI', price: 78.45, change: 1.34, trend: 'up' },
                    {ticker: 'NG', name: 'Gas Natural', price: 2.34, change: 3.45, trend: 'up' },
                    {ticker: 'XAG', name: 'Plata', price: 24.56, change: -0.78, trend: 'down' },
                    {ticker: 'HG', name: 'Cobre', price: 3.89, change: 0.92, trend: 'up' },
                    {ticker: 'ZC', name: 'Maíz', price: 4.45, change: -1.12, trend: 'down' }
                    ]
};

                    const investorsData = [
                    {name: 'Elena Márquez', handle: '@elena_inv', img: 'investor1', roi: 147.3, risk: 'Medio', riskColor: 'cyan', copiers: 8234, trades: 312, winRate: 78, alloc: [{name:'Acciones', val: 62, color: '#00e8a8'}, {name:'Crypto', val: 23, color: '#22d3ee'}, {name:'ETFs', val: 15, color: '#00c896'}] },
                    {name: 'Carlos Vidal', handle: '@carlos_v', img: 'investor2', roi: 98.6, risk: 'Bajo', riskColor: 'emerald', copiers: 12456, trades: 248, winRate: 84, alloc: [{name:'ETFs', val: 70, color: '#00e8a8'}, {name:'Acciones', val: 30, color: '#22d3ee'}] },
                    {name: 'Aiko Tanaka', handle: '@aiko_t', img: 'investor3', roi: 215.8, risk: 'Alto', riskColor: 'coral', copiers: 4567, trades: 489, winRate: 71, alloc: [{name:'Crypto', val: 75, color: '#22d3ee'}, {name:'Acciones', val: 25, color: '#00e8a8'}] },
                    {name: 'Marcus Reid', handle: '@marcus_r', img: 'investor4', roi: 82.4, risk: 'Medio', riskColor: 'cyan', copiers: 6789, trades: 198, winRate: 81, alloc: [{name:'Acciones', val: 55, color: '#00e8a8'}, {name:'ETFs', val: 30, color: '#22d3ee'}, {name:'Materias', val: 15, color: '#00c896'}] },
                    {name: 'Sofia Andersson', handle: '@sofia_a', img: 'investor5', roi: 124.7, risk: 'Medio', riskColor: 'cyan', copiers: 9123, trades: 267, winRate: 76, alloc: [{name:'Acciones', val: 45, color: '#00e8a8'}, {name:'ETFs', val: 35, color: '#22d3ee'}, {name:'Crypto', val: 20, color: '#00c896'}] },
                    {name: 'Diego Fernández', handle: '@diego_f', img: 'investor6', roi: 167.2, risk: 'Alto', riskColor: 'coral', copiers: 5234, trades: 398, winRate: 73, alloc: [{name:'Crypto', val: 60, color: '#22d3ee'}, {name:'Acciones', val: 30, color: '#00e8a8'}, {name:'Materias', val: 10, color: '#00c896'}] }
                    ];

                    // ============ TICKER ============
                    function renderTicker() {
  const track = document.getElementById('tickerTrack');
  const items = tickerData.map(t => \`
                    <div class="ticker-item inline-flex items-center gap-2.5">
                      <span class="font-mono text-sm font-semibold text-white/90">\${t.sym}</span>
                      <span class="font-mono text-sm text-white/60 price">\${t.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span class="font-mono text-sm change \${t.change >= 0 ? 'text-[var(--emerald-bright)]' : 'text-[var(--coral-bright)]'}">\${t.change >= 0 ? '+' : ''}\${t.change.toFixed(2)}%</span>
                      <span class="text-white/15 mx-3">·</span>
                    </div>
                    \`).join('');
                    track.innerHTML = items + items; // duplicate for seamless loop
}
                    renderTicker();

// Simulate live updates
setInterval(() => {
                      document.querySelectorAll('.ticker-item').forEach(item => {
                        if (Math.random() > 0.65) {
                          const isUp = Math.random() > 0.5;
                          item.classList.remove('flash-up', 'flash-down');
                          void item.offsetWidth;
                          item.classList.add(isUp ? 'flash-up' : 'flash-down');
                          setTimeout(() => item.classList.remove('flash-up', 'flash-down'), 1200);
                        }
                      });
                    const now = new Date();
                    document.getElementById('updateTime').textContent = now.toLocaleTimeString('es-ES');
}, 1800);

                    // ============ HERO CANDLESTICK CHART ============
                    const canvas = document.getElementById('heroChart');
                    const ctx = canvas.getContext('2d');
                    let candles = [];
                    let chartW = 0, chartH = 0;
                    let dpr = window.devicePixelRatio || 1;

                    function resizeChart() {
  const rect = canvas.getBoundingClientRect();
                    chartW = rect.width;
                    chartH = rect.height;
                    canvas.width = chartW * dpr;
                    canvas.height = chartH * dpr;
                    ctx.scale(dpr, dpr);
                    generateCandles();
                    drawChart();
}

                    function generateCandles() {
                      candles = [];
                    const numCandles = 70;
                    let price = 100;
                    const volatility = 3;
                    for (let i = 0; i < numCandles; i++) {
    const open = price;
                    const change = (Math.random() - 0.42) * volatility;
                    const close = Math.max(40, open + change);
                    const high = Math.max(open, close) + Math.random() * volatility * 0.6;
                    const low = Math.min(open, close) - Math.random() * volatility * 0.6;
                    candles.push({open, close, high, low, bullish: close >= open });
                    price = close;
  }
}

                    function drawChart() {
                      ctx.clearRect(0, 0, chartW, chartH);
                    if (candles.length === 0) return;

                    const padding = 60;
                    const drawW = chartW - padding * 2;
                    const drawH = chartH - padding * 2;
                    const candleW = drawW / candles.length * 0.7;
                    const gap = drawW / candles.length * 0.3;

  const allValues = candles.flatMap(c => [c.high, c.low]);
                    const minP = Math.min(...allValues) * 0.95;
                    const maxP = Math.max(...allValues) * 1.05;
                    const range = maxP - minP;

  candles.forEach((c, i) => {
    const x = padding + i * (candleW + gap) + candleW / 2;
                    const openY = padding + drawH - ((c.open - minP) / range) * drawH;
                    const closeY = padding + drawH - ((c.close - minP) / range) * drawH;
                    const highY = padding + drawH - ((c.high - minP) / range) * drawH;
                    const lowY = padding + drawH - ((c.low - minP) / range) * drawH;

                    const color = c.bullish ? 'rgba(0, 232, 168, 0.55)' : 'rgba(255, 107, 125, 0.55)';
                    const colorSolid = c.bullish ? 'rgba(0, 232, 168, 0.85)' : 'rgba(255, 107, 125, 0.85)';

                    // wick
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, highY);
                    ctx.lineTo(x, lowY);
                    ctx.stroke();

                    // body
                    ctx.fillStyle = colorSolid;
                    const bodyTop = Math.min(openY, closeY);
                    const bodyH = Math.max(2, Math.abs(closeY - openY));
                    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
  });

                    // Latest candle glow
                    const last = candles[candles.length - 1];
                    const lastX = padding + (candles.length - 1) * (candleW + gap) + candleW / 2;
                    const lastY = padding + drawH - ((last.close - minP) / range) * drawH;
                    const gradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 80);
                    gradient.addColorStop(0, 'rgba(0, 232, 168, 0.35)');
                    gradient.addColorStop(1, 'rgba(0, 232, 168, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(lastX - 80, lastY - 80, 160, 160);
}

                    window.addEventListener('resize', resizeChart);
                    setTimeout(resizeChart, 50);

// Add new candle periodically
setInterval(() => {
  const last = candles[candles.length - 1];
                    const open = last.close;
                    const change = (Math.random() - 0.42) * 3;
                    const close = Math.max(40, open + change);
                    candles.shift();
                    candles.push({
                      open, close,
                      high: Math.max(open, close) + Math.random() * 1.8,
                    low: Math.min(open, close) - Math.random() * 1.8,
    bullish: close >= open
  });
                    drawChart();
}, 2500);

// ============ PARALLAX ============
window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;
  document.querySelectorAll('.parallax-layer').forEach(el => {
    const speed = parseFloat(el.dataset.speed) || 0;
                    el.style.transform = \`translate3d(0, \${scrollY * speed}px, 0)\`;
  });
});

                    // ============ ASSETS ============
                    function formatPrice(p) {
  if (p < 1) return p.toFixed(4);
                    if (p < 100) return p.toFixed(2);
                    return p.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

                    function generateSparklinePath(trend, points = 20) {
                      let v = 50;
                    const values = [];
                    for (let i = 0; i < points; i++) {
                      v += (Math.random() - (trend === 'up' ? 0.38 : 0.62)) * 12;
                    v = Math.max(15, Math.min(85, v));
                    values.push(v);
  }
                    const w = 140, h = 36;
                    const step = w / (points - 1);
  const linePath = values.map((val, i) => \`\${i === 0 ? 'M' : 'L'} \${i * step} \${h - (val / 100) * h}\`).join(' ');
                    const areaPath = \`\${linePath} L \${w} \${h} L 0 \${h} Z\`;
                    return {line: linePath, area: areaPath };
}

                    function renderAssets(category) {
  const list = document.getElementById('assetList');
                    const data = assetsData[category];
  list.innerHTML = data.map((a, i) => {
    const spark = generateSparklinePath(a.trend);
                    const stroke = a.trend === 'up' ? '#00e8a8' : '#ff6b7d';
                    const fill = a.trend === 'up' ? 'rgba(0,232,168,0.15)' : 'rgba(255,107,125,0.15)';
                    const gradId = \`grad-\${category}-\${i}\`;
                    return \`
                    <div class="asset-row grid grid-cols-12 gap-4 px-6 py-5 items-center border-b border-[var(--line)] last:border-0">
                      <div class="col-span-3 flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold" style="background: \${a.trend === 'up' ? 'rgba(0,232,168,0.1)' : 'rgba(255,107,125,0.1)'}; color: \${stroke};">\${a.ticker.substring(0, 2)}</div>
                        <div>
                          <div class="font-mono text-sm font-semibold">\${a.ticker}</div>
                          <div class="text-xs text-white/40">\${a.name}</div>
                        </div>
                      </div>
                      <div class="col-span-2 text-right font-mono text-sm font-semibold">\${formatPrice(a.price)}</div>
                      <div class="col-span-2 text-right">
                        <span class="font-mono text-sm font-semibold \${a.change >= 0 ? 'text-[var(--emerald-bright)]' : 'text-[var(--coral-bright)]'}">\${a.change >= 0 ? '+' : ''}\${a.change.toFixed(2)}%</span>
                      </div>
                      <div class="col-span-3">
                        <svg viewBox="0 0 140 36" class="w-full h-9 sparkline" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="\${gradId}" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stop-color="\${stroke}" stop-opacity="0.4" />
                              <stop offset="100%" stop-color="\${stroke}" stop-opacity="0" />
                            </linearGradient>
                          </defs>
                          <path class="area" d="\${spark.area}" fill="url(#\${gradId})" />
                          <path class="line" d="\${spark.line}" fill="none" stroke="\${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </div>
                      <div class="col-span-2 flex items-center justify-end gap-2 relative">
                        <div class="asset-tooltip absolute right-full mr-3 top-1/2 -translate-y-1/2 glass-strong px-4 py-3 w-44 z-30">
                          <div class="text-[10px] font-mono text-white/40 mb-1">Precio exacto</div>
                          <div class="font-mono text-lg font-bold mb-2">\${formatPrice(a.price)} \${a.ticker === 'XAU' || a.ticker === 'BTC' ? '$' : '$'}</div>
                          <div class="flex gap-1.5">
                            <button class="flex-1 py-1.5 rounded-md text-[11px] font-semibold bg-[var(--emerald)] text-[var(--navy-900)]" onclick="showToast('Orden de compra \${a.ticker} enviada'); event.stopPropagation();">Comprar</button>
                            <button class="flex-1 py-1.5 rounded-md text-[11px] font-semibold border border-[var(--coral)]/40 text-[var(--coral-bright)]" onclick="showToast('Orden de venta \${a.ticker} enviada'); event.stopPropagation();">Vender</button>
                          </div>
                        </div>
                        <button class="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--line-strong)] hover:border-[var(--cyan)]/50 hover:text-[var(--cyan-bright)] transition" onclick="showToast('Abriendo detalle de \${a.ticker}'); event.stopPropagation();">Detalle</button>
                      </div>
                    </div>
                    \`;
  }).join('');
  // trigger sparkline animation
  setTimeout(() => {
                      document.querySelectorAll('#assetList .sparkline').forEach(s => s.classList.add('in-view'));
  }, 50);
}

                    renderAssets('stocks');

// tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
                      btn.addEventListener('click', () => {
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderAssets(btn.dataset.tab);
                      });
});

                    // ============ INVESTOR CARDS ============
                    function renderInvestors() {
  const grid = document.getElementById('investorGrid');
                    const riskStyles = {
                      'Bajo': {color: 'var(--emerald-bright)', bg: 'var(--emerald-dim)', border: 'var(--emerald)' },
                    'Medio': {color: 'var(--cyan-bright)', bg: 'var(--cyan-dim)', border: 'var(--cyan)' },
                    'Alto': {color: 'var(--coral-bright)', bg: 'var(--coral-dim)', border: 'var(--coral)' }
  };
  grid.innerHTML = investorsData.map(inv => {
    const rs = riskStyles[inv.risk];
    const sparkPath = (() => {
                      let v = 50; const vals = [];
                    for (let i = 0; i < 24; i++) {v += (Math.random() - 0.35) * 10; v = Math.max(20, Math.min(85, v)); vals.push(v); }
                    const w = 280, h = 50, step = w/23;
      return vals.map((val, i) => \`\${i === 0 ? 'M' : 'L'} \${i * step} \${h - (val / 100) * h}\`).join(' ');
    })();
                    return \`
                    <div class="tilt-card glass-strong p-6 glow-border" data-investor="\${inv.handle}">
                      <div class="tilt-layer-1">
                        <div class="flex items-start justify-between mb-5">
                          <div class="flex items-center gap-3">
                            <div class="relative">
                              <img src="https://picsum.photos/seed/\${inv.img}/120/120.jpg" class="w-14 h-14 rounded-full ring-2 ring-white/10" alt="\${inv.name}">
                                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--emerald)] flex items-center justify-center border-2 border-[var(--navy-800)]">
                                  <svg class="w-2.5 h-2.5 text-[var(--navy-900)]" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <div>
                              <div class="font-semibold">\${inv.name}</div>
                              <div class="text-xs text-white/50 font-mono">\${inv.handle}</div>
                            </div>
                          </div>
                          <div class="px-2 py-1 rounded-md text-[10px] font-mono font-semibold border" style="color: \${rs.color}; background: \${rs.bg}; border-color: \${rs.border};">RIESGO \${inv.risk.toUpperCase()}</div>
                        </div>

                        <div class="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-white/8">
                          <div>
                            <div class="text-[10px] font-mono text-white/40 tracking-wider mb-1">ROI 12M</div>
                            <div class="font-mono text-xl font-bold text-[var(--emerald-bright)]">+\${inv.roi.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div class="text-[10px] font-mono text-white/40 tracking-wider mb-1">COPIADORES</div>
                            <div class="font-mono text-xl font-bold">\${inv.copers ? inv.copers : inv.copiers.toLocaleString('es-ES')}</div>
                          </div>
                          <div>
                            <div class="text-[10px] font-mono text-white/40 tracking-wider mb-1">WIN RATE</div>
                            <div class="font-mono text-xl font-bold">\${inv.winRate}%</div>
                          </div>
                        </div>

                        <div class="mb-5">
                          <svg viewBox="0 0 280 50" class="w-full h-12 sparkline in-view" preserveAspectRatio="none">
                            <path class="line" d="\${sparkPath}" fill="none" stroke="#00e8a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </div>

                        <div class="mb-5">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-[10px] font-mono text-white/40 tracking-wider">ASIGNACIÓN DE ACTIVOS</span>
                            <span class="text-[10px] font-mono text-white/40">\${inv.trades} ops.</span>
                          </div>
                          <div class="alloc-bar mb-2">
                            \${inv.alloc.map(a => \`<div style="width: \${a.val}%; background: \${a.color};"></div>\`).join('')}
                          </div>
                          <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/50 font-mono">
                            \${inv.alloc.map(a => \`<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm" style="background: \${a.color};"></span>\${a.name} \${a.val}%</span>\`).join('')}
                          </div>
                        </div>

                        <button class="btn-primary ripple-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" onclick="showToast('Ahora copias a \${inv.name}. Cada operación se replicará automáticamente.')">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2" /></svg>
                          Copiar trader
                        </button>
                      </div>
                    </div>
                    \`;
  }).join('');

  // 3D tilt
  document.querySelectorAll('.tilt-card').forEach(card => {
                      card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const cx = rect.width / 2;
                        const cy = rect.height / 2;
                        const rotX = ((y - cy) / cy) * -8;
                        const rotY = ((x - cx) / cx) * 8;
                        card.style.transform = \`perspective(1000px) rotateX(\${rotX}deg) rotateY(\${rotY}deg) translateZ(0)\`;
                      });
    card.addEventListener('mouseleave', () => {
                      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
}
                    renderInvestors();

// ============ RIPPLE ============
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.ripple-btn');
                    if (!btn) return;
                    const rect = btn.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple';
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                    btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});

// ============ REVEAL ON SCROLL ============
const observer = new IntersectionObserver((entries) => {
                      entries.forEach(entry => {
                        if (entry.isIntersecting) {
                          entry.target.classList.add('in-view');
                        }
                      });
}, {threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .sparkline').forEach(el => observer.observe(el));

                    // ============ SIGNUP FORM ============
                    function goToStep2() {
  const email = document.getElementById('emailInput').value;
                    if (!email || !email.includes('@')) {
                      showToast('Introduce un correo válido para continuar');
                    return;
  }
                    document.getElementById('step1').classList.add('hidden');
                    document.getElementById('step2').classList.remove('hidden');
                    document.getElementById('step1-dot').classList.remove('active');
                    document.getElementById('step1-dot').classList.add('done');
                    document.getElementById('step1-dot').innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>';
                    document.getElementById('step2-dot').classList.remove('pending');
                    document.getElementById('step2-dot').classList.add('active');
                    document.getElementById('stepNum').textContent = '2';
}

                    function goToStep1() {
                      document.getElementById('step2').classList.add('hidden');
                    document.getElementById('step1').classList.remove('hidden');
                    document.getElementById('step1-dot').classList.add('active');
                    document.getElementById('step1-dot').classList.remove('done');
                    document.getElementById('step1-dot').textContent = '1';
                    document.getElementById('step2-dot').classList.add('pending');
                    document.getElementById('step2-dot').classList.remove('active');
                    document.getElementById('stepNum').textContent = '1';
}

                    function finishSignup() {
                      showToast('¡Cuenta demo creada! Tus $100.000 virtuales están listos.');
  setTimeout(() => {
                      // reset
                      goToStep1();
                    document.getElementById('emailInput').value = '';
  }, 2500);
}

// experience & risk selectors
document.querySelectorAll('.exp-btn').forEach(btn => {
                      btn.addEventListener('click', () => {
                        document.querySelectorAll('.exp-btn').forEach(b => {
                          b.classList.remove('active', 'border-[var(--cyan)]', 'bg-[var(--cyan-dim)]', 'text-white');
                          b.classList.add('border-white/10', 'text-white/60');
                        });
                        btn.classList.add('active', 'border-[var(--cyan)]', 'bg-[var(--cyan-dim)]', 'text-white');
                        btn.classList.remove('border-white/10', 'text-white/60');
                      });
});

document.querySelectorAll('.risk-btn').forEach(btn => {
                      btn.addEventListener('click', () => {
                        document.querySelectorAll('.risk-btn').forEach(b => {
                          b.classList.remove('active', 'border-[var(--cyan)]', 'bg-[var(--cyan-dim)]', 'text-white');
                          b.classList.add('border-white/10', 'text-white/60');
                        });
                        btn.classList.add('active', 'border-[var(--cyan)]', 'bg-[var(--cyan-dim)]', 'text-white');
                        btn.classList.remove('border-white/10', 'text-white/60');
                      });
});

                    // ============ TOAST ============
                    let toastTimeout;
                    function showToast(msg) {
  const toast = document.getElementById('toast');
                    document.getElementById('toastMsg').textContent = msg;
                    toast.classList.add('show');
                    clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

                    // init update time
                    const now = new Date();
                    document.getElementById('updateTime').textContent = now.toLocaleTimeString('es-ES');
                  </script>
                </body>
              </html>`
  },
  "aplicacion": {
    title: `Lumen — Software de Productividad Sereno`,
    brand: `Caso de Éxito: Aplicación`,
    desc: `Dashboard interactivo de Lumen, una app boutique de software (SaaS) orientada a flujos de trabajo complejos.`,
    gradient: `from-indigo-600 to-cyan-500`,
    challenge: `Rediseñar la frialdad de las plataformas SaaS corporativas tradicionales y convertirlas en una interfaz calma, limpia y minimalista.`,
    solution: `Se generó un dashboard interactivo completo con gráficos semanales SVG dinámicos, flujos de automatizaciones animados y comentarios contextuales en tiempo real.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `América del Norte & Europa`,
    industry: `SaaS / Productividad`,
    quote: `Lumen demuestra que el software complejo puede ser estético, silencioso por defecto y centrado en la concentración de las personas.`,
    quoteAuthor: `Marina Keller`,
    quoteRole: `Founder, Lumen SaaS`,
    metrics: [{"value":"14 días","label":"Prueba Premium","sublabel":"Acceso inmediato sin tarjeta de crédito"},{"value":"+4.2h","label":"Tiempo Ahorrado","sublabel":"Aumento de productividad diaria de los usuarios"},{"value":"100%","label":"Auditable","sublabel":"Flujos y triggers completamente configurados"}],
    demoTitle: `Lumen — Software de Productividad Sereno`,
    demoPrompt: `Diseña una página de inicio para una empresa boutique de software(SaaS) que transmita claridad, sofisticación técnica y confianza serena: el antídoto a las interfaces caóticas, sobrecargadas y frías del software empresarial tradicional.
Estrategia visual:

Imágenes: Capturas limpias de la interfaz del producto en uso real, personas enfocadas y calmadas trabajando(no poses forzadas), diagramas sutiles de flujos de datos, elementos abstractos de nodos y conexiones elegantes, espacios de trabajo minimalistas con luz natural.
    Fotografía: Luz natural suave y difusa, paleta de tonos fríos pero cálidos, profundidad de campo selectiva, alta resolución con acabados premium.
        Composición: Mucho espacio negativo, alineación rigurosa, jerarquía clara, elementos flotando con intención.Uso elegante de líneas sutiles y micro - interacciones geométricas.
Paleta de colores:
Primarios: Azul profundo medianoche(#0F172A), gris pizarra suave(#64748B), blanco puro con leve tinte cálido.
    Acentos: Cyan eléctrico sutil(#22D3EE), violeta índigo(#6366F1), verde esmeralda muy suave(#10B981).

        Fondo: Gradientes muy sutiles de oscuro a claro o textura casi imperceptible de ruido fino / grano.
            Tipografía:
Encabezados: Sans - serif geométrica moderna de alta legibilidad(tipo Satoshi, Neue Haas Grotesk o Inter Display), pesos 500 - 700.
Cuerpo: Sans - serif neutra con excelente legibilidad(Inter o SF Pro), interlineado generoso(1.7–1.9).


Diseño general: Márgenes y padding muy generosos, una idea clara por sección de scroll, scroll suave y lento.Estilo premium, minimalista pero cálido, que inspire confianza y deseo de usarlo.
Estructura de la página:

Hero principal: Imagen o video loop sutil del producto en acción + gran titular claro + subtítulo que explique la promesa principal + CTA principal("Empezar gratis" + "Ver demo") muy destacado.Animación sutil de los elementos de la interfaz flotando o conectándose.
Sección de confianza / Problema - Solución: Texto breve + visual que contraste "el dolor actual" vs "la experiencia con nosotros".
Características clave: Tres o cuatro bloques grandes con iconografía elegante + captura de pantalla + título y descripción breve.Al hacer hover se expande ligeramente y muestra un micro - video o animación del feature.
Cómo funciona: Flujo visual paso a paso(3 - 4 pasos) con ilustraciones conectadas y animaciones suaves al hacer scroll.
    Testimonios: Fotos reales de fundadores / usuarios + cita + logo de empresa + métrica de resultado(ej: “Redujimos 68 % el tiempo de reporting”).
        Integraciones: Logos de herramientas populares en un grid elegante y sutil.
            Precios / Planes: Tarjetas claras y comparativas con énfasis en el plan más recomendado.
                Equipo / Sobre nosotros: Breves perfiles de los fundadores o miembros clave con foto y frase personal.
                    Footer: Limpio, con enlaces importantes, newsletter y última llamada a acción.

Detalles de interacción:

El hero tiene una animación de “respiración” muy sutil en los elementos de la interfaz(4 - 5 segundos de ciclo).
Todos los titulares entran con fade - up elegante y ligero retardo al hacer scroll.
Al pasar el cursor sobre cualquier captura de producto se activa un zoom suave + overlay con highlight de la funcionalidad.
Las tarjetas de características tienen hover con elevación sutil y cambio de color en el acento.
Scroll progress indicator muy discreto en la parte superior.
    Micro - interacciones en botones(scale + glow suave).
Cursor personalizado sutil en zonas interactivas(opcional pero elegante).

Ambiente general: Profesional, moderno, cálido, premium, confiable, inteligente sin ser frío.Debe transmitir que “esto está pensado por personas que realmente entienden el trabajo complejo y quieren hacerlo más humano y simple”.`,
    demoCode: `<!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Lumen — Software sereno para trabajo complejo</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
                                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                                    <style>
                                        :root {
                                            --bg: #0F172A;
                                        --bg-soft: #131C31;
                                        --bg-card: rgba(30, 41, 59, 0.4);
                                        --fg: #F8FAFC;
                                        --fg-warm: #F1F5F9;
                                        --fg-muted: #94A3B8;
                                        --fg-subtle: #64748B;
                                        --accent-cyan: #22D3EE;
                                        --accent-indigo: #6366F1;
                                        --accent-emerald: #10B981;
                                        --border: rgba(148, 163, 184, 0.12);
                                        --border-soft: rgba(148, 163, 184, 0.06);
  }

                                        * {box - sizing: border-box; }

                                        html {scroll - behavior: smooth; }

                                        body {
                                            font - family: 'Inter', sans-serif;
                                        background: var(--bg);
                                        color: var(--fg);
                                        line-height: 1.75;
                                        overflow-x: hidden;
                                        font-weight: 400;
                                        -webkit-font-smoothing: antialiased;
  }

                                        h1, h2, h3, h4, .display {
                                            font - family: 'Space Grotesk', sans-serif;
                                        letter-spacing: -0.025em;
                                        line-height: 1.1;
                                        font-weight: 500;
  }

                                        /* Grano sutil */
                                        body::before {
                                            content: '';
                                        position: fixed;
                                        inset: 0;
                                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
                                        opacity: 0.035;
                                        pointer-events: none;
                                        z-index: 1;
                                        mix-blend-mode: overlay;
  }

                                        /* Cursor personalizado */
                                        .cursor-dot, .cursor-ring {
                                            position: fixed;
                                        top: 0;
                                        left: 0;
                                        pointer-events: none;
                                        z-index: 9999;
                                        transform: translate(-50%, -50%);
                                        will-change: transform;
  }
                                        .cursor-dot {
                                            width: 5px;
                                        height: 5px;
                                        background: var(--accent-cyan);
                                        border-radius: 50%;
                                        transition: width 0.3s, height 0.3s, background 0.3s;
  }
                                        .cursor-ring {
                                            width: 32px;
                                        height: 32px;
                                        border: 1px solid rgba(34, 211, 238, 0.35);
                                        border-radius: 50%;
                                        transition: width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, background 0.3s;
  }
                                        .cursor-ring.hover {
                                            width: 56px;
                                        height: 56px;
                                        border-color: rgba(99, 102, 241, 0.5);
                                        background: rgba(99, 102, 241, 0.06);
  }
                                        .cursor-ring.cta {
                                            width: 64px;
                                        height: 64px;
                                        border-color: rgba(34, 211, 238, 0.6);
                                        background: rgba(34, 211, 238, 0.08);
  }
                                        @media (hover: none) { .cursor - dot, .cursor - ring {display: none; } body {cursor: auto; } }
                                        @media (hover: hover) {body {cursor: none; } a, button {cursor: none; } }

                                        /* Scroll progress */
                                        .scroll-progress {
                                            position: fixed;
                                        top: 0;
                                        left: 0;
                                        height: 2px;
                                        background: linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo) 50%, var(--accent-emerald));
                                        z-index: 100;
                                        width: 100%;
                                        transform: scaleX(0);
                                        transform-origin: left;
  }

                                        /* Nav */
                                        .nav-blur {
                                            backdrop - filter: blur(20px) saturate(180%);
                                        -webkit-backdrop-filter: blur(20px) saturate(180%);
                                        background: rgba(15, 23, 42, 0.7);
                                        border-bottom: 1px solid var(--border-soft);
  }

                                        /* Ambient blobs */
                                        .ambient-blob {
                                            position: absolute;
                                        border-radius: 50%;
                                        filter: blur(100px);
                                        pointer-events: none;
                                        will-change: transform;
  }

                                        /* Animaciones */
                                        @keyframes breathe {
                                            0 %, 100 % { transform: translateY(0) scale(1); }
    50% {transform: translateY(-6px) scale(1.008); }
  }
                                        @keyframes breathe-slow {
                                            0 %, 100 % { transform: translateY(0) scale(1); }
    50% {transform: translateY(-10px) scale(1.012); }
  }
                                        @keyframes float-1 {
                                            0 %, 100 % { transform: translate(0, 0) rotate(0deg); }
    50% {transform: translate(8px, -14px) rotate(1deg); }
  }
                                        @keyframes float-2 {
                                            0 %, 100 % { transform: translate(0, 0) rotate(0deg); }
    50% {transform: translate(-10px, -8px) rotate(-1.5deg); }
  }
                                        @keyframes pulse-soft {
                                            0 %, 100 % { opacity: 0.5; }
    50% {opacity: 1; }
  }
                                        @keyframes dash-flow {
                                            to {stroke - dashoffset: -40; }
  }
                                        @keyframes shimmer-line {
                                            0 % { transform: translateX(-100 %); }
    100% {transform: translateX(200%); }
  }
                                        @keyframes ping-soft {
                                            0 % { transform: scale(1); opacity: 0.7; }
    100% {transform: scale(2.5); opacity: 0; }
  }
                                        @keyframes bar-grow {
                                            0 % { transform: scaleY(0); }
    100% {transform: scaleY(1); }
  }
                                        @keyframes glow-pulse {
                                            0 %, 100 % { box- shadow: 0 0 20px -5px rgba(34, 211, 238, 0.3); }
                                        50% {box - shadow: 0 0 40px -5px rgba(34, 211, 238, 0.6); }
  }

                                        .breathe {animation: breathe 5s ease-in-out infinite; }
                                        .breathe-slow {animation: breathe-slow 7s ease-in-out infinite; }
                                        .float-1 {animation: float-1 6s ease-in-out infinite; }
                                        .float-2 {animation: float-2 8s ease-in-out infinite; }

                                        /* Reveal */
                                        .reveal {
                                            opacity: 0;
                                        transform: translateY(30px);
                                        transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  }
                                        .reveal.visible {
                                            opacity: 1;
                                        transform: translateY(0);
  }
                                        .reveal.delay-1 {transition - delay: 0.1s; }
                                        .reveal.delay-2 {transition - delay: 0.2s; }
                                        .reveal.delay-3 {transition - delay: 0.3s; }
                                        .reveal.delay-4 {transition - delay: 0.4s; }

                                        /* Botones */
                                        .btn-primary {
                                            position: relative;
                                        background: linear-gradient(135deg, #6366F1 0%, #22D3EE 100%);
                                        color: white;
                                        padding: 14px 28px;
                                        border-radius: 12px;
                                        font-weight: 500;
                                        font-size: 0.95rem;
                                        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                                        box-shadow: 0 4px 20px -5px rgba(99, 102, 241, 0.4);
                                        overflow: hidden;
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 10px;
  }
                                        .btn-primary::before {
                                            content: '';
                                        position: absolute;
                                        inset: 0;
                                        background: linear-gradient(135deg, #22D3EE 0%, #6366F1 100%);
                                        opacity: 0;
                                        transition: opacity 0.4s;
  }
                                        .btn-primary:hover {
                                            transform: translateY(-2px) scale(1.02);
                                        box-shadow: 0 12px 40px -8px rgba(99, 102, 241, 0.6), 0 0 30px rgba(34, 211, 238, 0.3);
  }
                                        .btn-primary:hover::before {opacity: 1; }
  .btn-primary > * {position: relative; z-index: 1; }

                                        .btn-secondary {
                                            background: rgba(148, 163, 184, 0.04);
                                        border: 1px solid rgba(148, 163, 184, 0.2);
                                        color: var(--fg);
                                        padding: 14px 28px;
                                        border-radius: 12px;
                                        font-weight: 500;
                                        font-size: 0.95rem;
                                        transition: all 0.3s ease;
                                        backdrop-filter: blur(10px);
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 10px;
  }
                                        .btn-secondary:hover {
                                            border - color: rgba(34, 211, 238, 0.5);
                                        background: rgba(34, 211, 238, 0.05);
                                        transform: translateY(-2px);
  }

                                        /* Glass */
                                        .glass {
                                            background: rgba(30, 41, 59, 0.35);
                                        backdrop-filter: blur(20px) saturate(150%);
                                        -webkit-backdrop-filter: blur(20px) saturate(150%);
                                        border: 1px solid rgba(148, 163, 184, 0.1);
  }

                                        /* Product mockup base */
                                        .product-frame {
                                            background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
                                        border: 1px solid rgba(148, 163, 184, 0.15);
                                        border-radius: 14px;
                                        box-shadow:
                                        0 50px 100px -20px rgba(0, 0, 0, 0.6),
                                        0 30px 60px -30px rgba(99, 102, 241, 0.25),
                                        inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
                                        overflow: hidden;
  }

                                        .product-hover {
                                            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
                                        .product-hover:hover {
                                            transform: scale(1.015);
  }

                                        /* Feature card */
                                        .feature-card {
                                            background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%);
                                        border: 1px solid var(--border-soft);
                                        border-radius: 18px;
                                        padding: 32px;
                                        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                                        position: relative;
                                        overflow: hidden;
  }
                                        .feature-card::before {
                                            content: '';
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        height: 1px;
                                        background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
                                        opacity: 0;
                                        transition: opacity 0.5s;
  }
                                        .feature-card:hover {
                                            transform: translateY(-6px);
                                        border-color: rgba(99, 102, 241, 0.3);
                                        background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%);
                                        box-shadow: 0 30px 60px -20px rgba(99, 102, 241, 0.2);
  }
                                        .feature-card:hover::before {opacity: 1; }
                                        .feature-card:hover .feature-icon {
                                            background: rgba(99, 102, 241, 0.15);
                                        border-color: rgba(99, 102, 241, 0.4);
                                        color: var(--accent-indigo);
  }
                                        .feature-card:hover .feature-preview {opacity: 1; transform: translateY(0); }

                                        .feature-icon {
                                            width: 48px;
                                        height: 48px;
                                        border-radius: 12px;
                                        background: rgba(148, 163, 184, 0.06);
                                        border: 1px solid rgba(148, 163, 184, 0.15);
                                        color: var(--accent-cyan);
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 18px;
                                        transition: all 0.5s;
  }

                                        .feature-preview {
                                            opacity: 0;
                                        transform: translateY(10px);
                                        transition: opacity 0.5s, transform 0.5s;
  }

                                        /* Step number */
                                        .step-num {
                                            font - family: 'Space Grotesk', sans-serif;
                                        font-size: 11px;
                                        letter-spacing: 0.2em;
                                        color: var(--accent-cyan);
                                        text-transform: uppercase;
                                        font-weight: 500;
  }

                                        /* Pricing */
                                        .pricing-card {
                                            background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.2) 100%);
                                        border: 1px solid var(--border);
                                        border-radius: 20px;
                                        padding: 36px 32px;
                                        transition: all 0.5s;
                                        position: relative;
  }
                                        .pricing-card:hover {
                                            border - color: rgba(148, 163, 184, 0.25);
                                        transform: translateY(-4px);
  }
                                        .pricing-card.featured {
                                            background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%);
                                        border-color: rgba(99, 102, 241, 0.4);
                                        box-shadow: 0 30px 80px -20px rgba(99, 102, 241, 0.3);
  }

                                        /* Integration grid */
                                        .integration-cell {
                                            aspect - ratio: 1.6 / 1;
                                        border: 1px solid var(--border-soft);
                                        border-radius: 14px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        background: rgba(30, 41, 59, 0.25);
                                        transition: all 0.4s;
                                        color: var(--fg-subtle);
  }
                                        .integration-cell:hover {
                                            border - color: rgba(34, 211, 238, 0.3);
                                        background: rgba(34, 211, 238, 0.04);
                                        color: var(--fg);
                                        transform: translateY(-2px);
  }

                                        /* Section spacing */
                                        .section {padding: 140px 0; position: relative; }
                                        @media (max-width: 768px) { .section {padding: 80px 0; } }

                                        /* Headline gradient */
                                        .grad-text {
                                            background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%);
                                        -webkit-background-clip: text;
                                        background-clip: text;
                                        color: transparent;
  }
                                        .grad-accent {
                                            background: linear-gradient(135deg, #22D3EE 0%, #6366F1 100%);
                                        -webkit-background-clip: text;
                                        background-clip: text;
                                        color: transparent;
  }

                                        /* Bar chart */
                                        .bar {
                                            transform - origin: bottom;
                                        animation: bar-grow 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

                                        /* SVG line dash */
                                        .dash-flow {
                                            stroke - dasharray: 4 6;
                                        animation: dash-flow 2s linear infinite;
  }

                                        /* Mini metric chip */
                                        .chip {
                                            background: rgba(15, 23, 42, 0.7);
                                        backdrop-filter: blur(10px);
                                        border: 1px solid rgba(148, 163, 184, 0.15);
                                        border-radius: 10px;
                                        padding: 10px 14px;
  }

                                        /* Logo mark */
                                        .logo-mark {
                                            width: 28px;
                                        height: 28px;
                                        border-radius: 8px;
                                        background: linear-gradient(135deg, #6366F1, #22D3EE);
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 0 20px -5px rgba(99, 102, 241, 0.5);
  }

                                        /* Decorative grid */
                                        .grid-bg {
                                            background - image:
                                        linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
                                        background-size: 60px 60px;
  }

                                        /* Subtle highlight line */
                                        .highlight-line {
                                            position: relative;
  }
                                        .highlight-line::after {
                                            content: '';
                                        position: absolute;
                                        bottom: -4px;
                                        left: 0;
                                        width: 100%;
                                        height: 1px;
                                        background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  }

                                        /* Tab pill */
                                        .tab-pill {
                                            padding: 8px 16px;
                                        border-radius: 100px;
                                        font-size: 13px;
                                        color: var(--fg-muted);
                                        transition: all 0.3s;
                                        border: 1px solid transparent;
                                        cursor: none;
  }
                                        .tab-pill.active {
                                            color: var(--fg);
                                        background: rgba(34, 211, 238, 0.08);
                                        border-color: rgba(34, 211, 238, 0.3);
  }

                                        /* Selection */
                                        ::selection {background: rgba(99, 102, 241, 0.3); color: white; }

                                        /* Scrollbar */
                                        ::-webkit-scrollbar {width: 8px; }
                                        ::-webkit-scrollbar-track {background: var(--bg); }
                                        ::-webkit-scrollbar-thumb {background: rgba(148, 163, 184, 0.2); border-radius: 4px; }
                                        ::-webkit-scrollbar-thumb:hover {background: rgba(148, 163, 184, 0.3); }
                                    </style>
                                </head>
                                <body>

                                    <!-- Cursor personalizado -->
                                    <div class="cursor-dot" id="cursorDot"></div>
                                    <div class="cursor-ring" id="cursorRing"></div>

                                    <!-- Scroll progress -->
                                    <div class="scroll-progress" id="scrollProgress"></div>

                                    <!-- NAV -->
                                    <nav class="fixed top-0 left-0 right-0 z-50 nav-blur">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
                                            <a href="#" class="flex items-center gap-2.5">
                                                <div class="logo-mark">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linejoin="round" opacity="0.6" />
                                                    </svg>
                                                </div>
                                                <span class="font-display font-medium text-lg tracking-tight">Lumen</span>
                                            </a>
                                            <div class="hidden md:flex items-center gap-8 text-sm text-slate-400">
                                                <a href="#producto" class="hover:text-white transition interactive">Producto</a>
                                                <a href="#caracteristicas" class="hover:text-white transition interactive">Características</a>
                                                <a href="#flujo" class="hover:text-white transition interactive">Cómo funciona</a>
                                                <a href="#precios" class="hover:text-white transition interactive">Precios</a>
                                                <a href="#equipo" class="hover:text-white transition interactive">Equipo</a>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <a href="#" class="hidden sm:block text-sm text-slate-400 hover:text-white transition interactive">Iniciar sesión</a>
                                                <a href="#cta" class="btn-primary text-sm interactive" style="padding: 10px 20px;">
                                                    Empezar gratis
                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </nav>

                                    <!-- HERO -->
                                    <section class="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
                                        <!-- Ambient background -->
                                        <div class="absolute inset-0 grid-bg opacity-40"></div>
                                        <div class="ambient-blob" style="width: 600px; height: 600px; background: #6366F1; opacity: 0.12; top: -200px; right: -100px;"></div>
                                        <div class="ambient-blob" style="width: 500px; height: 500px; background: #22D3EE; opacity: 0.08; top: 200px; left: -150px;"></div>

                                        <div class="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
                                            <div class="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                                                <!-- Left: copy -->
                                                <div class="lg:col-span-6">
                                                    <div class="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-8">
                                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" style="animation: pulse-soft 2s infinite;"></span>
                                                        <span class="text-xs text-slate-300 tracking-wide">v2.4 — Ahora con flujos inteligentes</span>
                                                    </div>

                                                    <h1 class="reveal delay-1 text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight mb-6">
                                                        El trabajo complejo,<br>
                                                            <span class="grad-accent">hecho sereno.</span>
                                                    </h1>

                                                    <p class="reveal delay-2 text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
                                                        Lumen reúne tus datos, equipos y procesos en un espacio calmo y diseñado con intención. Menos ruido. Más claridad. Decisiones mejores, en menos tiempo.
                                                    </p>

                                                    <div class="reveal delay-3 flex flex-wrap items-center gap-4 mb-12">
                                                        <a href="#cta" class="btn-primary interactive cta-hover">
                                                            Empezar gratis
                                                            <i class="fa-solid fa-arrow-right text-xs"></i>
                                                        </a>
                                                        <a href="#producto" class="btn-secondary interactive cta-hover">
                                                            <i class="fa-solid fa-play text-xs"></i>
                                                            Ver demo (2 min)
                                                        </a>
                                                    </div>

                                                    <div class="reveal delay-4 flex items-center gap-6 text-xs text-slate-500">
                                                        <div class="flex items-center gap-2">
                                                            <i class="fa-solid fa-check text-emerald-400"></i>
                                                            Sin tarjeta de crédito
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <i class="fa-solid fa-check text-emerald-400"></i>
                                                            14 días premium
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <i class="fa-solid fa-check text-emerald-400"></i>
                                                            Setup en 5 minutos
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Right: product mockup con paneles flotantes -->
                                                <div class="lg:col-span-6 relative">
                                                    <!-- Decorative nodes SVG -->
                                                    <svg class="absolute -top-8 -left-8 w-32 h-32 opacity-50 float-1" viewBox="0 0 100 100">
                                                        <line x1="20" y1="20" x2="80" y2="20" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                                        <line x1="20" y1="20" x2="20" y2="80" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                                        <line x1="80" y1="20" x2="80" y2="80" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                                        <line x1="20" y1="80" x2="80" y2="80" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                                        <circle cx="20" cy="20" r="3" fill="#22D3EE" />
                                                        <circle cx="80" cy="20" r="3" fill="#22D3EE" />
                                                        <circle cx="20" cy="80" r="3" fill="#6366F1" />
                                                        <circle cx="80" cy="80" r="3" fill="#6366F1" />
                                                    </svg>

                                                    <!-- Main product frame -->
                                                    <div class="product-frame product-hover breathe relative">
                                                        <!-- Top bar -->
                                                        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-2.5 h-2.5 rounded-full bg-rose-400/40"></div>
                                                                <div class="w-2.5 h-2.5 rounded-full bg-amber-400/40"></div>
                                                                <div class="w-2.5 h-2.5 rounded-full bg-emerald-400/40"></div>
                                                            </div>
                                                            <div class="text-[10px] text-slate-500 font-mono">app.lumen.io/dashboard</div>
                                                            <div class="flex items-center gap-1.5">
                                                                <div class="w-5 h-5 rounded bg-slate-700/60"></div>
                                                            </div>
                                                        </div>

                                                        <!-- Body -->
                                                        <div class="flex">
                                                            <!-- Sidebar -->
                                                            <div class="w-12 border-r border-slate-700/40 py-3 flex flex-col items-center gap-3">
                                                                <div class="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400"></div>
                                                                <div class="w-6 h-6 rounded-md bg-cyan-400/20 border border-cyan-400/40"></div>
                                                                <div class="w-6 h-6 rounded-md bg-slate-700/40"></div>
                                                                <div class="w-6 h-6 rounded-md bg-slate-700/40"></div>
                                                                <div class="w-6 h-6 rounded-md bg-slate-700/40"></div>
                                                            </div>

                                                            <!-- Main content -->
                                                            <div class="flex-1 p-4">
                                                                <!-- Header row -->
                                                                <div class="flex items-center justify-between mb-4">
                                                                    <div>
                                                                        <div class="text-[10px] text-slate-500 mb-0.5">Resumen</div>
                                                                        <div class="text-sm text-white font-medium">Buenos días, Marina</div>
                                                                    </div>
                                                                    <div class="flex items-center gap-1.5">
                                                                        <div class="px-2 py-1 rounded-md bg-slate-700/40 text-[9px] text-slate-400">Hoy</div>
                                                                        <div class="px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-[9px] text-indigo-300">7d</div>
                                                                        <div class="px-2 py-1 rounded-md bg-slate-700/40 text-[9px] text-slate-400">30d</div>
                                                                    </div>
                                                                </div>

                                                                <!-- KPI cards -->
                                                                <div class="grid grid-cols-3 gap-2 mb-4">
                                                                    <div class="p-2 rounded-md bg-slate-800/40 border border-slate-700/30">
                                                                        <div class="text-[8px] text-slate-500 mb-0.5">Ingresos</div>
                                                                        <div class="text-xs text-white font-medium">$48.2K</div>
                                                                        <div class="text-[8px] text-emerald-400 mt-0.5">↑ 12.4%</div>
                                                                    </div>
                                                                    <div class="p-2 rounded-md bg-slate-800/40 border border-slate-700/30">
                                                                        <div class="text-[8px] text-slate-500 mb-0.5">Conversión</div>
                                                                        <div class="text-xs text-white font-medium">7.82%</div>
                                                                        <div class="text-[8px] text-emerald-400 mt-0.5">↑ 3.1%</div>
                                                                    </div>
                                                                    <div class="p-2 rounded-md bg-slate-800/40 border border-slate-700/30">
                                                                        <div class="text-[8px] text-slate-500 mb-0.5">Activos</div>
                                                                        <div class="text-xs text-white font-medium">1,284</div>
                                                                        <div class="text-[8px] text-rose-400 mt-0.5">↓ 0.4%</div>
                                                                    </div>
                                                                </div>

                                                                <!-- Chart -->
                                                                <div class="p-3 rounded-md bg-slate-800/30 border border-slate-700/30 mb-3">
                                                                    <div class="flex items-center justify-between mb-2">
                                                                        <div class="text-[10px] text-slate-300">Rendimiento semanal</div>
                                                                        <div class="flex items-center gap-2 text-[8px]">
                                                                            <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-cyan-400"></div><span class="text-slate-500">Actual</span></div>
                                                                            <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><span class="text-slate-500">Anterior</span></div>
                                                                        </div>
                                                                    </div>
                                                                    <svg viewBox="0 0 240 80" class="w-full h-16">
                                                                        <defs>
                                                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.4" />
                                                                                <stop offset="100%" stop-color="#22D3EE" stop-opacity="0" />
                                                                            </linearGradient>
                                                                            <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="0%" stop-color="#6366F1" stop-opacity="0.3" />
                                                                                <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <!-- Grid lines -->
                                                                        <line x1="0" y1="20" x2="240" y2="20" stroke="#334155" stroke-width="0.3" stroke-dasharray="2 2" />
                                                                        <line x1="0" y1="40" x2="240" y2="40" stroke="#334155" stroke-width="0.3" stroke-dasharray="2 2" />
                                                                        <line x1="0" y1="60" x2="240" y2="60" stroke="#334155" stroke-width="0.3" stroke-dasharray="2 2" />
                                                                        <!-- Area 2 (indigo, behind) -->
                                                                        <path d="M0,55 L30,50 L60,52 L90,45 L120,48 L150,40 L180,42 L210,38 L240,35 L240,80 L0,80 Z" fill="url(#areaGrad2)" />
                                                                        <path d="M0,55 L30,50 L60,52 L90,45 L120,48 L150,40 L180,42 L210,38 L240,35" stroke="#6366F1" stroke-width="1" fill="none" opacity="0.7" />
                                                                        <!-- Area 1 (cyan, front) -->
                                                                        <path d="M0,60 L30,45 L60,50 L90,30 L120,38 L150,25 L180,32 L210,18 L240,22 L240,80 L0,80 Z" fill="url(#areaGrad)" />
                                                                        <path d="M0,60 L30,45 L60,50 L90,30 L120,38 L150,25 L180,32 L210,18 L240,22" stroke="#22D3EE" stroke-width="1.5" fill="none" />
                                                                        <!-- Dot at end -->
                                                                        <circle cx="240" cy="22" r="3" fill="#22D3EE" />
                                                                        <circle cx="240" cy="22" r="6" fill="#22D3EE" opacity="0.3" style="animation: pulse-soft 2s infinite;" />
                                                                    </svg>
                                                                </div>

                                                                <!-- Mini bar chart -->
                                                                <div class="p-3 rounded-md bg-slate-800/30 border border-slate-700/30">
                                                                    <div class="text-[10px] text-slate-300 mb-2">Actividad por hora</div>
                                                                    <div class="flex items-end gap-1 h-8">
                                                                        <div class="bar w-full bg-cyan-400/30 rounded-sm" style="height: 30%; animation-delay: 0.1s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/40 rounded-sm" style="height: 50%; animation-delay: 0.15s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/50 rounded-sm" style="height: 65%; animation-delay: 0.2s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/60 rounded-sm" style="height: 45%; animation-delay: 0.25s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/70 rounded-sm" style="height: 80%; animation-delay: 0.3s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/80 rounded-sm" style="height: 95%; animation-delay: 0.35s;"></div>
                                                                        <div class="bar w-full bg-cyan-400 rounded-sm" style="height: 70%; animation-delay: 0.4s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/70 rounded-sm" style="height: 55%; animation-delay: 0.45s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/60 rounded-sm" style="height: 65%; animation-delay: 0.5s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/50 rounded-sm" style="height: 40%; animation-delay: 0.55s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/40 rounded-sm" style="height: 35%; animation-delay: 0.6s;"></div>
                                                                        <div class="bar w-full bg-cyan-400/30 rounded-sm" style="height: 25%; animation-delay: 0.65s;"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Floating chip 1 -->
                                                    <div class="absolute -top-4 -right-4 chip float-2 hidden md:block" style="animation-delay: 0.5s;">
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-6 h-6 rounded-md bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center">
                                                                <i class="fa-solid fa-check text-[10px] text-emerald-400"></i>
                                                            </div>
                                                            <div>
                                                                <div class="text-[9px] text-slate-500">Sincronizado</div>
                                                                <div class="text-[10px] text-white font-medium">hace 2 segundos</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Floating chip 2 -->
                                                    <div class="absolute -bottom-6 -left-6 chip float-1 hidden md:block" style="animation-delay: 1s;">
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-6 h-6 rounded-md bg-indigo-400/20 border border-indigo-400/40 flex items-center justify-center">
                                                                <i class="fa-solid fa-bolt text-[10px] text-indigo-300"></i>
                                                            </div>
                                                            <div>
                                                                <div class="text-[9px] text-slate-500">Flujo automático</div>
                                                                <div class="text-[10px] text-white font-medium">12 tareas completadas</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Floating chip 3 -->
                                                    <div class="absolute top-1/2 -right-8 chip float-2 hidden lg:block" style="animation-delay: 1.5s;">
                                                        <div class="text-[9px] text-slate-500 mb-1">Tiempo ahorrado</div>
                                                        <div class="text-sm text-white font-medium font-display">+ 4.2h</div>
                                                        <div class="text-[8px] text-emerald-400">hoy</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Logos trust bar -->
                                            <div class="reveal mt-24 lg:mt-32">
                                                <p class="text-center text-xs text-slate-500 tracking-widest uppercase mb-8">Equipos brillantes que confían en Lumen</p>
                                                <div class="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50">
                                                    <div class="text-slate-400 font-display text-lg font-medium">Northwind</div>
                                                    <div class="text-slate-400 font-display text-lg font-medium italic">Caldera</div>
                                                    <div class="text-slate-400 font-display text-lg font-medium tracking-widest">VERTEX</div>
                                                    <div class="text-slate-400 font-display text-lg font-light">meridian</div>
                                                    <div class="text-slate-400 font-display text-lg font-semibold">Quartz</div>
                                                    <div class="text-slate-400 font-display text-lg font-medium">Helio·</div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- PROBLEMA / SOLUCIÓN -->
                                    <section class="section relative">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="max-w-3xl mb-20">
                                                <div class="step-num reveal mb-4">01 — Por qué Lumen</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    El software empresarial<br>te ha estado fallando.
                                                </h2>
                                                <p class="reveal delay-2 text-lg text-slate-400 leading-relaxed">
                                                    Demasiadas pestañas. Demasiados avisos. Demasiada fricción para hacer lo que importa. Lumen existe porque el trabajo sofisticado merece una herramienta igual de sofisticada — y serena.
                                                </p>
                                            </div>

                                            <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
                                                <!-- Problema -->
                                                <div class="reveal glass rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                                                    <div class="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl"></div>
                                                    <div class="relative">
                                                        <div class="flex items-center gap-3 mb-6">
                                                            <div class="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                                                <i class="fa-solid fa-xmark text-rose-400"></i>
                                                            </div>
                                                            <span class="text-sm text-slate-400 tracking-wide">El dolor actual</span>
                                                        </div>

                                                        <!-- Caotic mockup -->
                                                        <div class="bg-slate-900/60 rounded-lg p-3 mb-6 border border-slate-700/40">
                                                            <div class="grid grid-cols-6 gap-1 mb-2">
                                                                <div class="h-3 bg-slate-700/60 rounded-sm"></div>
                                                                <div class="h-3 bg-rose-500/30 rounded-sm"></div>
                                                                <div class="h-3 bg-slate-700/60 rounded-sm"></div>
                                                                <div class="h-3 bg-amber-500/30 rounded-sm"></div>
                                                                <div class="h-3 bg-slate-700/60 rounded-sm"></div>
                                                                <div class="h-3 bg-rose-500/30 rounded-sm"></div>
                                                            </div>
                                                            <div class="space-y-1.5">
                                                                <div class="h-2 bg-slate-700/40 rounded w-full"></div>
                                                                <div class="h-2 bg-slate-700/40 rounded w-4/5"></div>
                                                                <div class="h-2 bg-slate-700/40 rounded w-3/5"></div>
                                                                <div class="h-2 bg-amber-500/20 rounded w-2/3"></div>
                                                                <div class="h-2 bg-slate-700/40 rounded w-full"></div>
                                                            </div>
                                                            <div class="flex gap-1 mt-3">
                                                                <div class="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[8px] rounded">Alerta</div>
                                                                <div class="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[8px] rounded">Pendiente</div>
                                                                <div class="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[8px] rounded">Error</div>
                                                                <div class="px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-[8px] rounded">+12</div>
                                                            </div>
                                                        </div>

                                                        <ul class="space-y-3 text-sm text-slate-400">
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-xmark text-rose-400/70 mt-1 text-xs"></i>
                                                                <span>Doce herramientas desconectadas para una sola tarea</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-xmark text-rose-400/70 mt-1 text-xs"></i>
                                                                <span>Notificaciones constantes que rompen tu foco</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-xmark text-rose-400/70 mt-1 text-xs"></i>
                                                                <span>Datos repartidos, decisiones improvisadas</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-xmark text-rose-400/70 mt-1 text-xs"></i>
                                                                <span>Onboarding eterno, adopción interminable</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <!-- Solución -->
                                                <div class="reveal delay-2 glass rounded-2xl p-8 lg:p-10 relative overflow-hidden" style="border-color: rgba(34, 211, 238, 0.2);">
                                                    <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
                                                    <div class="relative">
                                                        <div class="flex items-center gap-3 mb-6">
                                                            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center" style="animation: glow-pulse 3s infinite;">
                                                                <i class="fa-solid fa-check text-cyan-400"></i>
                                                            </div>
                                                            <span class="text-sm text-slate-300 tracking-wide">La experiencia Lumen</span>
                                                        </div>

                                                        <!-- Calm mockup -->
                                                        <div class="bg-slate-900/60 rounded-lg p-3 mb-6 border border-cyan-500/15">
                                                            <div class="flex items-center justify-between mb-3">
                                                                <div class="h-2 bg-slate-700/40 rounded w-1/4"></div>
                                                                <div class="flex gap-1">
                                                                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                                    <div class="text-[8px] text-slate-500">Sincronizado</div>
                                                                </div>
                                                            </div>
                                                            <div class="space-y-2">
                                                                <div class="flex items-center gap-2">
                                                                    <div class="w-1 h-6 bg-cyan-400 rounded-full"></div>
                                                                    <div class="flex-1">
                                                                        <div class="h-2 bg-slate-700/40 rounded w-3/4 mb-1"></div>
                                                                        <div class="h-1.5 bg-slate-700/30 rounded w-1/2"></div>
                                                                    </div>
                                                                    <div class="text-[8px] text-emerald-400">Listo</div>
                                                                </div>
                                                                <div class="flex items-center gap-2">
                                                                    <div class="w-1 h-6 bg-indigo-400 rounded-full"></div>
                                                                    <div class="flex-1">
                                                                        <div class="h-2 bg-slate-700/40 rounded w-2/3 mb-1"></div>
                                                                        <div class="h-1.5 bg-slate-700/30 rounded w-1/3"></div>
                                                                    </div>
                                                                    <div class="text-[8px] text-cyan-400">En curso</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <ul class="space-y-3 text-sm text-slate-300">
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-check text-cyan-400 mt-1 text-xs"></i>
                                                                <span>Una sola superficie, todo tu universo de trabajo</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-check text-cyan-400 mt-1 text-xs"></i>
                                                                <span>Silencio por defecto, notificaciones solo cuando importan</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-check text-cyan-400 mt-1 text-xs"></i>
                                                                <span>Datos unificados, decisiones claras en tiempo real</span>
                                                            </li>
                                                            <li class="flex items-start gap-3">
                                                                <i class="fa-solid fa-circle-check text-cyan-400 mt-1 text-xs"></i>
                                                                <span>Productivo en minutos, no en semanas</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- CARACTERÍSTICAS -->
                                    <section id="caracteristicas" class="section relative">
                                        <div class="ambient-blob" style="width: 500px; height: 500px; background: #6366F1; opacity: 0.06; top: 20%; right: -200px;"></div>

                                        <div class="max-w-7xl mx-auto px-6 lg:px-10 relative">
                                            <div class="max-w-3xl mb-20">
                                                <div class="step-num reveal mb-4">02 — Características</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    Cuatro piezas.<br>
                                                        <span class="grad-accent">Una experiencia completa.</span>
                                                </h2>
                                                <p class="reveal delay-2 text-lg text-slate-400">
                                                    Cada función está diseñada con la misma idea: eliminar fricción sin sacrificar profundidad.
                                                </p>
                                            </div>

                                            <div class="grid md:grid-cols-2 gap-6">

                                                <!-- Feature 1 -->
                                                <div class="feature-card reveal interactive">
                                                    <div class="flex items-start justify-between mb-6">
                                                        <div class="feature-icon">
                                                            <i class="fa-solid fa-wave-square"></i>
                                                        </div>
                                                        <span class="text-xs text-slate-500">01</span>
                                                    </div>
                                                    <h3 class="text-2xl font-medium mb-3">Analytics en tiempo real</h3>
                                                    <p class="text-slate-400 text-sm leading-relaxed mb-6">
                                                        Métricas que se actualizan al segundo. Sin refrescar. Sin esperar. Filtra, segmenta y comprende sin cambiar de pestaña.
                                                    </p>

                                                    <!-- Mini preview -->
                                                    <div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                                                        <div class="flex items-center justify-between mb-3">
                                                            <div class="text-[10px] text-slate-400">Ingresos · últimos 7 días</div>
                                                            <div class="flex items-center gap-1">
                                                                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400" style="animation: pulse-soft 2s infinite;"></div>
                                                                <div class="text-[9px] text-emerald-400">Live</div>
                                                            </div>
                                                        </div>
                                                        <svg viewBox="0 0 200 50" class="w-full h-12">
                                                            <defs>
                                                                <linearGradient id="f1grad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.4" />
                                                                    <stop offset="100%" stop-color="#22D3EE" stop-opacity="0" />
                                                                </linearGradient>
                                                            </defs>
                                                            <path d="M0,35 L25,28 L50,32 L75,20 L100,24 L125,15 L150,18 L175,10 L200,12 L200,50 L0,50 Z" fill="url(#f1grad)" />
                                                            <path d="M0,35 L25,28 L50,32 L75,20 L100,24 L125,15 L150,18 L175,10 L200,12" stroke="#22D3EE" stroke-width="1.5" fill="none" />
                                                            <circle cx="200" cy="12" r="2.5" fill="#22D3EE" />
                                                        </svg>
                                                        <div class="flex justify-between text-[9px] text-slate-500 mt-2">
                                                            <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Feature 2 -->
                                                <div class="feature-card reveal delay-1 interactive">
                                                    <div class="flex items-start justify-between mb-6">
                                                        <div class="feature-icon">
                                                            <i class="fa-solid fa-diagram-project"></i>
                                                        </div>
                                                        <span class="text-xs text-slate-500">02</span>
                                                    </div>
                                                    <h3 class="text-2xl font-medium mb-3">Flujos automatizados</h3>
                                                    <p class="text-slate-400 text-sm leading-relaxed mb-6">
                                                        Diseña procesos visuales que se ejecutan solos. Conecta triggers, condiciones y acciones con un lienzo limpio.
                                                    </p>

                                                    <div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                                                        <div class="flex items-center justify-between">
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center">
                                                                    <i class="fa-solid fa-bolt text-[10px] text-cyan-400"></i>
                                                                </div>
                                                                <div class="text-[10px] text-slate-300">Nuevo lead</div>
                                                            </div>
                                                            <svg width="30" height="10" viewBox="0 0 30 10"><line x1="0" y1="5" x2="25" y2="5" stroke="#64748B" stroke-width="1" stroke-dasharray="2 2" /><polygon points="25,2 28,5 25,8" fill="#64748B" /></svg>
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-8 h-8 rounded-lg bg-indigo-400/15 border border-indigo-400/30 flex items-center justify-center">
                                                                    <i class="fa-solid fa-filter text-[10px] text-indigo-300"></i>
                                                                </div>
                                                                <div class="text-[10px] text-slate-300">Filtrar</div>
                                                            </div>
                                                            <svg width="30" height="10" viewBox="0 0 30 10"><line x1="0" y1="5" x2="25" y2="5" stroke="#64748B" stroke-width="1" stroke-dasharray="2 2" /><polygon points="25,2 28,5 25,8" fill="#64748B" /></svg>
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-8 h-8 rounded-lg bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                                                                    <i class="fa-solid fa-envelope text-[10px] text-emerald-400"></i>
                                                                </div>
                                                                <div class="text-[10px] text-slate-300">Email</div>
                                                            </div>
                                                        </div>
                                                        <div class="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                                                            <div class="text-[9px] text-slate-500">847 ejecuciones · 0 errores</div>
                                                            <div class="text-[9px] text-emerald-400">Activo</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Feature 3 -->
                                                <div class="feature-card reveal delay-2 interactive">
                                                    <div class="flex items-start justify-between mb-6">
                                                        <div class="feature-icon">
                                                            <i class="fa-solid fa-people-group"></i>
                                                        </div>
                                                        <span class="text-xs text-slate-500">03</span>
                                                    </div>
                                                    <h3 class="text-2xl font-medium mb-3">Colaboración fluida</h3>
                                                    <p class="text-slate-400 text-sm leading-relaxed mb-6">
                                                        Comentarios contextuales, presencia en vivo, cambios sincronizados. Tu equipo trabaja junto sin reuniones innecesarias.
                                                    </p>

                                                    <div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                                                        <div class="flex items-center gap-2 mb-3">
                                                            <div class="flex -space-x-2">
                                                                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 border-2 border-slate-900"></div>
                                                                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-slate-900"></div>
                                                                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-rose-400 border-2 border-slate-900"></div>
                                                            </div>
                                                            <div class="text-[10px] text-slate-400">3 editando ahora</div>
                                                            <div class="ml-auto flex items-center gap-1">
                                                                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400" style="animation: pulse-soft 1.5s infinite;"></div>
                                                                <div class="text-[9px] text-emerald-400">Sincronizado</div>
                                                            </div>
                                                        </div>
                                                        <div class="space-y-2">
                                                            <div class="flex items-start gap-2 p-2 rounded bg-slate-800/40">
                                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex-shrink-0"></div>
                                                                <div class="flex-1">
                                                                    <div class="text-[9px] text-slate-300">Marina <span class="text-slate-500">· hace 2m</span></div>
                                                                    <div class="text-[10px] text-slate-400">¿Aprobamos el Q3?</div>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-start gap-2 p-2 rounded bg-indigo-500/5 border border-indigo-500/20">
                                                                <div class="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex-shrink-0"></div>
                                                                <div class="flex-1">
                                                                    <div class="text-[9px] text-slate-300">Diego <span class="text-slate-500">· ahora</span></div>
                                                                    <div class="text-[10px] text-slate-400">Aprobado ✓</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Feature 4 -->
                                                <div class="feature-card reveal delay-3 interactive">
                                                    <div class="flex items-start justify-between mb-6">
                                                        <div class="feature-icon">
                                                            <i class="fa-solid fa-shield-halved"></i>
                                                        </div>
                                                        <span class="text-xs text-slate-500">04</span>
                                                    </div>
                                                    <h3 class="text-2xl font-medium mb-3">Seguridad empresarial</h3>
                                                    <p class="text-slate-400 text-sm leading-relaxed mb-6">
                                                        Cifrado E2E, SSO, auditoría completa y residencia de datos. SOC 2 Tipo II y GDPR por defecto, no como extra.
                                                    </p>

                                                    <div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                                                        <div class="grid grid-cols-2 gap-3">
                                                            <div class="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                                                                <div class="flex items-center gap-1.5 mb-1">
                                                                    <i class="fa-solid fa-lock text-[9px] text-emerald-400"></i>
                                                                    <div class="text-[9px] text-slate-300">Cifrado AES-256</div>
                                                                </div>
                                                                <div class="text-[8px] text-slate-500">E2E en reposo y tránsito</div>
                                                            </div>
                                                            <div class="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                                                                <div class="flex items-center gap-1.5 mb-1">
                                                                    <i class="fa-solid fa-key text-[9px] text-emerald-400"></i>
                                                                    <div class="text-[9px] text-slate-300">SSO / SAML</div>
                                                                </div>
                                                                <div class="text-[8px] text-slate-500">Okta, Azure, Google</div>
                                                            </div>
                                                            <div class="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                                                                <div class="flex items-center gap-1.5 mb-1">
                                                                    <i class="fa-solid fa-certificate text-[9px] text-emerald-400"></i>
                                                                    <div class="text-[9px] text-slate-300">SOC 2 Tipo II</div>
                                                                </div>
                                                                <div class="text-[8px] text-slate-500">Auditado anualmente</div>
                                                            </div>
                                                            <div class="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                                                                <div class="flex items-center gap-1.5 mb-1">
                                                                    <i class="fa-solid fa-globe text-[9px] text-emerald-400"></i>
                                                                    <div class="text-[9px] text-slate-300">GDPR / CCPA</div>
                                                                </div>
                                                                <div class="text-[8px] text-slate-500">Cumplimiento total</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </section>

                                    <!-- CÓMO FUNCIONA -->
                                    <section id="flujo" class="section relative">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="max-w-3xl mb-20">
                                                <div class="step-num reveal mb-4">03 — Cómo funciona</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    De cero a flujo<br>en menos de una hora.
                                                </h2>
                                                <p class="reveal delay-2 text-lg text-slate-400">
                                                    Sin migraciones dolorosas. Sin consultores. Sin semanas de configuración.
                                                </p>
                                            </div>

                                            <!-- Steps con línea conectora -->
                                            <div class="relative">
                                                <!-- Línea decorativa horizontal -->
                                                <div class="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px">
                                                    <div class="w-full h-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                                    <div class="absolute top-0 left-0 h-full" id="stepLine" style="width: 0%; background: linear-gradient(90deg, #22D3EE, #6366F1); transition: width 1.5s cubic-bezier(0.16,1,0.3,1);"></div>
                                                </div>

                                                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
                                                    <!-- Step 1 -->
                                                    <div class="reveal text-center lg:text-left">
                                                        <div class="relative inline-flex items-center justify-center mb-6">
                                                            <div class="w-24 h-24 rounded-full glass flex items-center justify-center relative z-10">
                                                                <i class="fa-solid fa-plug text-2xl text-cyan-400"></i>
                                                            </div>
                                                            <div class="absolute inset-0 rounded-full border border-cyan-400/20" style="animation: ping-soft 3s infinite;"></div>
                                                        </div>
                                                        <div class="step-num mb-2">Paso 01</div>
                                                        <h3 class="text-xl font-medium mb-2">Conecta tus fuentes</h3>
                                                        <p class="text-sm text-slate-400 leading-relaxed">
                                                            Integra tus bases de datos, APIs y herramientas en unos clics. Más de 200 conectores nativos.
                                                        </p>
                                                    </div>

                                                    <!-- Step 2 -->
                                                    <div class="reveal delay-1 text-center lg:text-left">
                                                        <div class="relative inline-flex items-center justify-center mb-6">
                                                            <div class="w-24 h-24 rounded-full glass flex items-center justify-center relative z-10">
                                                                <i class="fa-solid fa-pen-ruler text-2xl text-indigo-400"></i>
                                                            </div>
                                                        </div>
                                                        <div class="step-num mb-2" style="color: #6366F1;">Paso 02</div>
                                                        <h3 class="text-xl font-medium mb-2">Diseña tu espacio</h3>
                                                        <p class="text-sm text-slate-400 leading-relaxed">
                                                            Arrastra, suelta, organiza. Crea vistas, dashboards y flujos con un lienzo visual intuitivo.
                                                        </p>
                                                    </div>

                                                    <!-- Step 3 -->
                                                    <div class="reveal delay-2 text-center lg:text-left">
                                                        <div class="relative inline-flex items-center justify-center mb-6">
                                                            <div class="w-24 h-24 rounded-full glass flex items-center justify-center relative z-10">
                                                                <i class="fa-solid fa-wand-magic-sparkles text-2xl text-cyan-400"></i>
                                                            </div>
                                                        </div>
                                                        <div class="step-num mb-2">Paso 03</div>
                                                        <h3 class="text-xl font-medium mb-2">Automatiza el ritmo</h3>
                                                        <p class="text-sm text-slate-400 leading-relaxed">
                                                            Define reglas y triggers. Lumen ejecuta, notifica y aprende — tú te enfocas en decidir.
                                                        </p>
                                                    </div>

                                                    <!-- Step 4 -->
                                                    <div class="reveal delay-3 text-center lg:text-left">
                                                        <div class="relative inline-flex items-center justify-center mb-6">
                                                            <div class="w-24 h-24 rounded-full glass flex items-center justify-center relative z-10">
                                                                <i class="fa-solid fa-chart-line text-2xl text-emerald-400"></i>
                                                            </div>
                                                        </div>
                                                        <div class="step-num mb-2" style="color: #10B981;">Paso 04</div>
                                                        <h3 class="text-xl font-medium mb-2">Observa y mejora</h3>
                                                        <p class="text-sm text-slate-400 leading-relaxed">
                                                            Métricas claras, tendencias honestas. Itera con datos, no con corazonadas.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- TESTIMONIOS -->
                                    <section class="section relative">
                                        <div class="ambient-blob" style="width: 400px; height: 400px; background: #22D3EE; opacity: 0.05; bottom: 20%; left: -100px;"></div>

                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="max-w-3xl mb-20">
                                                <div class="step-num reveal mb-4">04 — Testimonios</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    Resultados que se sienten<br>desde la primera semana.
                                                </h2>
                                            </div>

                                            <div class="grid md:grid-cols-3 gap-6">

                                                <!-- Testimonio 1 -->
                                                <div class="reveal glass rounded-2xl p-8 flex flex-col">
                                                    <div class="text-cyan-400/30 text-5xl font-display leading-none mb-4">"</div>
                                                    <p class="text-slate-300 leading-relaxed mb-8 flex-1">
                                                        Cambiamos 6 herramientas por Lumen. La primera semana ya sentíamos que recuperábamos nuestro tiempo. Es el primer software que no se siente como software.
                                                    </p>
                                                    <div class="flex items-center gap-4 pt-6 border-t border-slate-700/40">
                                                        <img src="https://picsum.photos/seed/marina/80/80.jpg" alt="Marina" class="w-12 h-12 rounded-full object-cover">
                                                            <div class="flex-1">
                                                                <div class="text-sm text-white font-medium">Marina Velasco</div>
                                                                <div class="text-xs text-slate-500">COO · Northwind Labs</div>
                                                            </div>
                                                    </div>
                                                    <div class="mt-6 pt-6 border-t border-slate-700/40">
                                                        <div class="text-3xl font-display font-medium grad-accent">-68%</div>
                                                        <div class="text-xs text-slate-500 mt-1">tiempo de reporting</div>
                                                    </div>
                                                </div>

                                                <!-- Testimonio 2 -->
                                                <div class="reveal delay-1 glass rounded-2xl p-8 flex flex-col" style="border-color: rgba(99, 102, 241, 0.2);">
                                                    <div class="text-indigo-400/30 text-5xl font-display leading-none mb-4">"</div>
                                                    <p class="text-slate-300 leading-relaxed mb-8 flex-1">
                                                        Como fundador técnico, valoro el detalle. Lumen tiene la sofisticación que exigiría de mi propio equipo. Y la calma que necesitaba mi empresa.
                                                    </p>
                                                    <div class="flex items-center gap-4 pt-6 border-t border-slate-700/40">
                                                        <img src="https://picsum.photos/seed/diego/80/80.jpg" alt="Diego" class="w-12 h-12 rounded-full object-cover">
                                                            <div class="flex-1">
                                                                <div class="text-sm text-white font-medium">Diego Marrero</div>
                                                                <div class="text-xs text-slate-500">CEO · Caldera</div>
                                                            </div>
                                                    </div>
                                                    <div class="mt-6 pt-6 border-t border-slate-700/40">
                                                        <div class="text-3xl font-display font-medium grad-accent">+3.4x</div>
                                                        <div class="text-xs text-slate-500 mt-1">velocidad operativa</div>
                                                    </div>
                                                </div>

                                                <!-- Testimonio 3 -->
                                                <div class="reveal delay-2 glass rounded-2xl p-8 flex flex-col">
                                                    <div class="text-emerald-400/30 text-5xl font-display leading-none mb-4">"</div>
                                                    <p class="text-slate-300 leading-relaxed mb-8 flex-1">
                                                        Lumen no impone su lógica. Se adapta a la nuestra. Es la primera vez que un sistema siente que trabaja con nosotros, no contra nosotros.
                                                    </p>
                                                    <div class="flex items-center gap-4 pt-6 border-t border-slate-700/40">
                                                        <img src="https://picsum.photos/seed/aria/80/80.jpg" alt="Aria" class="w-12 h-12 rounded-full object-cover">
                                                            <div class="flex-1">
                                                                <div class="text-sm text-white font-medium">Aria Tanaka</div>
                                                                <div class="text-xs text-slate-500">VP Operations · Vertex</div>
                                                            </div>
                                                    </div>
                                                    <div class="mt-6 pt-6 border-t border-slate-700/40">
                                                        <div class="text-3xl font-display font-medium grad-accent">$1.2M</div>
                                                        <div class="text-xs text-slate-500 mt-1">ahorro anual estimado</div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </section>

                                    <!-- INTEGRACIONES -->
                                    <section class="section relative">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="text-center max-w-2xl mx-auto mb-16">
                                                <div class="step-num reveal mb-4">05 — Integraciones</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    Conecta todo lo que ya usas.
                                                </h2>
                                                <p class="reveal delay-2 text-slate-400">
                                                    Más de 200 integraciones nativas. Si no existe, nuestra API la hace posible en horas.
                                                </p>
                                            </div>

                                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                <div class="integration-cell reveal interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-slack text-2xl mb-2"></i>
                                                        <div class="text-xs">Slack</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-1 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-github text-2xl mb-2"></i>
                                                        <div class="text-xs">GitHub</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-2 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-figma text-2xl mb-2"></i>
                                                        <div class="text-xs">Figma</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-google text-2xl mb-2"></i>
                                                        <div class="text-xs">Workspace</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-1 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-stripe-s text-2xl mb-2"></i>
                                                        <div class="text-xs">Stripe</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-2 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-notion text-2xl mb-2" style="font-size: 22px;"></i>
                                                        <div class="text-xs">Notion</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-aws text-2xl mb-2"></i>
                                                        <div class="text-xs">AWS</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-1 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-jira text-2xl mb-2"></i>
                                                        <div class="text-xs">Jira</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-2 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-dropbox text-2xl mb-2"></i>
                                                        <div class="text-xs">Dropbox</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-hubspot text-2xl mb-2"></i>
                                                        <div class="text-xs">HubSpot</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-1 interactive">
                                                    <div class="text-center">
                                                        <i class="fa-brands fa-zoom text-2xl mb-2"></i>
                                                        <div class="text-xs">Zoom</div>
                                                    </div>
                                                </div>
                                                <div class="integration-cell reveal delay-2 interactive" style="background: rgba(99, 102, 241, 0.06); border-color: rgba(99, 102, 241, 0.3);">
                                                    <div class="text-center">
                                                        <i class="fa-solid fa-plus text-xl mb-2 text-indigo-400"></i>
                                                        <div class="text-xs text-indigo-300">Ver todas</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- PRECIOS -->
                                    <section id="precios" class="section relative">
                                        <div class="ambient-blob" style="width: 500px; height: 500px; background: #6366F1; opacity: 0.07; top: 30%; right: -200px;"></div>

                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="text-center max-w-2xl mx-auto mb-16">
                                                <div class="step-num reveal mb-4">06 — Precios</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    Precios honestos.<br>Escala sin sorpresas.
                                                </h2>
                                                <p class="reveal delay-2 text-slate-400">
                                                    Sin costos ocultos. Sin planes con trampa. Cambia o cancela cuando quieras.
                                                </p>
                                            </div>

                                            <div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

                                                <!-- Starter -->
                                                <div class="pricing-card reveal interactive">
                                                    <div class="mb-6">
                                                        <div class="text-sm text-slate-400 mb-2">Starter</div>
                                                        <div class="flex items-baseline gap-1">
                                                            <span class="text-4xl font-display font-medium">$0</span>
                                                            <span class="text-sm text-slate-500">/mes</span>
                                                        </div>
                                                        <div class="text-xs text-slate-500 mt-2">Para individuos y proyectos pequeños</div>
                                                    </div>

                                                    <a href="#" class="block w-full btn-secondary text-center mb-8 interactive">
                                                        Empezar gratis
                                                    </a>

                                                    <ul class="space-y-3 text-sm">
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Hasta 3 usuarios</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>5 integraciones</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Dashboards ilimitados</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>1GB de almacenamiento</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-500">
                                                            <i class="fa-solid fa-minus text-xs mt-1"></i>
                                                            <span>Soporte por comunidad</span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <!-- Pro (featured) -->
                                                <div class="pricing-card featured reveal delay-1 interactive md:-mt-4 md:mb-4 relative">
                                                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase" style="background: linear-gradient(135deg, #6366F1, #22D3EE); color: white;">
                                                        Más elegido
                                                    </div>

                                                    <div class="mb-6">
                                                        <div class="text-sm text-indigo-300 mb-2">Pro</div>
                                                        <div class="flex items-baseline gap-1">
                                                            <span class="text-4xl font-display font-medium">$24</span>
                                                            <span class="text-sm text-slate-500">/mes por usuario</span>
                                                        </div>
                                                        <div class="text-xs text-slate-500 mt-2">Para equipos en crecimiento</div>
                                                    </div>

                                                    <a href="#" class="block w-full btn-primary text-center mb-8 interactive">
                                                        Probar 14 días gratis
                                                    </a>

                                                    <ul class="space-y-3 text-sm">
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>Usuarios ilimitados</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>Integraciones ilimitadas</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>Flujos automatizados avanzados</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>100GB de almacenamiento</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>Soporte prioritario 24/7</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-200">
                                                            <i class="fa-solid fa-check text-cyan-400 text-xs mt-1"></i>
                                                            <span>SSO y roles avanzados</span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <!-- Enterprise -->
                                                <div class="pricing-card reveal delay-2 interactive">
                                                    <div class="mb-6">
                                                        <div class="text-sm text-slate-400 mb-2">Enterprise</div>
                                                        <div class="flex items-baseline gap-1">
                                                            <span class="text-4xl font-display font-medium">A medida</span>
                                                        </div>
                                                        <div class="text-xs text-slate-500 mt-2">Para organizaciones grandes</div>
                                                    </div>

                                                    <a href="#" class="block w-full btn-secondary text-center mb-8 interactive">
                                                        Hablar con ventas
                                                    </a>

                                                    <ul class="space-y-3 text-sm">
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Todo lo de Pro</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Residencia de datos personalizada</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>SLA 99.99% garantizado</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Customer Success dedicado</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Auditorías y compliance avanzado</span>
                                                        </li>
                                                        <li class="flex items-start gap-3 text-slate-300">
                                                            <i class="fa-solid fa-check text-emerald-400 text-xs mt-1"></i>
                                                            <span>Onboarding personalizado</span>
                                                        </li>
                                                    </ul>
                                                </div>

                                            </div>
                                        </div>
                                    </section>

                                    <!-- EQUIPO -->
                                    <section id="equipo" class="section relative">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="max-w-3xl mb-20">
                                                <div class="step-num reveal mb-4">07 — Sobre nosotros</div>
                                                <h2 class="reveal delay-1 text-4xl md:text-5xl font-medium tracking-tight mb-6">
                                                    Personas que entienden<br>el trabajo complejo.
                                                </h2>
                                                <p class="reveal delay-2 text-lg text-slate-400">
                                                    Construimos Lumen porque vivimos el dolor. Después de 15 años en equipos de producto, datos y operaciones, decidimos hacer la herramienta que deseamos haber tenido.
                                                </p>
                                            </div>

                                            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

                                                <div class="reveal interactive">
                                                    <div class="relative mb-5 overflow-hidden rounded-xl group">
                                                        <img src="https://picsum.photos/seed/founder1/400/500.jpg" alt="Founder" class="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105">
                                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                                                    </div>
                                                    <div class="text-base font-medium text-white">Elena Cifuentes</div>
                                                    <div class="text-xs text-cyan-400 mb-3">Co-fundadora · CEO</div>
                                                    <p class="text-sm text-slate-400 leading-relaxed">"La simplicidad no es ausencia. Es elección precisa."</p>
                                                </div>

                                                <div class="reveal delay-1 interactive">
                                                    <div class="relative mb-5 overflow-hidden rounded-xl group">
                                                        <img src="https://picsum.photos/seed/founder2/400/500.jpg" alt="Founder" class="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105">
                                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                                                    </div>
                                                    <div class="text-base font-medium text-white">Mateo Olvera</div>
                                                    <div class="text-xs text-indigo-400 mb-3">Co-fundador · CTO</div>
                                                    <p class="text-sm text-slate-400 leading-relaxed">"La mejor interfaz es la que se vuelve invisible."</p>
                                                </div>

                                                <div class="reveal delay-2 interactive">
                                                    <div class="relative mb-5 overflow-hidden rounded-xl group">
                                                        <img src="https://picsum.photos/seed/founder3/400/500.jpg" alt="Founder" class="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105">
                                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                                                    </div>
                                                    <div class="text-base font-medium text-white">Nora Beltrán</div>
                                                    <div class="text-xs text-emerald-400 mb-3">Co-fundadora · Design</div>
                                                    <p class="text-sm text-slate-400 leading-relaxed">"El silencio también es diseño. Acallar lo que sobra."</p>
                                                </div>

                                                <div class="reveal delay-3 interactive">
                                                    <div class="relative mb-5 overflow-hidden rounded-xl group">
                                                        <img src="https://picsum.photos/seed/founder4/400/500.jpg" alt="Founder" class="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105">
                                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                                                    </div>
                                                    <div class="text-base font-medium text-white">Iván Soler</div>
                                                    <div class="text-xs text-cyan-400 mb-3">Co-fundador · Engineering</div>
                                                    <p class="text-sm text-slate-400 leading-relaxed">"Construir sistemas calmos requiere pensar dos veces cada decisión."</p>
                                                </div>

                                            </div>

                                            <!-- Métricas del equipo -->
                                            <div class="reveal mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-slate-700/40">
                                                <div>
                                                    <div class="text-3xl md:text-4xl font-display font-medium grad-accent mb-2">12K+</div>
                                                    <div class="text-xs text-slate-500">equipos activos</div>
                                                </div>
                                                <div>
                                                    <div class="text-3xl md:text-4xl font-display font-medium grad-accent mb-2">99.98%</div>
                                                    <div class="text-xs text-slate-500">uptime 2024</div>
                                                </div>
                                                <div>
                                                    <div class="text-3xl md:text-4xl font-display font-medium grad-accent mb-2">48</div>
                                                    <div class="text-xs text-slate-500">personas en el equipo</div>
                                                </div>
                                                <div>
                                                    <div class="text-3xl md:text-4xl font-display font-medium grad-accent mb-2">2019</div>
                                                    <div class="text-xs text-slate-500">año de fundación</div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- CTA FINAL -->
                                    <section id="cta" class="section relative overflow-hidden">
                                        <div class="ambient-blob" style="width: 600px; height: 600px; background: #6366F1; opacity: 0.15; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                                        <div class="ambient-blob" style="width: 400px; height: 400px; background: #22D3EE; opacity: 0.1; top: 20%; right: 10%;"></div>

                                        <div class="max-w-4xl mx-auto px-6 lg:px-10 text-center relative">
                                            <!-- Nodes decorativos -->
                                            <svg class="absolute -top-8 -left-8 w-24 h-24 opacity-30 float-1" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="3" fill="#22D3EE" />
                                                <circle cx="20" cy="20" r="2" fill="#6366F1" />
                                                <circle cx="80" cy="20" r="2" fill="#6366F1" />
                                                <circle cx="20" cy="80" r="2" fill="#6366F1" />
                                                <circle cx="80" cy="80" r="2" fill="#6366F1" />
                                                <line x1="50" y1="50" x2="20" y2="20" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="80" y2="20" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="20" y2="80" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="80" y2="80" stroke="#22D3EE" stroke-width="0.5" class="dash-flow" />
                                            </svg>
                                            <svg class="absolute -bottom-8 -right-8 w-24 h-24 opacity-30 float-2" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="3" fill="#6366F1" />
                                                <circle cx="20" cy="20" r="2" fill="#22D3EE" />
                                                <circle cx="80" cy="20" r="2" fill="#22D3EE" />
                                                <circle cx="20" cy="80" r="2" fill="#22D3EE" />
                                                <circle cx="80" cy="80" r="2" fill="#22D3EE" />
                                                <line x1="50" y1="50" x2="20" y2="20" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="80" y2="20" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="20" y2="80" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                                <line x1="50" y1="50" x2="80" y2="80" stroke="#6366F1" stroke-width="0.5" class="dash-flow" />
                                            </svg>

                                            <div class="reveal">
                                                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-8">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" style="animation: pulse-soft 2s infinite;"></span>
                                                    <span class="text-xs text-slate-300 tracking-wide">Disponible hoy · Sin tarjeta</span>
                                                </div>
                                            </div>

                                            <h2 class="reveal delay-1 text-4xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.1]">
                                                El trabajo complejo,<br>
                                                    <span class="grad-accent">hecho sereno.</span>
                                            </h2>

                                            <p class="reveal delay-2 text-lg text-slate-400 mb-10 max-w-xl mx-auto">
                                                Únete a más de 12,000 equipos que recuperaron su calma. Empieza gratis en menos de 5 minutos.
                                            </p>

                                            <div class="reveal delay-3 flex flex-wrap items-center justify-center gap-4 mb-8">
                                                <a href="#" class="btn-primary interactive cta-hover">
                                                    Empezar gratis ahora
                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                </a>
                                                <a href="#" class="btn-secondary interactive cta-hover">
                                                    <i class="fa-solid fa-calendar text-xs"></i>
                                                    Agendar demo
                                                </a>
                                            </div>

                                            <div class="reveal delay-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-check text-emerald-400"></i>
                                                    14 días premium incluidos
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-check text-emerald-400"></i>
                                                    Migración asistida gratis
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <i class="fa-solid fa-check text-emerald-400"></i>
                                                    Cancela cuando quieras
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- FOOTER -->
                                    <footer class="border-t border-slate-700/40 py-16 relative">
                                        <div class="max-w-7xl mx-auto px-6 lg:px-10">
                                            <div class="grid md:grid-cols-12 gap-10 mb-12">

                                                <div class="md:col-span-4">
                                                    <a href="#" class="flex items-center gap-2.5 mb-5">
                                                        <div class="logo-mark">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linejoin="round" opacity="0.6" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-display font-medium text-lg tracking-tight">Lumen</span>
                                                    </a>
                                                    <p class="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
                                                        Software sereno para trabajo complejo. Construimos herramientas que devuelven tiempo, claridad y calma a los equipos.
                                                    </p>

                                                    <!-- Newsletter -->
                                                    <div class="mb-6">
                                                        <div class="text-xs text-slate-500 mb-2">Recibe notas sobre producto, una vez al mes:</div>
                                                        <form class="flex gap-2" onsubmit="event.preventDefault(); showToast('Gracias. Te avisaremos pronto.');">
                                                            <input type="email" placeholder="tu@correo.com" required class="flex-1 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition">
                                                                <button type="submit" class="btn-primary text-sm interactive" style="padding: 8px 16px;">
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </button>
                                                        </form>
                                                    </div>
                                                </div>

                                                <div class="md:col-span-2">
                                                    <div class="text-xs text-slate-500 uppercase tracking-widest mb-4">Producto</div>
                                                    <ul class="space-y-2.5 text-sm text-slate-400">
                                                        <li><a href="#" class="hover:text-white transition interactive">Características</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Integraciones</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Precios</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Cambios</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Roadmap</a></li>
                                                    </ul>
                                                </div>

                                                <div class="md:col-span-2">
                                                    <div class="text-xs text-slate-500 uppercase tracking-widest mb-4">Empresa</div>
                                                    <ul class="space-y-2.5 text-sm text-slate-400">
                                                        <li><a href="#" class="hover:text-white transition interactive">Sobre nosotros</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Equipo</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Carreras</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Blog</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Prensa</a></li>
                                                    </ul>
                                                </div>

                                                <div class="md:col-span-2">
                                                    <div class="text-xs text-slate-500 uppercase tracking-widest mb-4">Recursos</div>
                                                    <ul class="space-y-2.5 text-sm text-slate-400">
                                                        <li><a href="#" class="hover:text-white transition interactive">Documentación</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">API</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Guías</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Estado del servicio</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Comunidad</a></li>
                                                    </ul>
                                                </div>

                                                <div class="md:col-span-2">
                                                    <div class="text-xs text-slate-500 uppercase tracking-widest mb-4">Legal</div>
                                                    <ul class="space-y-2.5 text-sm text-slate-400">
                                                        <li><a href="#" class="hover:text-white transition interactive">Privacidad</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Términos</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Seguridad</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">GDPR</a></li>
                                                        <li><a href="#" class="hover:text-white transition interactive">Cookies</a></li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-8 border-t border-slate-700/40">
                                                <div class="flex items-center gap-4 text-xs text-slate-500">
                                                    <span>© 2024 Lumen Software, S.L.</span>
                                                    <span class="hidden md:inline">·</span>
                                                    <span class="hidden md:inline">Hecho con calma en Madrid</span>
                                                </div>
                                                <div class="flex items-center gap-4">
                                                    <a href="#" class="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-cyan-400 transition interactive" aria-label="Twitter">
                                                        <i class="fa-brands fa-x-twitter text-sm"></i>
                                                    </a>
                                                    <a href="#" class="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-cyan-400 transition interactive" aria-label="LinkedIn">
                                                        <i class="fa-brands fa-linkedin-in text-sm"></i>
                                                    </a>
                                                    <a href="#" class="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-cyan-400 transition interactive" aria-label="GitHub">
                                                        <i class="fa-brands fa-github text-sm"></i>
                                                    </a>
                                                    <a href="#" class="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-cyan-400 transition interactive" aria-label="YouTube">
                                                        <i class="fa-brands fa-youtube text-sm"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </footer>

                                    <!-- Toast -->
                                    <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl glass text-sm text-white opacity-0 pointer-events-none transition-all duration-500 z-[100]" style="transform: translate(-50%, 20px);">
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid fa-check-circle text-emerald-400"></i>
                                            <span id="toastMsg"></span>
                                        </div>
                                    </div>

                                    <script>
  // Cursor personalizado
                                        const dot = document.getElementById('cursorDot');
                                        const ring = document.getElementById('cursorRing');
                                        let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  
  document.addEventListener('mousemove', (e) => {
                                            mouseX = e.clientX;
                                        mouseY = e.clientY;
                                        dot.style.transform = \`translate(\${mouseX}px, \${mouseY}px) translate(-50%, -50%)\`;
  });

                                        function animateRing() {
                                            ringX += (mouseX - ringX) * 0.15;
                                        ringY += (mouseY - ringY) * 0.15;
                                        ring.style.transform = \`translate(\${ringX}px, \${ringY}px) translate(-50%, -50%)\`;
                                        requestAnimationFrame(animateRing);
  }
                                        animateRing();

  // Hover states
  document.querySelectorAll('.interactive').forEach(el => {
                                            el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
  document.querySelectorAll('.cta-hover').forEach(el => {
                                            el.addEventListener('mouseenter', () => ring.classList.add('cta'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cta'));
  });

                                        // Scroll progress
                                        const progress = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
                                        const max = document.documentElement.scrollHeight - window.innerHeight;
                                        const pct = Math.min(scrolled / max, 1);
                                        progress.style.transform = \`scaleX(\${pct})\`;
  });

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
                                            entries.forEach(entry => {
                                                if (entry.isIntersecting) {
                                                    entry.target.classList.add('visible');
                                                }
                                            });
  }, {threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

                                        // Step line progreso
                                        const stepLine = document.getElementById('stepLine');
                                        const flujoSection = document.getElementById('flujo');
                                        if (flujoSection && stepLine) {
    const flujoObs = new IntersectionObserver((entries) => {
                                            entries.forEach(entry => {
                                                if (entry.isIntersecting) {
                                                    setTimeout(() => { stepLine.style.width = '100%'; }, 300);
                                                }
                                            });
    }, {threshold: 0.3 });
                                        flujoObs.observe(flujoSection);
  }

                                        // Toast
                                        function showToast(msg) {
    const toast = document.getElementById('toast');
                                        document.getElementById('toastMsg').textContent = msg;
                                        toast.style.opacity = '1';
                                        toast.style.transform = 'translate(-50%, 0)';
    setTimeout(() => {
                                            toast.style.opacity = '0';
                                        toast.style.transform = 'translate(-50%, 20px)';
    }, 3000);
  }

  // Smooth scroll para anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                                            anchor.addEventListener('click', (e) => {
                                                const target = document.querySelector(anchor.getAttribute('href'));
                                                if (target) {
                                                    e.preventDefault();
                                                    const offset = 80;
                                                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                                                    window.scrollTo({ top, behavior: 'smooth' });
                                                }
                                            });
  });

                                        // Parallax sutil en hero mockup
                                        const heroMockup = document.querySelector('.product-frame');
                                        if (heroMockup) {
                                            document.addEventListener('mousemove', (e) => {
                                                const x = (e.clientX / window.innerWidth - 0.5) * 8;
                                                const y = (e.clientY / window.innerHeight - 0.5) * 8;
                                                heroMockup.style.transform = \`perspective(1000px) rotateY(\${x * 0.3}deg) rotateX(\${-y * 0.3}deg)\`;
                                            });
  }
                                    </script>

                                </body>
                            </html>`
  },
  "multiplataforma": {
    title: `SplitWise Pro — Finanzas Compartidas Premium`,
    brand: `Caso de Éxito: Multiplataforma`,
    desc: `Versión premium y más avanzada de una app para dividir gastos y gestionar presupuestos de eventos y hogares compartidos.`,
    gradient: `from-emerald-600 to-zinc-700`,
    challenge: `Unificar la experiencia de usuario móvil (iOS/Android) con las capacidades de gestión masiva y gráficos interactivos de la versión web/desktop.`,
    solution: `Maverlang AI diseñó SplitWise Pro implementando una sidebar de navegación en escritorio, tarjetas de balance en tiempo real, resumen de gastos con gráficos y un modal adaptativo de adición de gastos.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `Global`,
    industry: `Fintech / Productividad`,
    quote: `La consistencia visual entre la versión móvil portrait y el panel extendido de desktop nos dio la confianza para lanzar en producción en tiempo récord.`,
    quoteAuthor: `Alex Morgan`,
    quoteRole: `VP of Product, SplitWise Pro`,
    metrics: [{"value":"100%","label":"Consistencia","sublabel":"Diseño adaptativo web y móvil"},{"value":"12%","label":"Ahorro Mensual","sublabel":"Reducción de gastos hormiga"},{"value":"0ms","label":"Sincronización","sublabel":"Actualización en tiempo real"}],
    demoTitle: `SplitWise Pro — Finanzas Compartidas Premium`,
    demoPrompt: `Diseña una aplicación multiplataforma completa(iOS, Android, Web y Desktop) llamada SplitWise Pro, la versión premium y más avanzada de una app para dividir gastos y gestionar finanzas compartidas.
Estrategia multiplataforma:

Diseño consistente pero adaptativo: Mobile - first con excelente experiencia en tablets, web responsive y aplicación desktop completa.
Código base compartido(Flutter o React Native + Web).

Estilo visual general:

Paleta: Verde esmeralda(#10B981), grises elegantes y azul de confianza.Dark Mode impecable.
    Tipografía: Inter o Satoshi.
        Estilo: Minimalista premium, limpio y profesional.

Funcionalidades clave:

División inteligente de gastos(igual, porcentual, por ítems, por consumo).
Escaneo de tickets con IA(en móvil) y subida manual en web / desktop.
Grupos ilimitados con balances en tiempo real.
Gráficos avanzados e interactivos(especialmente potentes en web / desktop).
Exportación a Excel / PDF.
Recordatorios automáticos y pagos integrados.
    Modo “Evento” y “Hogar compartido”.

Estructura adaptada:

Mobile: Navegación inferior simple y rápida.
    Web / Desktop: Sidebar izquierda + vista completa de dashboards, gráficos grandes y gestión masiva de gastos.

        Interacciones:

Animaciones fluidas en móvil y micro - interacciones elegantes en desktop.
Atajos de teclado en versión web / desktop.
Sincronización perfecta en tiempo real entre dispositivos.

Ambiente general: Confianza, claridad extrema y profesionalismo.Debe sentirse premium tanto en el celular como en la computadora.`,
    demoCode: `<!DOCTYPE html>
        <html lang="es" class="dark">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>SplitWise Pro - Dashboard</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                                    <style>
                                        body {font - family: 'Inter', sans-serif; }
                                        .tabular-nums {font - variant - numeric: tabular-nums; }
                                        ::-webkit-scrollbar {width: 8px; height: 8px; }
                                        ::-webkit-scrollbar-track {background: transparent; }
                                        ::-webkit-scrollbar-thumb {background: #3f3f46; border-radius: 4px; }
                                        ::-webkit-scrollbar-thumb:hover {background: #52525b; }
                                        .fade-in {animation: fadeIn 0.3s ease-in-out; }
                                        @keyframes fadeIn {from {opacity: 0; transform: translateY(-10px); } to {opacity: 1; transform: translateY(0); } }
                                    </style>
                                </head>
                                <body class="bg-zinc-950 text-zinc-100 antialiased">

                                    <!-- Layout Principal -->
                                    <div class="flex h-screen">

                                        <!-- Sidebar -->
                                        <aside class="hidden md:flex w-64 flex-col bg-zinc-900 border-r border-zinc-800 p-4">
                                            <div class="flex items-center gap-2 mb-10 px-2">
                                                <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-zinc-900">S</div>
                                                <span class="font-bold text-lg tracking-tight">SplitWise<span class="text-emerald-500">Pro</span></span>
                                            </div>
                                            <nav class="flex flex-col gap-1 flex-1">
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 text-emerald-500 font-medium text-sm">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                                    Dashboard
                                                </a>
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-sm">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                                    Grupos
                                                </a>
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-sm">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                                    Actividad
                                                </a>
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-sm">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                                    Estadísticas
                                                </a>
                                            </nav>
                                            <div class="border-t border-zinc-800 pt-4">
                                                <div class="flex items-center gap-3 px-2">
                                                    <img src="https://i.pravatar.cc/40?img=12" class="w-8 h-8 rounded-full" alt="User">
                                                        <div>
                                                            <p class="text-sm font-medium">Alex Morgan</p>
                                                            <p class="text-xs text-zinc-500">Premium</p>
                                                        </div>
                                                </div>
                                            </div>
                                        </aside>

                                        <!-- Main Content -->
                                        <main class="flex-1 overflow-y-auto">

                                            <!-- Top Bar -->
                                            <header class="sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 border-b border-zinc-800 p-4 flex items-center justify-between">
                                                <div class="flex-1 max-w-md">
                                                    <div class="relative">
                                                        <svg class="w-5 h-5 text-zinc-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                        <input type="text" placeholder="Buscar gastos o grupos... (Ctrl + K)" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors">
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-3 ml-4">
                                                    <button class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors relative">
                                                        <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                                        <span class="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                    </button>
                                                    <button onclick="openModal()" class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                                        Añadir Gasto
                                                    </button>
                                                </div>
                                            </header>

                                            <!-- Dashboard Content -->
                                            <div class="p-6 space-y-6">

                                                <!-- Balance Summary Cards -->
                                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
                                                        <p class="text-sm text-zinc-400 mb-1">Balance Total</p>
                                                        <h3 class="text-3xl font-bold text-emerald-500 tabular-nums">+$1,250.<span class="text-xl">50</span></h3>
                                                        <div class="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                                            <span class="flex items-center gap-1 text-emerald-500"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> 12% este mes</span>
                                                        </div>
                                                    </div>
                                                    <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
                                                        <p class="text-sm text-zinc-400 mb-1">Te Deben</p>
                                                        <h3 class="text-3xl font-bold text-zinc-100 tabular-nums">$1,840.<span class="text-xl">00</span></h3>
                                                        <div class="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                                            <span>De 3 personas</span>
                                                        </div>
                                                    </div>
                                                    <div class="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
                                                        <p class="text-sm text-zinc-400 mb-1">Tú Debes</p>
                                                        <h3 class="text-3xl font-bold text-red-500 tabular-nums">$589.<span class="text-xl">50</span></h3>
                                                        <div class="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                                            <span>A 2 personas</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Charts & Recent Activity -->
                                                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                                    <!-- Chart Container -->
                                                    <div class="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
                                                        <div class="flex justify-between items-center mb-6">
                                                            <h2 class="text-lg font-semibold">Gastos por Categoría</h2>
                                                            <select class="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500">
                                                                <option>Últimos 30 días</option>
                                                                <option>Este año</option>
                                                            </select>
                                                        </div>
                                                        <div class="h-64 w-full">
                                                            <canvas id="spendingChart"></canvas>
                                                        </div>
                                                    </div>

                                                    <!-- Debt Simplification -->
                                                    <div class="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
                                                        <h2 class="text-lg font-semibold mb-4">Saldar Deudas</h2>
                                                        <div class="space-y-4">
                                                            <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                                                <div class="flex items-center gap-3">
                                                                    <img src="https://i.pravatar.cc/40?img=5" class="w-8 h-8 rounded-full" alt="User">
                                                                        <span class="text-sm text-zinc-400">Te paga <span class="text-zinc-100 font-medium">Carlos</span></span>
                                                                </div>
                                                                <span class="text-emerald-500 font-semibold text-sm tabular-nums">$320.00</span>
                                                            </div>
                                                            <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                                                <div class="flex items-center gap-3">
                                                                    <img src="https://i.pravatar.cc/40?img=23" class="w-8 h-8 rounded-full" alt="User">
                                                                        <span class="text-sm text-zinc-400">Le pagas a <span class="text-zinc-100 font-medium">Sofía</span></span>
                                                                </div>
                                                                <span class="text-red-500 font-semibold text-sm tabular-nums">$150.50</span>
                                                            </div>
                                                            <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                                                <div class="flex items-center gap-3">
                                                                    <img src="https://i.pravatar.cc/40?img=15" class="w-8 h-8 rounded-full" alt="User">
                                                                        <span class="text-sm text-zinc-400">Te paga <span class="text-zinc-100 font-medium">Juan</span></span>
                                                                </div>
                                                                <span class="text-emerald-500 font-semibold text-sm tabular-nums">$45.00</span>
                                                            </div>
                                                        </div>
                                                        <button class="w-full mt-6 py-2.5 border border-emerald-500 text-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-500 hover:text-zinc-950 transition-colors">Saldar Todo</button>
                                                    </div>
                                                </div>

                                                <!-- Recent Expenses Table -->
                                                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
                                                    <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
                                                        <h2 class="text-lg font-semibold">Gastos Recientes</h2>
                                                        <button class="text-sm text-zinc-400 hover:text-emerald-500 flex items-center gap-2">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            Exportar Excel
                                                        </button>
                                                    </div>
                                                    <table class="w-full text-sm text-left">
                                                        <thead class="bg-zinc-800/50 text-zinc-500 uppercase text-xs">
                                                            <tr>
                                                                <th class="px-6 py-3 font-medium">Fecha</th>
                                                                <th class="px-6 py-3 font-medium">Descripción</th>
                                                                <th class="px-6 py-3 font-medium">Grupo</th>
                                                                <th class="px-6 py-3 font-medium">Pagado por</th>
                                                                <th class="px-6 py-3 font-medium text-right">Monto</th>
                                                                <th class="px-6 py-3 font-medium text-right">Tu parte</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="divide-y divide-zinc-800">
                                                            <tr class="hover:bg-zinc-800/30 transition-colors">
                                                                <td class="px-6 py-4 text-zinc-400">12 May</td>
                                                                <td class="px-6 py-4 font-medium text-zinc-100">Cena Equipo</td>
                                                                <td class="px-6 py-4 text-zinc-400">Trabajo</td>
                                                                <td class="px-6 py-4 text-zinc-400">Tú</td>
                                                                <td class="px-6 py-4 text-right tabular-nums font-medium text-zinc-100">$120.00</td>
                                                                <td class="px-6 py-4 text-right tabular-nums text-emerald-500">+$80.00</td>
                                                            </tr>
                                                            <tr class="hover:bg-zinc-800/30 transition-colors">
                                                                <td class="px-6 py-4 text-zinc-400">11 May</td>
                                                                <td class="px-6 py-4 font-medium text-zinc-100 flex items-center gap-2">
                                                                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                                    Renta Mayo
                                                                </td>
                                                                <td class="px-6 py-4 text-zinc-400">Hogar</td>
                                                                <td class="px-6 py-4 text-zinc-400">Carlos</td>
                                                                <td class="px-6 py-4 text-right tabular-nums font-medium text-zinc-100">$1,500.00</td>
                                                                <td class="px-6 py-4 text-right tabular-nums text-red-500">-$750.00</td>
                                                            </tr>
                                                            <tr class="hover:bg-zinc-800/30 transition-colors">
                                                                <td class="px-6 py-4 text-zinc-400">10 May</td>
                                                                <td class="px-6 py-4 font-medium text-zinc-100">Tickets Cine</td>
                                                                <td class="px-6 py-4 text-zinc-400">Amigos</td>
                                                                <td class="px-6 py-4 text-zinc-400">Sofía</td>
                                                                <td class="px-6 py-4 text-right tabular-nums font-medium text-zinc-100">$45.00</td>
                                                                <td class="px-6 py-4 text-right tabular-nums text-red-500">-$15.00</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div>
                                        </main>
                                    </div>

                                    <!-- Modal: Add Expense -->
                                    <div id="expenseModal" class="hidden fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                        <div class="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl fade-in">
                                            <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
                                                <h2 class="text-xl font-bold">Añadir Nuevo Gasto</h2>
                                                <button onclick="closeModal()" class="text-zinc-500 hover:text-zinc-100">
                                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <div class="p-6 space-y-5">
                                                <div class="flex items-center gap-4">
                                                    <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                                    </div>
                                                    <input type="text" placeholder="¿En qué gastaste?" class="flex-1 bg-transparent border-0 border-b border-zinc-700 focus:ring-0 focus:border-emerald-500 text-xl font-medium py-2 placeholder-zinc-600">
                                                </div>
                                                <div>
                                                    <p class="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Monto Total</p>
                                                    <div class="relative">
                                                        <span class="absolute left-3 top-2 text-2xl font-bold text-zinc-500">$</span>
                                                        <input type="text" value="0.00" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-2xl font-bold tabular-nums focus:outline-none focus:border-emerald-500">
                                                    </div>
                                                </div>

                                                <!-- Smart Split Tabs -->
                                                <div>
                                                    <div class="flex border-b border-zinc-800 mb-4">
                                                        <button class="px-4 py-2 text-sm font-medium text-emerald-500 border-b-2 border-emerald-500">Dividir Igual</button>
                                                        <button class="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-100">Porcentual</button>
                                                        <button class="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-100">Por Ítems</button>
                                                    </div>
                                                    <div class="space-y-3 max-h-48 overflow-y-auto pr-2">
                                                        <div class="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg">
                                                            <div class="flex items-center gap-3">
                                                                <input type="checkbox" checked class="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0">
                                                                    <img src="https://i.pravatar.cc/30?img=12" class="w-8 h-8 rounded-full" alt="User">
                                                                        <span class="text-sm">Tú</span>
                                                                    </div>
                                                                    <span class="text-sm font-semibold tabular-nums text-zinc-400">$0.00</span>
                                                            </div>
                                                            <div class="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg">
                                                                <div class="flex items-center gap-3">
                                                                    <input type="checkbox" checked class="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0">
                                                                        <img src="https://i.pravatar.cc/30?img=5" class="w-8 h-8 rounded-full" alt="User">
                                                                            <span class="text-sm">Carlos</span>
                                                                        </div>
                                                                        <span class="text-sm font-semibold tabular-nums text-zinc-400">$0.00</span>
                                                                </div>
                                                                <div class="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg">
                                                                    <div class="flex items-center gap-3">
                                                                        <input type="checkbox" checked class="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0">
                                                                            <img src="https://i.pravatar.cc/30?img=23" class="w-8 h-8 rounded-full" alt="User">
                                                                                <span class="text-sm">Sofía</span>
                                                                            </div>
                                                                            <span class="text-sm font-semibold tabular-nums text-zinc-400">$0.00</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="p-6 border-t border-zinc-800 flex gap-3">
                                                            <button onclick="closeModal()" class="flex-1 py-2.5 border border-zinc-700 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors">Cancelar</button>
                                                            <button onclick="closeModal()" class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-xl font-semibold transition-colors">Guardar Gasto</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <script>
        // Modal Logic
                                                    function openModal() {
                                                        document.getElementById('expenseModal').classList.remove('hidden');
        }
                                                    function closeModal() {
                                                        document.getElementById('expenseModal').classList.add('hidden');
        }

                                                    // Chart.js Configuration
                                                    const ctx = document.getElementById('spendingChart').getContext('2d');
                                                    const spendingChart = new Chart(ctx, {
                                                        type: 'doughnut',
                                                    data: {
                                                        labels: ['Hogar', 'Comida', 'Transporte', 'Ocio', 'Otros'],
                                                    datasets: [{
                                                        data: [1500, 320, 150, 120, 80],
                                                    backgroundColor: [
                                                    '#10B981', // Esmeralda
                                                    '#3B82F6', // Azul
                                                    '#F59E0B', // Ámbar
                                                    '#8B5CF6', // Violeta
                                                    '#EF4444'  // Rojo
                                                    ],
                                                    borderWidth: 0,
                                                    hoverOffset: 8
                }]
            },
                                                    options: {
                                                        responsive: true,
                                                    maintainAspectRatio: false,
                                                    cutout: '70%',
                                                    plugins: {
                                                        legend: {
                                                        position: 'bottom',
                                                    labels: {
                                                        color: '#A1A1AA',
                                                    usePointStyle: true,
                                                    pointStyle: 'circle',
                                                    padding: 20,
                                                    font: {
                                                        family: 'Inter',
                                                    size: 12
                            }
                        }
                    },
                                                    tooltip: {
                                                        backgroundColor: '#18181B',
                                                    titleColor: '#FAFAFA',
                                                    bodyColor: '#A1A1AA',
                                                    borderColor: '#3F3F46',
                                                    borderWidth: 1,
                                                    padding: 12,
                                                    boxPadding: 4,
                                                    cornerRadius: 8,
                                                    titleFont: {family: 'Inter', weight: 'bold' },
                                                    bodyFont: {family: 'Inter' }
                    }
                }
            }
        });
                                                </script>
                                            </body>
                                        </html>`
  },
  "multiplataforma-2": {
    title: `Circle — Red Social Privada Familiar`,
    brand: `Caso de Éxito: Multiplataforma`,
    desc: `Aplicación multiplataforma de redes sociales privadas para la comunicación y planificación de círculos pequeños e íntimos.`,
    gradient: `from-stone-600 to-amber-700`,
    challenge: `Crear un entorno que se sienta cálido, acogedor y libre de ruidos mediáticos, centrado puramente en las personas cercanas.`,
    solution: `Se implementó un layout cálido con soporte de Modo Focus que difumina distracciones, chat integrado, espacios de galería y notas compartidas.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Flash"],
    region: `América del Norte & España`,
    industry: `Social / Comunicación`,
    quote: `El Modo Focus permite silenciar notificaciones externas y concentrarse en el círculo de forma tranquila y humana.`,
    quoteAuthor: `Elena`,
    quoteRole: `Co-Founder, Circle Network`,
    metrics: [{"value":"🌿 Focus","label":"Modo Silencioso","sublabel":"Cero interrupciones de notificaciones"},{"value":"100%","label":"Privacidad","sublabel":"Círculos seguros por invitación"},{"value":"4 miembros","label":"Círculo Activo","sublabel":"Sincronizados en tiempo real"}],
    demoTitle: `Circle — Red Social Privada Familiar`,
    demoPrompt: `Diseña Circle, una aplicación multiplataforma(iOS, Android, Web y Desktop) de redes sociales privadas para grupos pequeños y cercanos.
Estrategia multiplataforma:

Experiencia unificada pero optimizada: Mobile para uso diario rápido, Web / Desktop para conversaciones más profundas y organización.

Estilo visual:

Paleta cálida y acogedora: tonos crema, beige, verde salvia y grises suaves.Muy buen Dark Mode.
Diseño humano, minimalista y premium.

Funcionalidades principales:

Círculos privados(grupos) con invitación segura.
Espacios dentro de cada círculo: Chat, Feed, Eventos, Galería, Notas compartidas, Metas grupales.
Mensajes temporales y modo “Sin distracciones”.
Eventos y planes con RSVPs.
Actualizaciones de estado significativas.

Adaptación por plataforma:

Mobile: Navegación simple y rápida, ideal para check - ins diarios.
    Web / Desktop: Mejor experiencia para chats largos, organización de eventos, galería grande y vista de múltiples círculos simultáneamente.

Detalles de interacción:

Sincronización perfecta en todos los dispositivos.
Soporte completo para arrastrar y soltar en desktop.
    Modo “Focus” que silencia notificaciones.

Ambiente general: Íntimo, cálido, seguro y profundo.Debe sentirse como un espacio privado premium tanto en el celular como en la computadora.`,
    demoCode: `<!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Circle - Espacio Íntimo</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                                <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
                                    <style>
                                        body {font - family: 'DM Sans', sans-serif; }
                                        .warm-bg {background - color: #1C1B1A; }
                                        .warm-surface {background - color: #252422; }
                                        .warm-border {border - color: #323130; }
                                        .sage-text {color: #A3B18A; }
                                        .sage-bg {background - color: #A3B18A; }
                                        .sage-bg-soft {background - color: rgba(163, 177, 138, 0.1); }
                                        .warm-hover:hover {background - color: #2D2C2A; }
                                        .custom-scroll::-webkit-scrollbar {width: 4px; }
                                        .custom-scroll::-webkit-scrollbar-thumb {background: #323130; border-radius: 2px; }
                                        .fade-in {animation: fadeIn 0.4s ease-out; }
                                        @keyframes fadeIn {from {opacity: 0; transform: translateY(10px); } to {opacity: 1; transform: translateY(0); } }
                                        .focus-mode {filter: blur(8px) brightness(0.5); pointer-events: none; transition: all 0.3s ease; }
                                    </style>
                                </head>
                                <body class="warm-bg text-stone-200 antialiased">

                                    <div class="flex h-screen overflow-hidden">

                                        <!-- Columna 1: Círculos -->
                                        <aside id="leftPanel" class="w-64 warm-surface warm-border-r border-r flex flex-col p-4 transition-all duration-300">
                                            <div class="flex items-center gap-2 mb-8">
                                                <div class="w-8 h-8 rounded-full sage-bg flex items-center justify-center text-stone-900 font-bold text-sm">C</div>
                                                <span class="font-semibold text-lg tracking-tight">Circle</span>
                                            </div>

                                            <button class="w-full flex items-center justify-center gap-2 sage-bg-soft sage-text py-2.5 rounded-xl text-sm font-medium mb-6 hover:bg-opacity-20 transition-colors">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                Nuevo Círculo
                                            </button>

                                            <p class="text-xs text-stone-500 uppercase tracking-wider px-2 mb-2">Tus Círculos</p>
                                            <nav class="flex flex-col gap-1 flex-1">
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl warm-hover transition-colors">
                                                    <div class="w-8 h-8 rounded-full bg-amber-700/30 flex items-center justify-center text-amber-500 text-xs font-bold">VC</div>
                                                    <span class="text-sm text-stone-300">Viaje al Campo</span>
                                                </a>
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-800/50 transition-colors border border-stone-700/50">
                                                    <div class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold">HF</div>
                                                    <span class="text-sm font-medium text-stone-100">Familia</span>
                                                    <span class="ml-auto w-2 h-2 rounded-full sage-bg"></span>
                                                </a>
                                                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl warm-hover transition-colors">
                                                    <div class="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 text-xs font-bold">EA</div>
                                                    <span class="text-sm text-stone-300">Amigos Íntimos</span>
                                                </a>
                                            </nav>

                                            <div class="border-t warm-border pt-4 mt-4 flex items-center gap-3">
                                                <img src="https://i.pravatar.cc/40?img=5" class="w-9 h-9 rounded-full" alt="User">
                                                    <div>
                                                        <p class="text-sm font-medium text-stone-200">Elena</p>
                                                        <p class="text-xs text-stone-500">🌿 Relajada</p>
                                                    </div>
                                            </div>
                                        </aside>

                                        <!-- Columna 2: Espacio Activo (Chat/Feed) -->
                                        <main class="flex-1 flex flex-col bg-stone-900/30 relative">

                                            <!-- Header del Espacio -->
                                            <header class="p-4 border-b warm-border flex items-center justify-between bg-stone-900/50 backdrop-blur-sm z-10">
                                                <div>
                                                    <h2 class="font-semibold text-lg">Familia</h2>
                                                    <p class="text-xs text-stone-500">4 miembros · 2 activos ahora</p>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <button class="px-3 py-1.5 text-xs rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors">Feed</button>
                                                    <button class="px-3 py-1.5 text-xs rounded-lg sage-bg-soft sage-text font-medium">Chat</button>
                                                    <button class="px-3 py-1.5 text-xs rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors">Galería</button>
                                                </div>
                                            </header>

                                            <!-- Contenido del Chat -->
                                            <div id="chatArea" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">

                                                <!-- Fecha separador -->
                                                <div class="flex justify-center">
                                                    <span class="text-xs text-stone-500 bg-stone-800/50 px-3 py-1 rounded-full">Hoy</span>
                                                </div>

                                                <!-- Mensaje Otro -->
                                                <div class="flex gap-3 fade-in">
                                                    <img src="https://i.pravatar.cc/40?img=12" class="w-8 h-8 rounded-full mt-1" alt="User">
                                                        <div>
                                                            <div class="flex items-baseline gap-2 mb-1">
                                                                <span class="text-sm font-semibold">Papá</span>
                                                                <span class="text-xs text-stone-500">10:30 AM</span>
                                                            </div>
                                                            <div class="max-w-md bg-stone-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-stone-200">
                                                                ¿Qué planes tienen para el fin de semana? Encontré una cabaña hermosa cerca del lago. 🌲
                                                            </div>
                                                        </div>
                                                </div>

                                                <!-- Mensaje Propio -->
                                                <div class="flex gap-3 justify-end fade-in">
                                                    <div class="max-w-md">
                                                        <div class="bg-stone-800 px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-stone-200">
                                                            ¡Suena increíble! Yo me encargo de la comida. ¿Les parece bien si llevamos a Luna (el perro)?
                                                        </div>
                                                        <div class="flex justify-end mt-1">
                                                            <span class="text-xs text-stone-500">10:32 AM · Leído</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Nota Compartida (Card Especial) -->
                                                <div class="flex gap-3 fade-in">
                                                    <div class="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center mt-1">
                                                        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                                    </div>
                                                    <div class="max-w-md w-full bg-stone-800/50 border warm-border rounded-2xl p-4">
                                                        <p class="text-xs text-amber-500 font-medium uppercase tracking-wider mb-2">Nota Compartida</p>
                                                        <h3 class="font-semibold text-stone-100 mb-2">Lista para la cabaña</h3>
                                                        <ul class="text-sm text-stone-400 space-y-1">
                                                            <li class="flex items-center gap-2"><input type="checkbox" checked class="rounded bg-stone-900 border-stone-600"> Comida para 3 días</li>
                                                            <li class="flex items-center gap-2"><input type="checkbox" class="rounded bg-stone-900 border-stone-600"> Ropa de abrigo</li>
                                                            <li class="flex items-center gap-2"><input type="checkbox" class="rounded bg-stone-900 border-stone-600"> Jabón para Luna</li>
                                                        </ul>
                                                    </div>
                                                </div>

                                            </div>

                                            <!-- Input del Chat -->
                                            <div class="p-4 border-t warm-border">
                                                <div class="flex items-center gap-2 bg-stone-800 rounded-2xl p-2">
                                                    <button class="p-2 text-stone-500 hover:text-stone-200 transition-colors">
                                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    </button>
                                                    <input type="text" placeholder="Escribe a tu familia..." class="flex-1 bg-transparent border-0 focus:ring-0 text-sm placeholder-stone-500">
                                                        <button class="p-2 sage-text hover:bg-stone-700 rounded-xl transition-colors">
                                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                                        </button>
                                                </div>
                                            </div>
                                        </main>

                                        <!-- Columna 3: Contexto (Eventos, Notas, Focus) -->
                                        <aside id="rightPanel" class="w-80 warm-surface warm-border-l border-l flex-col p-6 hidden lg:flex transition-all duration-300">

                                            <!-- Botón Modo Focus -->
                                            <button id="focusBtn" class="w-full flex items-center justify-center gap-2 bg-stone-800 text-stone-400 py-2.5 rounded-xl text-sm font-medium mb-6 hover:text-stone-100 transition-colors">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Activar Modo Focus
                                            </button>

                                            <div class="mb-8">
                                                <h3 class="text-xs text-stone-500 uppercase tracking-wider mb-3">Próximos Planes</h3>
                                                <div class="bg-stone-900/50 border warm-border rounded-2xl p-4">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <h4 class="font-semibold text-stone-100">Cabaña del Lago</h4>
                                                        <span class="text-xs sage-text sage-bg-soft px-2 py-0.5 rounded-full">Confirmado</span>
                                                    </div>
                                                    <p class="text-xs text-stone-400 mb-3">Sábado 20 May - 10:00 AM</p>
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex -space-x-2">
                                                            <img src="https://i.pravatar.cc/30?img=12" class="w-7 h-7 rounded-full border-2 border-stone-900" alt="U1">
                                                                <img src="https://i.pravatar.cc/30?img=5" class="w-7 h-7 rounded-full border-2 border-stone-900" alt="U2">
                                                                    <img src="https://i.pravatar.cc/30?img=23" class="w-7 h-7 rounded-full border-2 border-stone-900" alt="U3">
                                                                    </div>
                                                                    <button class="text-xs text-stone-400 hover:text-stone-100">Detalles</button>
                                                                </div>
                                                        </div>
                                                    </div>

                                                    <div class="mb-8">
                                                        <h3 class="text-xs text-stone-500 uppercase tracking-wider mb-3">Vibras de Hoy</h3>
                                                        <div class="space-y-3">
                                                            <div class="flex items-center gap-3">
                                                                <img src="https://i.pravatar.cc/30?img=12" class="w-7 h-7 rounded-full" alt="U1">
                                                                    <div class="text-sm">
                                                                        <span class="text-stone-300">Papá está </span>
                                                                        <span class="sage-text font-medium">🌿 Relajado</span>
                                                                    </div>
                                                            </div>
                                                            <div class="flex items-center gap-3">
                                                                <img src="https://i.pravatar.cc/30?img=23" class="w-7 h-7 rounded-full" alt="U3">
                                                                    <div class="text-sm">
                                                                        <span class="text-stone-300">Mamá está </span>
                                                                        <span class="text-amber-500 font-medium">☕ Trabajando</span>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 class="text-xs text-stone-500 uppercase tracking-wider mb-3">Espacios Rápidos</h3>
                                                        <div class="grid grid-cols-2 gap-3">
                                                            <button class="bg-stone-900/50 warm-border border rounded-xl p-3 flex flex-col items-center gap-2 warm-hover transition-colors">
                                                                <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                                                <span class="text-xs">Galería</span>
                                                            </button>
                                                            <button class="bg-stone-900/50 warm-border border rounded-xl p-3 flex flex-col items-center gap-2 warm-hover transition-colors">
                                                                <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                                                <span class="text-xs">Metas</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </aside>

                                            </div>

                                            <!-- Overlay Focus Mode -->
                                            <div id="focusOverlay" class="hidden fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 items-center justify-center">
                                                <div class="text-center fade-in">
                                                    <div class="w-16 h-16 rounded-full sage-bg-soft flex items-center justify-center mx-auto mb-4">
                                                        <svg class="w-8 h-8 sage-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                    </div>
                                                    <h3 class="text-xl font-semibold text-stone-100 mb-2">Modo Focus Activado</h3>
                                                    <p class="text-stone-400 text-sm max-w-xs mx-auto">El resto del mundo está silenciado. Estás disfrutando de tiempo de calidad con tu familia.</p>
                                                    <button id="exitFocusBtn" class="mt-6 px-6 py-2 bg-stone-800 text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">Salir del Modo Focus</button>
                                                </div>
                                            </div>

                                            <script>
                                                const focusBtn = document.getElementById('focusBtn');
                                                const exitFocusBtn = document.getElementById('exitFocusBtn');
                                                const focusOverlay = document.getElementById('focusOverlay');
                                                const leftPanel = document.getElementById('leftPanel');
                                                const rightPanel = document.getElementById('rightPanel');
                                                const chatArea = document.getElementById('chatArea');

        focusBtn.addEventListener('click', () => {
                                                    leftPanel.classList.add('focus-mode');
                                                rightPanel.classList.add('focus-mode');
                                                chatArea.classList.add('opacity-30', 'transition-opacity');
                                                focusOverlay.classList.remove('hidden');
                                                focusOverlay.classList.add('flex');
        });

        exitFocusBtn.addEventListener('click', () => {
                                                    leftPanel.classList.remove('focus-mode');
                                                rightPanel.classList.remove('focus-mode');
                                                chatArea.classList.remove('opacity-30');
                                                focusOverlay.classList.add('hidden');
                                                focusOverlay.classList.remove('flex');
        });

                                                // Auto-scroll chat
                                                chatArea.scrollTop = chatArea.scrollHeight;
                                            </script>
                                        </body>
                                    </html>`
  },
  "multiplataforma-3": {
    title: `MentorMatch — Plataforma de Mentoría Inteligente`,
    brand: `Caso de Éxito: Multiplataforma`,
    desc: `Plataforma de mentoría inteligente premium que conecta profesionales de forma profunda y personalizada.`,
    gradient: `from-[#1E3A8A] to-[#10B981]`,
    challenge: `El matching tradicional de habilidades suele ser plano y frío, omitiendo valores y estilos de aprendizaje.`,
    solution: `Maverlang AI diseñó MentorMatch integrando un algoritmo visual de match (96% de compatibilidad), dashboard de objetivos de progreso semanal y agendamiento interactivo.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `Global`,
    industry: `EdTech / Professional Development`,
    quote: `La compatibilidad calculada según valores y objetivos de vida elevó un 85% la retención de las mentorías.`,
    quoteAuthor: `Alex Riveiro`,
    quoteRole: `Product Director, MentorMatch`,
    metrics: [{"value":"96%","label":"Match Máximo","sublabel":"Compatibilidad algorítmica de valores"},{"value":"75%","label":"Progreso Semanal","sublabel":"Cumplimiento de metas de aprendizaje"},{"value":"25%+","label":"Retención","sublabel":"Frente a mentorías tradicionales"}],
    demoTitle: `MentorMatch — Plataforma de Mentoría Inteligente`,
    demoPrompt: ``,
    demoCode: ``
  },
  "aplicacion-1": {
    title: `NEXUS Blocks — Tetris Arcade Futurista`,
    brand: `Caso de Éxito: Aplicación`,
    desc: `Juego arcade móvil pulido y adictivo en modo vertical (Mobile Portrait), con físicas clásicas SRS y de partículas glow.`,
    gradient: `from-violet-600 to-cyan-550`,
    challenge: `Adaptar el comportamiento rápido de Tetris a gestos táctiles de swipe y tap en celulares sin retardo en los inputs.`,
    solution: `Maverlang AI codificó la física completa del juego móvil usando algoritmos puros en HTML/JS con wall-kicks y hold queue de piezas.`,
    products: ["Desarrollador de Apps (Maverlang AI)", "Maverlang 2.5 Flash"],
    region: `Global`,
    industry: `Gaming / Móvil`,
    quote: `La respuesta inmediata de los swipes y el destello visual al limpiar múltiples líneas es sumamente satisfactorio.`,
    quoteAuthor: `Héctor Guerrero`,
    quoteRole: `Lead Game Designer, Void Arcade`,
    metrics: [
      { value: "100%", label: "Táctil", sublabel: "Optimizada para juego con una mano" },
      { value: "60fps", label: "Frecuencia", sublabel: "Caída de bloques y partículas estables" },
      { value: "1 Prompt", label: "Construcción", sublabel: "Lógica de juego completa en un paso" }
    ],
    demoTitle: `NEXUS Blocks — Tetris Arcade`,
    demoPrompt: `Diseña un juego móvil estilo Tetris moderno, adictivo y altamente pulido, optimizado para teléfonos (portrait), con mecánicas clásicas mejoradas y una experiencia visual premium.
Concepto general:
Un Tetris contemporáneo que mantiene la esencia pura del clásico pero añade elegancia visual, feedback satisfactorio y progresión moderna. Nombre sugerido: “NEXUS Blocks” o “Void Tetris”. Debe sentirse premium, relajante pero desafiante, con un toque futurista minimalista.
Estilo visual:

Paleta de colores: Fondo negro profundo con gradientes sutiles. Bloques con colores vibrantes y luminosos (cian, magenta, amarillo, verde esmeralda, violeta). Efectos de brillo, glow y partículas al hacer líneas.
Diseño de bloques: Bloques con bordes redondeados suaves, efecto cristalino o metálico sutil, iluminación volumétrica y reflejos. Cada tetromino tiene un color distintivo y glow propio.
Estilo general: Cyber-minimalista con toques neon. Interfaz limpia, sin elementos innecesarios. Tipografía futurista moderna y legible.
Animaciones:
Caída suave de piezas con leve “rebote” al levantar.
Explosiones de partículas y líneas brillantes al completar una o múltiples líneas.
Efecto de “clear” con flash elegante y sonido satisfactorio.
Shake sutil de la pantalla al hacer tetris (4 líneas).


Mecánicas de juego (funcionales y equilibradas):

Controles táctiles optimizados:
Swipe izquierdo/derecho para mover.
Swipe abajo para caída rápida (soft drop).
Tap en el lado derecho para rotar derecha / izquierdo para rotar izquierda.
Botón de “Hold” y “Next Piece” visibles.

Sistema clásico de Tetris (SRS - Super Rotation System) con wall kicks.
Niveles que aumentan progresivamente la velocidad.
Sistema de puntuación: Single, Double, Triple, Tetris, T-Spins y combos.
Modo Ghost Piece (pieza sombra) activado por defecto.
Hold piece (guardar pieza) con cooldown visual.
Next queue de 3 piezas.

Estructura de la pantalla principal (Mobile Portrait):

Zona de juego ocupando el 70% superior (área de tablero centrada).
Panel derecho o inferior con:
Siguiente pieza (grande y clara).
Pieza en Hold.
Puntuación actual, nivel y líneas completadas.
Botones grandes y fáciles de tocar: Pause, Hold, Rotación alternativa.

Fondo dinámico que cambia sutilmente según el nivel o combo.

Modos de juego:

Modo Clásico (sin fin hasta Game Over).
Modo Zen (velocidad baja, sin presión, para relajarse).
Modo Desafío (niveles con objetivos específicos: hacer X tetris, sobrevivir X minutos, etc.).
Modo Diario (un tablero especial cada día).

Progresión y monetización (opcional pero elegante):

Sistema de skins para bloques y fondos (desbloqueables con monedas ganadas en partida).
Logros y estadísticas detalladas.
Tabla de récords globales.

Detalles de interacción y pulido:

Feedback háptico fuerte en cada movimiento, rotación y línea completada.
Sonidos muy satisfactorios: drop, rotate, line clear, tetris (con crescendo).
Efectos de pantalla: screen shake en tetris, partículas brillantes, trail en las piezas al caer rápido.
Transiciones suaves entre menús.
Tutorial inicial muy breve y visual (3 pantallas).
Pausa elegante con opción de reanudar o reiniciar.

Ambiente general:
Adictivo, satisfactorio, premium, moderno, limpio y visualmente hermoso. Debe sentirse profesional y pulido como un juego de estudio grande, pero manteniendo la simplicidad y pureza del Tetris clásico.`,
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>NEXUS Blocks - Prototype</title>
    <style>
        :root {
            --bg: #050505;
            --grid-line: rgba(255, 255, 255, 0.05);
            --cyan: #00F0FF;
            --yellow: #FFD700;
            --violet: #BD00FF;
            --green: #00FF7F;
            --magenta: #FF0055;
            --orange: #FF9500;
            --blue: #0080FF;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; -webkit-tap-highlight-color: transparent; }
        
        body {
            background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, var(--bg) 60%);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        .game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 10px;
        }

        .hud-top {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 10px;
            font-size: 14px;
            letter-spacing: 1px;
        }

        .hud-top span { color: var(--cyan); text-shadow: 0 0 5px var(--cyan); }

        .main-area {
            display: flex;
            gap: 15px;
        }

        .side-panel {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 80px;
        }

        .panel-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            backdrop-filter: blur(5px);
        }

        .panel-title { font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase; }
        .panel-value { font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 0 10px var(--cyan); }
        
        .mini-grid { width: 60px; height: 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 0 auto; }
        .mini-cell { width: 100%; height: 100%; background: transparent; }
        .mini-cell.active { border-radius: 2px; box-shadow: 0 0 4px currentColor; }

        #board {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(20, 1fr);
            width: 300px;
            height: 600px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
            position: relative;
        }

        .cell {
            border: 1px solid var(--grid-line);
            border-radius: 2px;
        }

        .block {
            border-radius: 4px;
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.2);
            animation: land 0.15s ease-out;
        }

        .ghost {
            border-radius: 4px;
            border: 2px dashed currentColor;
            opacity: 0.3;
            background: transparent !important;
        }

        .clearing {
            animation: clearFlash 0.3s ease-out forwards;
        }

        @keyframes clearFlash {
            0% { background: white !important; box-shadow: 0 0 20px white; }
            100% { background: transparent !important; transform: scale(0); }
        }

        @keyframes land {
            0% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .controls-hint {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="game-container">
        <div class="hud-top">
            <div>SCORE: <span id="score">0</span></div>
            <div>LEVEL: <span id="level">1</span></div>
            <div>LINES: <span id="lines">0</span></div>
        </div>
        
        <div class="main-area">
            <div class="side-panel">
                <div class="panel-box">
                    <div class="panel-title">Hold</div>
                    <div class="mini-grid" id="hold-grid"></div>
                </div>
            </div>
            
            <div id="board"></div>
            
            <div class="side-panel">
                <div class="panel-box">
                    <div class="panel-title">Next</div>
                    <div class="mini-grid" id="next-grid"></div>
                </div>
            </div>
        </div>

        <div class="controls-hint">
            Tap Izq: Rotar Anti | Tap Der: Rotar Hor | Swipe Abajo: Soft Drop | Swipe Arriba: Hard Drop
        </div>
    </div>

    <script>
        const COLS = 10, ROWS = 20;
        const board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        
        const COLORS = { I: '#00F0FF', O: '#FFD700', T: '#BD00FF', S: '#00FF7F', Z: '#FF0055', L: '#FF9500', J: '#0080FF' };
        const SHAPES = {
            I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]], L: [[0,0,1],[1,1,1]], J: [[1,0,0],[1,1,1]]
        };
        const TYPES = Object.keys(SHAPES);
        
        let current = null, next = null, hold = null, canHold = true;
        let score = 0, lines = 0, level = 1, dropInterval = 1000;
        let dropTimer = 0, lastTime = 0;
        let gameActive = true;

        const boardEl = document.getElementById('board');
        const nextGridEl = document.getElementById('next-grid');
        const holdGridEl = document.getElementById('hold-grid');

        function initBoard() {
            boardEl.innerHTML = '';
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.r = r; cell.dataset.c = c;
                    boardEl.appendChild(cell);
                }
            }
        }

        function newPiece() {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            return { type, shape: SHAPES[type], color: COLORS[type], x: 3, y: 0 };
        }

        function draw() {
            // Limpiar tablero visual
            document.querySelectorAll('.cell').forEach(c => {
                c.className = 'cell';
                c.style.background = '';
                c.style.boxShadow = '';
            });

            // Dibujar bloques asentados
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    if(board[r][c]) {
                        const cell = boardEl.children[r*COLS + c];
                        cell.className = 'cell block';
                        cell.style.background = board[r][c];
                        cell.style.boxShadow = \`0 0 8px \${board[r][c]}\`;
                    }
                }
            }

            // Dibujar fantasma (Ghost)
            if(current) {
                let ghostY = current.y;
                while(!collide(current, 0, ghostY - current.y + 1)) ghostY++;
                
                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = ghostY + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                cell.className = 'cell ghost';
                                cell.style.color = current.color;
                            }
                        }
                    });
                });

                // Dibujar pieza actual
                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = current.y + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                cell.className = 'cell block';
                                cell.style.background = current.color;
                                cell.style.boxShadow = \`0 0 10px \${current.color}\`;
                            }
                        }
                    });
                });
            }
            updateSidePanels();
        }

        function updateSidePanels() {
            drawMiniGrid(nextGridEl, next);
            drawMiniGrid(holdGridEl, hold);
        }

        function drawMiniGrid(el, piece) {
            el.innerHTML = '';
            for(let i=0; i<16; i++) {
                const div = document.createElement('div');
                div.className = 'mini-cell';
                el.appendChild(div);
            }
            if(piece) {
                piece.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const idx = r*4 + c;
                            el.children[idx].classList.add('active');
                            el.children[idx].style.background = piece.color;
                            el.children[idx].style.color = piece.color;
                        }
                    });
                });
            }
        }

        function collide(piece, dx, dy, shape = piece.shape) {
            for(let r=0; r<shape.length; r++){
                for(let c=0; c<shape[r].length; c++){
                    if(shape[r][c]) {
                        const x = piece.x + c + dx;
                        const y = piece.y + r + dy;
                        if(x < 0 || x >= COLS || y >= ROWS) return true;
                        if(y >= 0 && board[y][x]) return true;
                    }
                }
            }
            return false;
        }

        function merge() {
            current.shape.forEach((row, r) => {
                row.forEach((val, c) => {
                    if(val) board[current.y + r][current.x + c] = current.color;
                });
            });
            canHold = true;
        }

        function rotate() {
            const shape = current.shape;
            const N = shape.length;
            const M = shape[0].length;
            const newShape = Array.from({length: M}, () => Array(N).fill(0));
            for(let r=0; r<N; r++) for(let c=0; c<M; c++) newShape[c][N-1-r] = shape[r][c];
            
            if(!collide(current, 0, 0, newShape)) {
                current.shape = newShape;
            } else if(!collide(current, 1, 0, newShape)) { // Wall kick básico
                current.x++; current.shape = newShape;
            } else if(!collide(current, -1, 0, newShape)) {
                current.x--; current.shape = newShape;
            }
        }

        function clearLines() {
            let cleared = [];
            for(let r = ROWS - 1; r >= 0; r--) {
                if(board[r].every(cell => cell !== 0)) {
                    cleared.push(r);
                }
            }

            if(cleared.length > 0) {
                // Animación de flash
                cleared.forEach(r => {
                    for(let c=0; c<COLS; c++) {
                        boardEl.children[r*COLS + c].classList.add('clearing');
                    }
                });

                setTimeout(() => {
                    cleared.forEach(r => {
                        board.splice(r, 1);
                        board.unshift(Array(COLS).fill(0));
                    });
                    
                    // Lógica de puntos
                    const points = [0, 100, 300, 500, 800];
                    score += points[cleared.length] * level;
                    lines += cleared.length;
                    level = Math.floor(lines / 10) + 1;
                    dropInterval = Math.max(100, 1000 - (level * 80));
                    document.getElementById('score').textContent = score;
                    document.getElementById('lines').textContent = lines;
                    document.getElementById('level').textContent = level;
                    draw();
                }, 300);
            }
        }

        function drop(isSoft = false) {
            if(!collide(current, 0, 1)) {
                current.y++;
                if(isSoft) score += 1;
            } else {
                lockPiece();
            }
        }

        function hardDrop() {
            let dropDist = 0;
            while(!collide(current, 0, 1)) { current.y++; dropDist++; }
            score += dropDist * 2;
            if(dropDist > 0) navigator.vibrate(50); // Haptic feedback
            lockPiece();
        }

        function lockPiece() {
            merge();
            navigator.vibrate(20);
            clearLines();
            current = next;
            next = newPiece();
            if(collide(current, 0, 0)) {
                alert("GAME OVER! Score: " + score);
                gameActive = false;
            }
            draw();
        }

        function holdPiece() {
            if(!canHold) return;
            if(hold) {
                let temp = hold.type;
                hold = { type: current.type, shape: SHAPES[current.type], color: COLORS[current.type] };
                current = { type: temp, shape: SHAPES[temp], color: COLORS[temp], x: 3, y: 0 };
            } else {
                hold = { type: current.type, shape: SHAPES[current.type], color: COLORS[current.type] };
                current = next;
                next = newPiece();
            }
            canHold = false;
            draw();
        }

        function update(time = 0) {
            if(!gameActive) return;
            const deltaTime = time - lastTime;
            lastTime = time;
            dropTimer += deltaTime;

            if(dropTimer > dropInterval) {
                drop();
                dropTimer = 0;
                draw();
            }
            requestAnimationFrame(update);
        }

        // --- CONTROLES TÁCTILES ---
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

        boardEl.addEventListener('touchstart', e => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        boardEl.addEventListener('touchend', e => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const dt = Date.now() - touchStartTime;

            // Tap (Rotación)
            if(Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 200) {
                const rect = boardEl.getBoundingClientRect();
                if(touchEndX < rect.left + rect.width / 2) rotate(); // Tap izq
                else rotate(); // Tap der (En este prototipo simple rota igual, en real sería antihorario)
                draw();
                return;
            }

            // Swipes
            if(Math.abs(dx) > Math.abs(dy)) {
                if(dx < -20) { if(!collide(current, -1, 0)) current.x--; }
                else if(dx > 20) { if(!collide(current, 1, 0)) current.x++; }
            } else {
                if(dy > 40) drop(true); // Soft Drop
                else if(dy < -40) hardDrop(); // Hard Drop
            }
            draw();
        }, { passive: false });

        // Inicialización
        initBoard();
        current = newPiece();
        next = newPiece();
        draw();
        update();
    </script>
</body>
</html>`
  },
  "aplicacion-2": {
    title: `Agora — E-commerce Móvil de Próxima Generación`,
    brand: `Caso de Éxito: Aplicación`,
    desc: `Plataforma de marketplace completa móvil en modo vertical (Mobile Portrait), con animaciones fluidas y soporte Dark Mode.`,
    gradient: `from-yellow-500 to-amber-600`,
    challenge: `Construir un marketplace para celulares muy rápido, visualmente atractivo y fácil de navegar con una sola mano, que unifique compras y ventas.`,
    solution: `Maverlang AI estructuró la aplicación usando AlpineJS y TailwindCSS, integrando un buscador inteligente, grid de productos de 2 columnas, pantalla de detalles del producto con galería de fotos, chat interno y perfil de vendedor.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Flash"],
    region: `LatAm`,
    industry: `E-commerce / Marketplace`,
    quote: `El rendimiento fluido en dispositivos de gama media y la naturalidad del layout superaron nuestras expectativas.`,
    quoteAuthor: `Juan Pérez`,
    quoteRole: `Product Manager, Agora Marketplace`,
    metrics: [{"value":"100%","label":"Mobile First","sublabel":"Perfecto en celulares"},{"value":"60fps","label":"Rendimiento","sublabel":"Animaciones fluidas y ligeras"},{"value":"1.2s","label":"Carga Inicial","sublabel":"Respuestas instantáneas en móviles"}],
    demoTitle: `Agora — E-commerce Móvil de Próxima Generación`,
    demoPrompt: `Diseña una aplicación móvil de comercio electrónico estilo Mercado Libre, moderna, rápida y altamente profesional, optimizada exclusivamente para celulares(Mobile First - Portrait).
Nombre sugerido: “Vortex”, “Mercado Nova”, “Lumen Shop” o “Agora”.
Concepto general:
Una plataforma de marketplace completa donde cualquiera puede comprar y vender productos nuevos y usados de forma confiable, con una experiencia limpia, rápida y premium.
Estrategia visual y estilo:

Paleta de colores: Amarillo vibrante como color principal(#FFCC00 o #FACC15), negro / gris oscuro para fondos, blanco puro.Acentos en azul confiable y verde para envíos.
    Tipografía: Sans - serif moderna y muy legible(Inter, Satoshi o Roboto).Títulos claros y descripciones fáciles de leer.
Estilo general: Diseño limpio, moderno, con mucho espacio negativo, tarjetas bien definidas y navegación intuitiva.Soporte perfecto para Dark Mode.

Estructura principal de la App(Mobile Portrait):

Home / Inicio:
Buscador grande y permanente en la parte superior.
Carrusel de banners promocionales y ofertas del día.
Secciones rápidas: Categorías principales(con iconos grandes), “Ofertas del día”, “Más vendidos”, “Recomendados para ti”, “Envío gratis”.
Productos en grid de 2 columnas.

    Explorar / Categorías:
Menú de categorías completo con subcategorías.
Filtros avanzados potentes(precio, condición, ubicación, envío gratis, calificación, etc.).

Pantalla de Producto:
Galería de fotos grande con zoom y swipe.
Título claro, precio destacado(con precio anterior tachado si hay descuento).
Información de vendedor, reputación y “Mercado Envíos”.
Descripción detallada, características técnicas y opiniones.
    Botón “Comprar ahora” y “Agregar al carrito” grandes y fijos en la parte inferior.

Carrito y Checkout:
Carrito limpio con resumen.
Proceso de compra en pocos pasos: Dirección → Envío → Pago → Confirmación.
Opciones de pago claras(tarjeta, transferencia, cuotas, efectivo).

    Perfil / Vender:
Mis compras, Mis ventas, Favoritos, Historial.
Flujo sencillo y rápido para publicar productos(fotos, título, precio, descripción, categoría).


Características clave:

Sistema de búsqueda inteligente con sugerencias y corrección automática.
Recomendaciones personalizadas basadas en comportamiento.
Sistema de reputación de vendedores muy visible.
Filtros de ubicación(cerca de mí).
Notificaciones push: seguimiento de envíos, mensajes del vendedor, ofertas.
Chat integrado con el vendedor(rápido y limpio).
    Modo “Solo Envío Gratis” y “Solo Nuevos”.

Detalles de interacción:

Animaciones suaves y rápidas(nada pesado).
Feedback háptico al agregar al carrito, favorito o comprar.
Scroll infinito fluido en el feed principal.
Tarjetas de producto con hover / tap que muestran precio y descuento rápidamente.
Navegación inferior de 5 pestañas: Inicio | Categorías | Vender | Carrito | Perfil.
Modo offline básico(ver productos guardados).

Ambiente general:
Confianza, velocidad, claridad y cercanía.La app debe sentirse profesional pero accesible, moderna y confiable.Debe transmitir que comprar y vender es seguro, fácil y rápido.Experiencia premium sin ser complicada, pensada para millones de usuarios en Latinoamérica.
Requisitos técnicos visuales:

Excelente rendimiento en celulares de gama media.
Iconografía consistente y moderna.
Accesibilidad alta(buenos contrastes y tamaños de toque).
Optimizado para uso con una sola mano.`,
    demoCode: `<!DOCTYPE html>
<html lang="es" x-data="agoraApp()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Agora Marketplace</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        'agora-yellow': '#FACC15',
                        'agora-blue': '#2563EB',
                        'agora-green': '#10B981',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .snap-x-mandatory { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
        [x-cloak] { display: none !important; }
        .vibrate { animation: vibrate 0.2s; }
        @keyframes vibrate { 0% { transform: scale(1); } 50% { transform: scale(0.95); } 100% { transform: scale(1); } }
    </style>
</head>
<body class="bg-gray-100 dark:bg-zinc-900 flex justify-center text-zinc-900 dark:text-zinc-100">

    <!-- Mobile Container -->
    <div class="relative w-full max-w-md h-screen bg-white dark:bg-zinc-950 shadow-2xl flex flex-col overflow-hidden border-x border-gray-200 dark:border-zinc-800">
        
        <!-- Header -->
        <header class="px-4 pt-4 pb-2 bg-white dark:bg-zinc-950 z-20 sticky top-0 border-b border-gray-100 dark:border-zinc-800" x-show="activeTab !== 'product'">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-1 text-sm font-medium">
                    <svg class="w-4 h-4 text-agora-yellow" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                    <span>Enviar a</span>
                    <span class="font-bold">Bogotá 110111</span>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="darkMode = !darkMode" class="text-zinc-600 dark:text-zinc-300">
                        <svg x-show="!darkMode" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                        <svg x-show="darkMode" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                    </button>
                    <div class="relative">
                        <svg class="w-6 h-6 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                        <span x-show="cart.length > 0" class="absolute -top-1 -right-1 bg-agora-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" x-text="cart.length"></span>
                    </div>
                </div>
            </div>
            <div class="relative">
                <input type="text" placeholder="Buscar en Agora..." class="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                <svg class="w-5 h-5 text-zinc-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto pb-20 no-scrollbar" x-show="activeTab !== 'product'">
            
            <!-- HOME TAB -->
            <div x-show="activeTab === 'home'" class="space-y-6 pt-4">
                <!-- Banners -->
                <div class="flex gap-4 overflow-x-auto no-scrollbar snap-x-mandatory px-4">
                    <div class="min-w-[85%] h-32 bg-gradient-to-r from-agora-yellow to-yellow-500 rounded-2xl p-4 flex flex-col justify-center snap-start">
                        <h3 class="font-extrabold text-xl text-zinc-900">Hasta 40% OFF</h3>
                        <p class="text-zinc-800 text-sm font-medium">En tecnología seleccionada</p>
                        <button class="mt-2 bg-zinc-900 text-white text-xs font-bold py-1.5 px-4 rounded-lg w-fit">Ver ofertas</button>
                    </div>
                    <div class="min-w-[85%] h-32 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-4 flex flex-col justify-center snap-start">
                        <h3 class="font-extrabold text-xl text-agora-yellow">Envío Gratis</h3>
                        <p class="text-zinc-300 text-sm font-medium">En tu primera compra</p>
                    </div>
                </div>

                <!-- Categories -->
                <div class="px-4">
                    <h2 class="text-lg font-bold mb-3">Categorías</h2>
                    <div class="flex justify-between gap-2">
                        <template x-for="cat in categories" :key="cat.name">
                            <div class="flex flex-col items-center gap-1 w-1/4">
                                <div class="w-14 h-14 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl" x-html="cat.icon"></div>
                                <span class="text-xs text-center font-medium" x-text="cat.name"></span>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Offers Grid -->
                <div class="px-4">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-lg font-bold">Ofertas del día</h2>
                        <span class="text-agora-blue text-sm font-semibold">Ver todas</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <template x-for="(product, index) in products" :key="index">
                            <div @click="openProduct(product)" class="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden active:scale-95 transition-transform cursor-pointer">
                                <div class="aspect-square bg-gray-50 dark:bg-zinc-800 relative">
                                    <img :src="product.img" :alt="product.name" class="w-full h-full object-cover" loading="lazy">
                                    <span class="absolute top-2 left-2 bg-agora-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Envío Gratis</span>
                                </div>
                                <div class="p-2">
                                    <p class="text-xs text-zinc-500 dark:text-zinc-400 line-through" x-text="product.oldPrice"></p>
                                    <p class="text-lg font-bold text-zinc-900 dark:text-white" x-text="formatPrice(product.price)"></p>
                                    <p class="text-xs text-agora-green font-semibold" x-text="product.discount + '% OFF'"></p>
                                    <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate" x-text="product.name"></p>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- CATEGORIES TAB -->
            <div x-show="activeTab === 'categories'" class="p-4 space-y-6">
                <h2 class="text-2xl font-extrabold">Categorías</h2>
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <button @click="filterFreeShipping = !filterFreeShipping" :class="filterFreeShipping ? 'bg-agora-green text-white' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'" class="text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap">Solo Envío Gratis</button>
                    <button @click="filterNew = !filterNew" :class="filterNew ? 'bg-agora-blue text-white' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'" class="text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap">Solo Nuevos</button>
                </div>
                <div class="space-y-3">
                    <template x-for="cat in categories" :key="cat.name">
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer active:bg-gray-100">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl" x-html="cat.icon"></span>
                                <span class="font-semibold" x-text="cat.name"></span>
                            </div>
                            <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </template>
                </div>
            </div>

            <!-- SELL TAB -->
            <div x-show="activeTab === 'sell'" class="p-4 space-y-4">
                <h2 class="text-2xl font-extrabold">Vender producto</h2>
                <div class="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center">
                    <svg class="w-12 h-12 mx-auto text-zinc-400 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    <p class="font-semibold">Subir fotos</p>
                    <p class="text-xs text-zinc-500">Arrastra o toca para subir (Máx 10)</p>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-bold text-zinc-600 dark:text-zinc-400">Título</label>
                        <input type="text" placeholder="Ej: iPhone 13 128GB" class="w-full mt-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-sm font-bold text-zinc-600 dark:text-zinc-400">Precio</label>
                            <input type="text" placeholder="$ 1,000,000" class="w-full mt-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                        </div>
                        <div>
                            <label class="text-sm font-bold text-zinc-600 dark:text-zinc-400">Condición</label>
                            <select class="w-full mt-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                                <option>Nuevo</option>
                                <option>Usado</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button @click="haptic()" class="w-full bg-agora-yellow text-zinc-900 font-extrabold py-4 rounded-xl text-lg shadow-lg shadow-agora-yellow/30 active:scale-95 transition-transform">Publicar</button>
            </div>

            <!--CART TAB-->
    <div x-show="activeTab === 'cart'" class="p-4 space-y-4">
        <h2 class="text-2xl font-extrabold">Mi Carrito (<span x-text="cart.length"></span>)</h2>
        <template x-if="cart.length === 0">
            <div class="text-center py-20">
                <p class="text-zinc-500 mb-4">Tu carrito está vacío</p>
                <button @click="activeTab='home'" class="text-agora-blue font-bold">Explorar productos</button>
    </div>
                </template>
    <template x-for="(item, index) in cart" : key="index">
        <div class="flex gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
            <img:src="item.img" class="w-20 h-20 rounded-lg object-cover" alt="">
            <div class="flex-1">
                <p class="text-sm font-medium truncate" x-text="item.name"></p>
                <p class="text-lg font-bold" x-text="formatPrice(item.price)"></p>
                <button @click="cart.splice(index, 1)" class="text-xs text-red-500 font-semibold mt-1">Eliminar</button>
        </div>
    </div>
                </template>
    <div x-show="cart.length > 0" class="absolute bottom-20 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800">
        <div class="flex justify-between mb-3">
            <span class="font-medium text-zinc-500">Total</span>
            <span class="text-2xl font-extrabold" x-text="formatPrice(totalCart())"></span>
        </div>
        <button @click="haptic()" class="w-full bg-agora-yellow text-zinc-900 font-extrabold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-transform">Continuar compra</button>
                </div>
            </div>

            < !--PROFILE TAB-- >
    <div x-show="activeTab === 'profile'" class="p-4">
        <div class="flex flex-col items-center mb-6">
            <div class="w-24 h-24 bg-agora-yellow rounded-full flex items-center justify-center text-4xl font-extrabold text-zinc-900 mb-3">J</div>
            <h2 class="text-xl font-bold">Juan Pérez</h2>
            <p class="text-sm text-agora-green font-semibold flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1l2.928 5.934 6.55.95-4.739 4.62L15.856 19 10 15.934 4.144 19l1.117-5.496L.522 7.884l6.55-.95L10 1z" clip-rule="evenodd"></path></svg>
                Comprador Oro
            </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform">
                <svg class="w-8 h-8 mx-auto mb-2 text-zinc-700 dark:text-zinc-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                <span class="font-semibold text-sm">Mis Compras</span>
            </div>
            <div class="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform">
                <svg class="w-8 h-8 mx-auto mb-2 text-zinc-700 dark:text-zinc-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                <span class="font-semibold text-sm">Favoritos</span>
            </div>
        </div>
    </div>

        </main>

        < !--Product Detail Overlay-- >
    <div x-show="activeTab === 'product'" x-transition.opacity class="absolute inset-0 bg-white dark:bg-zinc-950 z-30 flex flex-col overflow-y-auto no-scrollbar" x-cloak>
        <div class="relative">
            <img:src="selectedProduct.img" class="w-full h-96 object-cover" alt="Product">
            <button @click="activeTab='home'" class="absolute top-4 left-4 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-lg active:scale-90 transition-transform">
            <svg class="w-6 h-6 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button @click="haptic()" class="absolute top-4 right-4 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-lg active:scale-90 transition-transform">
        <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    </button>
            </div>
            <div class="p-4 flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <p class="text-sm text-zinc-500 line-through" x-text="selectedProduct.oldPrice"></p>
                    <p class="text-sm text-agora-green font-bold" x-text="selectedProduct.discount + '% OFF'"></p>
                </div>
                <h1 class="text-2xl font-extrabold mb-2" x-text="selectedProduct.name"></h1>
                <p class="text-3xl font-extrabold text-zinc-900 dark:text-white mb-4" x-text="formatPrice(selectedProduct.price)"></p>
                
                <div class="flex items-center gap-2 mb-4 text-sm">
                    <svg class="w-5 h-5 text-agora-green" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                    <span class="font-semibold text-agora-green">Envío Gratis</span>
                    <span class="text-zinc-500">· Llega mañana</span>
                </div>

                <div class="border-t border-gray-100 dark:border-zinc-800 py-4 mb-4">
                    <h3 class="font-bold mb-2">Descripción</h3>
                    <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">Producto en excelente estado. Incluye caja original y todos sus accesorios. Sujeto a disponibilidad. Garantía de 3 meses directamente con el vendedor.</p>
                </div>

                <div class="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl">
                    <div class="w-12 h-12 bg-agora-blue rounded-full flex items-center justify-center text-white font-bold">T</div>
                    <div class="flex-1">
                        <p class="font-bold text-sm">TechStore Oficial</p>
                        <p class="text-xs text-agora-green flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Mercado Líder Platinum
                        </p>
                    </div>
                    <button class="text-agora-blue text-sm font-bold">Ver tienda</button>
                </div>
            </div>

            <!--Sticky Bottom Actions-->
            <div class="sticky bottom-0 bg-white dark:bg-zinc-950 p-4 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
                <button @click="addToCart(selectedProduct)" class="flex-1 border-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">Agregar</button>
                <button @click="addToCart(selectedProduct); activeTab='cart'" class="flex-[2] bg-agora-yellow text-zinc-900 font-extrabold py-3 rounded-xl shadow-lg active:scale-95 transition-transform" > Comprar ahora</button>
            </div>
        </div>

        < !--Bottom Navigation-- >
        <nav x-show="activeTab !== 'product'" class="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex justify-around items-center h-16 z-20 pb-safe">
            <button @click="activeTab='home'" :class="activeTab === 'home' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                <span class="text-[10px] font-semibold">Inicio</span>
            </button>
            <button @click="activeTab='categories'" : class="activeTab === 'categories' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform" >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                <span class="text-[10px] font-semibold">Categorías</span>
            </button>
    <button @click="activeTab='sell'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform" >
                <div class="w-10 h-10 bg-agora-yellow rounded-xl flex items-center justify-center shadow-lg shadow-agora-yellow/30 -mt-4 border-4 border-white dark:border-zinc-950">
                    <svg class="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <span class="text-[10px] font-semibold text-zinc-900 dark:text-white">Vender</span>
            </button>
    <button @click="activeTab='cart'" : class="activeTab === 'cart' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform relative" >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                <span class="text-[10px] font-semibold">Carrito</span>
            </button>
    <button @click="activeTab='profile'" : class="activeTab === 'profile' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform" >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span class="text-[10px] font-semibold">Perfil</span>
            </button>
        </nav>

    </div>

    <script>
        function agoraApp() {
            return {
            darkMode: false, // Inicia en Modo Claro por defecto
        activeTab: 'home',
        filterFreeShipping: false,
        filterNew: false,
        cart: [],
        selectedProduct: { },
        haptic() {
                    if (navigator.vibrate) navigator.vibrate(10);
                },
        formatPrice(num) {
                    return '$' + num.toLocaleString('es-CO');
                },
        openProduct(product) {
            this.selectedProduct = product;
        this.activeTab = 'product';
        document.querySelector('main').scrollTop = 0;
                },
        addToCart(product) {
            this.cart.push(product);
        this.haptic();
                },
        totalCart() {
                    return this.cart.reduce((sum, item) => sum + item.price, 0);
                },
        categories: [
        {name: 'Tecnología', icon: '📱' },
        {name: 'Hogar', icon: '🛋️' },
        {name: 'Moda', icon: '👗' },
        {name: 'Vehículos', icon: '🚗' }
        ],
        products: [
        {name: 'iPhone 13 128GB', price: 2400000, oldPrice: '$3.000.000', discount: 20, img: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80' },
        {name: 'Audífonos Sony WH', price: 890000, oldPrice: '$1.200.000', discount: 25, img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80' },
        {name: 'Apple Watch Series 8', price: 1590000, oldPrice: '$1.900.000', discount: 15, img: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500&q=80' },
        {name: 'Cámara GoPro Hero 11', price: 1750000, oldPrice: '$2.100.000', discount: 16, img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&q=80' },
        {name: 'MacBook Air M2', price: 4990000, oldPrice: '$5.800.000', discount: 14, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' },
        {name: 'Silla Gamer Reclinable', price: 650000, oldPrice: '$950.000', discount: 31, img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=80' }
        ]
            }
        }
    </script>
</body>
</html>`
  },
  "aplicacion-3": {
    title: `Clarity Invest — Inversiones Financieras Simplificadas`,
    brand: `Caso de Éxito: Aplicación`,
    desc: `Aplicación móvil financiera premium para inversiones en acciones, ETFs y fondos indexados, programada de manera limpia y sofisticada.`,
    gradient: `from-slate-900 to-blue-900`,
    challenge: `El diseño de aplicaciones de trading tradicionales suele ser confuso, sobrecargado de datos ruidosos y complejo para nuevos usuarios.`,
    solution: `Maverlang AI estructuró la interfaz del Dashboard financiero con gráficos SVG interactivos de rendimiento, control de periodos de tiempo y listas de activos.`,
    products: ["Desarrollador de Apps (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `Global`,
    industry: `Fintech / Inversiones`,
    quote: `La simpleza visual de los gráficos de rendimiento y la jerarquía de la información la hacen la app más pulida de nuestra colección.`,
    quoteAuthor: `Carlos Méndez`,
    quoteRole: `Chief Design Officer, Clarity Invest`,
    metrics: [{"value":"0%","label":"Confusión","sublabel":"Fácil de entender e interpretar"},{"value":"SVG","label":"Gráficos","sublabel":"Curvas vectoriales interactivas"},{"value":"3 Pasos","label":"Flujo de Compra","sublabel":"Simplicidad extrema para invertir"}],
    demoTitle: `Clarity Invest — Inversiones Financieras Simplificadas`,
    demoPrompt: `Crea una aplicación para celulares financiera premium para invertir en acciones, fondos indexados y ETFs, que transmita confianza, claridad, profesionalismo y sofisticación accesible. El antídoto a las apps financieras confusas, sobrecargadas de información y poco intuitivas.
Nombre sugerido: “Clarity Invest”, “Aether Capital” o “Lumen Finance”.
Estrategia visual y estilo:

Paleta de colores:
Primarios: Azul profundo profesional (#0F172A), blanco puro y gris neutro elegante.
Acentos: Verde esmeralda positivo (#10B981) para ganancias, rojo sutil para pérdidas, y azul brillante para acciones destacadas.

Tipografía: Sans-serif moderna y altamente legible (Inter o Satoshi). Títulos en peso 600-700, textos claros con excelente jerarquía.
Estilo general: Diseño minimalista premium, mucho espacio negativo, gráficos limpios y elegantes. Dark mode y Light mode impecables.
Visuales: Gráficos de líneas suaves y modernos, velas japonesas claras, iconografía simple y consistente. Fotografías sutiles de mercados financieros abstractos o arquitectónicos.

Estructura principal de la App (Mobile First):

Home / Dashboard (pantalla principal):
Resumen de portafolio con valor total, ganancia/pérdida diaria y general (con porcentaje grande y claro).
Gráfico interactivo del rendimiento del portafolio (1D, 7D, 1M, 3M, 1A, MAX).
Tarjetas rápidas: Acciones en tendencia, Fondos recomendados, Índices principales (S&P 500, Nasdaq, Merval, etc.).

Explorar / Mercado:
Buscador inteligente destacado en la parte superior.
Secciones: Acciones, Fondos Indexados, ETFs, Índices.
Filtros claros por sector, rendimiento, capitalización, dividendo, etc.
Lista de activos con precio, variación % y gráfico mini.

Portafolio:
Vista detallada de todas las inversiones.
Distribución por asset class (gráfico de torta elegante).
Rendimiento por activo con opción de ver histórico.

Invertir:
Flujo de compra extremadamente sencillo y claro (máximo 3 pasos).
Vista detallada de cada activo con información fundamental, noticias relevantes y análisis técnico.

Aprender / Academia:
Contenido educativo breve y visual (cursos cortos, glosario, guías).

Perfil y Ajustes:
Datos personales, verificación de identidad, preferencias de riesgo, historial de transacciones.


Detalles de interacción y experiencia:

Navegación inferior clara con 5 pestañas: Inicio, Explorar, Portafolio, Invertir, Perfil.
Todos los números y gráficos son interactivos (tap para más detalle).
Transiciones suaves y elegantes entre pantallas.
Feedback visual claro al comprar/vender (animación de confirmación).
Gráficos que se actualizan en tiempo real con animaciones suaves.
Modo oscuro por defecto con opción de cambio.
Notificaciones inteligentes y no invasivas (solo movimientos importantes o alertas configuradas).
Onboarding inicial muy claro y educativo para nuevos inversores.

Ambiente general:
Profesional, confiable, transparente, moderno y calmado. La app debe transmitir seguridad financiera y empoderamiento: “Invertir de forma inteligente es más sencillo y claro de lo que pensabas”. Cada pantalla debe sentirse premium, organizada y fácil de entender incluso para inversores principiantes.
Requisitos adicionales:

Alta legibilidad en todos los tamaños de letra.
Accesibilidad excelente (contrastes altos, soporte para VoiceOver).
Sensación de velocidad y fluidez.
Enfoque en datos claros y acciones accionables.`,
    demoCode: `import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- Sistema de Diseño (Design System) ---
const COLORS = {
  background: '#0F172A', // Azul profundo
  surface: '#1E293B',    // Superficies/Tarjetas
  border: '#334155',     // Bordes sutiles
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8', // Gris elegante
  gain: '#10B981',       // Verde esmeralda
  loss: '#F43F5E',       // Rojo sutil
  accent: '#3B82F6',     // Azul brillante CTA
};

// --- Datos Mockups ---
const portfolioData = {
  totalBalance: '$154,320.50',
  dailyChange: '+$1,240.00',
  dailyChangePercent: '+0.81%',
  isPositive: true,
};

const timeRanges = ['1D', '7D', '1M', '3M', '1A', 'MAX'];

const marketIndices = [
  { name: 'S&P 500', value: '5,150.42', change: '+0.54%', isPositive: true },
  { name: 'Nasdaq', value: '16,103.01', change: '+0.72%', isPositive: true },
  { name: 'Merval', value: '1,432,105.20', change: '-0.23%', isPositive: false },
];

const opportunities = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: '$172.40', change: '+1.2%', isPositive: true },
  { ticker: 'MSFT', name: 'Microsoft Corp.', price: '$408.59', change: '+0.8%', isPositive: true },
  { ticker: 'VOO', name: 'S&P 500 ETF', price: '$465.80', change: '+0.4%', isPositive: true },
];

// --- Componente de Gráfico SVG Personalizado ---
const PortfolioChart = () => {
  const chartWidth = width - 40; // Padding de 20 a cada lado
  const chartHeight = 200;
  const pathD = "M0,150 C40,120 80,140 120,100 C160,60 200,90 240,70 C280,50 320,80 360,40";
  const fillD = \`\${pathD} L\${chartWidth},\${chartHeight} L0,\${chartHeight} Z\`;

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.3" />
            <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillD} fill="url(#grad)" />
        <Path d={pathD} fill="none" stroke={COLORS.accent} strokeWidth="3" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const MarketCard = ({ item }) => (
  <View style={styles.marketCard}>
    <View>
      <Text style={styles.marketName}>{item.name}</Text>
      <Text style={styles.marketValue}>{item.value}</Text>
    </View>
    <View style={[styles.badge, { backgroundColor: item.isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }]}>
      <Text style={[styles.badgeText, { color: item.isPositive ? COLORS.gain : COLORS.loss }]}>
        {item.change}
      </Text>
    </View>
  </View>
);

const OpportunityItem = ({ item }) => (
  <View style={styles.opportunityRow}>
    <View style={styles.assetIcon}>
      <Text style={styles.assetIconText}>{item.ticker.charAt(0)}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.assetName}>{item.name}</Text>
      <Text style={styles.assetTicker}>{item.ticker}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.assetPrice}>{item.price}</Text>
      <Text style={[styles.assetChange, { color: item.isPositive ? COLORS.gain : COLORS.loss }]}>
        {item.change}
      </Text>
    </View>
  </View>
);

export default function App() {
  const [activeRange, setActiveRange] = useState('1M');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días</Text>
            <Text style={styles.userName}>Carlos Méndez</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>CM</Text>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Valor total del portafolio</Text>
          <Text style={styles.heroBalance}>{portfolioData.totalBalance}</Text>
          <View style={styles.heroChangeContainer}>
            <Text style={[styles.heroChange, { color: COLORS.gain }]}>
              {portfolioData.dailyChange} ({portfolioData.dailyChangePercent})
            </Text>
            <Text style={styles.heroTimeLabel}>Hoy</Text>
          </View>

          <PortfolioChart />

          <View style={styles.timeTogglesContainer}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setActiveRange(range)}
                style={[
                  styles.timeToggle,
                  activeRange === range && styles.timeToggleActive
                ]}
              >
                <Text
                  style={[
                    styles.timeToggleText,
                    activeRange === range && styles.timeToggleTextActive
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Índices del Mercado</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketScroll}>
            {marketIndices.map((item, index) => (
              <MarketCard key={index} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oportunidades Destacadas</Text>
          <Card>
            {opportunities.map((item, index) => (
              <OpportunityItem key={index} item={item} />
            ))}
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroCard: {
    marginBottom: 24,
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBalance: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  heroChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroTimeLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  chartContainer: {
    height: 200,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTogglesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
  },
  timeToggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeToggleActive: {
    backgroundColor: COLORS.surface,
  },
  timeToggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeToggleTextActive: {
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  marketScroll: {
    paddingRight: 20,
  },
  marketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  marketValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '750',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIconText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  assetName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  assetTicker: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  assetPrice: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  assetChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});`,
    demoCodeOverride: `<!DOCTYPE html>
<html lang="es" x-data="clarityApp()" :class="{ 'dark': true }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Clarity Invest</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        'clarity-bg': '#0F172A',
                        'clarity-surface': '#1E293B',
                        'clarity-border': '#334155',
                        'clarity-gain': '#10B981',
                        'clarity-loss': '#F43F5E',
                        'clarity-accent': '#3B82F6',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-[#0b0f19] flex justify-center text-white">

    <!-- Mobile Device Frame -->
    <div class="relative w-full max-w-md h-screen bg-[#0F172A] shadow-2xl flex flex-col overflow-hidden border-x border-[#334155]">
        
        <!-- Header -->
        <header class="px-5 pt-5 pb-3 bg-[#0F172A] z-20 flex items-center justify-between">
            <div>
                <span class="text-xs text-slate-400 font-medium">Buenos días</span>
                <h2 class="text-xl font-bold text-white mt-0.5">Carlos Méndez</h2>
            </div>
            <div class="w-11 h-11 bg-[#1E293B] rounded-full flex items-center justify-center border border-[#334155] cursor-pointer hover:border-blue-400 transition-colors">
                <span class="text-sm font-bold text-white">CM</span>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto pb-20 px-5 no-scrollbar space-y-6">
            
            <!-- Hero Card: Portfolio Value -->
            <div class="bg-[#1E293B] rounded-3xl p-5 border border-[#334155] shadow-md">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor total del portafolio</span>
                <h1 class="text-3xl font-extrabold text-white mt-1.5 tracking-tight">$154,320.50</h1>
                
                <div class="flex items-center gap-1.5 mt-1">
                    <span class="text-sm font-bold text-[#10B981]">+$1,240.00 (+0.81%)</span>
                    <span class="text-xs text-slate-400 font-semibold">Hoy</span>
                </div>

                <!-- Interactive SVG Chart -->
                <div class="h-44 mt-6 flex items-center justify-center relative">
                    <!-- Dynamic chart rendering based on Alpines selected range -->
                    <svg viewBox="0 0 340 160" class="w-full h-full">
                        <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35" />
                                <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0" />
                            </linearGradient>
                        </defs>
                        <!-- Area Fill -->
                        <path :d="getCurrentChartArea()" fill="url(#chartGrad)" class="transition-all duration-500 ease-in-out" />
                        <!-- Line -->
                        <path :d="getCurrentChartLine()" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" class="transition-all duration-500 ease-in-out" />
                    </svg>
                </div>

                <!-- Time range toggles -->
                <div class="flex justify-between mt-5 bg-[#0F172A] rounded-xl p-1">
                    <template x-for="range in ranges" :key="range">
                        <button 
                            @click="activeRange = range" 
                            :class="activeRange === range ? 'bg-[#1E293B] text-white shadow' : 'text-slate-400 hover:text-white'"
                            class="flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all"
                            x-text="range"
                        ></button>
                    </template>
                </div>
            </div>

            <!-- Market Indices -->
            <div class="space-y-3">
                <h3 class="text-base font-bold text-white">Índices del Mercado</h3>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    <template x-for="idx in indices" :key="idx.name">
                        <div class="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 min-w-[130px] flex flex-col justify-between shadow-sm">
                            <div>
                                <span class="text-xs font-semibold text-slate-400" x-text="idx.name"></span>
                                <h4 class="text-base font-extrabold mt-1 text-white" x-text="idx.value"></h4>
                            </div>
                            <span 
                                :class="idx.isPositive ? 'text-[#10B981]' : 'text-[#F43F5E]'" 
                                class="text-[10px] font-bold mt-2" 
                                x-text="idx.change"
                            ></span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Opportunities list -->
            <div class="space-y-3">
                <h3 class="text-base font-bold text-white">Oportunidades Destacadas</h3>
                <div class="bg-[#1E293B] border border-[#334155] rounded-2xl p-2 divide-y divide-[#334155]/40 shadow-sm">
                    <template x-for="opp in opportunities" :key="opp.ticker">
                        <div class="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/40 rounded-xl transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <span class="text-[#3B82F6] font-bold text-base" x-text="opp.ticker[0]"></span>
                                </div>
                                <div>
                                    <h4 class="text-sm font-bold text-white" x-text="opp.name"></h4>
                                    <span class="text-xs text-slate-400" x-text="opp.ticker"></span>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-sm font-bold text-white" x-text="opp.price"></span>
                                <p :class="opp.isPositive ? 'text-[#10B981]' : 'text-[#F43F5E]'" class="text-xs font-bold" x-text="opp.change"></p>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

        </main>

        <!-- Bottom Navigation Bar -->
        <nav class="absolute bottom-0 left-0 right-0 bg-[#0F172A] border-t border-[#334155] flex justify-around items-center h-16 z-20">
            <button class="flex flex-col items-center justify-center gap-0.5 w-full h-full text-[#3B82F6]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                <span class="text-[9px] font-semibold">Inicio</span>
            </button>
            <button class="flex flex-col items-center justify-center gap-0.5 w-full h-full text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <span class="text-[9px] font-semibold">Mercado</span>
            </button>
            <button class="flex flex-col items-center justify-center gap-0.5 w-full h-full text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
                <span class="text-[9px] font-semibold">Portafolio</span>
            </button>
            <button class="flex flex-col items-center justify-center gap-0.5 w-full h-full text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v12m-3-3l3 3m0 0l3-3m-3-12V3" /></svg>
                <span class="text-[9px] font-semibold">Invertir</span>
            </button>
            <button class="flex flex-col items-center justify-center gap-0.5 w-full h-full text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span class="text-[9px] font-semibold">Perfil</span>
            </button>
        </nav>
    </div>

    <script>
        function clarityApp() {
            return {
                activeRange: '1M',
                ranges: ['1D', '7D', '1M', '3M', '1A', 'MAX'],
                indices: [
                    { name: 'S&P 500', value: '5,150.42', change: '+0.54%', isPositive: true },
                    { name: 'Nasdaq', value: '16,103.01', change: '+0.72%', isPositive: true },
                    { name: 'Merval', value: '1,432,105.20', change: '-0.23%', isPositive: false }
                ],
                opportunities: [
                    { ticker: 'AAPL', name: 'Apple Inc.', price: '$172.40', change: '+1.2%', isPositive: true },
                    { ticker: 'MSFT', name: 'Microsoft Corp.', price: '$408.59', change: '+0.8%', isPositive: true },
                    { ticker: 'VOO', name: 'S&P 500 ETF', price: '$465.80', change: '+0.4%', isPositive: true }
                ],
                charts: {
                    '1D': {
                        line: 'M0,130 C40,110 80,120 120,95 C160,80 200,90 240,65 C280,60 320,55 360,50',
                        area: 'M0,130 C40,110 80,120 120,95 C160,80 200,90 240,65 C280,60 320,55 360,50 L360,160 L0,160 Z'
                    },
                    '7D': {
                        line: 'M0,140 C40,130 80,110 120,115 C160,90 200,100 240,75 C280,50 320,70 360,60',
                        area: 'M0,140 C40,130 80,110 120,115 C160,90 200,100 240,75 C280,50 320,70 360,60 L360,160 L0,160 Z'
                    },
                    '1M': {
                        line: 'M0,150 C40,120 80,140 120,100 C160,60 200,90 240,70 C280,50 320,80 360,40',
                        area: 'M0,150 C40,120 80,140 120,100 C160,60 200,90 240,70 C280,50 320,80 360,40 L360,160 L0,160 Z'
                    },
                    '3M': {
                        line: 'M0,120 C40,130 80,100 120,90 C160,105 200,60 240,50 C280,30 320,40 360,30',
                        area: 'M0,120 C40,130 80,100 120,90 C160,105 200,60 240,50 C280,30 320,40 360,30 L360,160 L0,160 Z'
                    },
                    '1A': {
                        line: 'M0,100 C40,110 80,90 120,75 C160,60 200,45 240,50 C280,35 320,25 360,20',
                        area: 'M0,100 C40,110 80,90 120,75 C160,60 200,45 240,50 C280,35 320,25 360,20 L360,160 L0,160 Z'
                    },
                    'MAX': {
                        line: 'M0,160 C40,150 80,120 120,90 C160,70 200,50 240,40 C280,30 320,15 360,10',
                        area: 'M0,160 C40,150 80,120 120,90 C160,70 200,50 240,40 C280,30 320,15 360,10 L360,160 L0,160 Z'
                    }
                },
                getCurrentChartLine() {
                    return this.charts[this.activeRange].line;
                },
                getCurrentChartArea() {
                    return this.charts[this.activeRange].area;
                }
            }
        }
    </script>
</body>
</html>`
  }
};;;

interface CasosPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CasoDeUsoPage({ params }: CasosPageProps) {
  const { slug } = await params;
  const data = USE_CASE_MAP[slug];

  if (!data) {
    notFound();
  }

  let deviceType: 'desktop' | 'mobile' | 'multiplatform' = 'desktop';
  if (slug.includes('multiplataforma')) {
    deviceType = 'multiplatform';
  } else if (slug.includes('aplicacion')) {
    deviceType = 'mobile';
  }

  return (
    <div className="bg-white h-screen w-screen overflow-y-auto pt-24 pb-20 font-sans text-slate-800 selection:bg-blue-150 selection:text-white select-none fixed inset-0 z-50">
      <LandingNavbar />
      
      {/* Container header and navigation */}
      <div className="max-w-6xl mx-auto px-6">

        {/* Breadcrumbs navigation row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-12">
          {/* Left Breadcrumbs */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Link href="/home" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Inicio
            </Link>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-slate-400">Casos de Uso</span>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-slate-500 font-bold">{data.brand}</span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
            <span className="text-[#1890FF]">Resumen del caso</span>
            <Link href="/home" className="hover:text-slate-900 transition-colors">Todos los casos de uso</Link>
          </div>
        </div>

        {/* Intro Section - Split H1 and Sidebar Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-16">
          
          {/* Left Content Column (H1 + Muted paragraph) */}
          <div className="lg:col-span-8">
            {/* Brand indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${data.gradient} text-white text-[10px] font-black uppercase tracking-wider mb-6 shadow-sm`}>
              {data.brand}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.05] mb-6">
              {data.title}
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed font-normal mb-8">
              {data.desc}
            </p>
          </div>

          {/* Right Floating Sidebar Metadata (Stripe Style) */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-[#FAF9F5] border border-[#E9E8E4] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs text-left">
              
              {/* Brand Logo Display */}
              <div className="flex items-center gap-2 pb-4 border-b border-[#E9E8E4]">
                <Logo showText={true} size="sm" forceLight={true} />
              </div>

              {/* Products used */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Productos Utilizados</h4>
                <ul className="space-y-3">
                  {data.products.map((prod, pi) => (
                    <li key={pi} className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1890FF]" />
                      {prod}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Geographic Region */}
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold pt-4 border-t border-[#E9E8E4]">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Región: <strong className="text-slate-800 font-bold">{data.region}</strong></span>
              </div>

              {/* Industry/Segment */}
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Industria: <strong className="text-slate-800 font-bold">{data.industry}</strong></span>
              </div>

            </div>
          </div>

        </div>

        {/* Content details and metrics row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pt-12 border-t border-slate-200/80">
          
          {/* Left Column - Metrics stack with vertical blue indicators */}
          <div className="lg:col-span-4 flex flex-col gap-10 text-left">
            {data.metrics.map((metric, mi) => (
              <div key={mi} className="border-l-[3.5px] border-[#1890FF] pl-5 flex flex-col items-start">
                <div className="text-4xl md:text-5xl font-black text-[#1890FF] tracking-tight leading-none mb-1">
                  {metric.value}
                </div>
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                  {metric.label}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {metric.sublabel}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - The Story paragraphs and high-fidelity Quote Box */}
          <div className="lg:col-span-8 text-left flex flex-col gap-8">
            
            {/* El Desafio */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#EF4444] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#EF4444]" /> El Desafío Anterior
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                {data.challenge}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-200/60" />

            {/* La Solucion */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1890FF] mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1890FF]" /> La Solución con Maverlang IA
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                {data.solution}
              </p>
            </div>

            {/* Quote Block (Stripe style) */}
            <blockquote className="relative bg-gradient-to-br from-blue-600 to-indigo-850 rounded-3xl p-8 text-white text-left shadow-lg overflow-hidden mt-6">
              {/* Blur gradient sphere inside quote card */}
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
              
              <p className="text-lg md:text-xl font-medium italic mb-6 leading-relaxed relative z-10">
                "{data.quote}"
              </p>
              
              <div className="relative z-10 flex flex-col">
                <span className="text-sm font-bold text-white">{data.quoteAuthor}</span>
                <span className="text-[11px] text-blue-200 font-semibold">{data.quoteRole}</span>
              </div>
            </blockquote>

            {/* We closed blockquote here */}
          </div>

        </div>

        {/* Full-Width AI Prompt console widget (renders below the story/metrics grid) */}
        {data.demoPrompt && (
          <UseCasePrompt promptText={data.demoPrompt} />
        )}

        {/* Full-Width Interactive Demo and Code Visualizer */}
        {data.demoCode && (
          <UseCasePreview
            code={data.demoCode}
            previewCode={data.demoCodeOverride}
            deviceType={deviceType}
            title={data.demoTitle || "Código de Ejemplo"}
          />
        )}

        {/* Bottom Call to Action Section */}
        <div className="bg-[#FAF9F5] border border-[#E9E8E4] rounded-3xl p-8 md:p-12 text-center mt-20 shadow-xs max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-black text-slate-950 mb-3 tracking-tight">
            Obtén la misma ventaja en tus análisis
          </h3>
          <p className="text-xs md:text-sm text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Únete hoy a Maverlang y eleva el nivel de tus decisiones de inversión con nuestra red multi-agente de Inteligencia Artificial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1890FF] hover:bg-[#1890FF]/90 text-white font-bold text-xs md:text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-[#1890FF]/20 group cursor-pointer"
            >
              Comenzar Gratis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/suscripcion"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs md:text-sm px-6 py-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Ver Planes Premium
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
