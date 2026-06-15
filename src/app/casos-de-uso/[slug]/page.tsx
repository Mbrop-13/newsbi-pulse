import { notFound } from "next/navigation";
import { Sparkles, Brain, Clock, ShieldCheck, ArrowRight, ExternalLink, Globe, Building, Bot, Bell, Folder, BookOpen, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

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
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
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
            <Link href="/" className="hover:text-slate-900 transition-colors">Todos los casos de uso</Link>
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
