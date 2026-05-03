# Plan de Implementación: AI Assistant v2.0 (Streaming y Tools)

Este plan detalla la actualización de la interfaz de Inteligencia Artificial para soportar escritura en tiempo real (streaming), integración de herramientas nativas (function calling) y mejoras en la experiencia de usuario.

## Resumen de Cambios

1. **Reinicio de Chat Automático:** Configurar el estado para que al cerrar la ventana de la IA y volver a abrirla, se inicie una conversación completamente nueva.
2. **Escritura en Vivo (Streaming):** Migrar el backend al Vercel AI SDK para permitir que el texto se genere progresivamente en la pantalla (efecto máquina de escribir) sin mostrar los llamados a herramientas (tools) en el texto plano.
3. **Herramientas de IA (Function Calling):**
   - `get_portfolio_news`: Permite a la IA buscar noticias recientes relevantes *exclusivamente* para los activos del portafolio del usuario.
   - `search_general_news`: Permite a la IA buscar noticias por etiqueta (ej. "trump") y límite de tiempo (ej. "24h").
   - `get_news_context`: Permite a la IA profundizar y obtener el contenido completo de una noticia específica si necesita más contexto para responder.
4. **Interfaz de Noticias Analizadas:** Crear un componente visual atractivo (similar al de acciones) para mostrar las noticias que la IA consultó mediante las herramientas. Al hacer clic, se desplegará un menú/modal con la lista de noticias analizadas y un botón para leer el artículo original.

## User Review Required

> [!IMPORTANT]
> **Reinicio de Chat:** Al implementar que siempre se inicie un chat nuevo al salir, si el usuario cierra el panel por accidente, perderá la vista actual (aunque el chat seguirá guardado en el historial de "Chats Anteriores"). ¿Estás de acuerdo con este comportamiento estricto?

> [!IMPORTANT]
> **Vercel AI SDK:** Para lograr el streaming perfecto y el manejo de herramientas de forma estructurada, instalaré las librerías `ai` y `@ai-sdk/openai`. Esto es el estándar moderno en Next.js.

## Cambios Propuestos

---

### Dependencias

#### [NEW] Instalación de Paquetes
- Instalación de `ai` y `@ai-sdk/openai` vía NPM para soportar streaming y function calling con OpenRouter.

---

### Backend (API)

#### [MODIFY] `src/app/api/ai/chat/route.ts`
- Migrar de un llamado fetch simple a `streamText` del Vercel AI SDK.
- Configurar el proveedor OpenAI compatible con OpenRouter.
- Declarar e implementar las herramientas:
  - `get_portfolio_news`
  - `search_general_news`
  - `get_news_context`
- Modificar el System Prompt para guiar a la IA en el uso de estas herramientas de forma invisible para el usuario final.

---

### Frontend (Estado y UI)

#### [MODIFY] `src/lib/stores/ai-chat-store.ts`
- Actualizar el método `close()` para que invoque `clearMessages()` y resetee `currentChatId`, asegurando un chat en blanco al volver a entrar.
- Adaptar la interfaz `ChatMessage` para soportar las estructuras del Vercel AI SDK.

#### [MODIFY] `src/components/assistant/full-screen-chat.tsx`
- Integrar el hook `useChat` del Vercel AI SDK para manejar el streaming.
- Filtrar los mensajes de tipo `tool-call` para que no se rendericen como texto crudo.
- Renderizar un componente visual `AnalyzedNewsCard` cuando la IA devuelva resultados de noticias.

#### [NEW] `src/components/assistant/analyzed-news-card.tsx`
- Crear el componente tipo acordeón o menú desplegable para mostrar las noticias consultadas.
- Incluir un enlace ("Leer noticia completa") que dirija al usuario a la URL del artículo.

## Verification Plan

### Automated Tests
- Compilar el proyecto (`npm run build`) para verificar que no haya errores de tipado con las nuevas interfaces.

### Manual Verification
- Abrir y cerrar la IA para confirmar que empieza en blanco.
- Preguntar a la IA "¿Qué noticias hay sobre mi portafolio?" y verificar:
  1. Que la IA escriba en vivo.
  2. Que aparezca la tarjeta visual con las noticias analizadas.
  3. Que no se vea el código JSON del llamado a la herramienta.
- Preguntar "¿Qué pasó con Trump en las últimas 24h?" para probar `search_general_news`.
