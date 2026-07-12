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
  "sitio-web-1": {
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
  "sitio-web-2": {
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
                                        dot.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)';
  });

                                        function animateRing() {
                                            ringX += (mouseX - ringX) * 0.15;
                                        ringY += (mouseY - ringY) * 0.15;
                                        ring.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px) translate(-50%, -50%)';
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
                                        progress.style.transform = 'scaleX(' + pct + ')';
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
                                                heroMockup.style.transform = 'perspective(1000px) rotateY(' + (x * 0.3) + 'deg) rotateX(' + (-y * 0.3) + 'deg)';
                                            });
  }
                                    </script>

                                </body>
                            </html>`
  },
  "multiplataforma-1": {
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
    <title>Circle - Intimate Spaces</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        .font-serif { font-family: 'Fraunces', serif; }
        
        /* Paleta Espresso & Sage (Warm Dark Mode) */
        .bg-espresso { background-color: #1A1917; }
        .bg-surface { background-color: #24221F; }
        .bg-surface-hover:hover { background-color: #2C2A26; }
        .border-warm { border-color: #332F2A; }
        .text-sage { color: #A3B18A; }
        .bg-sage { background-color: #A3B18A; }
        .bg-sage-soft { background-color: rgba(163, 177, 138, 0.15); }
        .border-sage { border-color: rgba(163, 177, 138, 0.3); }
        .glass-warm { background: rgba(26, 25, 23, 0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #332F2A; border-radius: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .scale-in { animation: scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        .focus-blur { filter: blur(12px) brightness(0.4); pointer-events: none; transition: all 0.4s ease; }
        
        /* Efecto de arrastrar y soltar (Desktop) */
        .drop-zone { transition: all 0.3s ease; border: 2px dashed transparent; }
        .drop-zone.active { border-color: #A3B18A; background-color: rgba(163, 177, 138, 0.05); transform: scale(1.02); }
    </style>
</head>
<body class="bg-espresso text-stone-200 antialiased pb-24 lg:pb-0">

    <!-- Layout Principal -->
    <div id="appLayout" class="flex h-screen overflow-hidden">

        <!-- ======================================= -->
        <!-- COLUMNA 1: Lista de Círculos (Desktop)  -->
        <!-- ======================================= -->
        <aside class="w-64 bg-surface border-r border-warm flex-col p-4 hidden lg:flex transition-all duration-300">
            <div class="flex items-center gap-2 mb-8 px-2">
                <div class="w-9 h-9 rounded-full bg-sage flex items-center justify-center text-stone-900 font-bold text-lg font-serif">C</div>
                <span class="font-bold text-lg tracking-tight font-serif">Circle</span>
            </div>
            
            <button class="w-full flex items-center justify-center gap-2 bg-sage-soft text-sage py-2.5 rounded-xl text-sm font-medium mb-6 hover:bg-opacity-20 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Nuevo Círculo
            </button>

            <p class="text-xs text-stone-500 uppercase tracking-wider px-2 mb-2 font-medium">Tus Espacios</p>
            <nav class="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-hover transition-colors">
                    <div class="w-8 h-8 rounded-full bg-amber-700/30 flex items-center justify-center text-amber-500 text-xs font-bold">VC</div>
                    <span class="text-sm text-stone-300">Viaje al Campo</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-800/40 border border-warm transition-colors">
                    <div class="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold">HF</div>
                    <span class="text-sm font-semibold text-stone-100">Familia</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-sage"></span>
                </a>
                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-hover transition-colors">
                    <div class="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 text-xs font-bold">EA</div>
                    <span class="text-sm text-stone-300">Amigos Íntimos</span>
                </a>
            </nav>

            <div class="border-t border-warm pt-4 mt-4 flex items-center gap-3">
                <img src="https://i.pravatar.cc/40?img=5" class="w-9 h-9 rounded-full" alt="User">
                <div>
                    <p class="text-sm font-medium text-stone-200">Elena</p>
                    <p class="text-xs text-stone-500 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-sage rounded-full"></span> 🌿 Relajada</p>
                </div>
            </div>
        </aside>

        <!-- ======================================= -->
        <!-- COLUMNA 2: Espacio Activo (Feed/Chat)   -->
        <!-- ======================================= -->
        <main class="flex-1 flex flex-col bg-espresso relative">
            
            <!-- Header Desktop -->
            <header class="hidden lg:flex p-6 border-b border-warm items-center justify-between glass-warm z-10">
                <div>
                    <h2 class="font-serif text-2xl font-medium tracking-tight">Familia</h2>
                    <p class="text-xs text-stone-500">4 miembros · 2 activos ahora</p>
                </div>
                <!-- Tabs Desktop -->
                <div class="flex items-center gap-1 bg-surface p-1 rounded-xl border border-warm">
                    <button onclick="switchTab('feed')" id="tab-feed" class="px-4 py-1.5 text-xs rounded-lg text-sage bg-sage-soft font-medium">Feed</button>
                    <button onclick="switchTab('chat')" id="tab-chat" class="px-4 py-1.5 text-xs rounded-lg text-stone-400 hover:text-stone-100">Chat</button>
                    <button onclick="switchTab('events')" id="tab-events" class="px-4 py-1.5 text-xs rounded-lg text-stone-400 hover:text-stone-100">Eventos</button>
                </div>
            </header>

            <!-- Header Mobile -->
            <header class="lg:hidden glass-warm border-b border-warm p-4 flex items-center justify-between sticky top-0 z-20">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 text-xs font-bold border border-sage">HF</div>
                    <div>
                        <h2 class="font-semibold text-sm leading-tight">Familia</h2>
                        <p class="text-[10px] text-stone-500">2 activos ahora</p>
                    </div>
                </div>
                <button onclick="toggleFocus()" class="p-2 text-stone-400 hover:text-stone-100">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
            </header>

            <!-- Vibes Row (Mobile & Desktop) -->
            <div class="flex gap-4 overflow-x-auto no-scrollbar p-4 border-b border-warm bg-surface/30">
                <div class="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                    <div class="w-14 h-14 rounded-full bg-surface border-2 border-dashed border-warm flex items-center justify-center text-stone-500 hover:border-sage hover:text-sage cursor-pointer transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <span class="text-[10px] text-stone-500">Tu Vibe</span>
                </div>
                <div class="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                    <div class="w-14 h-14 rounded-full bg-sage-soft border-2 border-sage flex items-center justify-center text-xl">🌿</div>
                    <span class="text-[10px] text-stone-300 truncate w-full text-center">Papá</span>
                </div>
                <div class="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                    <div class="w-14 h-14 rounded-full bg-amber-900/20 border-2 border-amber-700/30 flex items-center justify-center text-xl">☕</div>
                    <span class="text-[10px] text-stone-300 truncate w-full text-center">Mamá</span>
                </div>
                <div class="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                    <div class="w-14 h-14 rounded-full bg-stone-800 border-2 border-warm flex items-center justify-center text-xl">📚</div>
                    <span class="text-[10px] text-stone-300 truncate w-full text-center">Hermano</span>
                </div>
            </div>

            <!-- Contenido Dinámico (Feed/Chat) -->
            <div id="contentArea" class="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                
                <!-- Vista: Feed -->
                <div id="view-feed" class="max-w-2xl mx-auto space-y-6">
                    <!-- Post 1: Foto Grande -->
                    <div class="bg-surface border border-warm rounded-2xl overflow-hidden fade-in">
                        <div class="flex items-center gap-3 p-4">
                            <img src="https://i.pravatar.cc/40?img=12" class="w-8 h-8 rounded-full" alt="User">
                            <div>
                                <p class="text-sm font-semibold">Papá</p>
                                <p class="text-xs text-stone-500">Hace 2 horas · 🌲 Excursión</p>
                            </div>
                        </div>
                        <img src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" class="w-full h-64 object-cover" alt="Cabin">
                        <div class="p-4">
                            <p class="text-sm text-stone-300 mb-3">¡Encontré la cabaña! ¿Qué les parece para el fin de semana?</p>
                            <div class="flex items-center gap-4 text-stone-400 text-xs">
                                <button class="flex items-center gap-1.5 hover:text-sage transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> 3</button>
                                <button class="flex items-center gap-1.5 hover:text-sage transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> 2</button>
                            </div>
                        </div>
                    </div>

                    <!-- Post 2: Nota Larga (Serif) -->
                    <div class="bg-surface border border-warm rounded-2xl p-6 fade-in">
                        <div class="flex items-center gap-3 mb-4">
                            <img src="https://i.pravatar.cc/40?img=23" class="w-8 h-8 rounded-full" alt="User">
                            <div>
                                <p class="text-sm font-semibold">Mamá</p>
                                <p class="text-xs text-stone-500">Ayer · ✍️ Reflexión</p>
                            </div>
                        </div>
                        <h3 class="font-serif text-xl mb-2 text-stone-100">Sobre nuestro tiempo juntos</h3>
                        <p class="text-sm text-stone-400 leading-relaxed mb-4">Me alegra mucho ver cómo nos estamos organizando. Siento que últimamente estamos más conectados, a pesar de los horarios. Gracias por hacer el esfuerzo.</p>
                        <div class="flex items-center gap-4 text-stone-400 text-xs">
                            <button class="flex items-center gap-1.5 hover:text-sage transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> 4</button>
                        </div>
                    </div>
                </div>

                <!-- Vista: Chat (Oculta por defecto) -->
                <div id="view-chat" class="hidden max-w-2xl mx-auto space-y-6">
                    <div class="flex gap-3 fade-in">
                        <img src="https://i.pravatar.cc/40?img=12" class="w-8 h-8 rounded-full mt-1" alt="User">
                        <div>
                            <div class="bg-surface px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-stone-200 max-w-md">
                                ¿Qué planes tienen para el fin de semana?
                            </div>
                            <span class="text-[10px] text-stone-500 mt-1 ml-2 block">Papá · 10:30 AM</span>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-end fade-in">
                        <div class="max-w-md">
                            <div class="bg-sage-soft border border-sage px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-stone-100">
                                ¡Yo me encargo de la comida!
                            </div>
                            <span class="text-[10px] text-stone-500 mt-1 mr-2 block text-right">10:32 AM · Leído</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Drop Zone (Desktop) -->
            <div id="dropZone" class="drop-zone absolute bottom-4 right-4 w-64 p-4 bg-surface/80 backdrop-blur-md border border-warm rounded-2xl hidden lg:flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface">
                <svg class="w-8 h-8 text-stone-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p class="text-xs text-stone-400">Arrastra fotos aquí para compartirlas en el Feed</p>
            </div>
        </main>

        <!-- ======================================= -->
        <!-- COLUMNA 3: Contexto (Solo Desktop)      -->
        <!-- ======================================= -->
        <aside class="w-80 bg-surface border-l border-warm flex-col p-6 hidden lg:flex overflow-y-auto">
            
            <button onclick="toggleFocus()" class="w-full flex items-center justify-center gap-2 bg-stone-800/50 text-stone-400 py-2.5 rounded-xl text-sm font-medium mb-6 hover:text-stone-100 transition-colors border border-warm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Activar Modo Focus
            </button>

            <!-- Eventos -->
            <div class="mb-8">
                <h3 class="text-xs text-stone-500 uppercase tracking-wider mb-3 font-medium">Próximos Planes</h3>
                <div class="bg-espresso border border-warm rounded-2xl p-4 hover:border-sage transition-colors cursor-pointer">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-serif text-lg text-stone-100">Cabaña del Lago</h4>
                        <span class="text-[10px] text-sage bg-sage-soft px-2 py-0.5 rounded-full">Sábado</span>
                    </div>
                    <p class="text-xs text-stone-400 mb-4">20 May - 10:00 AM</p>
                    <div class="flex items-center justify-between">
                        <div class="flex -space-x-2">
                            <img src="https://i.pravatar.cc/30?img=12" class="w-7 h-7 rounded-full border-2 border-espresso" alt="U1">
                            <img src="https://i.pravatar.cc/30?img=5" class="w-7 h-7 rounded-full border-2 border-espresso" alt="U2">
                            <div class="w-7 h-7 rounded-full border-2 border-espresso bg-stone-700 flex items-center justify-center text-[10px] text-stone-300">+2</div>
                        </div>
                        <button class="text-xs text-sage hover:underline">RSVP</button>
                    </div>
                </div>
            </div>

            <!-- Notas Compartidas -->
            <div class="mb-8">
                <h3 class="text-xs text-stone-500 uppercase tracking-wider mb-3 font-medium">Notas Compartidas</h3>
                <div class="space-y-2">
                    <div class="bg-espresso border border-warm rounded-xl p-3 flex items-center gap-3 hover:bg-surface-hover cursor-pointer">
                        <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        <div>
                            <p class="text-sm text-stone-200 font-medium">Lista para la cabaña</p>
                            <p class="text-[10px] text-stone-500">Editada hace 5 min</p>
                        </div>
                    </div>
                    <div class="bg-espresso border border-warm rounded-xl p-3 flex items-center gap-3 hover:bg-surface-hover cursor-pointer">
                        <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        <div>
                            <p class="text-sm text-stone-200 font-medium">Presupuesto Vacaciones</p>
                            <p class="text-[10px] text-stone-500">Editada ayer</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </div>

    <!-- ======================================= -->
    <!-- BOTTOM NAV (Mobile)                      -->
    <!-- ======================================= -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2">
        <div class="glass-warm border border-warm rounded-3xl shadow-2xl flex items-center justify-around relative h-16">
            <!-- Inicio / Feed -->
            <button onclick="switchTab('feed')" class="flex flex-col items-center justify-center w-16 h-14 text-sage scale-in">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </button>
            <!-- Chat -->
            <button onclick="switchTab('chat')" class="flex flex-col items-center justify-center w-16 h-14 text-stone-500 hover:text-stone-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </button>
            
            <!-- Botón Central Flotante -->
            <div class="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <button onclick="toggleQuickActions()" id="quickBtn" class="w-16 h-16 bg-sage rounded-full flex items-center justify-center shadow-lg shadow-black/40 border-4 border-espresso active:scale-90 transition-transform">
                    <svg id="quickIcon" class="w-7 h-7 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
            </div>
            <div class="w-16"></div> <!-- Espaciador -->
            
            <!-- Eventos -->
            <button class="flex flex-col items-center justify-center w-16 h-14 text-stone-500 hover:text-stone-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </button>
            <!-- Espacios -->
            <button class="flex flex-col items-center justify-center w-16 h-14 text-stone-500 hover:text-stone-100 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            </button>
        </div>
        
        <!-- Quick Actions Expandidas (Mobile) -->
        <div id="quickActions" class="hidden absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 fade-in">
            <button class="flex items-center gap-2 bg-surface border border-warm px-4 py-2 rounded-full shadow-lg text-sm text-stone-200 hover:bg-surface-hover">
                <span>📸</span> Foto
            </button>
            <button class="flex items-center gap-2 bg-surface border border-warm px-4 py-2 rounded-full shadow-lg text-sm text-stone-200 hover:bg-surface-hover">
                <span>✍️</span> Nota
            </button>
            <button class="flex items-center gap-2 bg-surface border border-warm px-4 py-2 rounded-full shadow-lg text-sm text-stone-200 hover:bg-surface-hover">
                <span>🎉</span> Evento
            </button>
        </div>
    </nav>

    <!-- Focus Mode Overlay -->
    <div id="focusOverlay" class="hidden fixed inset-0 bg-espresso/95 backdrop-blur-lg z-50 flex-col items-center justify-center p-6 text-center">
        <div class="fade-in">
            <div class="w-24 h-24 rounded-full bg-sage-soft flex items-center justify-center mx-auto mb-8 border border-sage">
                <svg class="w-12 h-12 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </div>
            <h3 class="font-serif text-3xl text-stone-100 mb-3">Modo Focus Activado</h3>
            <p class="text-stone-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">El resto del mundo está silenciado. Estás disfrutando de tiempo de calidad con tu familia.</p>
            <button onclick="toggleFocus()" class="px-8 py-3 bg-surface text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors border border-warm">Salir del Modo Focus</button>
        </div>
    </div>

    <script>
        // Cambio de pestañas (Feed/Chat)
        function switchTab(tab) {
            const feed = document.getElementById('view-feed');
            const chat = document.getElementById('view-chat');
            const tabFeed = document.getElementById('tab-feed');
            const tabChat = document.getElementById('tab-chat');
            
            // Reset
            feed.classList.add('hidden');
            chat.classList.add('hidden');
            
            // Desktop tabs reset
            if(tabFeed) {
                tabFeed.classList.remove('text-sage', 'bg-sage-soft', 'font-medium');
                tabFeed.classList.add('text-stone-400', 'hover:text-stone-100');
            }
            if(tabChat) {
                tabChat.classList.remove('text-sage', 'bg-sage-soft', 'font-medium');
                tabChat.classList.add('text-stone-400', 'hover:text-stone-100');
            }
            
            // Apply
            if (tab === 'feed') {
                feed.classList.remove('hidden');
                if(tabFeed) {
                    tabFeed.classList.add('text-sage', 'bg-sage-soft', 'font-medium');
                    tabFeed.classList.remove('text-stone-400', 'hover:text-stone-100');
                }
            } else {
                chat.classList.remove('hidden');
                if(tabChat) {
                    tabChat.classList.add('text-sage', 'bg-sage-soft', 'font-medium');
                    tabChat.classList.remove('text-stone-400', 'hover:text-stone-100');
                }
            }
        }

        // Toggle Quick Actions (Mobile)
        function toggleQuickActions() {
            const actions = document.getElementById('quickActions');
            const icon = document.getElementById('quickIcon');
            if (actions.classList.contains('hidden')) {
                actions.classList.remove('hidden');
                actions.classList.add('flex');
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />'; // X icon
            } else {
                actions.classList.add('hidden');
                actions.classList.remove('flex');
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />'; // Plus icon
            }
        }

        // Focus Mode
        const focusOverlay = document.getElementById('focusOverlay');
        const appLayout = document.getElementById('appLayout');

        function toggleFocus() {
            if (focusOverlay.classList.contains('flex')) {
                appLayout.classList.remove('focus-blur');
                focusOverlay.classList.add('hidden');
                focusOverlay.classList.remove('flex');
            } else {
                appLayout.classList.add('focus-blur');
                focusOverlay.classList.remove('hidden');
                focusOverlay.classList.add('flex');
            }
        }

        // Drag & Drop Simulation (Desktop)
        const dropZone = document.getElementById('dropZone');
        if(dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('active');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('active');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('active');
                alert('Foto subida al Feed (Simulado)');
            });
        }
    </script>
</body>
</html>
`
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
    demoPrompt: `Diseña una plataforma de mentoría profesional inteligente interactiva llamada MentorMatch que incluya un algoritmo visual de match (96% de compatibilidad), dashboard de objetivos de progreso semanal y agendamiento interactivo de citas.`,
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MentorMatch - AI Mentoring</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glow-emerald { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
        .glow-indigo { box-shadow: 0 0 20px rgba(99, 102, 241, 0.25); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-[#0b0f19] text-slate-100 min-h-screen flex flex-col antialiased">
    <!-- Navbar -->
    <header class="glass sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-extrabold text-lg shadow-lg shadow-emerald-500/20">M</div>
            <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">MentorMatch</span>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs font-semibold text-slate-400 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Match Activo: 96%</span>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Col 1: Match Algorithm (left) -->
        <section class="lg:col-span-4 flex flex-col gap-6">
            <div class="glass p-6 rounded-2xl flex flex-col justify-between h-full min-h-[300px]">
                <div>
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Algoritmo de Compatibilidad</h3>
                    <h2 class="text-2xl font-extrabold text-white mb-4">Mentor Recomendado</h2>
                    
                    <!-- Circular compatibility gauge -->
                    <div class="relative w-36 h-36 mx-auto flex items-center justify-center my-6">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" stroke-width="8" fill="transparent" />
                            <circle cx="50" cy="50" r="40" stroke="#10b981" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="10.05" stroke-linecap="round" fill="transparent" class="glow-emerald" />
                        </svg>
                        <div class="absolute text-center">
                            <span class="text-3xl font-extrabold text-white">96%</span>
                            <p class="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Compatibilidad</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <img src="https://i.pravatar.cc/100?img=60" class="w-12 h-12 rounded-xl object-cover" alt="Mentor">
                        <div class="flex-1">
                            <h4 class="text-sm font-bold text-white">Alex Riveiro</h4>
                            <p class="text-xs text-slate-400">Director de Producto & Mentor Tech</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-2">
                        <span class="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">Producto SaaS</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">Liderazgo</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">Valores Clave</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Col 2: Progress Weekly Dashboard (center) -->
        <section class="lg:col-span-5 flex flex-col gap-6">
            <div class="glass p-6 rounded-2xl flex-1 flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-0.5">Objetivos de Progreso</h3>
                        <h2 class="text-xl font-extrabold text-white">Metas de Aprendizaje Semanal</h2>
                    </div>
                    <div class="text-right">
                        <span id="progressPercent" class="text-lg font-extrabold text-emerald-400">33%</span>
                        <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cumplido</p>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                    <div id="progressBar" class="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500" style="width: 33%"></div>
                </div>

                <!-- Checklist -->
                <div class="flex-1 space-y-3">
                    <label class="flex items-start gap-3 bg-slate-900/35 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                        <input type="checkbox" checked onclick="updateProgress(this)" class="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/40 w-4 h-4 bg-slate-950">
                        <div>
                            <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Revisar arquitectura inicial del MVP</span>
                            <p class="text-xs text-slate-500 mt-0.5">Discutido en la última sesión con Alex</p>
                        </div>
                    </label>
                    <label class="flex items-start gap-3 bg-slate-900/35 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                        <input type="checkbox" onclick="updateProgress(this)" class="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/40 w-4 h-4 bg-slate-950">
                        <div>
                            <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Completar modelo de BD relacional</span>
                            <p class="text-xs text-slate-500 mt-0.5">Definir entidades principales y relaciones</p>
                        </div>
                    </label>
                    <label class="flex items-start gap-3 bg-slate-900/35 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                        <input type="checkbox" onclick="updateProgress(this)" class="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/40 w-4 h-4 bg-slate-950">
                        <div>
                            <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Agendar llamada de seguimiento (RSVP)</span>
                            <p class="text-xs text-slate-500 mt-0.5">Revisión final de metas semanales</p>
                        </div>
                    </label>
                </div>
            </div>
        </section>

        <!-- Col 3: Interactive Scheduler (right) -->
        <section class="lg:col-span-3 flex flex-col gap-6">
            <div class="glass p-6 rounded-2xl flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Agendamiento</h3>
                    <h2 class="text-xl font-extrabold text-white mb-4">Próxima Sesión</h2>
                    
                    <div class="space-y-2 mt-4">
                        <p class="text-xs text-slate-400 font-semibold mb-2">Selecciona un horario:</p>
                        <button onclick="selectSlot(this)" class="w-full text-left py-2.5 px-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex justify-between items-center">
                            <span>Lunes, 14:00 - 15:00</span>
                            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">Libre</span>
                        </button>
                        <button onclick="selectSlot(this)" class="w-full text-left py-2.5 px-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex justify-between items-center">
                            <span>Miércoles, 16:30 - 17:30</span>
                            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">Libre</span>
                        </button>
                        <button onclick="selectSlot(this)" class="w-full text-left py-2.5 px-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex justify-between items-center">
                            <span>Viernes, 10:00 - 11:00</span>
                            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">Libre</span>
                        </button>
                    </div>
                </div>

                <div class="pt-6">
                    <button onclick="scheduleSession()" id="scheduleBtn" disabled class="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-extrabold text-sm transition-all cursor-not-allowed">Selecciona un horario</button>
                </div>
            </div>
        </section>
    </main>

    <!-- Audio & Alert Script -->
    <script>
        let selectedTime = null;
        let audioCtx = null;

        function playSound() {
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
                
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start();
                osc.stop(audioCtx.currentTime + 0.55);
            } catch (e) {}
        }

        function updateProgress() {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            const checked = Array.from(checkboxes).filter(c => c.checked).length;
            const pct = Math.round((checked / checkboxes.length) * 100);
            
            document.getElementById('progressPercent').textContent = pct + '%';
            document.getElementById('progressBar').style.width = pct + '%';
        }

        function selectSlot(btn) {
            // Reset others
            const buttons = btn.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                b.classList.remove('border-emerald-500', 'bg-emerald-500/10', 'text-white');
                b.classList.add('border-slate-800', 'bg-slate-900/50', 'text-slate-300');
            });
            
            btn.classList.remove('border-slate-800', 'bg-slate-900/50', 'text-slate-300');
            btn.classList.add('border-emerald-500', 'bg-emerald-500/10', 'text-white');
            
            selectedTime = btn.querySelector('span').textContent;
            
            const mainBtn = document.getElementById('scheduleBtn');
            mainBtn.disabled = false;
            mainBtn.classList.remove('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
            mainBtn.classList.add('bg-emerald-500', 'text-slate-900', 'hover:bg-emerald-400', 'glow-emerald');
            mainBtn.textContent = 'Confirmar Cita';
        }

        function scheduleSession() {
            if (!selectedTime) return;
            playSound();
            alert('¡Cita Confirmada con éxito para ' + selectedTime + '!');
        }
    </script>
</body>
</html>
`
  },
    "sitio-web-3": {
    title: `NOCTURNE — Boutique Cinematográfica de Videojuegos Premium`,
    brand: `Caso de Éxito: Sitio Web`,
    desc: `Página de inicio premium para una tienda boutique de videojuegos que transmite emoción controlada, sofisticación y calidad cinematográfica.`,
    gradient: `from-purple-900 to-rose-700`,
    challenge: `Diseñar una experiencia e-commerce de gaming que transmita sofisticación y misterio visual, evitando la estética infantil de las tiendas tradicionales.`,
    solution: `Se estructuró una landing page brutalista oscura con partículas interactivas de fondo, cursor personalizado responsivo y transiciones de tarjetas 3D en hover.`,
    products: ["Diseñador Web IA (Maverlang AI)","Maverlang 2.5 Pro"],
    region: `Europa & Asia`,
    industry: `Gaming / E-commerce`,
    quote: `El efecto de cursor personalizado con la órbita de partículas y la rotación 3D de las portadas logró capturar exactamente el tono cinematográfico que buscábamos.`,
    quoteAuthor: `Klaus Vanhoutte`,
    quoteRole: `Creative Director, Nocturne Games`,
    metrics: [{"value":"🎮 AAA","label":"Curaduría","sublabel":"Solo lanzamientos seleccionados"},{"value":"100%","label":"Responsivo","sublabel":"Perfecto en móviles y desktop"},{"value":"1 Prompt","label":"Generación","sublabel":"Layout y efectos creados en un paso"}],
    demoTitle: `NOCTURNE — Boutique de Videojuegos Premium`,
    demoPrompt: `Diseña una página de inicio para una tienda boutique de videojuegos premium que transmita emoción controlada, sofisticación y calidad cinematográfica: el antídoto a las tiendas caóticas, llenas de ofertas agresivas y diseño infantil.
Estrategia visual:

Imágenes: Arte clave de juegos AAA e indie de alta calidad, capturas cinematográficas en juego, personajes épicos, mundos inmersivos, escenas de acción dramáticas y momentos tranquilos.Incluye mockups de consolas, PCs gaming y periféricos premium.
    Fotografía: Estilo cinematográfico, iluminación dramática(rim lighting y volumétrica), contraste alto, colores saturados en las imágenes de juegos y tonos más controlados en el resto del sitio.
        Composición: Espacio negativo generoso, hero masivo, scroll vertical cinematográfico, superposiciones elegantes de elementos flotantes y parallax sutil.
Paleta de colores:
Primarios: Negro profundo(#0A0A0A), gris carbón(#1F1F1F), blanco puro.
    Acentos: Púrpura neón(#A855F7), cyan eléctrico(#06B6D4), rojo cereza(#F43F5E), dorado sutil(#EAB308) para destacar ediciones especiales.

        Tipografía:
Encabezados: Sans - serif geométrica bold y moderna(tipo Rajdhani, Orbitron o Neue Machina), con excelente presencia.
    Cuerpo: Sans - serif limpia y legible(Inter o Satoshi), interlineado generoso.

        Fondo: Dark mode dominante con gradientes sutiles, partículas o efectos de luz muy discretos en secciones específicas.

Diseño general: Estilo premium, elegante y cinematográfico.Mucho espacio para respirar, jerarquía clara y enfoque en la experiencia visual del juego.
Estructura de la página:

Hero principal: Video background o gran imagen cinemática de un juego destacado + título impactante + subtítulo + botones grandes(“Comprar ahora”, “Ver tráiler”, “Añadir a wishlist”).Incluye countdown para lanzamientos próximos.
Juegos destacados: Carrusel o grid grande de portadas de juegos con hover que revela precio, descuento, plataforma y calificación(Metacritic / Steam).
    Categorías: Secciones elegantes para PC, PlayStation, Xbox, Nintendo, Indie, Ediciones Coleccionista, Accesorios Premium.
Próximos lanzamientos: Calendario visual con tarjetas grandes y fecha destacada.
Ofertas y Deals: Sección con diseño premium(no barata), destacando descuentos reales y bundles.
Testimonios de jugadores: Citas con fotos de usuarios reales + avatar de Steam o logo de plataforma.
    Comunidad / Blog: Últimos artículos, noticias o contenido detrás de cámaras.
        Newsletter: Formulario destacado con incentivo(descuento en primera compra o acceso anticipado).

Detalles de interacción:

Hover en cualquier portada de juego: elevación 3D, brillo neón sutil, zoom suave en el arte y aparición de información rápida.
La imagen del hero tiene un parallax lento y efecto de profundidad.
Los títulos de secciones aparecen con animación cinematográfica(fade + slide desde abajo).
Carrito de compras con animación fluida al añadir juegos.
    Efecto “scanline” o glow muy sutil al pasar el cursor por elementos interactivos.
Scroll con velocidad variable según la sección(más lento en hero).
Sonido ambiental muy bajo y opcional al entrar al sitio(estilo trailer de juego).

Ambiente general: Profesional, inmersivo, cinematográfico, premium, emocionante pero elegante.Debe transmitir que es una tienda seria para gamers exigentes que valoran calidad, curaduría y experiencia premium.`,
    demoCode: `<!DOCTYPE html>
        <html lang="es">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>NOCTURNE — Boutique Cinematográfica de Videojuegos Premium</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                                <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                                        <style>
                                            :root {
                                                --bg-deep: #0A0A0A;
                                            --bg-charcoal: #141414;
                                            --bg-elevated: #1F1F1F;
                                            --text-pure: #FFFFFF;
                                            --text-muted: #8B8B8B;
                                            --text-dim: #555555;
                                            --accent-purple: #A855F7;
                                            --accent-cyan: #06B6D4;
                                            --accent-red: #F43F5E;
                                            --accent-gold: #EAB308;
                                            --border: rgba(255,255,255,0.08);
                                            --border-bright: rgba(255,255,255,0.15);
}

                                            * {-webkit - font - smoothing: antialiased; }
                                            html {scroll - behavior: smooth; }
                                            body {
                                                background: var(--bg-deep);
                                            color: var(--text-pure);
                                            font-family: 'Inter', sans-serif;
                                            overflow-x: hidden;
                                            cursor: none;
}
                                            .font-display {font - family: 'Rajdhani', sans-serif; letter-spacing: -0.01em; }

                                            /* Custom cursor */
                                            .cursor-dot {
                                                position: fixed; width: 6px; height: 6px;
                                            background: var(--accent-cyan); border-radius: 50%;
                                            pointer-events: none; z-index: 9999;
                                            transform: translate(-50%, -50%);
                                            transition: width 0.3s, height 0.3s, background 0.3s;
                                            mix-blend-mode: difference;
}
                                            .cursor-ring {
                                                position: fixed; width: 36px; height: 36px;
                                            border: 1px solid rgba(168, 85, 247, 0.5); border-radius: 50%;
                                            pointer-events: none; z-index: 9998;
                                            transform: translate(-50%, -50%);
                                            transition: width 0.3s, height 0.3s, border-color 0.3s, background 0.3s;
}
                                            .cursor-dot.hover {width: 10px; height: 10px; background: var(--accent-purple); }
                                            .cursor-ring.hover {width: 56px; height: 56px; border-color: var(--accent-cyan); background: rgba(6,182,212,0.05); }

                                            /* Grain */
                                            .bg-grain {
                                                position: fixed; inset: 0; pointer-events: none;
                                            opacity: 0.05; z-index: 1;
                                            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E");
}

                                            /* Scanline */
                                            .scanlines {
                                                position: absolute; inset: 0; pointer-events: none; opacity: 0;
                                            background: repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(6,182,212,0.04) 3px, rgba(6,182,212,0.04) 4px);
                                            transition: opacity 0.4s;
}
                                            .interactive:hover .scanlines {opacity: 1; }

                                            /* Hero */
                                            .hero-bg {
                                                position: absolute; inset: -10% 0 0 0; height: 120%;
                                            background-image: url('https://picsum.photos/seed/nocturnehero7/1920/1200.jpg');
                                            background-size: cover; background-position: center;
                                            will-change: transform;
                                            filter: brightness(0.5) contrast(1.15) saturate(1.2);
}
                                            .hero-overlay {
                                                position: absolute; inset: 0;
                                            background:
                                            radial-gradient(ellipse at 15% 50%, rgba(168, 85, 247, 0.18), transparent 50%),
                                            radial-gradient(ellipse at 85% 70%, rgba(6, 182, 212, 0.12), transparent 50%),
                                            linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.3) 40%, rgba(10,10,10,0.98) 100%),
                                            linear-gradient(90deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.2) 50%, transparent 100%);
}
                                            #particles {position: absolute; inset: 0; pointer-events: none; z-index: 2; }

                                            /* Title reveal */
                                            .reveal-mask {overflow: hidden; display: block; }
                                            .reveal-up {display: inline-block; transform: translateY(110%); animation: revealUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
                                            @keyframes revealUp {to {transform: translateY(0); } }
                                            .fade-in {opacity: 0; animation: fadeIn 1.2s ease forwards; }
                                            @keyframes fadeIn {to {opacity: 1; } }

                                            /* Fade slide on scroll */
                                            .fade-slide {opacity: 0; transform: translateY(40px); transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
                                            .fade-slide.in-view {opacity: 1; transform: translateY(0); }

                                            /* Game card 3D */
                                            .game-card {transform - style: preserve-3d; transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); will-change: transform; position: relative; }
                                            .game-card .card-inner {transform - style: preserve-3d; }
                                            .game-card .card-overlay {transform: translateZ(30px); transition: opacity 0.4s; }
                                            .game-card .card-glow {
                                                position: absolute; inset: -2px; border-radius: 6px;
                                            opacity: 0; transition: opacity 0.5s;
                                            background: linear-gradient(135deg, rgba(168, 85, 247, 0.5), transparent 40%, rgba(6, 182, 212, 0.4));
                                            filter: blur(24px); z-index: -1;
}
                                            .game-card:hover .card-glow {opacity: 1; }
                                            .game-card .card-img {transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s; }
                                            .game-card:hover .card-img {transform: scale(1.08); filter: brightness(0.7) saturate(1.2); }
                                            .game-card .card-info {opacity: 0; transform: translateY(20px); transition: opacity 0.4s 0.1s, transform 0.4s 0.1s; }
                                            .game-card:hover .card-info {opacity: 1; transform: translateY(0); }

                                            /* Buttons */
                                            .btn-primary {
                                                position: relative; background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
                                            color: white; padding: 18px 38px; font-family: 'Rajdhani', sans-serif;
                                            font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; font-size: 15px;
                                            overflow: hidden; transition: transform 0.3s, box-shadow 0.3s;
                                            display: inline-flex; align-items: center; gap: 12px;
}
                                            .btn-primary::before {
                                                content: ''; position: absolute; inset: 0;
                                            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
                                            opacity: 0; transition: opacity 0.4s;
}
                                            .btn-primary:hover::before {opacity: 1; }
                                            .btn-primary:hover {transform: translateY(-2px); box-shadow: 0 12px 40px rgba(168, 85, 247, 0.5); }
.btn-primary > * {position: relative; z-index: 1; }

                                            .btn-ghost {
                                                border: 1px solid rgba(255,255,255,0.2); color: white;
                                            padding: 18px 38px; font-family: 'Rajdhani', sans-serif;
                                            font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; font-size: 15px;
                                            transition: all 0.3s; background: rgba(255,255,255,0.03);
                                            backdrop-filter: blur(10px);
                                            display: inline-flex; align-items: center; gap: 12px;
}
                                            .btn-ghost:hover {border - color: var(--accent-cyan); background: rgba(6, 182, 212, 0.08); box-shadow: 0 0 30px rgba(6, 182, 212, 0.2); }

                                            .btn-wishlist {
                                                border: 1px solid rgba(255,255,255,0.15); color: white;
                                            padding: 18px; width: 56px; height: 56px;
                                            transition: all 0.3s; background: rgba(255,255,255,0.03);
                                            display: inline-flex; align-items: center; justify-content: center;
                                            backdrop-filter: blur(10px);
}
                                            .btn-wishlist:hover {border - color: var(--accent-red); color: var(--accent-red); box-shadow: 0 0 30px rgba(244, 63, 94, 0.3); }

                                            /* Section number */
                                            .section-num {
                                                font - family: 'Rajdhani', sans-serif; color: var(--accent-purple);
                                            font-size: 13px; letter-spacing: 0.4em; font-weight: 600;
                                            display: inline-flex; align-items: center; gap: 14px;
}
                                            .section-num::before {content: ''; width: 40px; height: 1px; background: var(--accent-purple); }

                                            /* Category card */
                                            .category-card {position: relative; overflow: hidden; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); border: 1px solid var(--border); }
                                            .category-card::before {
                                                content: ''; position: absolute; inset: 0;
                                            background: linear-gradient(180deg, transparent 20%, rgba(10,10,10,0.85) 70%, rgba(10,10,10,0.98) 100%);
                                            z-index: 1; transition: opacity 0.5s;
}
                                            .category-card:hover {transform: translateY(-6px); border-color: var(--accent-cyan); box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(6,182,212,0.15); }
                                            .category-card .cat-bg {transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s; filter: brightness(0.5) saturate(1.1); }
                                            .category-card:hover .cat-bg {transform: scale(1.1); filter: brightness(0.7) saturate(1.3); }

                                            /* Countdown */
                                            .countdown-box {
                                                background: rgba(255,255,255,0.025); border: 1px solid var(--border);
                                            backdrop-filter: blur(10px); padding: 18px 10px; text-align: center;
                                            border-radius: 3px; position: relative; overflow: hidden;
}
                                            .countdown-box::before {
                                                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 1px;
                                            background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent); opacity: 0.7;
}
                                            .countdown-num {
                                                font - family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 42px;
                                            line-height: 1; background: linear-gradient(180deg, #fff, #888);
                                            -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}

                                            /* Marquee */
                                            .marquee {display: flex; overflow: hidden; user-select: none; }
                                            .marquee-content {flex - shrink: 0; display: flex; align-items: center; gap: 3rem; animation: scroll 50s linear infinite; padding-right: 3rem; }
                                            @keyframes scroll {from {transform: translateX(0); } to {transform: translateX(-100%); } }

                                            /* Glow text */
                                            .glow-purple {text - shadow: 0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3); }
                                            .glow-cyan {text - shadow: 0 0 40px rgba(6, 182, 212, 0.5); }

                                            /* Pulse */
                                            @keyframes pulse-dot {0 %, 100 % { opacity: 1; transform: scale(1); } 50% {opacity: 0.4; transform: scale(0.7); } }
                                            .pulse-dot {animation: pulse-dot 2s ease-in-out infinite; }

                                            /* Scrollbar */
                                            ::-webkit-scrollbar {width: 8px; }
                                            ::-webkit-scrollbar-track {background: var(--bg-deep); }
                                            ::-webkit-scrollbar-thumb {background: linear-gradient(180deg, var(--accent-purple), var(--accent-cyan)); border-radius: 4px; }

                                            @media (max-width: 768px) {
                                                body {cursor: auto; }
                                            .cursor-dot, .cursor-ring {display: none; }
}

                                            /* Nav */
                                            .nav-blur {backdrop - filter: blur(24px) saturate(180%); background: rgba(10, 10, 10, 0.65); border-bottom: 1px solid var(--border); transition: background 0.3s; }
                                            .nav-blur.scrolled {background: rgba(10, 10, 10, 0.92); }

                                            /* Glass */
                                            .glass {background: rgba(255,255,255,0.025); backdrop-filter: blur(20px); border: 1px solid var(--border); }

                                            /* Deal badge */
                                            .deal-badge {background: linear-gradient(135deg, var(--accent-red), #be123c); color: white; padding: 5px 11px; font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.06em; border-radius: 2px; }

                                            .gold-text {background: linear-gradient(135deg, #fde047, var(--accent-gold)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                                            .purple-text {color: var(--accent-purple); }
                                            .cyan-text {color: var(--accent-cyan); }

                                            /* Scroll indicator */
                                            .scroll-indicator {position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-muted); font-family: 'Rajdhani', sans-serif; letter-spacing: 0.4em; font-size: 11px; z-index: 5; }
                                            .scroll-line {width: 1px; height: 50px; background: linear-gradient(180deg, var(--accent-cyan), transparent); animation: scroll-down 2s ease-in-out infinite; transform-origin: top; }
                                            @keyframes scroll-down {0 % { transform: scaleY(0); } 50% {transform: scaleY(1); } 100% {transform: scaleY(0); transform-origin: bottom; } }

                                            /* Sound toggle */
                                            .sound-toggle {position: fixed; bottom: 30px; right: 30px; z-index: 100; width: 52px; height: 52px; border-radius: 50%; background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); border: 1px solid var(--border-bright); display: flex; align-items: center; justify-content: center; transition: all 0.3s; color: var(--text-muted); }
                                            .sound-toggle:hover {border - color: var(--accent-cyan); color: var(--accent-cyan); box-shadow: 0 0 25px rgba(6, 182, 212, 0.3); }
                                            .sound-toggle.active {border - color: var(--accent-cyan); color: var(--accent-cyan); background: rgba(6, 182, 212, 0.1); }

                                            /* Cart pop */
                                            @keyframes cart-pop {0 % { transform: scale(1); } 50% {transform: scale(1.4); color: var(--accent-cyan); } 100% {transform: scale(1); } }
                                            .cart-pop {animation: cart-pop 0.5s ease; }

                                            /* Toast */
                                            .toast {position: fixed; bottom: 100px; right: 30px; background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(20px); border: 1px solid var(--accent-cyan); border-left: 3px solid var(--accent-cyan); padding: 18px 26px; border-radius: 4px; transform: translateX(140%); transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); z-index: 200; box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(6, 182, 212, 0.2); display: flex; align-items: center; gap: 14px; }
                                            .toast.show {transform: translateX(0); }

                                            /* Floating */
                                            .float-anim {animation: float 6s ease-in-out infinite; }
                                            @keyframes float {0 %, 100 % { transform: translateY(0); } 50% {transform: translateY(-12px); } }

                                            /* Upcoming cards horizontal scroll */
                                            .h-scroll {overflow - x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
                                            .h-scroll::-webkit-scrollbar {display: none; }
.h-scroll > * {scroll - snap - align: start; }

                                            /* Deal card */
                                            .deal-card {position: relative; overflow: hidden; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); border: 1px solid var(--border); }
                                            .deal-card:hover {transform: translateY(-4px); border-color: rgba(168,85,247,0.5); box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.15); }
                                            .deal-card .deal-bg {transition: transform 0.8s; filter: brightness(0.6) saturate(1.2); }
                                            .deal-card:hover .deal-bg {transform: scale(1.06); filter: brightness(0.75) saturate(1.3); }

                                            /* Vignette */
                                            .vignette {position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 200px rgba(0,0,0,0.7); }

                                            /* Newsletter */
                                            .newsletter-bg {
                                                background:
                                            radial-gradient(ellipse at 30% 50%, rgba(168, 85, 247, 0.15), transparent 60%),
                                            radial-gradient(ellipse at 70% 50%, rgba(6, 182, 212, 0.12), transparent 60%),
                                            linear-gradient(180deg, #0A0A0A, #141414, #0A0A0A);
}

                                            input:focus {outline: none; }

                                            /* Tag */
                                            .tag {font - family: 'Rajdhani', sans-serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; padding: 4px 10px; border: 1px solid var(--border-bright); border-radius: 2px; color: var(--text-muted); }

                                            /* Vertical text */
                                            .v-text {writing - mode: vertical-rl; transform: rotate(180deg); }

                                            /* Floating badge */
                                            .float-badge {background: rgba(10,10,10,0.7); backdrop-filter: blur(12px); border: 1px solid var(--border-bright); }

                                            /* Game cover treatment */
                                            .cover-treatment {position: relative; }
                                            .cover-treatment::after {content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.4) 75%, rgba(10,10,10,0.95) 100%); pointer-events: none; }

                                            /* Section divider */
                                            .divider-line {height: 1px; background: linear-gradient(90deg, transparent, var(--border-bright) 20%, var(--border-bright) 80%, transparent); }

                                            /* Card border hover */
                                            .card-interactive {transition: all 0.4s; border: 1px solid var(--border); }
                                            .card-interactive:hover {border - color: var(--border-bright); transform: translateY(-3px); }

                                            /* Hidden mobile nav */
                                            .mobile-menu {transform: translateX(100%); transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
                                            .mobile-menu.open {transform: translateX(0); }
                                        </style>
                                    </head>
                                    <body>

                                        <!-- Cursor -->
                                        <div class="cursor-dot" id="cursorDot"></div>
                                        <div class="cursor-ring" id="cursorRing"></div>

                                        <!-- Grain -->
                                        <div class="bg-grain"></div>

                                        <!-- Toast -->
                                        <div class="toast" id="toast">
                                            <i class="fa-solid fa-circle-check text-cyan-400"></i>
                                            <div>
                                                <div class="font-display text-sm tracking-wider">AÑADIDO AL CARRITO</div>
                                                <div class="toast-msg text-xs text-gray-400 mt-1">Artículo añadido correctamente</div>
                                            </div>
                                        </div>

                                        <!-- Sound Toggle -->
                                        <button class="sound-toggle" id="soundToggle" aria-label="Activar sonido ambiental">
                                            <i class="fa-solid fa-volume-xmark"></i>
                                        </button>

                                        <!-- Navigation -->
                                        <nav class="nav-blur fixed top-0 left-0 right-0 z-50" id="nav">
                                            <div class="max-w-[1600px] mx-auto px-8 lg:px-12 py-5 flex items-center justify-between">
                                                <a href="#" class="flex items-center gap-3 interactive">
                                                    <div class="w-9 h-9 relative">
                                                        <div class="absolute inset-0 border border-purple-400/60 rotate-45"></div>
                                                        <div class="absolute inset-1 bg-gradient-to-br from-purple-500 to-cyan-400 rotate-45 opacity-80"></div>
                                                    </div>
                                                    <div>
                                                        <div class="font-display font-bold text-xl tracking-[0.2em] leading-none">NOCTURNE</div>
                                                        <div class="text-[9px] text-gray-500 tracking-[0.3em] mt-1">PREMIUM GAMING BOUTIQUE</div>
                                                    </div>
                                                </a>

                                                <div class="hidden lg:flex items-center gap-10">
                                                    <a href="#featured" class="interactive font-display text-sm tracking-widest text-gray-300 hover:text-white transition">TIENDA</a>
                                                    <a href="#categories" class="interactive font-display text-sm tracking-widest text-gray-300 hover:text-white transition">PLATAFORMAS</a>
                                                    <a href="#upcoming" class="interactive font-display text-sm tracking-widest text-gray-300 hover:text-white transition">PRÓXIMAMENTE</a>
                                                    <a href="#deals" class="interactive font-display text-sm tracking-widest text-gray-300 hover:text-white transition">OFERTAS</a>
                                                    <a href="#blog" class="interactive font-display text-sm tracking-widest text-gray-300 hover:text-white transition">DIARIO</a>
                                                </div>

                                                <div class="flex items-center gap-5">
                                                    <button class="interactive w-10 h-10 flex items-center justify-center text-gray-300 hover:text-cyan-400 transition" aria-label="Buscar">
                                                        <i class="fa-solid fa-magnifying-glass"></i>
                                                    </button>
                                                    <button class="interactive w-10 h-10 flex items-center justify-center text-gray-300 hover:text-cyan-400 transition" aria-label="Cuenta">
                                                        <i class="fa-regular fa-user"></i>
                                                    </button>
                                                    <button class="interactive relative w-10 h-10 flex items-center justify-center text-gray-300 hover:text-cyan-400 transition" aria-label="Carrito">
                                                        <i class="fa-solid fa-bag-shopping"></i>
                                                        <span id="cartCount" class="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full text-[10px] font-bold flex items-center justify-center text-white">0</span>
                                                    </button>
                                                    <button class="lg:hidden interactive w-10 h-10 flex items-center justify-center text-gray-300" id="menuBtn" aria-label="Menú">
                                                        <i class="fa-solid fa-bars"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </nav>

                                        <!-- HERO -->
                                        <section class="relative h-screen overflow-hidden" id="hero">
                                            <div class="hero-bg" id="heroBg"></div>
                                            <div class="hero-overlay"></div>
                                            <canvas id="particles"></canvas>
                                            <div class="vignette"></div>

                                            <!-- Floating top label -->
                                            <div class="absolute top-28 left-8 lg:left-12 z-10 fade-in" style="animation-delay: 0.2s">
                                                <div class="flex items-center gap-3">
                                                    <span class="w-2 h-2 bg-red-500 rounded-full pulse-dot"></span>
                                                    <span class="font-display text-xs tracking-[0.4em] text-gray-300">ESTRENO MUNDIAL · 12.12.2024</span>
                                                </div>
                                            </div>

                                            <!-- Floating right badge -->
                                            <div class="hidden lg:block absolute top-32 right-12 z-10 fade-in float-badge px-5 py-4" style="animation-delay: 1s">
                                                <div class="font-display text-[10px] tracking-[0.3em] gold-text mb-1">EDICIÓN COLECCIONISTA</div>
                                                <div class="font-display text-2xl font-bold">Disponible</div>
                                                <div class="text-xs text-gray-400 mt-2">Incluye figura 30cm + artbook + OST</div>
                                            </div>

                                            <!-- Main hero content -->
                                            <div class="relative z-10 h-full flex items-center px-8 lg:px-12 max-w-[1600px] mx-auto">
                                                <div class="grid lg:grid-cols-12 gap-8 w-full items-center">

                                                    <div class="lg:col-span-8">
                                                        <div class="reveal-mask mb-4">
                                                            <span class="reveal-up font-display text-sm tracking-[0.3em] text-purple-400" style="animation-delay: 0.3s">VESPER STUDIOS PRESENTA</span>
                                                        </div>

                                                        <h1 class="font-display font-bold leading-[0.85] tracking-tight">
                                                            <span class="reveal-mask block">
                                                                <span class="reveal-up text-7xl md:text-8xl lg:text-[9rem] glow-purple" style="animation-delay: 0.4s">ASHES OF</span>
                                                            </span>
                                                            <span class="reveal-mask block">
                                                                <span class="reveal-up text-7xl md:text-8xl lg:text-[9rem] glow-purple" style="animation-delay: 0.55s">ETERNITY</span>
                                                            </span>
                                                        </h1>

                                                        <div class="reveal-mask mt-6 max-w-xl">
                                                            <span class="reveal-up text-gray-300 text-lg leading-relaxed block" style="animation-delay: 0.7s">
                                                                Un RPG de mundo abierto donde cada decisión forja un reino.
                                                                Cinco reinos. Tres mil años. Una última oportunidad.
                                                            </span>
                                                        </div>

                                                        <div class="fade-in mt-8 flex flex-wrap items-center gap-4" style="animation-delay: 1.2s">
                                                            <button class="btn-primary interactive" data-add-cart>
                                                                <i class="fa-solid fa-bolt"></i>
                                                                <span>Comprar ahora</span>
                                                            </button>
                                                            <button class="btn-ghost interactive">
                                                                <i class="fa-solid fa-play"></i>
                                                                <span>Ver tráiler</span>
                                                            </button>
                                                            <button class="btn-wishlist interactive" aria-label="Añadir a wishlist">
                                                                <i class="fa-regular fa-heart"></i>
                                                            </button>
                                                        </div>

                                                        <div class="fade-in mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400" style="animation-delay: 1.4s">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-display text-2xl gold-text font-bold">94</span>
                                                                <span class="text-xs uppercase tracking-widest">Metacritic</span>
                                                            </div>
                                                            <div class="w-px h-8 bg-white/15"></div>
                                                            <div class="flex items-center gap-2">
                                                                <i class="fa-solid fa-gamepad text-purple-400"></i>
                                                                <span class="font-display tracking-wider">RPG · MUNDO ABIERTO</span>
                                                            </div>
                                                            <div class="w-px h-8 bg-white/15"></div>
                                                            <div class="flex items-center gap-3">
                                                                <i class="fa-brands fa-playstation text-gray-300"></i>
                                                                <i class="fa-brands fa-xbox text-gray-300"></i>
                                                                <i class="fa-brands fa-steam text-gray-300"></i>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Countdown panel -->
                                                    <div class="lg:col-span-4 fade-in" style="animation-delay: 1.6s">
                                                        <div class="glass p-8 relative overflow-hidden">
                                                            <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

                                                            <div class="flex items-center justify-between mb-6">
                                                                <span class="font-display text-xs tracking-[0.3em] text-gray-400">LANZAMIENTO EN</span>
                                                                <span class="w-2 h-2 bg-cyan-400 rounded-full pulse-dot"></span>
                                                            </div>

                                                            <div class="grid grid-cols-4 gap-2 mb-6">
                                                                <div class="countdown-box">
                                                                    <div class="countdown-num" id="days">45</div>
                                                                    <div class="text-[10px] tracking-widest text-gray-500 mt-2">DÍAS</div>
                                                                </div>
                                                                <div class="countdown-box">
                                                                    <div class="countdown-num" id="hours">12</div>
                                                                    <div class="text-[10px] tracking-widest text-gray-500 mt-2">HRS</div>
                                                                </div>
                                                                <div class="countdown-box">
                                                                    <div class="countdown-num" id="minutes">34</div>
                                                                    <div class="text-[10px] tracking-widest text-gray-500 mt-2">MIN</div>
                                                                </div>
                                                                <div class="countdown-box">
                                                                    <div class="countdown-num" id="seconds">56</div>
                                                                    <div class="text-[10px] tracking-widest text-gray-500 mt-2">SEG</div>
                                                                </div>
                                                            </div>

                                                            <div class="space-y-3 text-sm">
                                                                <div class="flex items-center justify-between py-2 border-b border-white/5">
                                                                    <span class="text-gray-400">Edición Estándar</span>
                                                                    <span class="font-display font-semibold">\$59.99</span>
                                                                </div>
                                                                <div class="flex items-center justify-between py-2 border-b border-white/5">
                                                                    <span class="text-gray-400">Edición Deluxe</span>
                                                                    <span class="font-display font-semibold">\$89.99</span>
                                                                </div>
                                                                <div class="flex items-center justify-between py-2">
                                                                    <span class="gold-text font-display tracking-wider">Edición Coleccionista</span>
                                                                    <span class="font-display font-bold gold-text">\$199.99</span>
                                                                </div>
                                                            </div>

                                                            <button class="mt-6 w-full py-3 border border-purple-400/40 hover:bg-purple-500/10 transition font-display text-sm tracking-widest interactive">
                                                                RESERVAR AHORA
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <!-- Scroll indicator -->
                                            <div class="scroll-indicator">
                                                <span>SCROLL</span>
                                                <div class="scroll-line"></div>
                                            </div>
                                        </section>

                                        <!-- Trending ticker -->
                                        <div class="border-y border-white/5 py-5 overflow-hidden bg-[#0c0c0c] relative z-10">
                                            <div class="marquee">
                                                <div class="marquee-content">
                                                    <span class="font-display text-sm tracking-[0.3em] text-gray-500">TENDENCIA AHORA</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">ASHES OF ETERNITY</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">CRIMSON VEIL</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">VOIDWALKER</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">NEON REQUIEM</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">HOLLOW SANCTUM</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">ECHELON PROTOCOL</span>
                                                    <span class="text-purple-500">◆</span>
                                                </div>
                                                <div class="marquee-content" aria-hidden="true">
                                                    <span class="font-display text-sm tracking-[0.3em] text-gray-500">TENDENCIA AHORA</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">ASHES OF ETERNITY</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">CRIMSON VEIL</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">VOIDWALKER</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">NEON REQUIEM</span>
                                                    <span class="text-purple-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">HOLLOW SANCTUM</span>
                                                    <span class="text-cyan-500">◆</span>
                                                    <span class="font-display text-sm tracking-widest text-gray-200">ECHELON PROTOCOL</span>
                                                    <span class="text-purple-500">◆</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- FEATURED GAMES -->
                                        <section id="featured" class="py-32 px-8 lg:px-12 relative">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">01 — SELECCIÓN CURADA</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            Obras maestras,<br>
                                                                <span class="text-gray-500">no productos.</span>
                                                        </h2>
                                                    </div>
                                                    <p class="text-gray-400 max-w-md text-lg leading-relaxed">
                                                        Cada título en nuestra boutique ha sido evaluado por nuestro equipo de curadores.
                                                        Solo sobreviven los que merecen tu tiempo.
                                                    </p>
                                                </div>

                                                <!-- Game grid -->
                                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                                    <!-- Game 1 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/crimsonveil3/600/800.jpg') center/cover; filter: brightness(0.65) contrast(1.1) saturate(1.2) hue-rotate(-10deg);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="deal-badge">-30%</span>
                                                                <span class="tag bg-black/60 backdrop-blur">ACCIÓN</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">91</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">VESPER STUDIOS</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">CRIMSON VEIL</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-playstation"></i>
                                                                            <i class="fa-brands fa-xbox"></i>
                                                                            <i class="fa-brands fa-steam"></i>
                                                                        </div>
                                                                        <div class="flex items-baseline gap-2">
                                                                            <span class="text-gray-500 line-through text-sm">\$69.99</span>
                                                                            <span class="font-display font-bold text-2xl cyan-text">\$48.99</span>
                                                                        </div>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                    <!-- Game 2 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0.1s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/voidwalker9/600/800.jpg') center/cover; filter: brightness(0.6) contrast(1.15) saturate(1.3) hue-rotate(20deg);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="tag bg-black/60 backdrop-blur">CIENCIA FICCIÓN</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">88</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">ABYSSAL GAMES</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">VOIDWALKER</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-playstation"></i>
                                                                            <i class="fa-brands fa-xbox"></i>
                                                                            <i class="fa-brands fa-steam"></i>
                                                                        </div>
                                                                        <span class="font-display font-bold text-2xl">\$54.99</span>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                    <!-- Game 3 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0.2s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/hollowsanctum4/600/800.jpg') center/cover; filter: brightness(0.55) contrast(1.2) saturate(0.9);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="tag bg-black/60 backdrop-blur">HORROR</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">89</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">NOCTEM</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">HOLLOW SANCTUM</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-playstation"></i>
                                                                            <i class="fa-brands fa-xbox"></i>
                                                                            <i class="fa-brands fa-steam"></i>
                                                                            <i class="fa-solid fa-n"></i>
                                                                        </div>
                                                                        <span class="font-display font-bold text-2xl">\$44.99</span>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                    <!-- Game 4 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/neonrequiem5/600/800.jpg') center/cover; filter: brightness(0.65) contrast(1.15) saturate(1.4) hue-rotate(280deg);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="tag bg-black/60 backdrop-blur">CYBERPUNK</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">92</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">CHROMA WORKS</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">NEON REQUIEM</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-playstation"></i>
                                                                            <i class="fa-brands fa-xbox"></i>
                                                                            <i class="fa-brands fa-steam"></i>
                                                                        </div>
                                                                        <span class="font-display font-bold text-2xl">\$64.99</span>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                    <!-- Game 5 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0.1s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/ironclad2/600/800.jpg') center/cover; filter: brightness(0.6) contrast(1.2) saturate(1.1) sepia(0.2);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="deal-badge">-25%</span>
                                                                <span class="tag bg-black/60 backdrop-blur">ESTRATEGIA</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">87</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">FORGE INTERACTIVE</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">IRONCLAD DESTINY</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-playstation"></i>
                                                                            <i class="fa-brands fa-xbox"></i>
                                                                            <i class="fa-brands fa-steam"></i>
                                                                        </div>
                                                                        <div class="flex items-baseline gap-2">
                                                                            <span class="text-gray-500 line-through text-sm">\$52.99</span>
                                                                            <span class="font-display font-bold text-2xl cyan-text">\$39.74</span>
                                                                        </div>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                    <!-- Game 6 -->
                                                    <article class="game-card interactive fade-slide" style="transition-delay: 0.2s">
                                                        <div class="card-glow"></div>
                                                        <div class="card-inner relative aspect-[3/4] overflow-hidden bg-charcoal">
                                                            <div class="card-img absolute inset-0 cover-treatment" style="background: url('https://picsum.photos/seed/spectraldrift8/600/800.jpg') center/cover; filter: brightness(0.6) contrast(1.15) saturate(1.3) hue-rotate(160deg);"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 z-10 flex gap-2">
                                                                <span class="tag bg-black/60 backdrop-blur">INDIE</span>
                                                                <span class="tag bg-purple-500/20 backdrop-blur text-purple-300 border-purple-400/30">NUEVO</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 z-10 float-badge px-3 py-1.5">
                                                                <span class="font-display font-bold gold-text">90</span>
                                                            </div>

                                                            <div class="card-overlay absolute bottom-0 left-0 right-0 p-6 z-10">
                                                                <div class="card-info">
                                                                    <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">LUMEN STUDIO</div>
                                                                    <h3 class="font-display font-bold text-3xl mb-3">SPECTRAL DRIFT</h3>
                                                                    <div class="flex items-center justify-between mb-4">
                                                                        <div class="flex items-center gap-2 text-gray-400 text-sm">
                                                                            <i class="fa-brands fa-steam"></i>
                                                                            <i class="fa-solid fa-n"></i>
                                                                        </div>
                                                                        <span class="font-display font-bold text-2xl">\$24.99</span>
                                                                    </div>
                                                                    <button class="w-full py-3 bg-white text-black font-display font-semibold tracking-widest text-sm hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                        AÑADIR AL CARRITO
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>

                                                </div>

                                                <div class="mt-12 text-center fade-slide">
                                                    <a href="#" class="btn-ghost interactive">
                                                        <span>Ver todo el catálogo</span>
                                                        <i class="fa-solid fa-arrow-right"></i>
                                                    </a>
                                                </div>

                                            </div>
                                        </section>

                                        <!-- CATEGORIES -->
                                        <section id="categories" class="py-32 px-8 lg:px-12 relative bg-[#0c0c0c]">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">02 — PLATAFORMAS</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            Encuentra tu<br>
                                                                <span class="text-gray-500">próximo universo.</span>
                                                        </h2>
                                                    </div>
                                                    <p class="text-gray-400 max-w-md text-lg leading-relaxed">
                                                        Desde la última generación de consolas hasta setups de élite.
                                                        Accesorios premium, ediciones de coleccionista y periféricos seleccionados a mano.
                                                    </p>
                                                </div>

                                                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/pcgaming2/600/750.jpg') center/cover;"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-computer text-3xl text-cyan-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">01</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">2,847 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">PC GAMING</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.05s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/playstation5/600/750.jpg') center/cover;"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-brands fa-playstation text-3xl text-blue-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">02</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">1,523 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">PLAYSTATION</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.1s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/xboxseries/600/750.jpg') center/cover;"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-brands fa-xbox text-3xl text-green-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">03</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">1,284 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">XBOX</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.15s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/nintendoswitch/600/750.jpg') center/cover;"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-n text-3xl text-red-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">04</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">967 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">NINTENDO</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.2s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/indiegames/600/750.jpg') center/cover; filter: hue-rotate(60deg);"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-gem text-3xl text-purple-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">05</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">3,412 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">INDIE</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.25s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/collectors/600/750.jpg') center/cover; filter: sepia(0.3);"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="absolute top-5 right-5 z-10">
                                                            <span class="gold-text font-display text-xs tracking-widest font-bold">PREMIUM</span>
                                                        </div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-crown text-3xl gold-text"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">06</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">142 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">COLECCIONISTA</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.3s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/accessories/600/750.jpg') center/cover;"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-keyboard text-3xl text-cyan-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">07</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">856 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">ACCESORIOS</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                    <a href="#" class="category-card interactive fade-slide aspect-[4/5] relative block" style="transition-delay: 0.35s">
                                                        <div class="cat-bg absolute inset-0" style="background: url('https://picsum.photos/seed/vrheadset/600/750.jpg') center/cover; filter: hue-rotate(200deg);"></div>
                                                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[2]"></div>
                                                        <div class="relative z-10 h-full p-7 flex flex-col justify-between">
                                                            <div class="flex items-center justify-between">
                                                                <i class="fa-solid fa-vr-cardboard text-3xl text-purple-400"></i>
                                                                <span class="text-xs text-gray-400 font-display tracking-widest">08</span>
                                                            </div>
                                                            <div>
                                                                <div class="text-xs tracking-widest text-gray-400 mb-2 font-display">234 ARTÍCULOS</div>
                                                                <h3 class="font-display font-bold text-3xl mb-2">VR</h3>
                                                                <div class="flex items-center gap-2 text-cyan-400 text-sm">
                                                                    <span class="font-display tracking-wider">Explorar</span>
                                                                    <i class="fa-solid fa-arrow-right text-xs"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>

                                                </div>
                                            </div>
                                        </section>

                                        <!-- UPCOMING RELEASES -->
                                        <section id="upcoming" class="py-32 px-8 lg:px-12 relative">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">03 — CALENDARIO</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            El futuro,<br>
                                                                <span class="text-gray-500">en reserva.</span>
                                                        </h2>
                                                    </div>
                                                    <p class="text-gray-400 max-w-md text-lg leading-relaxed">
                                                        Próximos lanzamientos confirmados. Reserva con antelación y asegura ediciones limitadas,
                                                        contenido exclusivo y acceso anticipado.
                                                    </p>
                                                </div>

                                                <div class="h-scroll flex gap-6 pb-6 -mx-8 px-8 lg:-mx-12 lg:px-12">

                                                    <article class="flex-shrink-0 w-[340px] md:w-[420px] group interactive">
                                                        <div class="relative aspect-[3/4] overflow-hidden bg-charcoal mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/echelon1/500/700.jpg') center/cover; filter: brightness(0.6) saturate(1.2) hue-rotate(-20deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">RESERVA ABIERTA</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 float-badge p-3 text-center">
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">DIC</div>
                                                                <div class="font-display font-bold text-3xl gold-text leading-none">12</div>
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">2024</div>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">SYNCWARE</div>
                                                                <h3 class="font-display font-bold text-4xl">ECHELON PROTOCOL</h3>
                                                            </div>
                                                        </div>

                                                        <div class="space-y-3">
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Plataformas</span>
                                                                <div class="flex gap-3 text-gray-300">
                                                                    <i class="fa-brands fa-playstation"></i>
                                                                    <i class="fa-brands fa-xbox"></i>
                                                                    <i class="fa-brands fa-steam"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Género</span>
                                                                <span class="font-display tracking-wider">SHOOTER TÁCTICO</span>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Edición reservada</span>
                                                                <span class="gold-text font-display font-bold">\$129.99</span>
                                                            </div>
                                                            <button class="w-full mt-4 py-3 border border-white/15 hover:border-purple-400 hover:bg-purple-500/10 transition font-display tracking-widest text-sm interactive" data-add-cart>
                                                                RESERVAR AHORA
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="flex-shrink-0 w-[340px] md:w-[420px] group interactive">
                                                        <div class="relative aspect-[3/4] overflow-hidden bg-charcoal mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/spectraldrift2/500/700.jpg') center/cover; filter: brightness(0.6) saturate(1.3) hue-rotate(150deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">RESERVA ABIERTA</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 float-badge p-3 text-center">
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">ENE</div>
                                                                <div class="font-display font-bold text-3xl gold-text leading-none">08</div>
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">2025</div>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">LUMEN STUDIO</div>
                                                                <h3 class="font-display font-bold text-4xl">SPECTRAL DRIFT</h3>
                                                            </div>
                                                        </div>

                                                        <div class="space-y-3">
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Plataformas</span>
                                                                <div class="flex gap-3 text-gray-300">
                                                                    <i class="fa-brands fa-steam"></i>
                                                                    <i class="fa-solid fa-n"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Género</span>
                                                                <span class="font-display tracking-wider">EXPLORACIÓN</span>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Edición estándar</span>
                                                                <span class="gold-text font-display font-bold">\$24.99</span>
                                                            </div>
                                                            <button class="w-full mt-4 py-3 border border-white/15 hover:border-purple-400 hover:bg-purple-500/10 transition font-display tracking-widest text-sm interactive" data-add-cart>
                                                                RESERVAR AHORA
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="flex-shrink-0 w-[340px] md:w-[420px] group interactive">
                                                        <div class="relative aspect-[3/4] overflow-hidden bg-charcoal mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/lasthorizon3/500/700.jpg') center/cover; filter: brightness(0.6) saturate(1.2) sepia(0.2);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">PRÓXIMAMENTE</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 float-badge p-3 text-center">
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">FEB</div>
                                                                <div class="font-display font-bold text-3xl gold-text leading-none">14</div>
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">2025</div>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">HORIZON FORGE</div>
                                                                <h3 class="font-display font-bold text-4xl">THE LAST HORIZON</h3>
                                                            </div>
                                                        </div>

                                                        <div class="space-y-3">
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Plataformas</span>
                                                                <div class="flex gap-3 text-gray-300">
                                                                    <i class="fa-brands fa-playstation"></i>
                                                                    <i class="fa-brands fa-xbox"></i>
                                                                    <i class="fa-brands fa-steam"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Género</span>
                                                                <span class="font-display tracking-wider">SPACE SIM</span>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Edición estándar</span>
                                                                <span class="gold-text font-display font-bold">\$69.99</span>
                                                            </div>
                                                            <button class="w-full mt-4 py-3 border border-white/15 hover:border-cyan-400 hover:bg-cyan-500/10 transition font-display tracking-widest text-sm interactive">
                                                                NOTIFICARME
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="flex-shrink-0 w-[340px] md:w-[420px] group interactive">
                                                        <div class="relative aspect-[3/4] overflow-hidden bg-charcoal mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/ironveil4/500/700.jpg') center/cover; filter: brightness(0.6) saturate(1.2) hue-rotate(220deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">PRÓXIMAMENTE</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 float-badge p-3 text-center">
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">MAR</div>
                                                                <div class="font-display font-bold text-3xl gold-text leading-none">21</div>
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">2025</div>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">VESPER STUDIOS</div>
                                                                <h3 class="font-display font-bold text-4xl">IRON VEIL</h3>
                                                            </div>
                                                        </div>

                                                        <div class="space-y-3">
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Plataformas</span>
                                                                <div class="flex gap-3 text-gray-300">
                                                                    <i class="fa-brands fa-playstation"></i>
                                                                    <i class="fa-brands fa-xbox"></i>
                                                                    <i class="fa-brands fa-steam"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Género</span>
                                                                <span class="font-display tracking-wider">ACCIÓN RPG</span>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Edición estándar</span>
                                                                <span class="gold-text font-display font-bold">\$69.99</span>
                                                            </div>
                                                            <button class="w-full mt-4 py-3 border border-white/15 hover:border-cyan-400 hover:bg-cyan-500/10 transition font-display tracking-widest text-sm interactive">
                                                                NOTIFICARME
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="flex-shrink-0 w-[340px] md:w-[420px] group interactive">
                                                        <div class="relative aspect-[3/4] overflow-hidden bg-charcoal mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/quietus5/500/700.jpg') center/cover; filter: brightness(0.6) saturate(1.2);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">PRÓXIMAMENTE</span>
                                                            </div>

                                                            <div class="absolute top-5 right-5 float-badge p-3 text-center">
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">ABR</div>
                                                                <div class="font-display font-bold text-3xl gold-text leading-none">03</div>
                                                                <div class="font-display text-[10px] tracking-widest text-gray-400">2025</div>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-2 font-display">NOCTEM</div>
                                                                <h3 class="font-display font-bold text-4xl">QUIETUS</h3>
                                                            </div>
                                                        </div>

                                                        <div class="space-y-3">
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Plataformas</span>
                                                                <div class="flex gap-3 text-gray-300">
                                                                    <i class="fa-brands fa-playstation"></i>
                                                                    <i class="fa-brands fa-steam"></i>
                                                                </div>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Género</span>
                                                                <span class="font-display tracking-wider">NARRATIVO</span>
                                                            </div>
                                                            <div class="flex items-center justify-between text-sm">
                                                                <span class="text-gray-400">Edición estándar</span>
                                                                <span class="gold-text font-display font-bold">\$39.99</span>
                                                            </div>
                                                            <button class="w-full mt-4 py-3 border border-white/15 hover:border-cyan-400 hover:bg-cyan-500/10 transition font-display tracking-widest text-sm interactive">
                                                                NOTIFICARME
                                                            </button>
                                                        </div>
                                                    </article>

                                                </div>
                                            </div>
                                        </section>

                                        <!-- DEALS -->
                                        <section id="deals" class="py-32 px-8 lg:px-12 relative bg-[#0c0c0c]">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">04 — SELECCIÓN PREMIUM</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            Ofertas<br>
                                                                <span class="text-gray-500">sin rebajas de calidad.</span>
                                                        </h2>
                                                    </div>
                                                    <p class="text-gray-400 max-w-md text-lg leading-relaxed">
                                                        Descuentos reales en títulos seleccionados.
                                                        Sin trucos, sin inflar precios para luego "rebajarlos". Solo ahorro honesto.
                                                    </p>
                                                </div>

                                                <div class="grid lg:grid-cols-3 gap-6">

                                                    <article class="deal-card interactive fade-slide">
                                                        <div class="relative aspect-[16/11] overflow-hidden">
                                                            <div class="deal-bg absolute inset-0" style="background: url('https://picsum.photos/seed/bundle1/700/500.jpg') center/cover;"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 flex gap-2">
                                                                <span class="deal-badge">-40%</span>
                                                                <span class="tag bg-black/60 backdrop-blur">BUNDLE</span>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-1 font-display">OFERTA DESTACADA</div>
                                                                <h3 class="font-display font-bold text-3xl">CRIMSON VEIL + DLC</h3>
                                                            </div>
                                                        </div>

                                                        <div class="p-6">
                                                            <div class="space-y-2 mb-5 text-sm text-gray-400">
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Juego base completo</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> expansión "Veil of Shadows"</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Skins exclusivas</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Banda sonora digital</div>
                                                            </div>

                                                            <div class="flex items-baseline justify-between mb-5">
                                                                <div>
                                                                    <span class="text-gray-500 line-through text-sm">\$99.98</span>
                                                                    <div class="font-display font-bold text-4xl cyan-text">\$59.99</div>
                                                                </div>
                                                                <div class="text-right">
                                                                    <div class="text-xs text-gray-500">AHORRAS</div>
                                                                    <div class="font-display font-bold text-2xl gold-text">\$39.99</div>
                                                                </div>
                                                            </div>

                                                            <button class="w-full py-4 bg-white text-black font-display font-semibold tracking-widest hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                COMPRAR BUNDLE
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="deal-card interactive fade-slide" style="transition-delay: 0.1s">
                                                        <div class="relative aspect-[16/11] overflow-hidden">
                                                            <div class="deal-bg absolute inset-0" style="background: url('https://picsum.photos/seed/bundle2/700/500.jpg') center/cover; filter: hue-rotate(60deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 flex gap-2">
                                                                <span class="deal-badge">-25%</span>
                                                                <span class="tag bg-black/60 backdrop-blur">DELUXE</span>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-1 font-display">EDICIÓN PREMIUM</div>
                                                                <h3 class="font-display font-bold text-3xl">VOIDWALKER DELUXE</h3>
                                                            </div>
                                                        </div>

                                                        <div class="p-6">
                                                            <div class="space-y-2 mb-5 text-sm text-gray-400">
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Juego base completo</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Season Pass completo</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Artbook digital</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Acceso 72h anticipado</div>
                                                            </div>

                                                            <div class="flex items-baseline justify-between mb-5">
                                                                <div>
                                                                    <span class="text-gray-500 line-through text-sm">\$94.99</span>
                                                                    <div class="font-display font-bold text-4xl cyan-text">\$71.24</div>
                                                                </div>
                                                                <div class="text-right">
                                                                    <div class="text-xs text-gray-500">AHORRAS</div>
                                                                    <div class="font-display font-bold text-2xl gold-text">\$23.75</div>
                                                                </div>
                                                            </div>

                                                            <button class="w-full py-4 bg-white text-black font-display font-semibold tracking-widest hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                COMPRAR DELUXE
                                                            </button>
                                                        </div>
                                                    </article>

                                                    <article class="deal-card interactive fade-slide" style="transition-delay: 0.2s">
                                                        <div class="relative aspect-[16/11] overflow-hidden">
                                                            <div class="deal-bg absolute inset-0" style="background: url('https://picsum.photos/seed/bundle3/700/500.jpg') center/cover; filter: hue-rotate(180deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                                            <div class="scanlines"></div>

                                                            <div class="absolute top-5 left-5 flex gap-2">
                                                                <span class="deal-badge">-60%</span>
                                                                <span class="tag bg-purple-500/30 backdrop-blur text-purple-300 border-purple-400/30">INDIE</span>
                                                            </div>

                                                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                                                <div class="text-xs tracking-widest text-purple-400 mb-1 font-display">COLECCIÓN CURADA</div>
                                                                <h3 class="font-display font-bold text-3xl">INDIE SPOTLIGHT</h3>
                                                            </div>
                                                        </div>

                                                        <div class="p-6">
                                                            <div class="space-y-2 mb-5 text-sm text-gray-400">
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> 5 juegos indie premiados</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Banda sonora de cada título</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Wallpapers 4K exclusivos</div>
                                                                <div class="flex items-center gap-2"><i class="fa-solid fa-check text-cyan-400 text-xs"></i> Créditos de desarrollador</div>
                                                            </div>

                                                            <div class="flex items-baseline justify-between mb-5">
                                                                <div>
                                                                    <span class="text-gray-500 line-through text-sm">\$124.95</span>
                                                                    <div class="font-display font-bold text-4xl cyan-text">\$49.98</div>
                                                                </div>
                                                                <div class="text-right">
                                                                    <div class="text-xs text-gray-500">AHORRAS</div>
                                                                    <div class="font-display font-bold text-2xl gold-text">\$74.97</div>
                                                                </div>
                                                            </div>

                                                            <button class="w-full py-4 bg-white text-black font-display font-semibold tracking-widest hover:bg-cyan-400 transition interactive" data-add-cart>
                                                                COMPRAR COLECCIÓN
                                                            </button>
                                                        </div>
                                                    </article>

                                                </div>
                                            </div>
                                        </section>

                                        <!-- TESTIMONIALS -->
                                        <section class="py-32 px-8 lg:px-12 relative">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">05 — COMUNIDAD</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            Voces de quienes<br>
                                                                <span class="text-gray-500">saben jugar.</span>
                                                        </h2>
                                                    </div>
                                                    <div class="flex items-center gap-4">
                                                        <div class="flex items-center gap-2">
                                                            <i class="fa-solid fa-star text-gold-text" style="color: #EAB308"></i>
                                                            <span class="font-display font-bold text-2xl">4.9</span>
                                                            <span class="text-gray-500 text-sm">/ 5.0</span>
                                                        </div>
                                                        <div class="w-px h-8 bg-white/15"></div>
                                                        <div class="text-sm text-gray-400">
                                                            <span class="font-display font-bold text-white">12,847</span> reseñas verificadas
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="grid md:grid-cols-3 gap-6">

                                                    <article class="glass p-8 fade-slide card-interactive interactive relative">
                                                        <i class="fa-solid fa-quote-left text-3xl text-purple-400/30 mb-4"></i>
                                                        <p class="text-lg text-gray-200 leading-relaxed mb-8">
                                                            "Finalmente una tienda que trata a los videojuegos como lo que son: obras de arte.
                                                            La curaduría es impecable y el diseño del sitio es una obra en sí mismo."
                                                        </p>
                                                        <div class="flex items-center justify-between">
                                                            <div class="flex items-center gap-4">
                                                                <div class="w-12 h-12 rounded-full overflow-hidden border border-purple-400/30">
                                                                    <img src="https://picsum.photos/seed/avatar1/100/100.jpg" alt="Avatar" class="w-full h-full object-cover">
                                                                </div>
                                                                <div>
                                                                    <div class="font-display font-semibold tracking-wider">SHADOWRIVEN</div>
                                                                    <div class="text-xs text-gray-500">@shadow_riven · Verificado</div>
                                                                </div>
                                                            </div>
                                                            <i class="fa-brands fa-steam text-2xl text-gray-600"></i>
                                                        </div>
                                                        <div class="mt-6 pt-6 border-t border-white/5 flex justify-between text-xs text-gray-500">
                                                            <span>1,247 horas jugadas</span>
                                                            <span>Cliente desde 2022</span>
                                                        </div>
                                                    </article>

                                                    <article class="glass p-8 fade-slide card-interactive interactive relative" style="transition-delay: 0.1s">
                                                        <i class="fa-solid fa-quote-left text-3xl text-purple-400/30 mb-4"></i>
                                                        <p class="text-lg text-gray-200 leading-relaxed mb-8">
                                                            "No es solo una tienda, es una experiencia. Cada visita se siente como entrar a una
                                                            galería. Y los bundles premium valen cada céntimo. Calidad sobre cantidad."
                                                        </p>
                                                        <div class="flex items-center justify-between">
                                                            <div class="flex items-center gap-4">
                                                                <div class="w-12 h-12 rounded-full overflow-hidden border border-purple-400/30">
                                                                    <img src="https://picsum.photos/seed/avatar2/100/100.jpg" alt="Avatar" class="w-full h-full object-cover">
                                                                </div>
                                                                <div>
                                                                    <div class="font-display font-semibold tracking-wider">NIGHTFALL_GX</div>
                                                                    <div class="text-xs text-gray-500">@nightfall_gx · Verificado</div>
                                                                </div>
                                                            </div>
                                                            <i class="fa-brands fa-playstation text-2xl text-gray-600"></i>
                                                        </div>
                                                        <div class="mt-6 pt-6 border-t border-white/5 flex justify-between text-xs text-gray-500">
                                                            <span>3,892 horas jugadas</span>
                                                            <span>Cliente desde 2021</span>
                                                        </div>
                                                    </article>

                                                    <article class="glass p-8 fade-slide card-interactive interactive relative" style="transition-delay: 0.2s">
                                                        <i class="fa-solid fa-quote-left text-3xl text-purple-400/30 mb-4"></i>
                                                        <p class="text-lg text-gray-200 leading-relaxed mb-8">
                                                            "El mejor descubrimiento del año. Compré una edición coleccionista y llegó impecable,
                                                            con empaquetado premium. Esto es a lo que aspiran otras tiendas."
                                                        </p>
                                                        <div class="flex items-center justify-between">
                                                            <div class="flex items-center gap-4">
                                                                <div class="w-12 h-12 rounded-full overflow-hidden border border-purple-400/30">
                                                                    <img src="https://picsum.photos/seed/avatar3/100/100.jpg" alt="Avatar" class="w-full h-full object-cover">
                                                                </div>
                                                                <div>
                                                                    <div class="font-display font-semibold tracking-wider">VORTEXKNIGHT</div>
                                                                    <div class="text-xs text-gray-500">@vortex_knight · Verificado</div>
                                                                </div>
                                                            </div>
                                                            <i class="fa-brands fa-xbox text-2xl text-gray-600"></i>
                                                        </div>
                                                        <div class="mt-6 pt-6 border-t border-white/5 flex justify-between text-xs text-gray-500">
                                                            <span>2,156 horas jugadas</span>
                                                            <span>Cliente desde 2023</span>
                                                        </div>
                                                    </article>

                                                </div>
                                            </div>
                                        </section>

                                        <!-- BLOG -->
                                        <section id="blog" class="py-32 px-8 lg:px-12 relative bg-[#0c0c0c]">
                                            <div class="max-w-[1600px] mx-auto">

                                                <div class="flex flex-wrap items-end justify-between mb-16 gap-6 fade-slide">
                                                    <div>
                                                        <div class="section-num mb-6">06 — DIARIO</div>
                                                        <h2 class="font-display font-bold text-5xl md:text-7xl leading-none">
                                                            Detrás<br>
                                                                <span class="text-gray-500">del pixel.</span>
                                                        </h2>
                                                    </div>
                                                    <a href="#" class="btn-ghost interactive">
                                                        <span>Ver todo</span>
                                                        <i class="fa-solid fa-arrow-right"></i>
                                                    </a>
                                                </div>

                                                <div class="grid lg:grid-cols-3 gap-6">

                                                    <article class="group interactive fade-slide cursor-pointer">
                                                        <div class="relative aspect-[16/10] overflow-hidden mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/blog1/600/400.jpg') center/cover; filter: brightness(0.7) saturate(1.2);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                            <div class="scanlines"></div>
                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">DESARROLLO</span>
                                                            </div>
                                                        </div>
                                                        <div class="text-xs text-gray-500 mb-3 font-display tracking-widest">12 NOV 2024 · 8 MIN LECTURA</div>
                                                        <h3 class="font-display font-bold text-2xl mb-3 group-hover:text-cyan-400 transition leading-tight">
                                                            Detrás de cámaras: el desarrollo de Ashes of Eternity
                                                        </h3>
                                                        <p class="text-gray-400 leading-relaxed mb-4">
                                                            Cinco años de desarrollo, un equipo de 200 personas y una visión: crear el RPG que
                                                            redefina el género. Conversamos con Vesper Studios.
                                                        </p>
                                                        <div class="flex items-center gap-3 text-sm">
                                                            <div class="w-8 h-8 rounded-full overflow-hidden">
                                                                <img src="https://picsum.photos/seed/author1/50/50.jpg" alt="Autor" class="w-full h-full object-cover">
                                                            </div>
                                                            <span class="text-gray-400">Elena Vasquez</span>
                                                        </div>
                                                    </article>

                                                    <article class="group interactive fade-slide cursor-pointer" style="transition-delay: 0.1s">
                                                        <div class="relative aspect-[16/10] overflow-hidden mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/blog2/600/400.jpg') center/cover; filter: brightness(0.7) saturate(1.2) hue-rotate(60deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                            <div class="scanlines"></div>
                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">ANÁLISIS</span>
                                                            </div>
                                                        </div>
                                                        <div class="text-xs text-gray-500 mb-3 font-display tracking-widest">08 NOV 2024 · 12 MIN LECTURA</div>
                                                        <h3 class="font-display font-bold text-2xl mb-3 group-hover:text-cyan-400 transition leading-tight">
                                                            El renacimiento del RPG: una conversación con Studio Vesper
                                                        </h3>
                                                        <p class="text-gray-400 leading-relaxed mb-4">
                                                            Sobre narrativa emergente, sistemas de elección que importan de verdad, y por qué
                                                            el futuro del género pasa por respetar la inteligencia del jugador.
                                                        </p>
                                                        <div class="flex items-center gap-3 text-sm">
                                                            <div class="w-8 h-8 rounded-full overflow-hidden">
                                                                <img src="https://picsum.photos/seed/author2/50/50.jpg" alt="Autor" class="w-full h-full object-cover">
                                                            </div>
                                                            <span class="text-gray-400">Marcus Chen</span>
                                                        </div>
                                                    </article>

                                                    <article class="group interactive fade-slide cursor-pointer" style="transition-delay: 0.2s">
                                                        <div class="relative aspect-[16/10] overflow-hidden mb-5">
                                                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style="background: url('https://picsum.photos/seed/blog3/600/400.jpg') center/cover; filter: brightness(0.7) saturate(1.2) hue-rotate(180deg);"></div>
                                                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                            <div class="scanlines"></div>
                                                            <div class="absolute top-5 left-5">
                                                                <span class="tag bg-black/60 backdrop-blur">GUÍAS</span>
                                                            </div>
                                                        </div>
                                                        <div class="text-xs text-gray-500 mb-3 font-display tracking-widest">02 NOV 2024 · 15 MIN LECTURA</div>
                                                        <h3 class="font-display font-bold text-2xl mb-3 group-hover:text-cyan-400 transition leading-tight">
                                                            Configurando el setup gaming definitivo para 2025
                                                        </h3>
                                                        <p class="text-gray-400 leading-relaxed mb-4">
                                                            Desde el monitor hasta la silla. Guía completa de periféricos premium,
                                                            optimización de PC y cómo construir un setup que dure años sin obsolescencia.
                                                        </p>
                                                        <div class="flex items-center gap-3 text-sm">
                                                            <div class="w-8 h-8 rounded-full overflow-hidden">
                                                                <img src="https://picsum.photos/seed/author3/50/50.jpg" alt="Autor" class="w-full h-full object-cover">
                                                            </div>
                                                            <span class="text-gray-400">Sofia Reyes</span>
                                                        </div>
                                                    </article>

                                                </div>
                                            </div>
                                        </section>

                                        <!-- NEWSLETTER -->
                                        <section class="py-32 px-8 lg:px-12 relative newsletter-bg overflow-hidden">
                                            <div class="absolute inset-0 opacity-20" style="background: url('https://picsum.photos/seed/newsbg/1600/600.jpg') center/cover; filter: brightness(0.4) saturate(1.3);"></div>
                                            <div class="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>

                                            <div class="max-w-3xl mx-auto text-center relative z-10 fade-slide">
                                                <div class="section-num justify-center mb-6 inline-flex">EXCLUSIVO · MIEMBROS</div>
                                                <h2 class="font-display font-bold text-5xl md:text-7xl leading-[0.95] mb-6">
                                                    Únete a la<br>
                                                        <span class="glow-purple">avant-garde</span> del gaming.
                                                </h2>
                                                <p class="text-gray-300 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
                                                    <span class="gold-text font-display font-bold">10% en tu primera compra</span> + acceso anticipado a ediciones limitadas,
                                                    contenido exclusivo y curaduría semanal directamente en tu inbox.
                                                </p>

                                                <form class="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onsubmit="event.preventDefault(); subscribeNewsletter();">
                                                    <input
                                                        type="email"
                                                        id="emailInput"
                                                        required
                                                        placeholder="tu@email.com"
                                                        class="flex-1 bg-white/5 backdrop-blur border border-white/15 px-6 py-4 text-white placeholder-gray-500 font-display tracking-wider focus:border-cyan-400 transition"
                                                    >
                                                        <button type="submit" class="btn-primary interactive justify-center">
                                                            <span>Suscribirme</span>
                                                            <i class="fa-solid fa-arrow-right"></i>
                                                        </button>
                                                </form>

                                                <p class="text-xs text-gray-500 mt-6 tracking-wider">
                                                    Sin spam. Curaduría semanal. Cancela cuando quieras. · <a href="#" class="hover:text-gray-300 underline">Términos</a>
                                                </p>
                                            </div>
                                        </section>

                                        <!-- FOOTER -->
                                        <footer class="bg-black border-t border-white/5 pt-20 pb-10 px-8 lg:px-12">
                                            <div class="max-w-[1600px] mx-auto">
                                                <div class="grid lg:grid-cols-12 gap-12 mb-16">

                                                    <div class="lg:col-span-4">
                                                        <div class="flex items-center gap-3 mb-6">
                                                            <div class="w-10 h-10 relative">
                                                                <div class="absolute inset-0 border border-purple-400/60 rotate-45"></div>
                                                                <div class="absolute inset-1 bg-gradient-to-br from-purple-500 to-cyan-400 rotate-45 opacity-80"></div>
                                                            </div>
                                                            <div>
                                                                <div class="font-display font-bold text-2xl tracking-[0.2em] leading-none">NOCTURNE</div>
                                                                <div class="text-[9px] text-gray-500 tracking-[0.3em] mt-1">PREMIUM GAMING BOUTIQUE</div>
                                                            </div>
                                                        </div>
                                                        <p class="text-gray-400 leading-relaxed mb-6 max-w-sm">
                                                            Una tienda para gamers exigentes que valoran la curaduría, el diseño y la experiencia
                                                            por encima del ruido. Seleccionado a mano, entregado con cuidado.
                                                        </p>
                                                        <div class="flex gap-4">
                                                            <a href="#" class="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition interactive" aria-label="Twitter">
                                                                <i class="fa-brands fa-x-twitter"></i>
                                                            </a>
                                                            <a href="#" class="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition interactive" aria-label="Discord">
                                                                <i class="fa-brands fa-discord"></i>
                                                            </a>
                                                            <a href="#" class="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition interactive" aria-label="YouTube">
                                                                <i class="fa-brands fa-youtube"></i>
                                                            </a>
                                                            <a href="#" class="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition interactive" aria-label="Instagram">
                                                                <i class="fa-brands fa-instagram"></i>
                                                            </a>
                                                            <a href="#" class="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition interactive" aria-label="Twitch">
                                                                <i class="fa-brands fa-twitch"></i>
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div class="lg:col-span-2">
                                                        <h4 class="font-display text-sm tracking-widest text-gray-500 mb-5">TIENDA</h4>
                                                        <ul class="space-y-3 text-sm">
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Destacados</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Novedades</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Próximos lanzamientos</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Ofertas</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Ediciones coleccionista</a></li>
                                                        </ul>
                                                    </div>

                                                    <div class="lg:col-span-2">
                                                        <h4 class="font-display text-sm tracking-widest text-gray-500 mb-5">PLATAFORMAS</h4>
                                                        <ul class="space-y-3 text-sm">
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">PC Gaming</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">PlayStation</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Xbox</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Nintendo</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">VR</a></li>
                                                        </ul>
                                                    </div>

                                                    <div class="lg:col-span-2">
                                                        <h4 class="font-display text-sm tracking-widest text-gray-500 mb-5">COMPAÑÍA</h4>
                                                        <ul class="space-y-3 text-sm">
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Sobre nosotros</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Curaduría</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Diario</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Carreras</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Contacto</a></li>
                                                        </ul>
                                                    </div>

                                                    <div class="lg:col-span-2">
                                                        <h4 class="font-display text-sm tracking-widest text-gray-500 mb-5">SOPORTE</h4>
                                                        <ul class="space-y-3 text-sm">
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Centro de ayuda</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Envíos</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Devoluciones</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Garantía</a></li>
                                                            <li><a href="#" class="text-gray-300 hover:text-cyan-400 transition interactive">Estado de pedido</a></li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div class="divider-line mb-8"></div>

                                                <div class="flex flex-wrap justify-between items-center gap-6 text-xs text-gray-500">
                                                    <div class="flex flex-wrap items-center gap-6">
                                                        <span>© 2024 Nocturne Boutique. Todos los derechos reservados.</span>
                                                        <a href="#" class="hover:text-gray-300 transition interactive">Términos</a>
                                                        <a href="#" class="hover:text-gray-300 transition interactive">Privacidad</a>
                                                        <a href="#" class="hover:text-gray-300 transition interactive">Cookies</a>
                                                    </div>
                                                    <div class="flex items-center gap-4">
                                                        <i class="fa-brands fa-cc-visa text-2xl text-gray-600"></i>
                                                        <i class="fa-brands fa-cc-mastercard text-2xl text-gray-600"></i>
                                                        <i class="fa-brands fa-cc-paypal text-2xl text-gray-600"></i>
                                                        <i class="fa-brands fa-cc-amex text-2xl text-gray-600"></i>
                                                        <i class="fa-brands fa-apple-pay text-2xl text-gray-600"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </footer>

                                        <script>
