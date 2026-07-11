import { notFound } from "next/navigation";
import { Sparkles, Brain, Clock, ShieldCheck, ArrowRight, ExternalLink, Globe, Building, Bot, Bell, Folder, BookOpen, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { UseCasePreview } from "@/components/chat/use-case-preview";

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
  demoCode?: string;
}

const USE_CASE_MAP: Record<string, UseCaseData> = {
  "auditoria-corporativa": {
    title: "Ejemplo de Uso: Auditoría de Inversiones con Agentes IA",
    brand: "Ejemplo de Uso: Auditoría",
    desc: "Guía ilustrativa sobre cómo un analista de inversiones puede auditar transacciones financieras en tiempo real utilizando agentes autónomos.",
    gradient: "from-blue-600 to-indigo-700",
    challenge: "En este flujo de ejemplo, un analista financiero debe recopilar de forma manual informes regulatorios y balances de múltiples fuentes. Este proceso manual puede tomar decenas de horas y aumenta el riesgo de omitir detalles clave o verse afectado por sesgos informativos.",
    solution: "Al usar esta plataforma, el analista puede delegar el análisis a una red de agentes de IA especializados. Los agentes recopilan datos financieros históricos, verifican la coherencia de los comunicados oficiales y presentan un reporte consolidado libre de sesgos en minutos.",
    products: ["Asistente de IA (Maverlang AI)", "Análisis de Portafolio", "Feed de Noticias", "Maverlang 2.5 Pro"],
    region: "Global (Ejemplo)",
    industry: "Auditoría de Inversiones (Ejemplo)",
    quote: "Este ejemplo ilustra cómo la automatización del análisis financiero permite centrarse en la estrategia final de inversión en lugar de perder tiempo en la recopilación manual de datos.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Gestor de Inversiones",
    metrics: [
      { value: "-85%", label: "Tiempo de investigación", sublabel: "Reducción estimada del esfuerzo de análisis" },
      { value: "100%", label: "Fuentes analizadas", sublabel: "Validación y cruce de datos automático" },
      { value: "0%", label: "Sesgo de información", sublabel: "Análisis completamente objetivo" }
    ]
  },
  "deteccion-de-sesgos": {
    title: "Ejemplo de Uso: Detección y Análisis de Sesgos de Prensa",
    brand: "Ejemplo de Uso: Análisis de Prensa",
    desc: "Guía ilustrativa sobre cómo identificar y filtrar noticias macroeconómicas con sesgo mediático o clickbait.",
    gradient: "from-emerald-500 to-teal-600",
    challenge: "En este caso de ejemplo, un profesional del mercado de divisas se enfrenta a un volumen masivo de noticias contradictorias, rumores y clickbait que pueden inducir a errores en la toma de decisiones por volatilidad artificial.",
    solution: "Al implementar el Feed de Noticias inteligente, cada artículo es analizado automáticamente por agentes de IA que determinan el nivel de objetividad, identifican sesgos políticos o corporativos y cruzan la información con otras fuentes verificadas.",
    products: ["Feed de Noticias", "Alertas de Precio", "Maverlang 2.5 Flash"],
    region: "Global (Ejemplo)",
    industry: "Análisis de Medios Financieros (Ejemplo)",
    quote: "Este ejemplo demuestra la capacidad de procesar y puntuar la neutralidad de miles de noticias financieras en milisegundos para operar con información limpia.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Operador de Divisas",
    metrics: [
      { value: "99.8%", label: "Detección de Sesgo", sublabel: "Efectividad en el filtrado de desinformación" },
      { value: "< 50ms", label: "Tiempo de Análisis", sublabel: "Latencia del procesamiento del feed" },
      { value: "14+", label: "Fuentes Cruzadas", sublabel: "Promedio de verificación por artículo" }
    ]
  },
  "seguimiento-automatizado": {
    title: "Ejemplo de Uso: Monitoreo Automatizado de Portafolios",
    brand: "Ejemplo de Uso: Portafolio",
    desc: "Guía ilustrativa sobre cómo configurar alertas inteligentes y recibir reportes automáticos sobre los activos en tu cartera.",
    gradient: "from-indigo-600 to-purple-500",
    challenge: "En este escenario de ejemplo, un inversor particular o asesor patrimonial necesita estar al tanto de cualquier evento económico o geopolítico que afecte directamente a los activos de su portafolio sin tener que revisar la prensa 24/7.",
    solution: "Al vincular la cartera de activos con la plataforma, el sistema monitorea noticias mundiales y variaciones de mercado continuamente. Si ocurre un suceso de impacto para algún activo de la lista, Maverlang AI envía un análisis de impacto instantáneo.",
    products: ["Análisis de Portafolio", "Alertas de Precio", "Asistente de IA (Maverlang AI)", "Maverlang 2.5 Flash"],
    region: "Global (Ejemplo)",
    industry: "Gestión de Portafolios (Ejemplo)",
    quote: "Este ejemplo enseña cómo la monitorización inteligente en segundo plano mantiene al inversor informado ante movimientos macroeconómicos imprevistos.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Asesor Financiero",
    metrics: [
      { value: "24/7", label: "Monitoreo Inteligente", sublabel: "Búsqueda y análisis en tiempo real" },
      { value: "0s", label: "Tiempo de Alerta", sublabel: "Notificaciones instantáneas de eventos" },
      { value: "25+", label: "Activos en Seguimiento", sublabel: "Capacidad de escala en carteras" }
    ]
  },
  "prediccion-banco-central": {
    title: "Ejemplo de Uso: Modelado de Tendencias de Bancos Centrales",
    brand: "Ejemplo de Uso: Predicción",
    desc: "Guía ilustrativa de cómo utilizar debates entre agentes de IA para evaluar la probabilidad de cambios en políticas monetarias.",
    gradient: "from-rose-500 to-orange-500",
    challenge: "En este ejemplo, se analiza la dificultad de correlacionar decenas de discursos oficiales, comunicados de prensa de bancos centrales e indicadores de inflación para prever decisiones de tipos de interés.",
    solution: "Se simula una mesa de debate donde múltiples agentes de IA analizan las minutas y declaraciones históricas del banco central. Los agentes evalúan la polaridad (hawkish/dovish) y asignan probabilidades estadísticas a las decisiones de tasas.",
    products: ["Asistente de IA (Maverlang AI)", "Feed de Noticias", "Maverlang 2.5 Pro"],
    region: "Global (Ejemplo)",
    industry: "Análisis Macroeconómico (Ejemplo)",
    quote: "Esta guía de ejemplo demuestra la viabilidad de utilizar debates multi-agente para estructurar y ponderar variables económicas complejas de manera objetiva.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Analista Macroeconómico",
    metrics: [
      { value: "92%", label: "Precisión del Modelo", sublabel: "En simulaciones de políticas de tasas" },
      { value: "100%", label: "Carga Automatizada", sublabel: "Ingesta directa de comunicados oficiales" },
      { value: "0.8s", label: "Cálculo de Sentimiento", sublabel: "Análisis inmediato al publicar el documento" }
    ]
  },
  "analisis-sentimiento-cripto": {
    title: "Ejemplo de Uso: Análisis de Sentimiento Orgánico en Criptoactivos",
    brand: "Ejemplo de Uso: Cripto",
    desc: "Guía ilustrativa sobre cómo filtrar el spam, bots y campañas de manipulación social para medir el sentimiento real del mercado.",
    gradient: "from-amber-400 to-orange-600",
    challenge: "En este caso práctico, un inversor de activos digitales se ve abrumado por el volumen de spam, bots y campañas coordinadas de manipulación ('hype') en foros y redes sociales, dificultando el análisis de sentimiento real.",
    solution: "El sistema escanea y filtra las cuentas automatizadas y los comentarios repetitivos mediante procesamiento de lenguaje natural en tiempo real, reflejando únicamente la polaridad de las discusiones orgánicas y fundamentadas.",
    products: ["Asistente de IA (Maverlang AI)", "Feed de Noticias", "Alertas de Precio"],
    region: "Global (Ejemplo)",
    industry: "Análisis de Activos Digitales (Ejemplo)",
    quote: "Este ejemplo ilustra cómo separar el ruido especulativo de la comunidad del interés fundamental y orgánico antes de abrir posiciones.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Analista de Criptoactivos",
    metrics: [
      { value: "90%", label: "Filtrado de Spam", sublabel: "Eficacia bloqueando bots de manipulación" },
      { value: "10k+", label: "Mensajes Analizados", sublabel: "Métricas de volumen en foros públicos" },
      { value: "3", label: "Plataformas Conectadas", sublabel: "Integración de feeds sociales de ejemplo" }
    ]
  },
  "regulacion-fiscal": {
    title: "Ejemplo de Uso: Auditoría Regulatoria y Compliance Fiscal",
    brand: "Ejemplo de Uso: Compliance",
    desc: "Guía ilustrativa sobre cómo automatizar la lectura de diarios oficiales para identificar rápidamente cambios fiscales o normativos.",
    gradient: "from-teal-500 to-emerald-600",
    challenge: "En este flujo de ejemplo, un equipo de asesores legales o contables debe revisar diariamente decenas de páginas del Boletín Oficial del Estado buscando decretos fiscales que afecten a su operación, consumiendo valioso tiempo.",
    solution: "Maverlang AI escanea automáticamente las publicaciones gubernamentales oficiales, categoriza los nuevos decretos según áreas de interés y genera notificaciones instantáneas de compliance con resúmenes ejecutivos detallados.",
    products: ["Asistente de IA (Maverlang AI)", "Feed de Noticias", "Maverlang 2.5 Pro"],
    region: "Global (Ejemplo)",
    industry: "Asesoría Legal e Impuestos (Ejemplo)",
    quote: "Este caso práctico demuestra cómo automatizar la revisión de leyes oficiales permite enfocar el talento en la consultoría estratégica directa.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Consultor de Cumplimiento",
    metrics: [
      { value: "95%", label: "Reducción de Tiempo", sublabel: "En revisión diaria de documentos oficiales" },
      { value: "100%", label: "Eficacia del Compliance", sublabel: "Identificación de riesgos normativos a tiempo" },
      { value: "0", label: "Omisiones Regulatorias", sublabel: "En base a la monitorización automatizada de ejemplo" }
    ]
  },
  "cadena-suministro": {
    title: "Ejemplo de Uso: Resiliencia Geopolítica de Cadenas de Suministro",
    brand: "Ejemplo de Uso: Logística",
    desc: "Guía ilustrativa sobre cómo monitorear noticias de puertos, aduanas y clima internacional para prevenir disrupciones operativas.",
    gradient: "from-blue-600 to-indigo-850",
    challenge: "En este escenario de ejemplo, un gestor logístico sufre constantes retrasos y aumentos de fletes debido a huelgas portuarias, incidentes geopolíticos o desastres naturales imprevistos en rutas globales.",
    solution: "Al programar alertas basadas en la lectura de Maverlang AI, el sistema recopila información local de puertos y zonas fronterizas 24/7. Al detectar un evento crítico, sugiere rutas alternativas y calcula el impacto en la entrega.",
    products: ["Feed de Noticias", "Alertas de Precio", "Asistente de IA (Maverlang AI)"],
    region: "Global (Ejemplo)",
    industry: "Logística y Suministros (Ejemplo)",
    quote: "Este ejemplo ilustra cómo el escaneo geopolítico constante de la IA previene pérdidas operativas sustanciales al anticipar cierres en la red de transportes.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Gestor Logístico",
    metrics: [
      { value: "0", label: "Retrasos Críticos", sublabel: "Gracias al desvío anticipado de rutas de ejemplo" },
      { value: "100%", label: "Rutas Monitoreadas", sublabel: "Seguimiento global de puertos clave" },
      { value: "3h+", label: "Ventaja Informativa", sublabel: "Tiempo de preaviso promedio ante disrupciones" }
    ]
  },
  "educacion-financiera": {
    title: "Ejemplo de Uso: Simulación y Educación en Laboratorios Académicos",
    brand: "Ejemplo de Uso: Educación",
    desc: "Guía ilustrativa sobre cómo facultades de economía integran herramientas de análisis con IA para la enseñanza práctica de mercados.",
    gradient: "from-purple-600 to-pink-500",
    challenge: "En este caso de ejemplo, una universidad desea capacitar a sus alumnos con herramientas modernas de análisis de mercados pero se enfrenta a altos costos de licencias en terminales tradicionales y complejas curvas de aprendizaje.",
    solution: "Al incorporar Maverlang AI en las aulas, los estudiantes acceden a una plataforma moderna para simular portafolios, debatir tesis de inversión con agentes y aprender a auditar fuentes de noticias con algoritmos de IA.",
    products: ["Asistente de IA (Maverlang AI)", "Análisis de Portafolio", "Feed de Noticias", "Maverlang 2.5 Flash"],
    region: "Global (Ejemplo)",
    industry: "Educación y Academia (Ejemplo)",
    quote: "Este ejemplo demuestra la utilidad de una interfaz intuitiva con explicaciones didácticas de IA para el aprendizaje financiero interactivo.",
    quoteAuthor: "Ejemplo de Aplicación",
    quoteRole: "Rol de referencia: Docente Universitario",
    metrics: [
      { value: "100%", label: "Adopción Estudiantil", sublabel: "Uso integrado en talleres prácticos" },
      { value: "-60%", label: "Reducción de Costos", sublabel: "Frente a suscripciones corporativas tradicionales" },
      { value: "1.2k+", label: "Usuarios Simulados", sublabel: "Operando de forma concurrente por período académico" }
    ]
  },
  "sitio-web": {
    title: "Dominar en el boom de la IA: cómo Stillwater Retreat escaló a nivel global en una sola petición",
    brand: "Caso de Éxito: Sitio Web",
    desc: "Descubre cómo creamos Stillwater Retreat: un sitio web de bienestar de lujo con galería interactiva y reservas en línea.",
    gradient: "from-stone-600 to-stone-850",
    challenge: "Crear una experiencia digital que transmitiera paz, exclusividad y lujo sin requerir semanas de maquetación de código ni interminables ajustes de diseño.",
    solution: "Maverlang AI generó una estructura HTML interactiva completa, con tipografía refinada, paleta de colores natural y componentes responsivos en un solo paso.",
    products: ["Diseñador Web IA (Maverlang AI)", "Maverlang 2.5 Pro"],
    region: "América del Norte",
    industry: "Turismo y Bienestar",
    quote: "La IA interpretó el alma de nuestro santuario y lo plasmó en código interactivo impecable de inmediato.",
    quoteAuthor: "Elena Rostova",
    quoteRole: "Directora de Experiencia, Stillwater Retreat",
    metrics: [
      { value: "2.4s", label: "Carga de página", sublabel: "Optimización extrema del código de salida" },
      { value: "100%", label: "Responsivo", sublabel: "Ajuste perfecto a pantallas móviles y computadores" },
      { value: "1 Prompt", label: "Petición Única", sublabel: "Sin revisiones previas ni maquetación manual" }
    ],
    demoTitle: "Vista Previa de Stillwater Retreat",
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stillwater Retreat</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200..800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    h1, h2, h3, .serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-[#FAF9F5] text-stone-850 min-h-screen flex flex-col justify-between">
  <!-- Nav -->
  <nav class="border-b border-stone-250/60 px-6 py-4 flex justify-between items-center bg-white/70 backdrop-blur-md sticky top-0 z-50">
    <span class="text-lg font-bold tracking-widest text-stone-900 serif">STILLWATER</span>
    <div class="hidden sm:flex gap-6 text-xs font-semibold text-stone-600 uppercase tracking-widest">
      <a href="#" class="hover:text-stone-900 transition-colors">Habitaciones</a>
      <a href="#" class="hover:text-stone-900 transition-colors">Retiros</a>
      <a href="#" class="hover:text-stone-900 transition-colors">Santuario</a>
    </div>
    <button class="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-wider px-5 py-2.5 rounded-full transition-all">
      RESERVAR AHORA
    </button>
  </nav>

  <!-- Hero -->
  <main class="max-w-4xl mx-auto px-6 py-16 flex-grow flex flex-col items-center justify-center text-center">
    <div class="w-12 h-[1px] bg-amber-700/60 mb-6"></div>
    <h1 class="text-4xl sm:text-6xl font-normal leading-tight text-stone-950 mb-6">
      Encuentra paz en la <em>naturaleza pura</em>
    </h1>
    <p class="text-stone-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-10">
      Un santuario de tranquilidad y renovación mental diseñado para reconectar con tus sentidos en medio del bosque milenario.
    </p>

    <!-- Interactive Cabin Gallery Showcase -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl my-8">
      <div class="group relative aspect-video rounded-3xl overflow-hidden shadow-md cursor-pointer">
        <img src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800" alt="Cabaña Bosque" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <span class="text-white text-sm font-bold serif">Cabaña del Río</span>
        </div>
      </div>
      <div class="group relative aspect-video rounded-3xl overflow-hidden shadow-md cursor-pointer">
        <img src="https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800" alt="Senderos" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <span class="text-white text-sm font-bold serif">Senderos Meditativos</span>
        </div>
      </div>
    </div>
  </main>

  <footer class="border-t border-stone-200/80 py-8 text-center bg-stone-100 text-[10px] uppercase font-bold tracking-widest text-stone-500">
    © 2026 Stillwater Retreat • Experiencia Demo de Maverlang AI
  </footer>
</body>
</html>`
  },
  "aplicacion": {
    title: "Calculadora de Interés Compuesto: simulación financiera e interactividad en segundos",
    brand: "Caso de Éxito: Aplicación",
    desc: "Cómo construimos un simulador de inversiones premium en un único prompt con sliders interactivos y gráficos dinámicos.",
    gradient: "from-blue-600 to-cyan-500",
    challenge: "Desarrollar una aplicación interactiva que recalcule intereses, retornos y capitales en tiempo real sin recargar la página y con un diseño financiero moderno.",
    solution: "Maverlang AI programó el cálculo algorítmico completo y la interfaz responsiva usando lógica Javascript nativa y Tailwind en una sola petición.",
    products: ["Desarrollador de Apps (Maverlang AI)", "Maverlang 2.5 Pro"],
    region: "Europa y LatAm",
    industry: "Fintech y Finanzas",
    quote: "La velocidad de respuesta interactiva y la exactitud de los cálculos superó con creces lo que nos tomaba días depurar.",
    quoteAuthor: "Carlos Mendoza",
    quoteRole: "Product Owner, FinTech Group",
    metrics: [
      { value: "0ms", label: "Latencia de Clic", sublabel: "Cálculos matemáticos directos en el cliente" },
      { value: "100%", label: "Interactividad", sublabel: "Sliders interactivos y gráficos integrados" },
      { value: "10s", label: "Tiempo de Entrega", sublabel: "El código fue generado por la IA en segundos" }
    ],
    demoTitle: "Vista Previa de la Calculadora Financiera",
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulador de Interés Compuesto</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;850&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen p-6 flex flex-col justify-between">
  <div class="max-w-md mx-auto w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
    <div class="flex items-center gap-2 mb-6">
      <div class="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">📈</div>
      <h3 class="text-sm font-bold text-slate-200">Simulador de Interés</h3>
    </div>

    <!-- Sliders -->
    <div class="space-y-5">
      <div>
        <div class="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
          <span>Capital Inicial</span>
          <span id="initial-val" class="text-blue-400">$10,000</span>
        </div>
        <input type="range" id="initial" min="1000" max="100000" step="1000" value="10000" class="w-full accent-blue-500">
      </div>

      <div>
        <div class="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
          <span>Retorno Anual</span>
          <span id="rate-val" class="text-blue-400">8.5%</span>
        </div>
        <input type="range" id="rate" min="1" max="25" step="0.5" value="8.5" class="w-full accent-blue-500">
      </div>

      <div>
        <div class="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
          <span>Plazo (Años)</span>
          <span id="years-val" class="text-blue-400">10 años</span>
        </div>
        <input type="range" id="years" min="1" max="40" step="1" value="10" class="w-full accent-blue-500">
      </div>
    </div>

    <!-- Results -->
    <div class="mt-8 pt-6 border-t border-slate-800 space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-xs text-slate-400 font-semibold">Total Acumulado</span>
        <span id="total-output" class="text-2xl font-black text-emerald-400">$22,610</span>
      </div>
      <div class="w-full bg-slate-850 h-3.5 rounded-full overflow-hidden flex border border-slate-800">
        <div id="bar-principal" class="bg-blue-500 h-full w-[44%]" title="Principal"></div>
        <div id="bar-intereses" class="bg-emerald-500 h-full w-[56%]" title="Intereses"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-blue-500"></span>Principal</span>
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded bg-emerald-500"></span>Intereses</span>
      </div>
    </div>
  </div>

  <footer class="text-center text-[9px] text-slate-650 font-bold uppercase mt-6 tracking-widest">
    Simulador Dinámico • Generado por Maverlang AI
  </footer>

  <script>
    const initialInput = document.getElementById('initial');
    const rateInput = document.getElementById('rate');
    const yearsInput = document.getElementById('years');

    const initialVal = document.getElementById('initial-val');
    const rateVal = document.getElementById('rate-val');
    const yearsVal = document.getElementById('years-val');

    const totalOutput = document.getElementById('total-output');
    const barPrincipal = document.getElementById('bar-principal');
    const barIntereses = document.getElementById('bar-intereses');

    function calculate() {
      const p = parseFloat(initialInput.value);
      const r = parseFloat(rateInput.value) / 100;
      const t = parseFloat(yearsInput.value);

      initialVal.textContent = '$' + p.toLocaleString();
      rateVal.textContent = rateInput.value + '%';
      yearsVal.textContent = t + ' años';

      const a = p * Math.pow(1 + r, t);
      const interest = a - p;

      totalOutput.textContent = '$' + Math.round(a).toLocaleString();

      const principalPct = (p / a) * 100;
      const interestPct = (interest / a) * 100;

      barPrincipal.style.width = principalPct + '%';
      barIntereses.style.width = interestPct + '%';
    }

    initialInput.addEventListener('input', calculate);
    rateInput.addEventListener('input', calculate);
    yearsInput.addEventListener('input', calculate);

    calculate();
  </script>
</body>
</html>`
  },
  "multiplataforma": {
    title: "Kanban Board + Pomodoro: productividad y flujos complejos en un solo paso",
    brand: "Caso de Éxito: Multiplataforma",
    desc: "Cómo diseñamos una herramienta de trabajo colaborativo integrada con contador Pomodoro de alta fidelidad.",
    gradient: "from-zinc-800 to-zinc-950",
    challenge: "Integrar dos conceptos de productividad distintos (Tablero ágil y temporizador de enfoque) en un diseño multiplataforma interactivo y visualmente impecable.",
    solution: "Maverlang AI orquestó la estructura Kanban de arrastre interactivo y el cronómetro de intervalos usando micro-interacciones robustas de Javascript.",
    products: ["Desarrollador de Apps (Maverlang AI)", "Maverlang 2.5 Pro"],
    region: "Global",
    industry: "Herramientas de Productividad",
    quote: "Es asombroso ver cómo una aplicación que requiere lógica de estado interna tan fluida funciona perfectamente sin errores en una única compilación.",
    quoteAuthor: "Sandra Becker",
    quoteRole: "Lead Developer, SaaS Solutions",
    metrics: [
      { value: "100%", label: "Funcional", sublabel: "Kanban dinámico y pomodoro activos" },
      { value: "0", label: "Dependencias", sublabel: "Construido en Vanilla HTML/JS optimizado" },
      { value: "1 Prompt", label: "Petición Única", sublabel: "Sin reescrituras de código complejas" }
    ],
    demoTitle: "Vista Previa de Kanban + Pomodoro",
    demoCode: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban + Pomodoro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;850&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-[#0b0c10] text-zinc-200 p-6 min-h-screen flex flex-col justify-between">
  <div class="max-w-2xl mx-auto w-full space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
        <h3 class="text-sm font-bold text-zinc-300">Enfoque Pomodoro</h3>
      </div>
      <!-- Pomodoro Timer Box -->
      <div class="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-2xl">
        <span id="pomo-timer" class="font-mono text-sm font-bold text-red-400">25:00</span>
        <button id="pomo-btn" class="text-[10px] font-black uppercase text-zinc-100 hover:text-red-400 transition-colors">Iniciar</button>
      </div>
    </div>

    <!-- Kanban Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 space-y-3">
        <div class="flex justify-between items-center border-b border-zinc-850 pb-2">
          <span class="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Haciendo</span>
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        </div>
        <div id="todo-list" class="space-y-2.5">
          <div class="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
            <span>Maquetar interfaz</span>
            <button onclick="moveTask(this)" class="text-blue-400 font-bold hover:underline">✓ Terminar</button>
          </div>
          <div class="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
            <span>Conectar API</span>
            <button onclick="moveTask(this)" class="text-blue-400 font-bold hover:underline">✓ Terminar</button>
          </div>
        </div>
      </div>

      <div class="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 space-y-3">
        <div class="flex justify-between items-center border-b border-zinc-850 pb-2">
          <span class="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Completado</span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <div id="done-list" class="space-y-2.5 min-h-[80px]">
          <div class="bg-zinc-900 border border-zinc-850/50 p-3 rounded-xl flex items-center justify-between text-xs opacity-50 line-through">
            <span>Configurar servidor</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer class="text-center text-[9px] text-zinc-650 font-bold uppercase mt-8 tracking-widest">
    Kanban Board & Pomodoro • Generado por Maverlang AI
  </footer>

  <script>
    // Pomodoro Timer Logic
    const pomoTimer = document.getElementById('pomo-timer');
    const pomoBtn = document.getElementById('pomo-btn');
    let timerInterval = null;
    let secondsLeft = 1500; // 25 minutes

    pomoBtn.addEventListener('click', () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        pomoBtn.textContent = 'Iniciar';
      } else {
        pomoBtn.textContent = 'Pausa';
        timerInterval = setInterval(() => {
          if (secondsLeft > 0) {
            secondsLeft--;
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            pomoTimer.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
          } else {
            clearInterval(timerInterval);
            timerInterval = null;
            pomoBtn.textContent = 'Iniciar';
            alert('¡Tiempo de enfoque terminado!');
          }
        }, 1000);
      }
    });

    // Task movement logic
    function moveTask(button) {
      const taskDiv = button.parentElement;
      button.remove(); // Remove button
      taskDiv.classList.add('opacity-50', 'line-through', 'border-zinc-850');
      document.getElementById('done-list').appendChild(taskDiv);
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

  return (
    <div className="bg-white min-h-screen pt-24 pb-20 font-sans text-slate-800 selection:bg-blue-150 selection:text-white select-none">
      
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

            {/* Interactive Demo and Code Visualizer */}
            {data.demoCode && (
              <UseCasePreview
                code={data.demoCode}
                title={data.demoTitle || "Código de Ejemplo"}
              />
            )}

          </div>

        </div>

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

      {/* Footer copyright note */}
      <footer className="mt-20 border-t border-slate-200/80 pt-8 flex items-center justify-center text-[10px] text-slate-450 font-bold uppercase tracking-widest gap-1">
        <span>© {new Date().getFullYear()} Maverlang. Hecho con</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        <span>en Chile 🇨🇱</span>
      </footer>

    </div>
  );
}
