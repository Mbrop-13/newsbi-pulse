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
    title: "Ejemplo Práctico: ¿Cómo un Gestor de Fondos podría ocupar Reclu para auditar transacciones en tiempo real?",
    brand: "Ejemplo: M&A e Inversión",
    desc: "Simulación de cómo un administrador de activos puede utilizar Reclu para reducir el tiempo de investigación y auditoría de fusiones en un 85% usando agentes inteligentes.",
    gradient: "from-blue-600 to-indigo-700",
    challenge: "En este escenario de ejemplo, un analista financiero debe recopilar manualmente docenas de informes corporativos, boletines de prensa e hilos regulatorios para auditar una sola transacción de M&A. Este flujo manual consume más de 20 horas de trabajo y aumenta el riesgo de omitir alertas críticas o dejarse influenciar por sesgos editoriales.",
    solution: "Al ocupar Reclu, el profesional puede delegar la tarea a una red de agentes especializados de IA. El agente geopolítico y de mercados compila datos financieros en vivo, el VerifierAgent valida la confiabilidad de los comunicados emitidos, y el modelo Reclu 2.5 Pro procesa las correlaciones de volatilidad. Esto permite generar un reporte de riesgo unificado libre de sesgos en menos de 3 horas.",
    products: ["Asistente de IA (R-AI)", "Análisis de Portafolio", "Feed de Noticias", "Reclu 2.5 Pro"],
    region: "Ejemplo Global (Simulado)",
    industry: "Gestión de Activos (M&A) - Ejemplo Ilustrativo",
    quote: "Este ejemplo demuestra cómo la automatización de la lectura analítica con Reclu permite a los gestores centrarse en la estrategia final de inversión en lugar de ahogarse en la recolección manual de información.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Director de Estrategia & M&A",
    metrics: [
      { value: "-85%", label: "Tiempo de investigación", sublabel: "Reducido de 20 a 3 horas" },
      { value: "100%", label: "Fuentes auditadas", sublabel: "Simulación de verificación en vivo" },
      { value: "0%", label: "Sesgo de información", sublabel: "Análisis neutro sin clickbait" }
    ]
  },
  "deteccion-de-sesgos": {
    title: "Ejemplo Práctico: ¿Cómo un Analista Financiero podría ocupar Reclu para purificar el flujo informativo de divisas?",
    brand: "Ejemplo: Trading & Divisas",
    desc: "Simulación de cómo una mesa de trading de divisas puede implementar el sistema VerifierAgent de Reclu para aislar el ruido mediático y la propaganda en reportes globales.",
    gradient: "from-emerald-500 to-teal-600",
    challenge: "Supongamos una situación donde el clickbait macroeconómico y los rumores financieros no contrastados sobre decisiones de los bancos centrales inducen a decisiones apresuradas en la mesa de dinero, provocando pérdidas innecesarias por volatilidad inducida artificialmente.",
    solution: "Al ocupar la API de Reclu, cada noticia o reporte de mercado se evalúa mediante un modelo de análisis de sesgo político y de credibilidad. La plataforma detecta automáticamente la procedencia de la noticia y solo resalta aquellas informaciones con un score de confianza superior a 8.5 puntos, asegurando un trading totalmente objetivo y libre de ruido.",
    products: ["Feed de Noticias", "Alertas de Precio", "Reclu 2.5 Flash"],
    region: "Ejemplo Multiregional (Simulado)",
    industry: "Análisis de Información Financiera - Ejemplo",
    quote: "Con este modelo de ejemplo se ilustra la capacidad de purificar en milisegundos miles de fuentes de noticias para proteger a las operaciones de la desinformación.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Jefe de Mesa de Dinero",
    metrics: [
      { value: "99.8%", label: "Filtro de Clickbait", sublabel: "Efectividad del VerifierAgent" },
      { value: "< 50ms", label: "Tiempo de Calificación", sublabel: "Latencia en tiempo real" },
      { value: "14+", label: "Fuentes Cruzadas", sublabel: "Por cada artículo validado" }
    ]
  },
  "seguimiento-automatizado": {
    title: "Ejemplo Práctico: ¿Cómo un Asesor Patrimonial podría ocupar Reclu para monitorear portafolios multiactivos?",
    brand: "Ejemplo: Wealth Management",
    desc: "Simulación de cómo sincronizar carteras de clientes con alertas inteligentes multicanal de Reclu para responder al instante ante acontecimientos del mercado.",
    gradient: "from-indigo-600 to-purple-500",
    challenge: "En este caso ficticio de uso, un asesor patrimonial enfrenta el reto de monitorear manualmente noticias y eventos globales que afecten a docenas de activos diferentes distribuidos en las carteras de cientos de clientes minoristas, reaccionando habitualmente tarde.",
    solution: "Al ocupar las herramientas de Reclu, los activos de los portafolios se conectan directamente al motor de la IA. En el instante en que se publica y verifica un hecho geopolítico o macroeconómico relevante, el sistema evalúa su impacto financiero potencial y despacha notificaciones y resúmenes automáticos al asesor y al cliente.",
    products: ["Análisis de Portafolio", "Alertas de Precio", "Asistente de IA (R-AI)", "Reclu 2.5 Flash"],
    region: "Ejemplo Nacional (Simulado)",
    industry: "Asesoría Patrimonial - Ejemplo Ilustrativo",
    quote: "Este ejemplo de aplicación muestra cómo la IA de Reclu vigila y alerta en tiempo real las variaciones del mercado, ofreciendo tranquilidad permanente a los inversores.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Asesor de Wealth Management",
    metrics: [
      { value: "24/7", label: "Monitoreo Activo", sublabel: "Sin interrupción ni demoras" },
      { value: "0s", label: "Tiempo de Reacción", sublabel: "Alertas inmediatas en vivo" },
      { value: "25+", label: "Activos Protegidos", sublabel: "Por cada portafolio en la red" }
    ]
  },
  "prediccion-banco-central": {
    title: "Ejemplo Práctico: ¿Cómo una Firma de Corretaje podría ocupar Reclu para modelar variaciones de tasas?",
    brand: "Ejemplo: Macro & Corretaje",
    desc: "Simulación del uso de redes de consenso de agentes IA de Reclu para estimar probabilidades de variaciones macroeconómicas de interés interbancario.",
    gradient: "from-rose-500 to-orange-500",
    challenge: "Supongamos que los economistas de una firma deben procesar cientos de discursos, reportes de empleo y cifras de IPC mensuales dispersos para proyectar las decisiones del Banco Central, resultando en predicciones imprecisas por falta de correlación de datos.",
    solution: "Al ocupar Reclu, la firma puede alimentar a los agentes con los últimos datos económicos y discursos oficiales. Se simula una mesa virtual de consejeros donde la IA debate las implicaciones monetarias, calculando de manera científica un porcentaje de probabilidad de alza de tasas y arrojando métricas de cobertura al instante.",
    products: ["Asistente de IA (R-AI)", "Feed de Noticias", "Reclu 2.5 Pro"],
    region: "Ejemplo Regional (Simulado)",
    industry: "Investigación Macroeconómica - Ejemplo",
    quote: "Este caso ficticio ejemplifica cómo sustituir la intuición por modelos de consenso de IA entrenados con variables macroeconómicas reales.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Economista de Mesa de Corretaje",
    metrics: [
      { value: "92%", label: "Precisión de Pronósticos", sublabel: "En decisiones de tasas swap" },
      { value: "100%", label: "Flujo Automatizado", sublabel: "Procesamiento diario continuo" },
      { value: "0.8s", label: "Actualización de Probabilidad", sublabel: "Ante nuevos comunicados" }
    ]
  },
  "analisis-sentimiento-cripto": {
    title: "Ejemplo Práctico: ¿Cómo un Inversor de Criptoactivos podría ocupar Reclu para descifrar el sentimiento real del mercado?",
    brand: "Ejemplo: Cripto & Social",
    desc: "Simulación del filtrado masivo de spam y campañas artificiales de bots coordinadas en redes para medir el momentum de activos digitales de manera honesta.",
    gradient: "from-amber-400 to-orange-600",
    challenge: "En este escenario hipotético, un trader de criptoactivos se encuentra abrumado por el volumen de spam, rumores falsos y campañas coordinadas de manipulación en foros y redes sociales, lo que distorsiona el análisis técnico genuino.",
    solution: "Al ocupar el procesador de sentimiento social de Reclu, el inversor puede conectar flujos de datos comunitarios directamente al R-AI. El sistema identifica y descarta las cuentas automatizadas y bots de spam en tiempo real, evaluando la polaridad de las discusiones orgánicas y reflejando una métrica de sentimiento fidedigna.",
    products: ["Asistente de IA (R-AI)", "Feed de Noticias", "Alertas de Precio"],
    region: "Ejemplo de Redes Globales (Simulado)",
    industry: "Inversión en Activos Digitales - Ejemplo",
    quote: "Este ejemplo ilustra la capacidad de separar la especulación artificial del interés real de la comunidad, aportando claridad antes de abrir posiciones.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Trader de Criptoactivos Independiente",
    metrics: [
      { value: "90%", label: "Filtrado de Spam", sublabel: "Bloqueo efectivo de bots" },
      { value: "10k+", label: "Mensajes Analizados", sublabel: "Por minuto en tiempo real" },
      { value: "3", label: "Redes Sociales Conectadas", sublabel: "Seguimiento unificado" }
    ]
  },
  "regulacion-fiscal": {
    title: "Ejemplo Práctico: ¿Cómo un Estudio Jurídico podría ocupar Reclu para realizar compliance y auditoría regulatoria?",
    brand: "Ejemplo: Compliance Legal",
    desc: "Simulación de cómo un estudio tributario o jurídico puede automatizar el monitoreo diario de diarios oficiales y boletines regulatorios del gobierno.",
    gradient: "from-teal-500 to-emerald-600",
    challenge: "Supongamos que los abogados de una firma deben dedicar varias horas diarias de lectura manual en diarios estatales oficiales buscando cambios regulatorios, exenciones tributarias o normativas aduaneras que afecten a la cartera de clientes, ralentizando la asesoría legal.",
    solution: "Al ocupar los agentes regulatorios de Reclu, la IA se encarga de escanear, catalogar y resumir diariamente el boletín oficial del Estado. Al identificar un cambio de ley relevante para los sectores de interés de los clientes, el sistema genera alertas inmediatas y propuestas iniciales de compliance automatizadas.",
    products: ["Asistente de IA (R-AI)", "Feed de Noticias", "Reclu 2.5 Pro"],
    region: "Ejemplo Gubernamental (Simulado)",
    industry: "Asesoría Legal y Tributaria - Ejemplo",
    quote: "Este caso ilustra cómo el análisis regulatorio automatizado libera a los equipos legales para que se enfoquen en la consultoría estratégica de alto valor.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Abogado Senior de Compliance",
    metrics: [
      { value: "95%", label: "Ahorro de Tiempo", sublabel: "En revisión diaria de decretos" },
      { value: "100%", label: "Cumplimiento Regulatorio", sublabel: "Riesgos identificados a tiempo" },
      { value: "0", label: "Multas u Omisiones", sublabel: "En las carteras de los clientes" }
    ]
  },
  "cadena-suministro": {
    title: "Ejemplo Práctico: ¿Cómo un Gestor de Operaciones Logísticas podría ocupar Reclu para esquivar disrupciones geopolíticas?",
    brand: "Ejemplo: Logística Global",
    desc: "Simulación de cómo las empresas importadoras y exportadoras emplean la IA de Reclu para adelantarse a tormentas aduaneras, huelgas portuarias o tensiones fronterizas.",
    gradient: "from-blue-600 to-indigo-850",
    challenge: "En este ejemplo ilustrativo, un director de transportes se ve afectado constantemente por huelgas portuarias, conflictos climáticos locales o bloqueos de rutas globales imprevistas, lo que encarece los fletes e interrumpe la cadena de suministros.",
    solution: "Al ocupar Reclu, el departamento de supply chain programa alertas basadas en la lectura geopolítica de la IA. El sistema escanea noticias aduaneras e informes locales de puertos 24/7 y, al menor indicio de disrupción severa verificado, sugiere de manera reactiva rutas alternativas y calcula el impacto en la fecha de arribo.",
    products: ["Feed de Noticias", "Alertas de Precio", "Asistente de IA (R-AI)"],
    region: "Ejemplo Marítimo Global (Simulado)",
    industry: "Logística y Supply Chain - Ejemplo",
    quote: "Este ejemplo demuestra cómo la anticipación informativa y el escaneo geopolítico de la IA evitan demoras críticas de días en el transporte de carga.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Director de Supply Chain & Comercio",
    metrics: [
      { value: "0", label: "Retrasos Críticos", sublabel: "Rutas cambiadas a tiempo" },
      { value: "100%", label: "Rutas Monitoreadas", sublabel: "Seguimiento global continuo" },
      { value: "3h+", label: "Alerta Anticipada", sublabel: "Ventaja informativa promedio" }
    ]
  },
  "educacion-financiera": {
    title: "Ejemplo Práctico: ¿Cómo una Universidad podría ocupar Reclu en sus laboratorios de finanzas académicos?",
    brand: "Ejemplo: Academia & Finanzas",
    desc: "Simulación de cómo facultades y escuelas de economía usan el ecosistema Reclu para enseñar a los estudiantes a auditar noticias e investigar mercados.",
    gradient: "from-purple-600 to-pink-500",
    challenge: "Supongamos una facultad que busca dar herramientas prácticas de mercado a sus alumnos, pero enfrenta presupuestos prohibitivos en licencias de terminales de noticias profesionales tradicionales y curvas de aprendizaje de varios meses.",
    solution: "Al ocupar Reclu en sus laboratorios, los alumnos acceden a una plataforma amigable y moderna donde interactúan con R-AI para debatir hipótesis, realizar análisis de portafolio simulados y aprender a identificar sesgo periodístico mediante algoritmos de inteligencia artificial.",
    products: ["Asistente de IA (R-AI)", "Análisis de Portafolio", "Feed de Noticias", "Reclu 2.5 Flash"],
    region: "Ejemplo Educativo (Simulado)",
    industry: "Educación y Academia - Ejemplo",
    quote: "Con este modelo educativo de ejemplo, se muestra cómo los estudiantes pueden interactuar con mercados reales mediante explicaciones didácticas de IA.",
    quoteAuthor: "Testimonio Ilustrativo",
    quoteRole: "Ejemplo de Rol: Docente Investigador en Finanzas",
    metrics: [
      { value: "100%", label: "Integración Curricular", sublabel: "Uso práctico en cátedras" },
      { value: "-60%", label: "Reducción de Costes", sublabel: "Frente a terminales tradicionales" },
      { value: "1.2k+", label: "Alumnos Activos", sublabel: "Operando en paralelo por mes" }
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
        
        {/* Banner de Aviso de Ejemplo */}
        <div className="mb-8 bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Caso de Ejemplo Ilustrativo</p>
              <p className="text-[11px] text-slate-500">Este caso es una simulación práctica orientada a describir cómo un rol profesional podría ocupar las herramientas de Reclu IA en su flujo diario.</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50 text-center sm:text-left self-start sm:self-auto">
            SIMULACIÓN
          </span>
        </div>

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
                <Logo showText={true} size="sm" />
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
                <ShieldCheck className="w-4 h-4 text-[#1890FF]" /> La Solución con Reclu IA
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
            Únete hoy a Reclu y eleva el nivel de tus decisiones de inversión con nuestra red multi-agente de Inteligencia Artificial.
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
        <span>© {new Date().getFullYear()} Reclu. Hecho con</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        <span>en Chile 🇨🇱</span>
      </footer>

    </div>
  );
}