// Custom cursor
                                            const cursorDot = document.getElementById('cursorDot');
                                            const cursorRing = document.getElementById('cursorRing');
                                            let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
                                                mouseX = e.clientX;
                                            mouseY = e.clientY;
                                            cursorDot.style.left = mouseX + 'px';
                                            cursorDot.style.top = mouseY + 'px';
});

                                            function animateRing() {
                                                ringX += (mouseX - ringX) * 0.18;
                                            ringY += (mouseY - ringY) * 0.18;
                                            cursorRing.style.left = ringX + 'px';
                                            cursorRing.style.top = ringY + 'px';
                                            requestAnimationFrame(animateRing);
}
                                            animateRing();

                                            // Hover states
                                            function bindCursorHover() {
                                                document.querySelectorAll('a, button, .interactive, .game-card, .category-card, input').forEach(el => {
                                                    el.addEventListener('mouseenter', () => {
                                                        cursorDot.classList.add('hover');
                                                        cursorRing.classList.add('hover');
                                                    });
                                                    el.addEventListener('mouseleave', () => {
                                                        cursorDot.classList.remove('hover');
                                                        cursorRing.classList.remove('hover');
                                                    });
                                                });
}
                                            bindCursorHover();

                                            // Hero parallax
                                            const heroBg = document.getElementById('heroBg');
                                            const heroSection = document.getElementById('hero');
                                            let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
                                            if (heroBg && scrolled < window.innerHeight) {
                                                heroBg.style.transform = 'translateY(' + (scrolled * 0.4) + 'px) scale(' + (1 + scrolled * 0.0002) + ')';
  }

                                            // Nav background
                                            const nav = document.getElementById('nav');
  if (scrolled > 50) nav.classList.add('scrolled');
                                            else nav.classList.remove('scrolled');

                                            lastScrollY = scrolled;
});

