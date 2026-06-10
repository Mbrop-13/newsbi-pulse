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

*   Se creó el script de migración **[add-tokens-columns.sql](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/add-tokens-columns.sql)** en la raíz del proyecto para asegurar que la base de datos Supabase cuente con las columnas `ai_tokens` (en `monthly_usage`) y `ai_tokens_total` (en `lifetime_usage`) requeridas para persistir el consumo de tokens del usuario.

---

## 4. Visualización de Límites de Tokens Relativos

*   **Página de Suscripción:** Se eliminaron las referencias a consultas absolutas ("100 consultas IA/mes", etc.) en [page.tsx](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/src/app/suscripcion/page.tsx) y se reemplazaron por multiplicadores de tokens respecto al Plan Free:
    *   **Pro:** `20x más tokens IA que Plan Free` (1.000.000 tokens mensuales)
    *   **Max:** `90x más tokens IA que Plan Free` (4.500.000 tokens mensuales)
    *   **Ultra:** `200x más tokens IA que Plan Free` (10.000.000 tokens mensuales)
*   **Promociones Dinámicas (Promo X2):** Se actualizó el ayudante de promociones `applyPromoToPlans` en la vista de suscripción para parsear de manera dinámica el multiplicador e incrementarlo al doble (ej: mostrando `40x`, `180x`, y `400x` más tokens de manera responsiva).
*   **Preguntas Frecuentes (FAQ):** Se adaptó la respuesta de la sección de preguntas frecuentes de suscripción para detallar el límite gratuito de `50.000 tokens IA de por vida` y la escalabilidad de los planes de pago.
*   **Modales de Conversión y Upgrade:** 
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

## 9. Rediseño de Modelos a Reclu, Disposición y Logotipos (Perplexity Style)

Se han completado los últimos ajustes estéticos e identitarios de la plataforma:
*   **Alineación del Chat en Landing Page:** Se solucionó el problema por el cual la barra de chat inicial se ubicaba muy abajo tras la eliminación de las sugerencias. Se añadió un espaciador inferior dinámico (`h-32`) que reubica la barra en la zona media-alta del viewport, exactamente donde se encontraba antes.
*   **Limpieza del Selector de Modelos Dropdown:**
    *   Se removió el buscador (`CommandInput`) de los menús desplegables del selector de modelos.
    *   Se eliminaron por completo todos los símbolos/emojis de los modelos de las pastillas disparadoras y de las opciones de la lista desplegable.
*   **Renombramiento de Modelos (Reclu):** Se actualizaron las referencias de modelos a la nueva identidad corporativa:
    *   `Mimo v2.5` -> **`Reclu v2.5`**
    *   `Mimo v2.5 Pro` -> **`Reclu v2.5 Pro`**
    *   `Mimo v2.6 Agent` -> **`Reclu v2.6 Agent`**
    *   Esto aplica tanto en el componente global `ModelSelector` como en la descripción interna del simulador de agentes de Mirofish (`mirofish-sandbox.tsx`).
*   **Identidad y Logotipo (Reclu):**
    *   Se reemplazó la marca "Maverlang" en la barra lateral (`SidebarLogo`) y en la cabecera de la landing page del chat.
    *   Ahora la plataforma utiliza el logotipo completo de la marca (el mismo que aparece en la sección Home) de forma directa, eliminando el texto redundante "Reclu" a su lado. Cuando la barra lateral está colapsada, se muestra el favicon cuadrado de la marca.

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



