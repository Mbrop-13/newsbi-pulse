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