// Mouse parallax on hero
document.addEventListener('mousemove', (e) => {
  if (window.pageYOffset > window.innerHeight) return;
                                            const x = (e.clientX / window.innerWidth - 0.5) * 20;
                                            const y = (e.clientY / window.innerHeight - 0.5) * 20;
                                            if (heroBg) {
    const scrolled = window.pageYOffset;
                                            heroBg.style.transform = 'translate(' + x + 'px, ' + (scrolled * 0.4 + y) + 'px) scale(' + (1 + scrolled * 0.0002) + ')';
  }
});

                                            // Particles
                                            const canvas = document.getElementById('particles');
                                            const ctx = canvas.getContext('2d');

                                            function resizeCanvas() {
                                                canvas.width = canvas.offsetWidth;
                                            canvas.height = canvas.offsetHeight;
}
                                            resizeCanvas();

                                            const particles = [];
                                            for (let i = 0; i < 70; i++) {
                                                particles.push({
                                                    x: Math.random() * canvas.width,
                                                    y: Math.random() * canvas.height,
                                                    r: Math.random() * 1.6 + 0.3,
                                                    vx: (Math.random() - 0.5) * 0.25,
                                                    vy: (Math.random() - 0.5) * 0.25,
                                                    opacity: Math.random() * 0.5 + 0.1,
                                                    color: Math.random() > 0.5 ? '168, 85, 247' : '6, 182, 212'
                                                });
}

                                            function animateParticles() {
                                                ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
                                                p.x += p.vx;
                                            p.y += p.vy;
                                            if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
                                            if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;

                                            ctx.beginPath();
                                            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                                            ctx.fillStyle = 'rgba(' + p.color + ', ' + p.opacity + ')';
                                            ctx.fill();

                                            // Glow
                                            ctx.beginPath();
                                            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                                            ctx.fillStyle = 'rgba(' + p.color + ', ' + (p.opacity * 0.1) + ')';
                                            ctx.fill();
  });
                                            requestAnimationFrame(animateParticles);
}
                                            animateParticles();

                                            window.addEventListener('resize', resizeCanvas);

                                            // Countdown
                                            const targetDate = new Date();
                                            targetDate.setDate(targetDate.getDate() + 45);
                                            targetDate.setHours(23, 59, 59, 0);

                                            function updateCountdown() {
  const now = new Date();
                                            const diff = targetDate - now;

                                            if (diff < 0) return;

                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                                            document.getElementById('days').textContent = String(days).padStart(2, '0');
                                            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
                                            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
                                            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}
                                            setInterval(updateCountdown, 1000);
                                            updateCountdown();

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
                                                entries.forEach(entry => {
                                                    if (entry.isIntersecting) {
                                                        entry.target.classList.add('in-view');
                                                    }
                                                });
}, {threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-slide').forEach(el => observer.observe(el));

// 3D tilt on game cards
document.querySelectorAll('.game-card').forEach(card => {
                                                card.addEventListener('mousemove', (e) => {
                                                    const rect = card.getBoundingClientRect();
                                                    const x = e.clientX - rect.left;
                                                    const y = e.clientY - rect.top;
                                                    const cx = rect.width / 2;
                                                    const cy = rect.height / 2;
                                                    const rotateY = ((x - cx) / cx) * 8;
                                                    const rotateX = -((y - cy) / cy) * 8;
                                                    card.style.transform = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(15px)';
                                                });
  card.addEventListener('mouseleave', () => {
                                                card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateZ(0)';
  });
});

                                            // Add to cart
                                            let cartCount = 0;
                                            const cartCountEl = document.getElementById('cartCount');

document.querySelectorAll('[data-add-cart]').forEach(btn => {
                                                btn.addEventListener('click', (e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    cartCount++;
                                                    cartCountEl.textContent = cartCount;
                                                    cartCountEl.classList.add('cart-pop');
                                                    setTimeout(() => cartCountEl.classList.remove('cart-pop'), 500);

                                                    // Get context for message
                                                    let msg = 'Artículo añadido correctamente';
                                                    const card = btn.closest('article');
                                                    if (card) {
                                                        const title = card.querySelector('h3');
                                                        if (title) msg = title.textContent;
                                                    }
                                                    showToast(msg);
                                                });
});

                                            function showToast(msg) {
  const toast = document.getElementById('toast');
                                            toast.querySelector('.toast-msg').textContent = msg;
                                            toast.classList.add('show');
                                            clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

                                            // Newsletter
                                            function subscribeNewsletter() {
  const input = document.getElementById('emailInput');
                                            if (input.value && input.checkValidity()) {
                                                showToast('Suscripción confirmada. Revisa tu email para el código de descuento.');
                                            input.value = '';
  }
}

                                            // Sound toggle with Web Audio API
                                            let audioCtx, masterGain, isPlaying = false;
                                            const soundBtn = document.getElementById('soundToggle');

soundBtn.addEventListener('click', () => {
  if (!audioCtx) {
                                                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                            masterGain = audioCtx.createGain();
                                            masterGain.gain.value = 0;
                                            masterGain.connect(audioCtx.destination);

                                            // Ambient drone - low frequencies
                                            const freqs = [55, 82.4, 110, 164.8];
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
                                            osc.frequency.value = f;
                                            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
                                            const g = audioCtx.createGain();
                                            g.gain.value = 0.08 / (i + 1);

                                            // Slight detune for richness
                                            osc.detune.value = (Math.random() - 0.5) * 8;

                                            // LFO for subtle movement
                                            const lfo = audioCtx.createOscillator();
                                            lfo.frequency.value = 0.1 + Math.random() * 0.2;
                                            const lfoGain = audioCtx.createGain();
                                            lfoGain.gain.value = 2;
                                            lfo.connect(lfoGain);
                                            lfoGain.connect(osc.frequency);
                                            lfo.start();

                                            osc.connect(g);
                                            g.connect(masterGain);
                                            osc.start();
    });

                                            // Add a subtle filter
                                            const filter = audioCtx.createBiquadFilter();
                                            filter.type = 'lowpass';
                                            filter.frequency.value = 400;
                                            filter.Q.value = 1;
  }

                                            isPlaying = !isPlaying;
                                            const targetVol = isPlaying ? 0.06 : 0;
                                            masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
                                            masterGain.gain.linearRampToValueAtTime(targetVol, audioCtx.currentTime + 1.2);

                                            soundBtn.classList.toggle('active', isPlaying);
                                            soundBtn.querySelector('i').className = isPlaying ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
});

                                            // Horizontal scroll for upcoming section
                                            const hScroll = document.querySelector('.h-scroll');
                                            if (hScroll) {
                                                hScroll.addEventListener('wheel', (e) => {
                                                    if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) > 0) {
                                                        // Only hijack if within bounds
                                                        const maxScroll = hScroll.scrollWidth - hScroll.clientWidth;
                                                        if ((e.deltaY > 0 && hScroll.scrollLeft < maxScroll) ||
                                                            (e.deltaY < 0 && hScroll.scrollLeft > 0)) {
                                                            // Don't prevent default - let user scroll naturally too
                                                        }
                                                    }
                                                });
}

                                            // Re-bind cursor for dynamically added elements
                                            setTimeout(bindCursorHover, 100);
                                        </script>

                                    </body>
                                </html>`
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

Fondo dinámico que cambia sutilmente según el nivel o combo.`,
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>NEXUS Blocks - Premium Tetris</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['Courier New', 'monospace'],
                    },
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        if (window.self !== window.top) {
            document.documentElement.classList.add('in-iframe');
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #030303;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #fff;
            overflow: hidden;
        }
        
        .orbitron {
            font-family: 'Orbitron', sans-serif;
        }

        .phone-frame {
            width: 100%;
            max-width: 390px;
            height: 95vh;
            max-height: 844px;
            border-radius: 40px;
            border: 8px solid #1a1a1a;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            background-color: #07090e;
        }

        /* Responsive board */
        #board {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(20, 1fr);
            background: rgba(10, 15, 30, 0.6);
            border: 2px solid rgba(0, 240, 255, 0.25);
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.05);
            position: relative;
        }

        .cell {
            border: 1px solid rgba(255, 255, 255, 0.02);
            border-radius: 1px;
        }

        .block {
            border-radius: 4px;
            box-shadow: inset 2px 2px 0 rgba(255, 255, 255, 0.35), inset -2px -2px 0 rgba(0, 0, 0, 0.3);
            animation: land 0.12s ease-out;
        }

        .ghost {
            border-radius: 4px;
            border: 1.5px dashed currentColor;
            opacity: 0.25;
            background: transparent !important;
        }

        .clearing {
            animation: clearFlash 0.25s ease-out forwards;
        }

        @keyframes clearFlash {
            0% { background: #fff !important; box-shadow: 0 0 15px #fff; }
            100% { background: transparent !important; transform: scale(0); }
        }

        @keyframes land {
            0% { transform: scale(1.06); }
            100% { transform: scale(1); }
        }

        /* Ocultar barra de desplazamiento */
        ::-webkit-scrollbar { display: none; }

        /* Adaptabilidad dentro de iframes */
        .in-iframe body {
            background-color: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .in-iframe .phone-frame {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
        }
    </style>
</head>
<body>

    <div class="phone-frame">
        <!-- Status Bar Falso -->
        <div class="flex justify-between items-center px-8 pt-3 pb-1 text-sm font-semibold z-50 text-slate-400">
            <span>9:41</span>
            <div class="flex items-center gap-1">
                <i data-lucide="signal" class="w-4 h-4"></i>
                <i data-lucide="wifi" class="w-4 h-4"></i>
                <i data-lucide="battery-full" class="w-6 h-6"></i>
            </div>
        </div>

        <!-- Pantalla de Inicio -->
        <div id="screen-start" class="absolute inset-0 bg-[#07090e]/95 z-50 flex flex-col items-center justify-center p-6 text-center">
            <div class="w-20 h-20 rounded-3xl bg-blue-600/10 border-2 border-blue-500/30 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
                <i data-lucide="gamepad-2" class="w-10 h-10 text-blue-400"></i>
            </div>
            <h1 class="orbitron text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">NEXUS BLOCKS</h1>
            <p class="text-xs text-slate-400 max-w-xs leading-relaxed mb-8">Disfruta de una experiencia arcade futurista con físicas mejoradas y audio sintetizado en tiempo real.</p>
            <button id="btn-start" class="orbitron px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all text-sm tracking-widest">
                INICIAR JUEGO
            </button>
        </div>

        <!-- Pantalla de Game Over -->
        <div id="screen-gameover" class="absolute inset-0 bg-[#07090e]/95 z-50 flex flex-col items-center justify-center p-6 text-center hidden">
            <div class="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4">
                <i data-lucide="skull" class="w-8 h-8 text-red-500"></i>
            </div>
            <h2 class="orbitron text-2xl font-black text-red-500 mb-1">FIN DE JUEGO</h2>
            <p class="text-slate-400 text-sm mb-6">Puntuación Final</p>
            <div id="final-score" class="orbitron text-5xl font-black text-white tracking-tight mb-8">0</div>
            <button id="btn-restart" class="orbitron px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all text-sm tracking-widest">
                JUGAR DE NUEVO
            </button>
        </div>

        <!-- Pantalla de Pausa -->
        <div id="screen-pause" class="absolute inset-0 bg-[#07090e]/95 z-50 flex flex-col items-center justify-center p-6 text-center hidden">
            <div class="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
                <i data-lucide="pause" class="w-8 h-8 text-blue-400"></i>
            </div>
            <h2 class="orbitron text-2xl font-black text-white tracking-wider mb-8">JUEGO EN PAUSA</h2>
            <button id="btn-resume" class="orbitron px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all text-sm tracking-widest">
                REANUDAR
            </button>
        </div>

        <!-- Cabecera de Juego (HUD) -->
        <header class="px-5 pt-3 pb-2 flex justify-between items-center z-10">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
                    <span class="text-[9px] font-black text-blue-400">N</span>
                </div>
                <span class="orbitron text-xs font-black tracking-wider text-slate-300">NEXUS BLOCKS</span>
            </div>
            <!-- Botón de Pausa -->
            <button id="btn-pause" class="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <i data-lucide="pause" class="w-4 h-4"></i>
            </button>
        </header>

        <!-- Área Principal de Juego -->
        <div class="flex-1 flex px-4 items-center justify-center gap-3 select-none">
            <!-- Columna Izquierda: Hold -->
            <div class="flex flex-col gap-4 items-center">
                <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 text-center w-14 shadow-md">
                    <div class="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hold</div>
                    <div class="w-10 h-10 grid grid-cols-4 gap-0.5 mx-auto" id="hold-grid"></div>
                </div>
            </div>

            <!-- Centro: Tablero de Juego (10x20) -->
            <div id="board" class="w-[200px] h-[400px]"></div>

            <!-- Columna Derecha: Estadísticas y Siguiente -->
            <div class="flex flex-col gap-4 items-center">
                <!-- Next -->
                <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 text-center w-14 shadow-md">
                    <div class="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Next</div>
                    <div class="w-10 h-10 grid grid-cols-4 gap-0.5 mx-auto" id="next-grid"></div>
                </div>
                
                <!-- Stats -->
                <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 text-center w-14 shadow-md space-y-3">
                    <div>
                        <div class="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Score</div>
                        <div id="score" class="orbitron text-xs font-bold text-blue-400 mt-0.5">0</div>
                    </div>
                    <div>
                        <div class="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Lvl</div>
                        <div id="level" class="orbitron text-xs font-bold text-indigo-400 mt-0.5">1</div>
                    </div>
                    <div>
                        <div class="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Lines</div>
                        <div id="lines" class="orbitron text-xs font-bold text-emerald-400 mt-0.5">0</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Controles virtuales -->
        <div class="px-5 pb-6 pt-2 shrink-0 grid grid-cols-12 gap-3 z-30 select-none">
            <!-- Izquierda: Direccional Pad -->
            <div class="col-span-6 grid grid-cols-3 gap-2">
                <div></div>
                <button id="btn-hard-drop" class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-md">
                    <i data-lucide="chevrons-up" class="w-5 h-5"></i>
                </button>
                <div></div>
                
                <button id="btn-left" class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-md">
                    <i data-lucide="chevron-left" class="w-5 h-5"></i>
                </button>
                <button id="btn-soft-drop" class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-md">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                </button>
                <button id="btn-right" class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-md">
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                </button>
            </div>
            
            <!-- Derecha: Acciones de Rotar y Guardar -->
            <div class="col-span-6 flex items-center justify-end gap-3 pr-2">
                <button id="btn-hold" class="w-12 h-12 rounded-full bg-amber-600/10 border border-amber-500/50 flex flex-col items-center justify-center text-amber-400 active:bg-amber-600 active:text-white active:scale-90 transition-all shadow-md shadow-amber-500/5">
                    <span class="text-[7px] font-black tracking-wider uppercase">Hold</span>
                    <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
                </button>
                <button id="btn-rotate" class="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/50 flex flex-col items-center justify-center text-blue-400 active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-md shadow-blue-500/5">
                    <span class="text-[8px] font-black tracking-wider uppercase">Rotar</span>
                    <i data-lucide="rotate-cw" class="w-4.5 h-4.5"></i>
                </button>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();

        const COLS = 10, ROWS = 20;
        let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        
        const COLORS = { 
            I: '#00F0FF', 
            O: '#FFE600', 
            T: '#A300FF', 
            S: '#00FF66', 
            Z: '#FF0055', 
            L: '#FF7F00', 
            J: '#0066FF' 
        };
        const SHAPES = {
            I: [[1,1,1,1]], 
            O: [[1,1],[1,1]], 
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]], 
            Z: [[1,1,0],[0,1,1]], 
            L: [[0,0,1],[1,1,1]], 
            J: [[1,0,0],[1,1,1]]
        };
        const TYPES = Object.keys(SHAPES);
        
        let current = null, next = null, hold = null, canHold = true;
        let score = 0, lines = 0, level = 1, dropInterval = 1000;
        let dropTimer = 0, lastTime = 0;
        let gameActive = false;
        let isPaused = false;

        const boardEl = document.getElementById('board');
        const nextGridEl = document.getElementById('next-grid');
        const holdGridEl = document.getElementById('hold-grid');

        let audioCtx = null;
        function playSound(type) {
            try {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                const osc = audioCtx.createOscillator();
                const gainCtx = audioCtx.createGain();
                osc.connect(gainCtx);
                gainCtx.connect(audioCtx.destination);
                
                if (type === 'move') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04);
                    gainCtx.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gainCtx.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.04);
                } else if (type === 'rotate') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.06);
                    gainCtx.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gainCtx.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.06);
                } else if (type === 'drop') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
                    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.08);
                    gainCtx.gain.setValueAtTime(0.12, audioCtx.currentTime);
                    gainCtx.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.08);
                } else if (type === 'clear') {
                    const now = audioCtx.currentTime;
                    const freqs = [523.25, 659.25, 783.99, 1046.50];
                    freqs.forEach((f, idx) => {
                        const o = audioCtx.createOscillator();
                        const g = audioCtx.createGain();
                        o.connect(g);
                        g.connect(audioCtx.destination);
                        o.type = 'sine';
                        o.frequency.setValueAtTime(f, now + idx * 0.04);
                        g.gain.setValueAtTime(0.08, now + idx * 0.04);
                        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
                        o.start(now + idx * 0.04);
                        o.stop(now + idx * 0.04 + 0.12);
                    });
                } else if (type === 'gameover') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
                    osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.45);
                    gainCtx.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainCtx.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.45);
                }
            } catch (e) {
                console.error("Web Audio API not supported or blocked", e);
            }
        }

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
            document.querySelectorAll('.cell').forEach(c => {
                c.className = 'cell';
                c.style.background = '';
                c.style.boxShadow = '';
                c.style.borderColor = '';
            });

            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    if(board[r][c]) {
                        const cell = boardEl.children[r*COLS + c];
                        if (cell) {
                            cell.className = 'cell block';
                            cell.style.background = board[r][c];
                            cell.style.boxShadow = '0 0 8px ' + board[r][c];
                            cell.style.borderColor = board[r][c];
                        }
                    }
                }
            }

            if(current) {
                let ghostY = current.y;
                while(!collide(current, 0, ghostY - current.y + 1)) ghostY++;
                
                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = ghostY + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                if (cell) {
                                    cell.className = 'cell ghost';
                                    cell.style.color = current.color;
                                }
                            }
                        }
                    });
                });

                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = current.y + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                if (cell) {
                                    cell.className = 'cell block';
                                    cell.style.background = current.color;
                                    cell.style.boxShadow = '0 0 10px ' + current.color + ', inset 0 0 4px rgba(255,255,255,0.4)';
                                    cell.style.borderColor = current.color;
                                }
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
                div.className = 'mini-cell bg-slate-900 border border-slate-950/20';
                el.appendChild(div);
            }
            if(piece) {
                let startX = 1;
                let startY = 1;
                if (piece.type === 'I') { startX = 0; startY = 1; }
                else if (piece.type === 'O') { startX = 1; startY = 1; }
                
                piece.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const gridY = startY + r;
                            const gridX = startX + c;
                            if (gridY >= 0 && gridY < 4 && gridX >= 0 && gridX < 4) {
                                const idx = gridY*4 + gridX;
                                if (el.children[idx]) {
                                    el.children[idx].classList.add('active');
                                    el.children[idx].style.background = piece.color;
                                    el.children[idx].style.boxShadow = '0 0 8px ' + piece.color;
                                }
                            }
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

        // Merge piece into board
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
            for(let r=0; r<N; r++) {
                for(let c=0; c<M; c++) {
                    newShape[c][N-1-r] = shape[r][c];
                }
            }
            
            const kicks = [0, -1, 1, -2, 2];
            for (let dx of kicks) {
                if (!collide(current, dx, 0, newShape)) {
                    current.x += dx;
                    current.shape = newShape;
                    playSound('rotate');
                    return true;
                }
            }
            return false;
        }

        function clearLines() {
            let cleared = [];
            for(let r = ROWS - 1; r >= 0; r--) {
                if(board[r].every(cell => cell !== 0)) {
                    cleared.push(r);
                }
            }

            if(cleared.length > 0) {
                cleared.forEach(r => {
                    for(let c=0; c<COLS; c++) {
                        const cell = boardEl.children[r*COLS + c];
                        if (cell) cell.classList.add('clearing');
                    }
                });

                playSound('clear');

                setTimeout(() => {
                    cleared.forEach(r => {
                        board.splice(r, 1);
                        board.unshift(Array(COLS).fill(0));
                    });
                    
                    const points = [0, 100, 300, 500, 800];
                    score += points[cleared.length] * level;
                    lines += cleared.length;
                    level = Math.floor(lines / 10) + 1;
                    dropInterval = Math.max(80, 1000 - (level - 1) * 100);
                    
                    document.getElementById('score').textContent = score;
                    document.getElementById('lines').textContent = lines;
                    document.getElementById('level').textContent = level;
                    draw();
                }, 250);
            }
        }

        function drop(isSoft = false) {
            if(!collide(current, 0, 1)) {
                current.y++;
                if(isSoft) {
                    score += 1;
                    document.getElementById('score').textContent = score;
                }
            } else {
                lockPiece();
            }
        }

        function hardDrop() {
            let dropDist = 0;
            while(!collide(current, 0, 1)) { 
                current.y++; 
                dropDist++; 
            }
            score += dropDist * 2;
            document.getElementById('score').textContent = score;
            playSound('drop');
            lockPiece();
        }

        function lockPiece() {
            merge();
            clearLines();
            current = next;
            next = newPiece();
            if(collide(current, 0, 0)) {
                playSound('gameover');
                document.getElementById('final-score').textContent = score;
                document.getElementById('screen-gameover').classList.remove('hidden');
                gameActive = false;
            }
            draw();
        }

        function holdPiece() {
            if(!canHold) return;
            playSound('rotate');
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
            if(!gameActive || isPaused) return;
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

        function bindBtn(id, action) {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                if (gameActive && !isPaused) action();
            }, { passive: false });
            btn.addEventListener('click', e => {
                e.preventDefault();
                if (gameActive && !isPaused) action();
            });
        }

        bindBtn('btn-left', () => { if(!collide(current, -1, 0)) { current.x--; playSound('move'); draw(); } });
        bindBtn('btn-right', () => { if(!collide(current, 1, 0)) { current.x++; playSound('move'); draw(); } });
        bindBtn('btn-soft-drop', () => { drop(true); draw(); });
        bindBtn('btn-hard-drop', () => { hardDrop(); draw(); });
        bindBtn('btn-rotate', () => { rotate(); draw(); });
        bindBtn('btn-hold', () => { holdPiece(); draw(); });

        document.getElementById('btn-pause').addEventListener('click', () => {
            if (!gameActive) return;
            isPaused = true;
            document.getElementById('screen-pause').classList.remove('hidden');
        });
        document.getElementById('btn-resume').addEventListener('click', () => {
            isPaused = false;
            document.getElementById('screen-pause').classList.add('hidden');
            lastTime = performance.now();
            requestAnimationFrame(update);
        });

        function startGame() {
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
            } catch(e){}

            document.getElementById('screen-start').classList.add('hidden');
            document.getElementById('screen-gameover').classList.add('hidden');
            document.getElementById('screen-pause').classList.add('hidden');
            
            board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
            score = 0;
            lines = 0;
            level = 1;
            dropInterval = 1000;
            gameActive = true;
            isPaused = false;
            canHold = true;
            hold = null;
            
            document.getElementById('score').textContent = score;
            document.getElementById('lines').textContent = lines;
            document.getElementById('level').textContent = level;
            
            initBoard();
            current = newPiece();
            next = newPiece();
            draw();
            
            lastTime = performance.now();
            requestAnimationFrame(update);
        }

        document.getElementById('btn-start').addEventListener('click', startGame);
        document.getElementById('btn-restart').addEventListener('click', startGame);

        window.addEventListener('keydown', e => {
            if (!gameActive || isPaused) return;
            if (e.key === 'ArrowLeft') {
                if(!collide(current, -1, 0)) { current.x--; playSound('move'); draw(); }
            } else if (e.key === 'ArrowRight') {
                if(!collide(current, 1, 0)) { current.x++; playSound('move'); draw(); }
            } else if (e.key === 'ArrowDown') {
                drop(true); draw();
            } else if (e.key === 'ArrowUp') {
                rotate(); draw();
            } else if (e.key === ' ') {
                hardDrop(); draw();
            } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
                holdPiece(); draw();
            }
        });
    </script>
