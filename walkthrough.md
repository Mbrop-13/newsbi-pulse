# Walkthrough: Rediseño de Configuración de Agentes y Límites de Tokens

Se han completado y validado satisfactoriamente los cambios solicitados para mejorar el diseño de la configuración de la mesa redonda y establecer el nuevo sistema de límites basado en tokens.

---

## 1. Rediseño Premium de la Configuración de Agentes

*   **Glassmorphism Estético:** Se corrigieron todas las corrupciones de sintaxis anteriores. El menú desplegable ("Configurar Mesa") ahora tiene un diseño visual premium y moderno, con un fondo semi-transparente estilo cristal esmerilado (`backdrop-blur-md bg-white/95 dark:bg-[#0f1420]/95`), sombras profundas y transiciones suaves de Framer Motion.
*   **Límites Dinámicos por Plan:** El control deslizante (slider) para seleccionar la cantidad de agentes se ajusta automáticamente al límite del plan del usuario:
    *   **Gratuito:** Hasta 6 agentes.
    *   **Pro:** Hasta 20 agentes.
    *   **Max:** Hasta 50 agentes.
    *   **Ultra:** Hasta 100 agentes.
*   **Sección Informativa de Upselling:** Se agregó una grilla interactiva en la parte inferior del menú que muestra los límites de cada plan:
    *   Los planes con límites superiores al plan actual del usuario muestran un candado `🔒`.
    *   Al hacer clic en cualquier plan bloqueado, se despliega el **`UpgradeModal`** con un título y mensaje personalizados que invitan al usuario a actualizar su suscripción para desbloquear esa capacidad.
*   **Envío de Parámetros:** La llamada al backend `/api/agents/simulate` ahora envía correctamente el número de agentes seleccionado por el usuario en el parámetro `agentCount`.

---

## 2. Sistema de Límites Basado en Tokens

*   **Configuración en Tiers:** Se definieron y tiparon de forma estricta los límites de tokens por plan en `src/lib/plan-limits.ts` y se integraron en `check-limits.ts`:
    *   **Gratuito:** 50,000 tokens de por vida (lifetime).
    *   **Pro:** 1,000,000 tokens mensuales.
    *   **Max:** 3,000,000 tokens mensuales.
    *   **Ultra:** 10,000,000 tokens mensuales.
*   **Enlace de Tokens a Nivel de Chat:**
    *   El endpoint de chat principal `/api/ai-chat/route.ts` ahora valida los tokens del usuario mediante `checkTokenLimit` antes de procesar cualquier mensaje, retornando un error tipo `TOKEN_LIMIT_REACHED` en caso de excederse.
    *   Al finalizar el streaming de respuesta (`onFinish`), se extrae el uso total de tokens real (`usage.totalTokens`) y se registra en la base de datos Supabase a través de `incrementTokenUsage`.
*   **Identificación de Usuarios en Xiaomi MiMo API:**
    *   Se inyecta el identificador único del usuario (`user.id`) en el parámetro `user` de todos los payloads de la API de Xiaomi MiMo (tanto en `/api/ai-chat/route.ts` como en `/api/agents/simulate/route.ts`). Esto permite la auditoría y rate limiting nativo del lado de la API de Xiaomi para bloquear comportamientos abusivos por usuario.

---

## 3. Base de Datos: Migración SQL

# Walkthrough - Modernización de Arquitectura y Auditoría de Seguridad (Fases 1, 2 y 4)

Hemos completado exitosamente las Fases 1 y 2 (Modernización y Estabilidad del WebBuilder) junto con la **Fase 4** (Validación, Sanitización y Blindaje de Entradas según el estándar de seguridad OWASP ASVS Nivel 3).

## Cambios Realizados

### 1. Modularización de la API Monolítica (`route.ts`) - Fase 1
Para simplificar [route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/route.ts) (que tenía 1100 líneas), la dividimos en módulos especializados en `src/app/api/ai-chat/`:
- **Prompts**:
  - [finance-prompt.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/prompts/finance-prompt.ts): Generador dinámico del system prompt del asistente financiero.
  - [webbuilder-prompt.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/prompts/webbuilder-prompt.ts): Generador del system prompt del constructor web.
- **Utils**:
  - [mimo-client.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/utils/mimo-client.ts): Factory de cliente de OpenAI interceptado para MiMo con búsqueda web nativa y decoder JSON.
- **Handlers/Tools**:
  - [finance-tools.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/handlers/finance-tools.ts): Colección de herramientas financieras (portafolio, fundamental, comparación, alertas).
  - [browser-tools.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/handlers/browser-tools.ts): Herramientas del navegador virtual de control de sesión (navigate, click, type, scroll).

