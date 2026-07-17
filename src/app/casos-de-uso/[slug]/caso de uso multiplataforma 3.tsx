prompt:Diseña una aplicación multiplataforma completa (iOS, Android, Web y Desktop) llamada MentorMatch, una plataforma premium de mentoría inteligente que conecta mentores y aprendices de manera profunda, efectiva y personalizada.
Concepto principal:
El matching no se basa solo en habilidades técnicas, sino en una combinación inteligente de experiencia, objetivos de vida, estilo de aprendizaje, valores y personalidad. La app debe transmitir profesionalismo, confianza y calidez humana.
Estilo Visual General (Multiplataforma):

Paleta de colores: Azul profundo profesional (#1E3A8A), blanco y gris neutro elegante, acentos en verde esmeralda (#10B981) para crecimiento y confianza.
Tipografía: Sans-serif moderna y altamente legible (Inter o Satoshi).
Estilo: Minimalista premium, limpio, con mucho espacio negativo, jerarquía visual clara y animaciones suaves pero profesionales.
Dark Mode y Light Mode perfectamente optimizados.

Estructura y Funcionalidades Específicas:
1. Onboarding (Primera experiencia)

Test inicial de 8-10 preguntas sobre objetivos, estilo de aprendizaje, disponibilidad y valores.
Creación de perfil detallado (experiencia, logros, áreas de expertise, preferencias de mentoría).

2. Home Dashboard

Para aprendices: Matches recomendados con porcentaje de compatibilidad.
Para mentores: Solicitudes pendientes y próximos encuentros.
Resumen de actividad y progreso.

3. Descubrir y Matching

Sistema de IA que muestra matches con puntuación de compatibilidad (0-100%).
Filtros avanzados: industria, habilidades específicas, nivel de experiencia, ubicación (presencial/virtual), disponibilidad horaria.
Vista de perfil completo del mentor/aprendiz con bio, experiencia, reseñas y “por qué quiero ser mentor/aprendiz”.

4. Sesiones de Mentoría

Tipos de sesiones: Video (30/45/60 min), Audio, Chat estructurado.
Herramientas durante la llamada: agenda compartida, notas en tiempo real, grabación (con permiso).
Sistema de objetivos y seguimiento post-sesión (¿Qué aprendiste? ¿Próximos pasos?).

5. Progreso y Herramientas

Dashboard de objetivos personales con seguimiento visual.
Biblioteca compartida de recursos (artículos, plantillas, ejercicios).
Historial completo de sesiones y notas.

Adaptación por Plataforma:

Mobile (iOS/Android): Experiencia rápida para agendar, chatear y sesiones cortas.
Web/Desktop: Experiencia completa con videollamadas grandes, comparación lado a lado de mentores, dashboards detallados y herramientas de productividad.

Detalles de Interacción:

Animaciones elegantes al hacer match (confeti sutil o efecto de conexión).
Notificaciones respetuosas y útiles (nunca spam).
Feedback háptico en móvil al confirmar una sesión.
Atajos de teclado completos en versión desktop/web.
Sincronización en tiempo real entre todos los dispositivos.

Sistema de Reputación:

Reseñas detalladas después de cada sesión.
Verificación de identidad y experiencia para mentores.
Insignias de logros (Top Mentor, Especialista en X, etc.).

Monetización (incluir en el diseño):

Modelo freemium: primeras sesiones gratis o con descuento.
Suscripción mensual para aprendices (acceso ilimitado a mentores).
Comisión por sesión para la plataforma (transparente).

Ambiente General Requerido:
Profesional, confiable, inspirador, cálido y claro. Cada pantalla debe transmitir seriedad y al mismo tiempo cercanía humana. La app debe sentirse como una plataforma premium de desarrollo personal y profesional.



codigo:<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MentorMatch - Premium Mentoring</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1E3A8A; /* Azul Profundo */
            --accent: #10B981; /* Verde Esmeralda */
            --bg: #F8FAFC; /* Gris Nube */
            --surface: #FFFFFF;
            --text-main: #1E293B;
            --text-muted: #64748B;
            --border: #E2E8F0;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            -webkit-font-smoothing: antialiased;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        .card-shadow {
            box-shadow: 0 4px 20px -2px rgba(30, 58, 138, 0.08);
        }
        .card-shadow-hover:hover {
            box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.15);
            transform: translateY(-2px);
        }
        .nav-item.active {
            background-color: rgba(30, 58, 138, 0.1);
            color: var(--primary);
            font-weight: 600;
        }
        .nav-item.active svg {
            color: var(--primary);
        }
        
        /* Animación sutil de match */
        @keyframes pulse-accent {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pulse-accent {
            animation: pulse-accent 2s infinite;
        }

        .hidden-view { display: none; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="overflow-hidden">

    <div class="flex h-screen w-screen">
        
        <!-- SIDEBAR (Desktop) -->
        <aside class="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 flex-shrink-0">
            <div>
                <!-- Logo -->
                <div class="flex items-center gap-2 mb-10">
                    <div class="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">M</div>
                    <h1 class="text-xl font-bold tracking-tight text-slate-800">MentorMatch</h1>
                </div>

                <!-- Navegación -->
                <nav class="flex flex-col gap-1">
                    <button onclick="switchView('home')" class="nav-item active flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 transition-colors hover:bg-slate-50 text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        Inicio
                    </button>
                    <button onclick="switchView('discover')" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 transition-colors hover:bg-slate-50 text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        Descubrir
                    </button>
                    <button class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 transition-colors hover:bg-slate-50 text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        Sesiones
                    </button>
                    <button class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 transition-colors hover:bg-slate-50 text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Progreso
                    </button>
                </nav>
            </div>

            <!-- Upgrade Card -->
            <div class="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl p-5 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <h4 class="font-semibold text-sm mb-1">MentorMatch Plus</h4>
                <p class="text-xs text-blue-100 mb-4">Sesiones ilimitadas y análisis avanzado.</p>
                <button class="w-full bg-[#10B981] hover:bg-emerald-400 transition-colors text-white text-xs font-bold py-2 rounded-lg">Mejorar Plan</button>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="flex-1 flex flex-col overflow-hidden">
            
            <!-- TOP BAR -->
            <header class="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 py-4 z-10">
                <div class="relative w-96">
                    <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Buscar mentores, habilidades o industrias..." class="w-full bg-slate-50 border border-transparent focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none transition-all">
                </div>
                
                <div class="flex items-center gap-6">
                    <button class="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full pulse-accent"></span>
                    </button>
                    <div class="flex items-center gap-3 cursor-pointer">
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" class="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover">
                        <div>
                            <p class="text-sm font-semibold text-slate-800">Alex Riveiro</p>
                            <p class="text-xs text-slate-400">Aprendiz</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- VIEW CONTAINER -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-10">
                
                <!-- HOME VIEW -->
                <div id="view-home" class="fade-in">
                    <!-- Hero / Greeting -->
                    <div class="flex justify-between items-end mb-10">
                        <div>
                            <h2 class="text-3xl font-bold text-slate-800 tracking-tight">Buenos días, Alex</h2>
                            <p class="text-slate-500 mt-1">Tienes una sesión hoy y 3 nuevos matches perfectos.</p>
                        </div>
                        <div class="flex items-center gap-4 bg-white p-4 rounded-xl card-shadow border border-slate-50">
                            <div class="relative w-12 h-12">
                                <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 0 0 31.831 a 15.9155 15.9155 0 0 0 0 -31.831" fill="none" stroke="#E2E8F0" stroke-width="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 0 0 31.831 a 15.9155 15.9155 0 0 0 0 -31.831" fill="none" stroke="#10B981" stroke-width="3" stroke-dasharray="75, 100" stroke-linecap="round" />
                                </svg>
                                <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">75%</span>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 font-medium">Progreso Semanal</p>
                                <p class="text-sm font-bold text-slate-800">3 de 4 objetivos</p>
                            </div>
                        </div>
                    </div>

                    <!-- Upcoming Session -->
                    <div class="bg-gradient-to-r from-[#1E3A8A] to-[#294ea3] rounded-2xl p-8 mb-10 flex justify-between items-center text-white relative overflow-hidden card-shadow">
                        <div class="absolute right-0 top-0 opacity-20">
                            <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="150" cy="0" r="80" fill="white"/>
                                <circle cx="100" cy="150" r="60" fill="white"/>
                            </svg>
                        </div>
                        <div class="relative z-10">
                            <span class="text-xs font-semibold text-blue-200 uppercase tracking-wider">Próxima Sesión</span>
                            <h3 class="text-2xl font-bold mt-2">Estrategia de Producto con Elena Rojas</h3>
                            <p class="text-blue-100 text-sm mt-1">Hoy, 15:00 - 16:00 hs · Videollamada</p>
                        </div>
                        <button class="bg-[#10B981] hover:bg-emerald-400 transition-colors px-6 py-3 rounded-xl font-semibold text-sm shadow-lg flex items-center gap-2 relative z-10">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            Unirse a la Sala
                        </button>
                    </div>

                    <!-- Matches Recomendados -->
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Matches Recomendados para ti</h3>
                    <div class="grid grid-cols-3 gap-6 mb-10">
                        <!-- Match Card 1 -->
                        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=47" class="w-16 h-16 rounded-full object-cover" alt="Mentor">
                                <div class="flex flex-col items-center justify-center bg-emerald-50 text-[#10B981] px-2.5 py-1 rounded-lg">
                                    <span class="text-xs font-medium">Match</span>
                                    <span class="text-lg font-bold leading-none">96%</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Elena Rojas</h4>
                            <p class="text-sm text-slate-500 mb-3">VP Product @ TechCorp</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Estrategia</span>
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Liderazgo</span>
                            </div>
                            <button class="w-full text-sm font-semibold text-[#1E3A8A] border border-slate-200 hover:bg-slate-50 py-2 rounded-lg transition-colors">Ver Perfil</button>
                        </div>
                        <!-- Match Card 2 -->
                        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=33" class="w-16 h-16 rounded-full object-cover" alt="Mentor">
                                <div class="flex flex-col items-center justify-center bg-emerald-50 text-[#10B981] px-2.5 py-1 rounded-lg">
                                    <span class="text-xs font-medium">Match</span>
                                    <span class="text-lg font-bold leading-none">91%</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Javier Méndez</h4>
                            <p class="text-sm text-slate-500 mb-3">Senior Dev @ Google</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Arquitectura</span>
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Carrera</span>
                            </div>
                            <button class="w-full text-sm font-semibold text-[#1E3A8A] border border-slate-200 hover:bg-slate-50 py-2 rounded-lg transition-colors">Ver Perfil</button>
                        </div>
                        <!-- Match Card 3 -->
                        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=23" class="w-16 h-16 rounded-full object-cover" alt="Mentor">
                                <div class="flex flex-col items-center justify-center bg-emerald-50 text-[#10B981] px-2.5 py-1 rounded-lg">
                                    <span class="text-xs font-medium">Match</span>
                                    <span class="text-lg font-bold leading-none">88%</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Sofía Castro</h4>
                            <p class="text-sm text-slate-500 mb-3">Founder @ InnovaLab</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Startups</span>
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Finanzas</span>
                            </div>
                            <button class="w-full text-sm font-semibold text-[#1E3A8A] border border-slate-200 hover:bg-slate-50 py-2 rounded-lg transition-colors">Ver Perfil</button>
                        </div>
                    </div>

                    <!-- Progress Tools Snippet -->
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Tus Objetivos de la Semana</h3>
                    <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow">
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium text-slate-700">Definir Roadmap Q3</span>
                                    <span class="font-semibold text-[#10B981]">Completado</span>
                                </div>
                                <div class="w-full bg-slate-100 rounded-full h-2">
                                    <div class="bg-[#10B981] h-2 rounded-full" style="width: 100%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium text-slate-700">Mejorar habilidades de negociación</span>
                                    <span class="font-semibold text-slate-500">60%</span>
                                </div>
                                <div class="w-full bg-slate-100 rounded-full h-2">
                                    <div class="bg-[#1E3A8A] h-2 rounded-full" style="width: 60%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DISCOVER VIEW -->
                <div id="view-discover" class="hidden-view fade-in">
                    <h2 class="text-3xl font-bold text-slate-800 tracking-tight mb-2">Descubrir Mentores</h2>
                    <p class="text-slate-500 mb-8">Filtramos los mejores perfiles según tu test inicial y actividad reciente.</p>

                    <!-- Filters -->
                    <div class="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-2">
                        <button class="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-xl whitespace-nowrap">Todos</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Producto</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Ingeniería</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Liderazgo</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Startups</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Diseño UX</button>
                        <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 whitespace-nowrap">Marketing</button>
                    </div>

                    <!-- Grid de Mentores -->
                    <div class="grid grid-cols-4 gap-6">
                        <!-- Generamos dinámicamente con JS para simplicidad del código, pero aquí van 2 de ejemplo estáticos -->
                        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=5" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-50" alt="Mentor">
                                <div class="text-right">
                                    <span class="text-xs font-bold text-[#10B981] block">98% Match</span>
                                    <span class="text-xs text-amber-500 font-medium flex items-center gap-1 mt-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> 4.9</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Roberto Díaz</h4>
                            <p class="text-sm text-slate-500 mb-2">CTO @ Fintech Global</p>
                            <p class="text-xs text-slate-400 mb-4 leading-relaxed">Especialista en escalar equipos de ingeniería y arquitectura cloud.</p>
                            <div class="flex justify-between items-center border-t border-slate-50 pt-4">
                                <span class="text-xs font-bold text-slate-600">$80/sesión</span>
                                <button class="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Agendar</button>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=44" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-50" alt="Mentor">
                                <div class="text-right">
                                    <span class="text-xs font-bold text-[#10B981] block">93% Match</span>
                                    <span class="text-xs text-amber-500 font-medium flex items-center gap-1 mt-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> 5.0</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Laura Giménez</h4>
                            <p class="text-sm text-slate-500 mb-2">Head of Design @ UIPro</p>
                            <p class="text-xs text-slate-400 mb-4 leading-relaxed">Diseño centrado en el usuario y liderazgo de equipos creativos.</p>
                            <div class="flex justify-between items-center border-t border-slate-50 pt-4">
                                <span class="text-xs font-bold text-slate-600">$60/sesión</span>
                                <button class="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Agendar</button>
                            </div>
                        </div>
                        
                        <!-- Puedes duplicar estos bloques para llenar el grid -->
                         <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer opacity-50">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=13" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-50" alt="Mentor">
                                <div class="text-right">
                                    <span class="text-xs font-bold text-[#10B981] block">89% Match</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Marcos Vidal</h4>
                            <p class="text-sm text-slate-500 mb-2">Marketing Director</p>
                            <p class="text-xs text-slate-400 mb-4 leading-relaxed">Estrategia de crecimiento y adquisición de usuarios.</p>
                            <div class="flex justify-between items-center border-t border-slate-50 pt-4">
                                <span class="text-xs font-bold text-slate-600">$50/sesión</span>
                                <button class="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Agendar</button>
                            </div>
                        </div>
                        
                         <div class="bg-white rounded-2xl p-6 border border-slate-100 card-shadow card-shadow-hover transition-all cursor-pointer opacity-50">
                            <div class="flex justify-between items-start mb-4">
                                <img src="https://i.pravatar.cc/150?img=32" class="w-20 h-20 rounded-full object-cover border-4 border-emerald-50" alt="Mentor">
                                <div class="text-right">
                                    <span class="text-xs font-bold text-[#10B981] block">85% Match</span>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-800">Carolina Pérez</h4>
                            <p class="text-sm text-slate-500 mb-2">HR Lead @ Innovate</p>
                            <p class="text-xs text-slate-400 mb-4 leading-relaxed">Desarrollo de cultura organizacional y talento.</p>
                            <div class="flex justify-between items-center border-t border-slate-50 pt-4">
                                <span class="text-xs font-bold text-slate-600">$45/sesión</span>
                                <button class="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Agendar</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <script>
        // Lógica para cambiar de vista
        function switchView(viewName) {
            // Ocultar todas las vistas
            document.querySelectorAll('.hidden-view, .fade-in').forEach(el => {
                if(el.id && el.id.startsWith('view-')) {
                    el.classList.add('hidden-view');
                    el.classList.remove('fade-in');
                }
            });

            // Mostrar vista seleccionada
            const targetView = document.getElementById(`view-${viewName}`);
            if (targetView) {
                targetView.classList.remove('hidden-view');
                targetView.classList.add('fade-in');
            }

            // Actualizar navegación activa
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
        }
    </script>
</body>
</html>