</body>
</html>
`
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
<html lang="es" x-data="agoraApp()">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Agora Marketplace</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
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
        body { font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; background-color: #e5e7eb; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .snap-x-mandatory { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
        [x-cloak] { display: none !important; }
        .card-shadow { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .toast-enter { opacity: 0; transform: translateY(20px); }
        .toast-enter-active { transition: all 0.3s ease; opacity: 1; transform: translateY(0); }
    </style>
</head>
<body class="flex justify-center text-zinc-900">

    <!-- Mobile Container -->
    <div class="relative w-full max-w-md h-screen bg-gray-50 shadow-2xl flex flex-col overflow-hidden">
        
        <!-- Header -->
        <header class="px-4 pt-4 pb-3 bg-white z-20 sticky top-0 border-b border-gray-100" x-show="activeTab !== 'product'">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-1 text-sm font-medium">
                    <svg class="w-4 h-4 text-agora-yellow" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                    <span class="text-zinc-500">Enviar a</span>
                    <span class="font-bold">Bogotá 110111</span>
                </div>
                <div class="relative">
                    <svg class="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                    <span x-show="cart.length > 0" class="absolute -top-1 -right-1 bg-agora-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" x-text="cart.length"></span>
                </div>
            </div>
            <div class="relative">
                <input type="text" placeholder="Buscar productos, marcas y más..." class="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-agora-yellow focus:bg-white transition-all">
                <svg class="w-5 h-5 text-zinc-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto pb-24 no-scrollbar bg-gray-50" x-show="activeTab !== 'product'">
            
            <!-- HOME TAB -->
            <div x-show="activeTab === 'home'" class="pt-4">
                <!-- Banners -->
                <div class="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory px-4 pb-2">
                    <div class="min-w-[85%] h-36 bg-gradient-to-r from-agora-yellow to-amber-400 rounded-2xl p-4 flex flex-col justify-center snap-start shadow-sm relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-24 h-24 bg-white/20 rounded-full -mr-8 -mt-8"></div>
                        <h3 class="font-extrabold text-xl text-zinc-900 z-10">Hasta 40% OFF</h3>
                        <p class="text-zinc-800 text-sm font-medium z-10 mb-2">En tecnología seleccionada</p>
                        <button class="bg-zinc-900 text-white text-xs font-bold py-1.5 px-4 rounded-lg w-fit z-10">Ver ofertas</button>
                    </div>
                    <div class="min-w-[85%] h-36 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-4 flex flex-col justify-center snap-start shadow-sm relative overflow-hidden">
                        <div class="absolute right-0 bottom-0 w-32 h-32 bg-agora-yellow/10 rounded-full -mr-10 -mb-10"></div>
                        <h3 class="font-extrabold text-xl text-white z-10">Mercado Envíos</h3>
                        <p class="text-zinc-300 text-sm font-medium z-10 mb-2">Envío gratis en tu primera compra</p>
                        <button class="bg-white text-zinc-900 text-xs font-bold py-1.5 px-4 rounded-lg w-fit z-10">Saber más</button>
                    </div>
                </div>

                <!-- Categories -->
                <div class="px-4 mt-6">
                    <div class="grid grid-cols-4 gap-2 text-center">
                        <div class="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform">
                            <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                <svg class="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                            </div>
                            <span class="text-[11px] font-medium text-zinc-600">Tecnología</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform">
                            <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                <svg class="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                            </div>
                            <span class="text-[11px] font-medium text-zinc-600">Hogar</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform">
                            <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                <svg class="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.099 3.75A9.66 9.66 0 0112 3c5.523 0 10 4.477 10 10 0 5.523-4.477 10-10 10-5.522 0-10-4.477-10-10 0-1.39.29-2.715.81-3.883a17.968 17.968 0 0111.535 11.535" /></svg>
                            </div>
                            <span class="text-[11px] font-medium text-zinc-600">Moda</span>
                        </div>
                        <div class="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform">
                            <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                <svg class="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-6m6 0V9.75m-6 9v-9m6 0V5.25c0-.621-.504-1.125-1.125-1.125H10.5c-.621 0-1.125.504-1.125 1.125V9.75" /></svg>
                            </div>
                            <span class="text-[11px] font-medium text-zinc-600">Vehículos</span>
                        </div>
                    </div>
                </div>

                <!-- Offers Grid -->
                <div class="px-4 mt-8">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-bold tracking-tight">Ofertas del día</h2>
                        <span class="text-agora-blue text-sm font-semibold flex items-center gap-1">
                            Ver todas
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <template x-for="(product, index) in products" :key="index">
                            <div @click="openProduct(product)" class="bg-white rounded-xl card-shadow border border-gray-100 overflow-hidden active:scale-[0.97] transition-transform cursor-pointer">
                                <div class="aspect-square bg-gray-100 relative">
                                    <img :src="product.img" :alt="product.name" class="w-full h-full object-cover" loading="lazy">
                                    <span class="absolute top-2 left-2 bg-agora-green text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">Envío Gratis</span>
                                </div>
                                <div class="p-2.5">
                                    <p class="text-lg font-extrabold text-zinc-900 leading-tight" x-text="formatPrice(product.price)"></p>
                                    <p class="text-[11px] text-zinc-500 line-through leading-tight" x-text="product.oldPrice"></p>
                                    <p class="text-[11px] text-agora-green font-bold leading-tight mb-1" x-text="product.discount + '% OFF'"></p>
                                    <p class="text-[11px] text-zinc-400 leading-tight">en 12x sin interés</p>
                                    <p class="text-xs text-zinc-700 mt-1 truncate font-medium" x-text="product.name"></p>
                                    <div class="flex items-center gap-0.5 mt-1">
                                        <svg class="w-3 h-3 text-agora-yellow" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <span class="text-[11px] font-semibold text-zinc-500" x-text="product.rating + ' (' + product.sales + ')'"></span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- CATEGORIES TAB -->
            <div x-show="activeTab === 'categories'" class="p-4">
                <h2 class="text-2xl font-extrabold mb-4 tracking-tight">Categorías</h2>
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
                    <button class="bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap active:scale-95 transition-transform">Todas</button>
                    <button @click="filterFreeShipping = !filterFreeShipping" :class="filterFreeShipping ? 'bg-agora-green text-white' : 'bg-white text-zinc-600 border border-gray-200'" class="text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap active:scale-95 transition-transform">Solo Envío Gratis</button>
                    <button @click="filterNew = !filterNew" :class="filterNew ? 'bg-agora-blue text-white' : 'bg-white text-zinc-600 border border-gray-200'" class="text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap active:scale-95 transition-transform">Solo Nuevos</button>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                            </div>
                            <span class="font-semibold text-sm">Tecnología</span>
                        </div>
                        <svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                            </div>
                            <span class="font-semibold text-sm">Hogar y Muebles</span>
                        </div>
                        <svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.099 3.75A9.66 9.66 0 0112 3c5.523 0 10 4.477 10 10 0 5.523-4.477 10-10 10-5.522 0-10-4.477-10-10 0-1.39.29-2.715.81-3.883a17.968 17.968 0 0111.535 11.535" /></svg>
                            </div>
                            <span class="font-semibold text-sm">Moda</span>
                        </div>
                        <svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            </div>

            <!-- SELL TAB -->
            <div x-show="activeTab === 'sell'" class="p-4">
                <h2 class="text-2xl font-extrabold mb-4 tracking-tight">Vender producto</h2>
                <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 bg-white">
                    <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg class="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    </div>
                    <p class="font-semibold text-sm">Arrastra o toca para subir fotos</p>
                    <p class="text-xs text-zinc-400 mt-1">Máximo 10 fotos. Formato JPG o PNG.</p>
                </div>
                <div class="space-y-4 bg-white p-4 rounded-xl border border-gray-100">
                    <div>
                        <label class="text-xs font-bold text-zinc-500 uppercase tracking-wide">Título</label>
                        <input type="text" placeholder="Ej: iPhone 13 128GB" class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-bold text-zinc-500 uppercase tracking-wide">Precio</label>
                            <input type="text" placeholder="$ 1,000,000" class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-zinc-500 uppercase tracking-wide">Condición</label>
                            <select class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-agora-yellow">
                                <option>Nuevo</option>
                                <option>Usado</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button @click="haptic(); showToast('Producto publicado con éxito')" class="w-full mt-6 bg-agora-yellow text-zinc-900 font-extrabold py-3.5 rounded-xl text-base shadow-md shadow-agora-yellow/40 active:scale-[0.98] transition-transform">Publicar</button>
            </div>

            <!-- CART TAB -->
            <div x-show="activeTab === 'cart'" class="p-4 pt-0">
                <h2 class="text-2xl font-extrabold mb-4 pt-4 tracking-tight">Mi Carrito (<span x-text="cart.length"></span>)</h2>
                <template x-if="cart.length === 0">
                    <div class="text-center py-24 flex flex-col items-center">
                        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                        </div>
                        <p class="text-zinc-500 mb-4 font-medium">Tu carrito está vacío</p>
                        <button @click="activeTab='home'" class="text-agora-blue font-bold bg-agora-blue/10 py-2 px-6 rounded-full text-sm">Explorar productos</button>
                    </div>
                </template>
                <div class="space-y-3">
                    <template x-for="(item, index) in cart" :key="index">
                        <div class="flex gap-3 bg-white p-3 rounded-xl border border-gray-100">
                            <img :src="item.img" class="w-20 h-20 rounded-lg object-cover" alt="">
                            <div class="flex-1 flex flex-col justify-center">
                                <p class="text-sm font-medium truncate" x-text="item.name"></p>
                                <p class="text-lg font-bold mt-1" x-text="formatPrice(item.price)"></p>
                                <button @click="cart.splice(index, 1)" class="text-xs text-zinc-400 font-semibold mt-1 flex items-center gap-1 w-fit">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- PROFILE TAB -->
            <div x-show="activeTab === 'profile'" class="p-4">
                <div class="flex flex-col items-center mb-6 mt-4">
                    <div class="w-24 h-24 bg-gradient-to-br from-agora-yellow to-amber-300 rounded-full flex items-center justify-center text-4xl font-extrabold text-zinc-900 mb-3 shadow-lg shadow-agora-yellow/30 border-4 border-white">J</div>
                    <h2 class="text-xl font-bold">Juan Pérez</h2>
                    <p class="text-sm text-agora-green font-semibold flex items-center gap-1 mt-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1l2.928 5.934 6.55.95-4.739 4.62L15.856 19 10 15.934 4.144 19l1.117-5.496L.522 7.884l6.55-.95L10 1z" clip-rule="evenodd"></path></svg>
                        Comprador Oro
                    </p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform border border-gray-100 shadow-sm">
                        <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg class="w-6 h-6 text-agora-blue" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                        </div>
                        <span class="font-semibold text-sm text-zinc-700">Mis Compras</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform border border-gray-100 shadow-sm">
                        <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                        </div>
                        <span class="font-semibold text-sm text-zinc-700">Favoritos</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform border border-gray-100 shadow-sm">
                        <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg class="w-6 h-6 text-agora-green" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                        </div>
                        <span class="font-semibold text-sm text-zinc-700">Mensajes</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl text-center cursor-pointer active:scale-95 transition-transform border border-gray-100 shadow-sm">
                        <div class="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg class="w-6 h-6 text-agora-yellow" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <span class="font-semibold text-sm text-zinc-700">Ajustes</span>
                    </div>
                </div>
            </div>

        </main>

        <!-- Product Detail Overlay -->
        <div x-show="activeTab === 'product'" x-transition.opacity class="absolute inset-0 bg-white z-30 flex flex-col overflow-y-auto no-scrollbar" x-cloak>
            <div class="relative bg-gray-100">
                <img :src="selectedProduct.img" class="w-full h-96 object-cover" alt="Product">
                <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    <span class="w-1.5 h-1.5 bg-zinc-900/50 rounded-full"></span>
                    <span class="w-1.5 h-1.5 bg-zinc-900/20 rounded-full"></span>
                    <span class="w-1.5 h-1.5 bg-zinc-900/20 rounded-full"></span>
                </div>
                <button @click="activeTab='home'" class="absolute top-4 left-4 bg-white p-2 rounded-full shadow-md active:scale-90 transition-transform">
                    <svg class="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button @click="haptic(); showToast('Agregado a Favoritos')" class="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md active:scale-90 transition-transform">
                    <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                </button>
            </div>
            <div class="p-4 flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <p class="text-sm text-zinc-400 line-through" x-text="selectedProduct.oldPrice"></p>
                    <p class="text-sm text-agora-green font-bold" x-text="selectedProduct.discount + '% OFF'"></p>
                </div>
                <h1 class="text-xl font-bold mb-2 text-zinc-800 leading-snug" x-text="selectedProduct.name"></h1>
                <p class="text-3xl font-extrabold text-zinc-900 mb-1" x-text="formatPrice(selectedProduct.price)"></p>
                <p class="text-sm text-zinc-500 mb-4">en 12x <span class="font-semibold" x-text="formatPrice(Math.round(selectedProduct.price / 12))"></span> sin interés</p>
                
                <div class="flex items-center gap-2 mb-4 bg-agora-green/10 text-agora-green p-3 rounded-xl border border-agora-green/20">
                    <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                    <div>
                        <p class="font-bold text-sm">Llega gratis mañana</p>
                        <p class="text-xs text-agora-green/80">Comprando antes de las 4pm</p>
                    </div>
                </div>

                <div class="border-t border-gray-100 py-4 mb-4">
                    <h3 class="font-bold text-zinc-800 mb-2">Características principales</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between border-b border-gray-50 pb-2">
                            <span class="text-zinc-500">Condición</span>
                            <span class="font-medium">Nuevo</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-50 pb-2">
                            <span class="text-zinc-500">Garantía</span>
                            <span class="font-medium">3 meses</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-50 pb-2">
                            <span class="text-zinc-500">Marca</span>
                            <span class="font-medium">Apple</span>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-100 py-4 mb-4">
                    <h3 class="font-bold text-zinc-800 mb-2">Descripción</h3>
                    <p class="text-sm text-zinc-600 leading-relaxed">Producto en excelente estado. Incluye caja original y todos sus accesorios. Sujeto a disponibilidad. Para más información no dudes en contactar al vendedor.</p>
                </div>

                <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-xl mb-4">
                    <div class="w-12 h-12 bg-agora-blue rounded-full flex items-center justify-center text-white font-bold text-lg">T</div>
                    <div class="flex-1">
                        <p class="font-bold text-sm">TechStore Oficial</p>
                        <p class="text-xs text-agora-green flex items-center gap-1 font-medium">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Mercado Líder Platinum
                        </p>
                    </div>
                    <button class="text-agora-blue text-xs font-bold border border-agora-blue/20 py-1.5 px-3 rounded-full">Ver tienda</button>
                </div>
            </div>

            <!-- Sticky Bottom Actions -->
            <div class="sticky bottom-0 bg-white p-4 border-t border-gray-100 flex gap-3 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <button @click="addToCart(selectedProduct); showToast('Agregado al carrito')" class="flex-1 border-2 border-zinc-900 text-zinc-900 font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                </button>
                <button @click="addToCart(selectedProduct); activeTab='cart'" class="flex-[2] bg-agora-yellow text-zinc-900 font-extrabold py-3 rounded-xl shadow-md shadow-agora-yellow/40 active:scale-95 transition-transform">Comprar ahora</button>
            </div>
        </div>

        <!-- Toast Notification -->
        <div x-show="toastVisible" x-transition:enter="toast-enter" x-transition:enter-end="toast-enter-active" x-transition:leave="transition ease-in duration-200" x-transition:leave-end="opacity-0" class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg z-50 flex items-center gap-2" x-cloak>
            <svg class="w-5 h-5 text-agora-green" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span x-text="toastMessage"></span>
        </div>

        <!-- Bottom Navigation -->
        <nav x-show="activeTab !== 'product'" class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-20 pb-safe">
            <button @click="activeTab='home'" :class="activeTab === 'home' ? 'text-agora-blue' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                <span class="text-[10px] font-semibold">Inicio</span>
            </button>
            <button @click="activeTab='categories'" :class="activeTab === 'categories' ? 'text-agora-blue' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                <span class="text-[10px] font-semibold">Categorías</span>
            </button>
            <button @click="activeTab='sell'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform">
                <div class="w-10 h-10 bg-agora-yellow rounded-xl flex items-center justify-center shadow-md shadow-agora-yellow/40 -mt-6 border-4 border-white">
                    <svg class="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <span class="text-[10px] font-semibold text-agora-blue mt-1">Vender</span>
            </button>
            <button @click="activeTab='cart'" :class="activeTab === 'cart' ? 'text-agora-blue' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform relative">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                <span x-show="cart.length > 0" class="absolute top-1 right-6 bg-agora-blue text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center" x-text="cart.length"></span>
                <span class="text-[10px] font-semibold">Carrito</span>
            </button>
            <button @click="activeTab='profile'" :class="activeTab === 'profile' ? 'text-agora-blue' : 'text-zinc-400'" class="flex flex-col items-center justify-center gap-0.5 w-full h-full active:scale-90 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span class="text-[10px] font-semibold">Perfil</span>
            </button>
        </nav>

    </div>

    <script>
        function agoraApp() {
            return {
                activeTab: 'home',
                filterFreeShipping: false,
                filterNew: false,
                cart: [],
                selectedProduct: {},
                toastVisible: false,
                toastMessage: '',
                toastTimer: null,
                
                haptic() {
                    if (navigator.vibrate) navigator.vibrate(10);
                },
                showToast(message) {
                    this.toastMessage = message;
                    this.toastVisible = true;
                    clearTimeout(this.toastTimer);
                    this.toastTimer = setTimeout(() => {
                        this.toastVisible = false;
                    }, 2000);
                },
                formatPrice(num) {
                    if (!num) return '';
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
                products: [
                    { name: 'iPhone 13 128GB', price: 2400000, oldPrice: '$3.000.000', discount: 20, rating: 4.9, sales: '1.2k', img: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80' },
                    { name: 'Audífonos Sony WH-1000', price: 890000, oldPrice: '$1.200.000', discount: 25, rating: 4.8, sales: '850', img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80' },
                    { name: 'Apple Watch Series 8', price: 1590000, oldPrice: '$1.900.000', discount: 15, rating: 4.7, sales: '530', img: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500&q=80' },
                    { name: 'Cámara GoPro Hero 11', price: 1750000, oldPrice: '$2.100.000', discount: 16, rating: 4.9, sales: '320', img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&q=80' },
                    { name: 'MacBook Air M2 13"', price: 4990000, oldPrice: '$5.800.000', discount: 14, rating: 5.0, sales: '120', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' },
                    { name: 'Silla Gamer Reclinable', price: 650000, oldPrice: '$950.000', discount: 31, rating: 4.6, sales: '2.1k', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=80' }
                ]
            }
        }
    </script>
</body>
</html>
`
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
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clarity Invest - Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        if (window.self !== window.top) {
            document.documentElement.classList.add('in-iframe');
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --gain-green: #10B981;
            --loss-red: #F43F5E;
            --accent-blue: #3B82F6;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #000000; /* Fondo fuera del teléfono */
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            transition: background-color 0.3s ease;
        }

        .phone-frame {
            width: 100%;
            max-width: 390px;
            height: 95vh;
            max-height: 844px;
            border-radius: 40px;
            border: 8px solid #1a1a1a;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            background-color: #F8FAFC; /* MODO CLARO POR DEFECTO */
        }

        .dark .phone-frame {
            background-color: #0F172A; /* MODO OSCURO */
        }

        /* Scrollbar Oculto */
        .content-scroll::-webkit-scrollbar { display: none; }
        .content-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* Animaciones */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .stagger-1 { animation: slideUp 0.4s ease-out 0.1s backwards; }
        .stagger-2 { animation: slideUp 0.4s ease-out 0.2s backwards; }
        .stagger-3 { animation: slideUp 0.4s ease-out 0.3s backwards; }
        .stagger-4 { animation: slideUp 0.4s ease-out 0.4s backwards; }
        
        .screen { display: none; animation: fadeIn 0.3s ease-out; }
        .screen.active { display: flex; flex-direction: column; flex: 1; }

        /* Glassmorphism Nav */
        .glass-nav {
            background: rgba(248, 250, 252, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(51, 65, 85, 0.5);
        }

        /* Componentes de UI */
        .card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .dark .card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(51, 65, 85, 0.5);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        .bottom-sheet {
            transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .bottom-sheet.hidden-sheet {
            transform: translateY(100%);
        }

        /* Adaptabilidad dentro de iframes (previsualizador de la plataforma) */
        .in-iframe body {
            background-color: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh !important;
            min-height: 100vh !important;
            display: block !important;
        }
        .in-iframe .phone-frame {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
        }
    </style>
</head>
<body>

    <div class="phone-frame">
        <!-- Status Bar Falso -->
        <div class="flex justify-between items-center px-8 pt-3 pb-1 text-sm font-semibold z-50 text-slate-900 dark:text-white">
            <span>9:41</span>
            <div class="flex items-center gap-1">
                <i data-lucide="signal" class="w-4 h-4"></i>
                <i data-lucide="wifi" class="w-4 h-4"></i>
                <i data-lucide="battery-full" class="w-6 h-6"></i>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- PANTALLA 1: INICIO (DASHBOARD)             -->
        <!-- ========================================== -->
        <div id="screen-home" class="screen active flex-1 overflow-y-auto content-scroll pb-24">
            <!-- Header -->
            <header class="flex justify-between items-center px-6 pt-4 pb-2 stagger-1">
                <div>
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Buenos días</p>
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Carlos Méndez</h1>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Theme Toggle -->
                    <button onclick="toggleTheme()" class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                        <i data-lucide="moon" class="w-5 h-5 dark:hidden"></i>
                        <i data-lucide="sun" class="w-5 h-5 hidden dark:block"></i>
                    </button>
                    <div class="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                        <span class="font-bold text-slate-600 dark:text-slate-300">CM</span>
                    </div>
                </div>
            </header>

            <!-- Hero Balance Card -->
            <section class="px-6 mt-4 stagger-2">
                <div class="card rounded-3xl p-6">
                    <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Valor total del portafolio</p>
                    <h2 class="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">$154,320.50</h2>
                    <div class="flex items-center gap-2 mb-6">
                        <div class="flex items-center gap-1 bg-emerald-500/15 px-2 py-1 rounded-lg">
                            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-500"></i>
                            <span class="text-emerald-500 text-sm font-bold">+0.81%</span>
                        </div>
                        <span class="text-slate-500 dark:text-slate-400 text-sm">+$1,240.00 hoy</span>
                    </div>

                    <!-- Gráfico SVG Premium -->
                    <div class="relative h-40 w-full mb-4">
                        <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:0.4" />
                                    <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,80 C30,70 50,85 80,60 C110,35 140,50 170,40 C200,30 230,10 300,20 L300,100 L0,100 Z" fill="url(#grad)" />
                            <path d="M0,80 C30,70 50,85 80,60 C110,35 140,50 170,40 C200,30 230,10 300,20" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            <circle cx="300" cy="20" r="4" fill="#3B82F6" />
                            <circle cx="300" cy="20" r="8" fill="#3B82F6" opacity="0.3" />
                        </svg>
                    </div>

                    <!-- Time Toggles -->
                    <div class="flex justify-between bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1">
                        <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">1D</button>
                        <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">7D</button>
                        <button class="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-lg transition-transform active:scale-95">1M</button>
                        <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">3M</button>
                        <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">1A</button>
                        <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">MAX</button>
                    </div>
                </div>
            </section>

            <!-- Quick Actions -->
            <section class="px-6 mt-6 grid grid-cols-4 gap-4 stagger-3">
                <button class="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <i data-lucide="arrow-down-left" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Depositar</span>
                </button>
                <button class="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <i data-lucide="arrow-up-right" class="w-5 h-5 text-slate-600 dark:text-slate-300"></i>
                    </div>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Retirar</span>
                </button>
                <button class="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <i data-lucide="swap" class="w-5 h-5 text-slate-600 dark:text-slate-300"></i>
                    </div>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Transferir</span>
                </button>
                <button class="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <i data-lucide="scan-line" class="w-5 h-5 text-slate-600 dark:text-slate-300"></i>
                    </div>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Escanear</span>
                </button>
            </section>

            <!-- Portfolio Allocation (Donut Chart) -->
            <section class="px-6 mt-8 stagger-4">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-3">Distribución</h3>
                <div class="card rounded-2xl p-5 flex items-center gap-6">
                    <div class="relative w-24 h-24 flex-shrink-0">
                        <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.91549" fill="none" stroke="#E2E8F0" stroke-width="4" class="dark:stroke-slate-700"></circle>
                            <circle cx="18" cy="18" r="15.91549" fill="none" stroke="#3B82F6" stroke-width="4" stroke-dasharray="60 40" stroke-dashoffset="0" stroke-linecap="round"></circle>
                            <circle cx="18" cy="18" r="15.91549" fill="none" stroke="#10B981" stroke-width="4" stroke-dasharray="30 70" stroke-dashoffset="-60" stroke-linecap="round"></circle>
                            <circle cx="18" cy="18" r="15.91549" fill="none" stroke="#F43F5E" stroke-width="4" stroke-dasharray="10 90" stroke-dashoffset="-90" stroke-linecap="round"></circle>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center flex-col">
                            <span class="text-xs text-slate-500 dark:text-slate-400">Total</span>
                            <span class="text-sm font-bold text-slate-900 dark:text-white">$154K</span>
                        </div>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-600"></div><span class="text-sm text-slate-600 dark:text-slate-300">Acciones</span></div>
                            <span class="text-sm font-bold text-slate-900 dark:text-white">60%</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-emerald-500"></div><span class="text-sm text-slate-600 dark:text-slate-300">ETFs</span></div>
                            <span class="text-sm font-bold text-slate-900 dark:text-white">30%</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-rose-500"></div><span class="text-sm text-slate-600 dark:text-slate-300">Efectivo</span></div>
                            <span class="text-sm font-bold text-slate-900 dark:text-white">10%</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Market Indices -->
            <section class="mt-8 stagger-4">
                <div class="flex justify-between items-center px-6 mb-3">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">Mercados Hoy</h3>
                    <button class="text-blue-600 dark:text-blue-400 text-sm font-semibold">Ver todo</button>
                </div>
                <div class="flex gap-3 overflow-x-auto content-scroll px-6 pb-2">
                    <div class="min-w-[160px] card p-4 rounded-2xl">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">S&P 500</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">+0.54%</span>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">5,150.42</h4>
                        <svg viewBox="0 0 100 30" class="w-full h-8"><path d="M0,20 Q25,25 50,15 T100,5" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" /></svg>
                    </div>
                    <div class="min-w-[160px] card p-4 rounded-2xl">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Nasdaq</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">+0.72%</span>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">16,103.1</h4>
                        <svg viewBox="0 0 100 30" class="w-full h-8"><path d="M0,25 Q20,20 40,22 T100,2" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" /></svg>
                    </div>
                    <div class="min-w-[160px] card p-4 rounded-2xl">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Merval</span>
                            <span class="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">-0.23%</span>
                        </div>
                        <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">1,432K</h4>
                        <svg viewBox="0 0 100 30" class="w-full h-8"><path d="M0,5 Q30,15 50,10 T100,25" fill="none" stroke="#F43F5E" stroke-width="2" stroke-linecap="round" /></svg>
                    </div>
                </div>
            </section>
        </div>

        <!-- ========================================== -->
        <!-- PANTALLA 2: EXPLORAR (MERCADO)             -->
        <!-- ========================================== -->
        <div id="screen-explore" class="screen flex-1 overflow-y-auto content-scroll pb-24">
            <header class="px-6 pt-4 pb-4 stagger-1">
                <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Explorar</h1>
                <div class="relative">
                    <i data-lucide="search" class="w-5 h-5 absolute left-4 top-3.5 text-slate-400"></i>
                    <input type="text" placeholder="Buscar acciones, ETFs, fondos..." class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </header>

            <!-- Tabs de Categoría -->
            <div class="flex gap-2 px-6 mb-4 overflow-x-auto content-scroll">
                <button class="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full whitespace-nowrap">Todo</button>
                <button class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-full whitespace-nowrap">Acciones</button>
                <button class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-full whitespace-nowrap">ETFs</button>
                <button class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-full whitespace-nowrap">Fondos</button>
                <button class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-full whitespace-nowrap">Índices</button>
            </div>

            <!-- Lista de Activos -->
            <div class="px-6 space-y-2 stagger-2">
                <div onclick="openAssetDetail('Apple Inc.', 'AAPL', '$172.40', '+1.20%', true)" class="flex items-center justify-between p-3 card rounded-2xl active:scale-98 transition-transform cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white text-sm">A</div>
                        <div>
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Apple Inc.</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400">NASDAQ: AAPL</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <svg viewBox="0 0 50 20" class="w-12 h-5"><path d="M0,15 Q10,5 25,10 T50,2" fill="none" stroke="#10B981" stroke-width="1.5" /></svg>
                        <div class="text-right">
                            <p class="font-bold text-slate-900 dark:text-white text-sm">$172.40</p>
                            <p class="text-xs font-bold text-emerald-500">+1.20%</p>
                        </div>
                    </div>
                </div>
                <div onclick="openAssetDetail('Microsoft', 'MSFT', '$408.59', '+0.80%', true)" class="flex items-center justify-between p-3 card rounded-2xl active:scale-98 transition-transform cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white text-sm">M</div>
                        <div>
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Microsoft Corp.</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400">NASDAQ: MSFT</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <svg viewBox="0 0 50 20" class="w-12 h-5"><path d="M0,10 Q15,15 25,8 T50,5" fill="none" stroke="#10B981" stroke-width="1.5" /></svg>
                        <div class="text-right">
                            <p class="font-bold text-slate-900 dark:text-white text-sm">$408.59</p>
                            <p class="text-xs font-bold text-emerald-500">+0.80%</p>
                        </div>
                    </div>
                </div>
                <div onclick="openAssetDetail('Tesla', 'TSLA', '$178.22', '-1.50%', false)" class="flex items-center justify-between p-3 card rounded-2xl active:scale-98 transition-transform cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white text-sm">T</div>
                        <div>
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Tesla Inc.</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400">NASDAQ: TSLA</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <svg viewBox="0 0 50 20" class="w-12 h-5"><path d="M0,5 Q10,15 25,12 T50,18" fill="none" stroke="#F43F5E" stroke-width="1.5" /></svg>
                        <div class="text-right">
                            <p class="font-bold text-slate-900 dark:text-white text-sm">$178.22</p>
                            <p class="text-xs font-bold text-rose-500">-1.50%</p>
                        </div>
                    </div>
                </div>
                <div onclick="openAssetDetail('S&P 500 ETF', 'VOO', '$465.80', '+0.40%', true)" class="flex items-center justify-between p-3 card rounded-2xl active:scale-98 transition-transform cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white text-sm">V</div>
                        <div>
                            <h4 class="font-bold text-slate-900 dark:text-white text-sm">S&P 500 ETF</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400">NYSE: VOO</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <svg viewBox="0 0 50 20" class="w-12 h-5"><path d="M0,15 Q20,10 30,8 T50,4" fill="none" stroke="#10B981" stroke-width="1.5" /></svg>
                        <div class="text-right">
                            <p class="font-bold text-slate-900 dark:text-white text-sm">$465.80</p>
                            <p class="text-xs font-bold text-emerald-500">+0.40%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- PANTALLA 3: DETALLE DE ACTIVO (INVERTIR)   -->
        <!-- ========================================== -->
        <div id="screen-detail" class="screen flex-1 overflow-y-auto content-scroll pb-24">
            <header class="flex items-center justify-between px-6 pt-4 pb-2">
                <button onclick="changeScreen('explore')" class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <div class="text-center">
                    <h2 id="detail-name" class="font-bold text-slate-900 dark:text-white">Apple Inc.</h2>
                    <p id="detail-ticker" class="text-xs text-slate-500 dark:text-slate-400">NASDAQ: AAPL</p>
                </div>
                <button class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <i data-lucide="star" class="w-5 h-5"></i>
                </button>
            </header>

            <section class="px-6 mt-4">
                <div class="flex items-end gap-2 mb-1">
                    <h2 id="detail-price" class="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">$172.40</h2>
                    <span id="detail-change" class="text-lg font-bold text-emerald-500 mb-1">+1.20%</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Cierre anterior: $170.35</p>

                <!-- Gráfico de Velas Japonesas (Simulado) -->
                <div class="relative h-48 w-full mb-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2">
                    <svg viewBox="0 0 300 150" class="w-full h-full overflow-visible">
                        <line x1="0" y1="30" x2="300" y2="30" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4" class="dark:stroke-slate-700"></line>
                        <line x1="0" y1="75" x2="300" y2="75" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4" class="dark:stroke-slate-700"></line>
                        <line x1="0" y1="120" x2="300" y2="120" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4" class="dark:stroke-slate-700"></line>
                        
                        <g stroke="#10B981" fill="#10B981">
                            <line x1="20" y1="90" x2="20" y2="110" stroke-width="2" /><rect x="15" y="95" width="10" height="10" />
                            <line x1="50" y1="80" x2="50" y2="105" stroke-width="2" /><rect x="45" y="85" width="10" height="15" />
                            <line x1="80" y1="70" x2="80" y2="95" stroke-width="2" /><rect x="75" y="75" width="10" height="15" />
                            <line x1="140" y1="50" x2="140" y2="80" stroke-width="2" /><rect x="135" y="55" width="10" height="20" />
                            <line x1="170" y1="40" x2="170" y2="65" stroke-width="2" /><rect x="165" y="45" width="10" height="15" />
                            <line x1="200" y1="30" x2="200" y2="55" stroke-width="2" /><rect x="195" y="35" width="10" height="15" />
                            <line x1="260" y1="20" x2="260" y2="45" stroke-width="2" /><rect x="255" y="25" width="10" height="15" />
                        </g>
                        <g stroke="#F43F5E" fill="#F43F5E">
                            <line x1="110" y1="60" x2="110" y2="90" stroke-width="2" /><rect x="105" y="65" width="10" height="20" />
                            <line x1="230" y1="25" x2="230" y2="50" stroke-width="2" /><rect x="225" y="30" width="10" height="15" />
                        </g>
                    </svg>
                </div>

                <!-- Time Toggles -->
                <div class="flex justify-between bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
                    <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg">1D</button>
                    <button class="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg">1S</button>
                    <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg">1M</button>
                    <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg">3M</button>
                    <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg">1A</button>
                    <button class="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 rounded-lg">MAX</button>
                </div>

                <!-- Fundamentales -->
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-3">Fundamentales</h3>
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="card p-4 rounded-2xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Cap. de Mercado</p>
                        <p class="text-base font-bold text-slate-900 dark:text-white">2.68T</p>
                    </div>
                    <div class="card p-4 rounded-2xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Ratio P/E</p>
                        <p class="text-base font-bold text-slate-900 dark:text-white">28.45</p>
                    </div>
                    <div class="card p-4 rounded-2xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Dividendo</p>
                        <p class="text-base font-bold text-slate-900 dark:text-white">0.52%</p>
                    </div>
                    <div class="card p-4 rounded-2xl">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Volumen</p>
                        <p class="text-base font-bold text-slate-900 dark:text-white">54.2M</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- ========================================== -->
        <!-- NAVEGACIÓN INFERIOR                         -->
        <!-- ========================================== -->
        <nav class="glass-nav absolute bottom-0 w-full px-6 py-3 flex justify-between items-center z-40">
            <button onclick="changeScreen('home')" id="nav-home" class="flex flex-col items-center gap-1 w-16 transition-colors">
                <i data-lucide="home" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400">Inicio</span>
            </button>
            <button onclick="changeScreen('explore')" id="nav-explore" class="flex flex-col items-center gap-1 w-16 transition-colors">
                <i data-lucide="compass" class="w-6 h-6 text-slate-400"></i>
                <span class="text-[10px] font-medium text-slate-400">Explorar</span>
            </button>
            <button id="nav-portfolio" class="flex flex-col items-center gap-1 w-16 transition-colors">
                <i data-lucide="briefcase" class="w-6 h-6 text-slate-400"></i>
                <span class="text-[10px] font-medium text-slate-400">Portafolio</span>
            </button>
            <button onclick="openBuySheet()" id="nav-invest" class="flex flex-col items-center gap-1 w-16 transition-colors">
                <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center -mt-3 shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">
                    <i data-lucide="plus" class="w-6 h-6 text-white"></i>
                </div>
            </button>
            <button id="nav-profile" class="flex flex-col items-center gap-1 w-16 transition-colors">
                <i data-lucide="user" class="w-6 h-6 text-slate-400"></i>
                <span class="text-[10px] font-medium text-slate-400">Perfil</span>
            </button>
        </nav>

        <!-- ========================================== -->
        <!-- MODAL: FLUJO DE COMPRA (BOTTOM SHEET)      -->
        <!-- ========================================== -->
        <div id="overlay" class="absolute inset-0 bg-black/50 z-50 hidden" onclick="closeBuySheet()"></div>
        <div id="buy-sheet" class="bottom-sheet absolute bottom-0 w-full z-50 rounded-t-3xl bg-white dark:bg-slate-800 p-6 hidden-sheet max-h-[80%] overflow-y-auto content-scroll">
            <div class="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-6"></div>
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Comprar AAPL</h3>
                <button onclick="closeBuySheet()" class="p-2 rounded-full bg-slate-100 dark:bg-slate-700"><i data-lucide="x" class="w-5 h-5 text-slate-900 dark:text-white"></i></button>
            </div>

            <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">Cantidad a invertir</p>
            <div class="relative mb-4">
                <span class="absolute left-4 top-3.5 text-2xl font-bold text-slate-400">$</span>
                <input type="number" value="1000" class="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="flex gap-2 mb-6">
                <button class="flex-1 py-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold rounded-xl">$100</button>
                <button class="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl">$1,000</button>
                <button class="flex-1 py-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold rounded-xl">$5,000</button>
                <button class="flex-1 py-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold rounded-xl">Max</button>
            </div>

            <div class="space-y-2 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500 dark:text-slate-400">Precio estimado</span>
                    <span class="font-semibold text-slate-900 dark:text-white">$172.40</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500 dark:text-slate-400">Acciones a recibir</span>
                    <span class="font-semibold text-slate-900 dark:text-white">5.794</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500 dark:text-slate-400">Comisión</span>
                    <span class="font-semibold text-emerald-500">$0.00</span>
                </div>
            </div>

            <button onclick="confirmPurchase()" class="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-98 transition-transform flex items-center justify-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                Confirmar Compra
            </button>
        </div>

        <!-- Modal de Éxito -->
        <div id="success-modal" class="absolute inset-0 z-[60] bg-black/70 hidden flex items-center justify-center">
            <div class="bg-white dark:bg-slate-800 w-3/4 p-8 rounded-3xl flex flex-col items-center gap-4" style="animation: scaleIn 0.3s ease-out;">
                <div class="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                    <i data-lucide="check" class="w-10 h-10 text-white" stroke-width="3"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white text-center">¡Compra Exitosa!</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 text-center">Has añadido 5.79 acciones de AAPL a tu portafolio.</p>
                <button onclick="closeSuccess()" class="mt-4 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl">Listo</button>
            </div>
        </div>

    </div>

    <script>
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
};

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
            <span className="text-slate-500 font-bold">Caso de Uso</span>
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