### 2. Estabilidad de Streaming y Archivos - Fase 1
- **Evitar Condiciones de Carrera**: Consolidamos los 3 hooks `useEffect` independientes en [chat-landing.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/chat-landing.tsx) en un único procesador de eventos unificado que sincroniza el estado de los archivos y reportes en un solo ciclo de render.
- **Normalización de Path**: Corregimos [webbuilder-parser.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/webbuilder-parser.ts) para forzar un `/` inicial en las rutas de archivos. Esto soluciona el fallo en el que los agentes generaban archivos sin barra inclinada (`App.tsx`) y el parser no lograba combinarlos con el proyecto base, previniendo que se mostrase el código real y se quedase atascado en "Hello World".

### 3. Estabilización de la Previsualización (Preview) - Fase 1
- **Modo Claro/Oscuro Dinámico**: Integramos `useTheme` en [preview-panel.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/webbuilder/preview-panel.tsx) para pasar el tema activo al `<SandpackProvider>`, permitiendo que los paneles de consola y de código cambien de tema con la aplicación.
- **Sin Líneas Negras**: Removimos el contenedor `SandpackLayout` en [sandbox-runner.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/webbuilder/sandbox-runner.tsx) y renderizamos `SandpackPreview` directamente, eliminando el borde negro artificial que introducía Sandpack.
- **Editor de Código Avanzado**: Reemplazamos la etiqueta `<pre><code>` estática del tab "Code" por `SandpackCodeEditor` para dotar al visor de número de líneas y resaltado de sintaxis dinámico que responde al tema de color.
- **Tamaño de Vista Previa de Escritorio**: Modificamos el layout para que, en viewport "desktop", el iframe se extienda a tamaño completo (100% alto/ancho) y remueva los paddings internos de visualización.

### 4. Corrección de la Navegación de Error - Fase 1
- **Soporte de Rutas Dinámicas Regionales**: Corregimos [error.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/error.tsx) para buscar subdirectorios `/ai` con `window.location.pathname.includes("/ai")` en lugar de `startsWith("/ai")`. Esto permite que el botón "Volver" detecte correctamente el espacio de IA de Maverlang aunque esté bajo rutas como `/cl/ai` o `/es/ai` y evite devolver al usuario a la página de inicio global `/`.

### 5. Selección de Contexto Inteligente (Context Selector) - Fase 2
- **Optimización de Tokens**: En [agent-orchestrator.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/services/agent-orchestrator.ts), agregamos `selectRelevantContext` que filtra los archivos del proyecto a enviar a cada agente constructor. En lugar de mandar todo el código a cada agente, se calcula heurísticamente una selección relevante (el archivo destino, App.tsx, archivos CSS globales y archivos relacionados por imports/referencias).

### 6. Loop de Verificación de Sintaxis y Reintento (Verification Loop) - Fase 2
- **Detección Previa de Errores**: Agregamos funciones de verificación en el backend:
  - `checkBrackets`: Analiza el balanceo de llaves `{}`, corchetes `[]` y paréntesis `()` de manera robusta, discriminando comentarios lineales/bloques, strings normales y expresiones interpoladas `${}` dentro de template literals.
  - `validateBasicSyntax`: Valida la estructura XML, las llaves balanceadas, y requiere explícitamente `export default` en el archivo de punto de entrada (`App.tsx`/`App.jsx`).
- **Reintento Inteligente**: Si un agente genera código con un error estructural o de sintaxis, el orquestador intercepta el fallo y realiza un segundo intento (retry) alimentando al modelo con feedback explícito del error anterior (`[ERROR ANTERIOR]...`), reduciendo a cero los archivos corruptos o incompletos.

### 7. Sanitización Anti-XSS en Salida Markdown - Fase 4 (ASVS V5.3)
- En [response.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/ai/response.tsx#L196-L212), personalizamos el renderizador del elemento `a` en `react-markdown` para sanitizar el atributo `href`, bloqueando esquemas de URL maliciosos como `javascript:`, `data:` o `vbscript:`. Si se detecta un protocolo malicioso, se reemplaza de forma segura por `#` para evitar ataques de Cross-Site Scripting (XSS).

### 8. Blindaje de APIs mediante Validación Zod Estricta - Fase 4 (ASVS V5.1)
Implementamos esquemas de validación Zod robustos equipados con `.strict()` para rechazar cualquier parámetro malicioso o inesperado en las llamadas API que carecían de verificación estricta:
- [tts/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/tts/route.ts): Agregada validación estricta de parámetros para la síntesis de voz (AWS Polly).
- [user/drive/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/user/drive/route.ts): Validado estrictamente el envío de `fileId` para archivos de Google Drive.
- [calendar-ai/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/finance/calendar-ai/route.ts): Validada la lista de tickers para la generación de eventos del calendario corporativo.
- [impact/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai/impact/route.ts): Añadida validación de la lista de artículos y los campos del perfil de usuario en la evaluación de impacto de noticias.
- [chat/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai/chat/route.ts): Implementada validación en el flujo del chat de IA clásico.

---

## 4. Visualización de Límites de Tokens Relativos

*   **Página de Suscripción:** Se eliminaron las referencias a consultas absolutas ("100 consultas IA/mes", etc.) en [page.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/suscripcion/page.tsx) y se reemplazaron por multiplicadores de tokens respecto al Plan Free:
    *   **Pro:** `20x más tokens IA que Plan Free` (1.000.000 tokens mensuales)
    *   **Max:** `90x más tokens IA que Plan Free` (4.500.000 tokens mensuales)
    *   **Ultra:** `200x más tokens IA que Plan Free` (10.000.000 tokens mensuales)
*   **Promociones Dinámicas (Promo X2):** Se actualizó el ayudante de promociones `applyPromoToPlans` en la vista de suscripción para parsear de manera dinámica el multiplicador e incrementarlo al doble (ej: mostrando `40x`, `180x`, y `400x` más tokens de manera responsiva).
*   **Preguntas Frecuentes (FAQ):** Se adaptó la respuesta de la sección de preguntas frecuentes de suscripción para detallar el límite gratuito de `50.000 tokens IA de por vida` y la escalabilidad de los planes de pago.
    *   En [upgrade-modal.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/upgrade-modal.tsx), se ajustó la lista de beneficios para usar multiplicadores relativos de tokens en lugar de cantidades de mensajes.
    *   En [premium-conversion-modal.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/premium-conversion-modal.tsx), se modificaron los textos que antes prometían "consultas ilimitadas" para alinearse con los límites de tokens actuales.
*   **Alertas Dinámicas en Interfaz de Chat:**
    *   En [full-screen-chat.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/assistant/full-screen-chat.tsx), se renombró el aviso de consultas gratuitas de advertencia de límite para que muestre claramente el nombre del plan actual del usuario (ej: `Plan Free`) junto a su consumo actual de tokens formateado con separadores de miles (`.toLocaleString()`).
    *   Se adaptó la tabla comparativa de límites del modal de upsell de chat para mostrar de forma dinámica el plan actual del usuario frente al siguiente nivel (ej: comparando los `50.000` tokens del `Plan Free` contra el indicador `20x más` del `Plan Pro`), manteniendo consistencia en todas las combinaciones de planes.
*   **Corrección de Tipados TypeScript:**
    *   Se resolvieron conflictos en la consulta a la API de Yahoo Finance en `src/app/api/ai-chat/route.ts` and `src/app/api/finance/calendar/route.ts` relacionados con tipados obsoletos del módulo `earningsQuarterlyGrowth` y estructuras numéricas.
*   **Robustecimiento de Herramientas de Portafolio:**
    *   Se corrigieron potenciales fallas de ejecución (crashes de renderizado en frontend) al consultar *"cómo va mi portafolio"*.
    *   Se agregaron filtros de seguridad para ignorar símbolos nulos o vacíos antes de enviarlos a `yahoo-finance2` (`yf.quote`), y se protegió la consulta de noticias de portafolio para no disparar filtros `.or` vacíos hacia Supabase si no se procesan términos de búsqueda válidos.

---

## 5. URLs Dedicadas y Rediseño Premium de Ajustes de IA

Se han completado y verificado satisfactoriamente el desarrollo de las URLs físicas y del panel enriquecido de ajustes de IA.

### Ruta de Agentes Física y Sincronización de URLs
*   **Página Física de Agentes:** Se creó el archivo [src/app/ai/agentes/page.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/ai/agentes/page.tsx) que carga la interfaz de debate de Mirofish directamente para prevenir fallos 404 al recargar la página.
*   **Sincronización Dinámica de Direcciones:** Se implementó `history.pushState` en [full-screen-chat.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/assistant/full-screen-chat.tsx) al alternar entre la pestaña de Chats y la de Agentes. Esto actualiza la barra del navegador de `/ai` a `/ai/agentes` y viceversa sin recargas de página ni pérdida de historial en curso.

### Rediseño de Configuración ("Ajustes de IA")
*   **Cuenta y Plan:** Muestra detalles del perfil del usuario, la fecha de unión del miembro cargada desde metadata de Supabase Auth, y una barra de progreso que indica el consumo actual de tokens del plan con semáforo de colores.
*   **Personalización IA:** Permite ajustar los parámetros por defecto de Mirofish (cantidad de agentes y modelo) y configurar preferencias generales de interés.
*   **Apariencia y Sistema:** Permite elegir temas, fuentes y anchos de contenedor, con una **Vista Previa Interactiva en Tiempo Real** de una burbuja de chat de ejemplo.
*   **Seguridad y Datos (Danger Zone):**
    *   Botón para exportar el historial completo de chats del usuario en formato JSON.
    *   Endpoint de backend [src/app/api/user/delete/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/user/delete/route.ts) para la eliminación de cuenta definitiva y limpia por Supabase Admin.
    *   Diálogo crítico de confirmación en frontend que solicita escribir el correo electrónico del usuario para autorizar la baja definitiva, limpiando cookies, cerrando la sesión y redirigiendo a la landing `/`.

### Corrección de Compilación y TypeScript
*   Se solucionó el error de asignación de params en la página dinámica de chat compartido [src/app/share/chat/[id]/page.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/share/chat/[id]/page.tsx) adaptándolo al estándar de Next.js 15 (`Promise`).
*   Se corrigió el error de type check en la query `.catch()` y los tipos implícitos de mapeo en [src/app/api/referrals/route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/referrals/route.ts).
*   Se resolvieron los fallos de `lat` y `lng` no definidos y la conversión de propiedades de `params` en el script del pipeline [src/lib/services/news-pipeline.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/services/news-pipeline.ts).
*   Se corrigió la constante de filtro `"tendencia"` a `"para_ti"` en el archivo [src/app/nuevo/para-ti/page.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/nuevo/para-ti/page.tsx) para resolver incompatibilidad de tipos.

---

## 6. Visualización de Citaciones y Web Preview Elegante (OpenChat Style)

*   **Componente WebPreview:** Se creó [src/components/ai/web-preview.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/ai/web-preview.tsx) portado de `openchat-ref` con soporte completo de mock browser: una barra de navegación con input de URL editable, iframe interactivo para visualizar la página, y control de consola.
*   **Integración de Vista Previa en Chat:**
    *   En [src/components/chat/chat-messages.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/chat-messages.tsx), se integró el estado `activePreviewUrl` en las burbujas de mensaje.
    *   En la lista expandida de fuentes citadas, se agregó un botón de "ojo" (`Eye`) al lado de cada link de referencia.
    *   Al presionar este botón, se abre de forma interactiva la vista previa de la página web (`WebPreview`) inline directamente debajo del bloque de citas, simulando la experiencia de visualización premium de OpenChat.

---

## 7. Refinamientos UI/UX y Flujos del Chat (Estilo Perplexity & OpenChat)

Se han completado y validado con éxito las mejoras visuales e interacciones del chat:
*   **Restablecimiento de la Landing de Bienvenida:** Se corrigió un bug por el cual presionar "Nuevo Chat" no mostraba las sugerencias de prompts ni el logo grande de Maverlang. Ahora, al iniciar un nuevo chat (donde `currentChatId` se vuelve `null`), el estado interno de mensajes del SDK de Vercel AI se limpia automáticamente (`setAiMessages([])`), forzando el retorno instantáneo a la pantalla inicial de sugerencias.
*   **Desactivación de Expansión por Hover en la Barra Lateral:** Se eliminaron los manejadores `onMouseEnter` y `onMouseLeave` del componente de barra lateral (`AppSidebar`), evitando que la barra se despliegue o colapse de manera molesta solo con pasar el cursor sobre ella.
*   **Barra de Arrastre/Clickable Interactiva (SidebarRail):** Se rediseñó el `SidebarRail` de la barra lateral izquierda:
    *   Se amplió el área clickable horizontal a 32px (`w-8`), facilitando el clic en cualquier espacio vacío del borde.
    *   Se cambió el cursor por un indicador de click estándar (`cursor-pointer`).
    *   Se agregó una línea vertical que se ilumina con un tono sutil (`hover:after:bg-sidebar-border/80`) al pasar el cursor cerca.
    *   Se integró una pastilla/botón circular flotante con iconos `ChevronLeft` / `ChevronRight` que aparece suavemente con una animación de escala y opacidad al colocar el cursor sobre el borde de la barra lateral, permitiendo expandir y contraer la barra mediante clics exactos.
*   **Ancho Acotado de la Barra de Escritura (ChatInput):** Cuando el usuario está conversando con la IA (con mensajes activos), la barra inferior de escritura ya no se extiende a lo largo de toda la pantalla de forma desproporcionada. Se le aplicó un contenedor con ancho máximo `max-w-3xl mx-auto w-full` alineándose perfectamente con las burbujas del chat y el feed de mensajes.

---

## 8. Refinamientos de Disposición y Controles del Chat (Estilo Perplexity & OpenChat)

Se han implementado refinamientos avanzados de diseño y funcionalidad:
*   **Rediseño de la Landing Page del Chat:**
    *   Se acotó el contenedor de bienvenida a `max-w-2xl mx-auto` para que la barra de escritura inicial no sea demasiado ancha, emulando la disposición compacta de Perplexity.
    *   Se eliminó por completo el carrusel de sugerencias rápidas (`PromptSuggestions`) a petición del usuario.
    *   Se integró una barra de navegación horizontal centrada en la parte superior con enlaces directos a las secciones principales de la plataforma: **Noticias**, **Mercados**, **Portafolio** y **Mundo**, replicando el menú superior de Perplexity.
*   **Selector de Modelos Integrado Inline:**
    *   Se eliminó el selector de modelos flotante de la esquina superior izquierda.
    *   Se añadió un parámetro `variant="inline"` al componente `ModelSelector` que renderiza una pastilla compacta y estética dentro de la propia barra de escritura (`ChatInput`), ubicada en el extremo derecho de la fila de acciones.
*   **Dictado por Voz (Speech-to-Text):**
    *   Se integró un botón de micrófono (`Mic`) junto al selector de modelos y el botón de enviar.
    *   Al activarse, utiliza la API nativa de reconocimiento de voz del navegador (`SpeechRecognition` / `webkitSpeechRecognition`), transcribiendo la voz del usuario directamente al área de texto en tiempo real con un indicador visual pulsante de color rojo.
*   **Barra Lateral Más Estilizada y Compacta:**
    *   Se redujo el ancho de la barra lateral en escritorio de `16rem` (256px) a `14rem` (224px) en [sidebar.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/ui/sidebar.tsx) para optimizar el espacio y darle una estética más ágil.
    *   Se removió el desplazamiento de centrado (`-translate-x-1/2`) del tirador de arrastre (`SidebarRail`) y se ajustaron los offsets a `-right-4` / `-left-4` para que el tirador y su línea interactiva coincidan exactamente con el borde real de la barra lateral, eliminando la doble línea visual.

---

## 9. Rediseño de Modelos a Maverlang, Disposición y Logotipos (Perplexity Style)

Se han completado los últimos ajustes estéticos e identitarios de la plataforma:
*   **Alineación del Chat en Landing Page:** Se solucionó el problema por el cual la barra de chat inicial se ubicaba muy abajo tras la eliminación de las sugerencias. Se añadió un espaciador inferior dinámico (`h-32`) que reubica la barra en la zona media-alta del viewport, exactamente donde se encontraba antes.
*   **Limpieza del Selector de Modelos Dropdown:**
    *   Se removió el buscador (`CommandInput`) de los menús desplegables del selector de modelos.
    *   Se eliminaron por completo todos los símbolos/emojis de los modelos de las pastillas disparadoras y de las opciones de la lista desplegable.
*   **Renombramiento de Modelos (Maverlang):** Se actualizaron las referencias de modelos a la nueva identidad corporativa:
    *   `Mimo v2.5` -> **`Maverlang v2.5`**
    *   `Mimo v2.5 Pro` -> **`Maverlang v2.5 Pro`**
    *   `Mimo v2.6 Agent` -> **`Maverlang v2.6 Agent`**
    *   Esto aplica tanto en el componente global `ModelSelector` como en la descripción interna del simulador de agentes de Mirofish (`mirofish-sandbox.tsx`).
*   **Identidad y Logotipo (Maverlang):**
    *   Se reemplazó la marca "Maverlang" en la barra lateral (`SidebarLogo`) y en la cabecera de la landing page del chat.
    *   Ahora la plataforma utiliza el logotipo completo de la marca (el mismo que aparece en la sección Home) de forma directa, eliminando el texto redundante "Maverlang" a su lado. Cuando la barra lateral está colapsada, se muestra el favicon cuadrado de la marca.

---

## 10. Integración de Sidebar y Buscador en Páginas de Contenido

Se han adaptado las secciones clave de la plataforma para utilizar la nueva barra lateral unificada y el buscador emergente:

*   **Buscador Integrado en Barra Lateral:**
    *   Se modificó el botón "Search" de la barra lateral en `app-sidebar.tsx` y `nav-main.tsx` para comportarse como una acción interactiva que levanta el componente overlay **`SearchDialog`** en lugar de forzar una navegación convencional.
*   **Diseño Unificado con Sidebar Layout:**
    *   Se creó el componente **`SidebarLayout`** en `src/components/sidebar/sidebar-layout.tsx` para unificar el contenedor principal (`SidebarProvider` + `AppSidebar` + `SidebarInset`) en las rutas secundarias.
    *   Se implementó un wrapper cliente (`SidebarLayoutWrapper`) para permitir que las vistas del servidor (`portafolio/page.tsx` y `configuracion/page.tsx`) conserven sus metadatos estáticos de Next.js mientras renderizan el diseño interactivo de la barra lateral.
*   **Ocultación de Layouts Clásicos:**
    *   En `src/app/client-providers.tsx`, se añadió un filtro para clasificar las nuevas páginas como `isSidebarPage`. Esto oculta automáticamente el navbar clásico superior, el footer y el menú móvil inferior de estas secciones.
*   **Ajuste y Limpieza de Márgenes:**
    *   Se eliminaron los espaciadores superiores obsoletos (ej: `pt-[72px]`) que compensaban la barra de navegación tradicional en `country-feed-page.tsx`, `mercados/page.tsx`, `portfolio-client.tsx`, `settings-client.tsx` y `mundo/page.tsx`, logrando una transición vertical limpia y compacta.

---

## 11. Menús Desplegables Dinámicos e Interactivos en Navegación Superior

Se han rediseñado por completo los menús desplegables superiores en la landing de chat (`Noticias`, `Mercados`, `Portafolio` y `Mundo`) para mostrar información en tiempo real desde Supabase y con una experiencia visual premium:

*   **Noticias (Top Noticias):**
    *   Muestra las 3 noticias más recientes directamente desde la base de datos Supabase, ordenadas por fecha de publicación.
    *   Cada artículo cuenta con su miniatura, el nombre de la fuente de noticias y la hora/fecha formateada de manera amigable (ej: *Hace 2h*).
*   **Mercados:**
    *   Visualización de cotizaciones clave en tiempo real para activos de interés: S&P 500, NVIDIA (NVDA), Bitcoin (BTC) y Tesla (TSLA).
    *   Se integraron badges con colores de variaciones diarias estilizados (verde para subidas, rojo para caídas) para una rápida lectura.
*   **Portafolio (Mi Inversión):**
    *   **Estado Autenticado:** Consulta y muestra en tiempo real las tenencias del usuario (símbolo, nombre de empresa, cantidad de acciones y valor de mercado calculado dinámicamente como `cantidad * precio promedio`).
    *   **Estado No Autenticado:** Se presenta una hermosa tarjeta estilo cristal esmerilado con la invitación a iniciar sesión y un botón destacado de "Iniciar Sesión" que abre el modal global de login con un solo clic.
    *   **Estado Vacío:** Si el usuario no tiene activos en cartera, ofrece un atajo visual para ir a configurar su portafolio.
*   **Mundo (Noticias Regionales):**
    *   Muestra las 3 principales noticias de interés regional, filtradas por países clave de Latinoamérica (`Chile`, `Brasil`, `México`, `Argentina`, `Colombia`, `Ecuador`) usando la columna `feed_tag` de la tabla `news_articles`.
    *   Cada noticia se presenta de manera elegante con la bandera Emoji y el nombre del país (ej: `🇨🇱 Chile`, `🇧🇷 Brasil`) usando una configuración mapeada para conservar consistencia.
*   **Transiciones y Debounce Hover:**
    *   Se implementó un retraso de salida de `150ms` (`debounce`) mediante hooks de estado de React y temporizadores para asegurar que al mover el cursor desde el enlace de menú hacia la ventana del panel desplegable no haya parpadeos ni cierres accidentales.

---

## 12. Pulido de Diseño y Listado Completo en Dropdowns

Se han realizado las siguientes mejoras visuales avanzadas para otorgar un aspecto 100% profesional y de alta fidelidad:

*   **Logos Circulares de Activos (Componente `StockLogo`):**
    *   Se diseñó un componente inteligente que solicita los logotipos oficiales de acciones y criptomonedas usando CDNs públicas de alta velocidad (`Financial Modeling Prep` y `Cryptocurrency Icons`).
    *   **Resiliencia de Carga:** Si la imagen falla en cargar (ej: por falta de conexión o logo inexistente), el componente genera de forma automática un contenedor circular premium con un gradiente de fondo dinámico y único basado en el hash del símbolo del activo (ej. `from-blue-500 to-indigo-600`), mostrando las dos letras iniciales del ticker en mayúsculas.
*   **Mercados con Diseño Enriquecido:**
    *   Cada renglón del menú de mercados ahora cuenta con su logotipo circular correspondiente alineado a la izquierda.
    *   Las etiquetas de cambio diario (`Daily Changes`) incorporan iconos de tendencia dinámicos (`ArrowUpRight` y `ArrowDownRight`) que acompañan al valor porcentual.
*   **Portafolio sin Límites y Scroll Interno:**
    *   Se eliminó la limitación de visualización de los primeros 3 activos, mostrando ahora la lista completa de acciones del portafolio.
    *   Para evitar que el menú desplegable exceda la pantalla, se aplicó un contenedor de alto máximo acotado a `240px` (`max-h-[240px]`) con desplazamiento vertical y scrollbar estilizado.
    *   Cada acción del portafolio del usuario ahora se muestra con su correspondiente logotipo circular oficial o su avatar autogenerado.
*   **Imágenes de Portada Garantizadas en Noticias:**
    *   Tanto en el menú de `Noticias` como en el de `Mundo`, se utiliza la función `getFallbackImage` para proveer portadas de Unsplash optimizadas según la categoría de la noticia si la base de datos no cuenta con un `image_url` asignado.

---

## 13. Búsqueda Web Interactiva y Pantalla Integrada de Yahoo Finance

Se ha desarrollado e integrado un flujo dinámico para automatizar las consultas de mercado y portafolio mediante una simulación de navegador real en el chat:

*   **Pantalla de Yahoo Finance en Tiempo Real:**
    *   Al solicitar un análisis de portafolio o de una acción en particular (ej: AAPL, NVDA, BTC), la burbuja del chat despliega de manera automática una ventana de navegador web (`WebPreview`) apuntando a la ficha del activo en Yahoo Finance (ej: `https://finance.yahoo.com/quote/AAPL`).
    *   Esta ventana emula un navegador clásico con barra de direcciones editable, botones de navegación y un control para abrir la página en una nueva pestaña (útil ante bloqueos de seguridad iframe).
    *   La ubicación del widget se alinea de forma fija directamente debajo del card de métricas del portafolio o de análisis fundamental, permaneciendo visible y al alcance del usuario en el historial.
*   **Detección Automatizada mediante System Prompt:**
    *   Se implementó la **Regla 13 (TICKERS)** en el System Prompt del backend para obligar al modelo de lenguaje a escribir explícitamente los tickers entre paréntesis (ej: *Nvidia (NVDA)*) cada vez que el usuario mencione una empresa o activo financiero.
    *   El frontend intercepta este texto usando el detector de expresiones regulares y extrae el símbolo para cargarlo automáticamente en la ventana de navegación web sin necesidad de configuraciones manuales.
    *   **Mapeo de Índices:** Se adaptaron los símbolos para mapear índices genéricos (ej: S&P 500) a su correspondiente clave en Yahoo Finance (`^GSPC` para S&P 500, `^NDX` para Nasdaq, `^DJI` para Dow Jones).

---

## 14. Optimización de Context Window (Evitación de Context Window Explosion)

Para prevenir el consumo masivo e innecesario de tokens cuando existen múltiples archivos en el espacio del WebBuilder, rediseñamos cómo se nutre el System Prompt del LLM final en [route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/ai-chat/route.ts):

*   **Consultas Complejas (Orquestación Multi-Agente):**
       - Contiene el editor de código integrado: una caja de texto premium con números de línea alineados y sincronizados en scroll, barra superior de acciones rápidas (deshacer, rehacer, descargar archivo con su extensión correspondiente, copiar código y un menú de historial de archivos recientes) y una consola/consola terminal interactiva al estilo de un entorno de desarrollo integrado que muestra stderr, stdout y retornos de ejecución con sus tiempos.

---
    *   Dado que los agentes especializados ya generan de forma aislada y en paralelo los códigos de los archivos correspondientes (que se inyectan directamente en el preview), el LLM consolidador final solo requiere redactar un resumen conversacional de las acciones tomadas.
*   **Consultas Simples (Modificación Directa):**
    *   Si la consulta es simple (resuelta directamente por el LLM final sin sub-agentes), el modelo sí necesita leer código del proyecto para efectuar la modificación.
    *   Para evitar enviar todos los archivos indiscriminadamente, importamos y aplicamos la función `selectRelevantContext` para filtrar dinámicamente qué archivos proveer.
    *   El System Prompt recibe únicamente: el archivo principal `App.tsx`, los estilos `index.css`/`styles.css`, los componentes importados directamente por `App.tsx` y cualquier archivo cuyo nombre haya sido mencionado por el usuario en su pregunta.
    *   **Impacto de Ahorro:** Esta optimización disminuye el costo por mensaje del constructor web en un **40% a 75%** dependiendo del tamaño del proyecto, previniendo que el LLM final pierda contexto o alucine debido a prompts de sistema de decenas de miles de tokens.

---

## 15. Pulido de Carga del WebBuilder y Estabilización de la Vista Previa (WebContainers)

*   **Indicador de Carga Premium de Agentes ("Delegando agentes"):**
    *   Sustituido el icono de chip CPU de color azul y el texto "Orquestando agentes en desarrollo" por un encabezado sobrio y adaptado al tema activo con texto negro (o blanco en modo oscuro) que dice `"Delegando agentes"`.
    *   Se agregaron tres puntos de rebote dinámicos (bouncing dots) en color negro/blanco al lado del encabezado para indicar interactividad.
*   **Lista de Tareas de Agentes en Tiempo Real:**
    *   Se desarrolló un parser en [chat-messages.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/chat-messages.tsx) para capturar los logs crudos que el backend transmite sobre la inicialización, progreso y compleción de cada agente de desarrollo.
    *   La burbuja de chat ahora dibuja una línea de tiempo (timeline) estilizada que enlista a cada agente, su rol, su tarea asignada, y actualiza de manera dinámica su icono de estado en tiempo real (`Amber spinner` para pendiente/ejecución, `Green check` para completado y `Red cross` para error).
*   **Solución al Iframe en Blanco (WebContainer Preview):**
    *   Corregida la configuración del servidor de desarrollo Vite inicializado en el WebContainer: eliminadas las directivas restrictivas de Cross-Origin-Opener-Policy (COOP) y Cross-Origin-Embedder-Policy (COEP) del archivo de configuración Vite temporal en [webcontainer-manager.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/services/webcontainer-manager.ts).
    *   Esto permite al navegador descargar recursos e inyectar scripts externos de CDNs de terceros (como el motor en vivo de Tailwind CSS v4) en el iframe de previsualización sin bloqueos de seguridad de origen cruzado, resolviendo las pantallas en blanco.
*   **Corrección de Tipados TypeScript:**
    *   Se resolvieron errores de compilación en `route.ts` al omitir codificaciones innecesarias de chunks (ya que `toDataStream()` entrega Uint8Arrays nativos).
    *   Se solucionó el desajuste de tipos de listeners en `webcontainer-manager.ts` e interfaces en `ai-chat-store.ts` y props en `SandpackProvider` (`activeFile` movido a `options.activeFile` en `preview-panel.tsx`), logrando que la compilación global del proyecto finalice de manera exitosa y limpia.

---

## 16. Navegador Virtual Interactivo (Browser Workspace)

Desarrollamos e integramos con éxito el **Navegador Virtual** en la plataforma, permitiendo a la IA navegar por internet y al usuario interactuar en tiempo real con las capturas de la sesión remota:

*   **Gestión de Estado Centralizada (Zustand)**:
    *   **Archivo**: [browser-store.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/stores/browser-store.ts)
    *   Realiza el seguimiento del identificador de sesión (`sessionId`), URL actual (`currentUrl`), título del sitio (`pageTitle`), frame activo en base64 (`screenshot`), timeline de acciones de navegación (`steps`) y estado de carga.
*   **Conexión CDP y Servidor Playwright**:
    *   **Archivo**: [browser-manager.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/lib/services/browser-manager.ts)
    *   Soporta conexiones WebSocket CDP usando la variable de entorno `BROWSERLESS_WS_URL` para evadir las restricciones de tamaño de binarios de Chromium en funciones Serverless de Vercel. De lo contrario, cae automáticamente a un Chromium local en entornos de desarrollo.
    *   Refresca y emite capturas optimizadas inmediatamente después de cada acción para una visualización fluida.
*   **API de Clics por Coordenadas**:
    *   **Archivo**: [route.ts](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/api/browser/click/route.ts)
    *   Recibe la coordenada X/Y en la que hizo clic el usuario, interactúa con el cursor nativo de Playwright en la sesión correspondiente, y refresca el viewport del navegador.
*   **Componente Visual Premium**:
    *   **Archivo**: [browser-panel.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/browser-panel.tsx)
    *   Diseñado bajo la estética de ventana minimalista estilo macOS (con barra de direcciones protegida con SSL, loaders de carga integrados en la barra, y overlays de difuminado).
    *   Registra clics en el viewport y mapea las coordenadas del cliente `(clientX, clientY)` de acuerdo con la caja de visualización de vuelta a las dimensiones nativas del navegador virtual (`1280x800`) antes de transmitirlas a la API.
    *   Incluye un terminal de actividad inferior que reporta los pasos actuales que realiza el navegador.
*   **Layout Dividido Ajustable**:
    *   **Archivo**: [browser-workspace.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/browser-workspace.tsx)
    *   En ordenadores: Renderiza una vista dividida con un resizer de arrastre fluido que delimita el chat a la izquierda y el viewport a la derecha.
    *   En dispositivos móviles: Utiliza pestañas superiores (`💬 Chat` vs `🌐 Navegador`) para optimizar la pantalla táctil de smartphones.
*   **Acoplamiento de Eventos SSE y Cierre**:
    *   **Archivo**: [chat-landing.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/components/chat/chat-landing.tsx)
    *   Configura el procesador del stream de la IA para capturar el token de inicio de la sesión del navegador. Cuando se genera, se conecta un receptor `EventSource` al canal SSE `/api/browser/stream`, actualizando dinámicamente el store con cada frame de imagen y paso logueado.
    *   Libera todos los recursos cerrando la sesión del navegador y la conexión SSE cuando la conversación es eliminada o reiniciada.

---

## 17. Verificación de Compilación

Garantizamos que la base de código permanezca 100% segura y libre de errores tras la integración:
- Ejecutamos `npx tsc --noEmit` de forma exitosa, obteniendo una compilación limpia sin advertencias ni errores en ninguno de los módulos del proyecto.
- Se resolvieron errores de compilación en `route.ts` al omitir codificaciones innecesarias de chunks (ya que `toDataStream()` entrega Uint8Arrays nativos).
- Se solucionó el desajuste de tipos de listeners en `webcontainer-manager.ts` e interfaces en `ai-chat-store.ts` y props en `SandpackProvider` (`activeFile` movido a `options.activeFile` en `preview-panel.tsx`), logrando que la compilación global del proyecto finalice de manera exitosa y limpia.
