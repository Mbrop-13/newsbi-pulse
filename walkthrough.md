# Actualización de la AI Assistant: Streaming y Herramientas Nativas

Se han implementado satisfactoriamente los últimos requerimientos técnicos sobre la experiencia de la IA (Streaming en vivo, reset de chat, y búsquedas con contexto del portafolio).

## Resumen de Cambios
1. **Reset al cerrar:** Se modificó el store principal de la IA (`src/lib/stores/ai-chat-store.ts`) para que limpie el estado del chat al cerrarse, forzando a que la próxima vez que entres inicies desde un chat limpio y sin historial previo acumulado.
2. **Vercel AI SDK (Streaming):** Se integró exitosamente `useChat` de la librería `ai` de Vercel en la interfaz gráfica (`full-screen-chat.tsx`). Ahora las respuestas de la IA se transmiten palabra por palabra (streaming en vivo) sin tener que esperar a que el LLM termine toda su respuesta.
3. **Herramientas de Búsqueda de Noticias (Native Tools):** La ruta de la API (`src/app/api/ai-chat/route.ts`) se reescribió por completo para dotar al agente de herramientas formales usando el sistema `tool()` de Vercel AI SDK. Las siguientes funciones pueden ser llamadas nativamente por el LLM:
   - `get_portfolio_news`: Revisa el portafolio en tiempo real usando Supabase y filtra noticias relacionadas específicamente a los `tickers` que tengas en tu billetera, devolviendo títulos y scores de relevancia.
   - `search_general_news`: Busca dentro de todo el abanico de noticias en base a etiquetas o consultas.
   - `get_news_context`: Permite al LLM consultar el contenido enriquecido (`enriched_content`) de una noticia específica para dar mayor contexto en sus explicaciones.
4. **Nueva UI `AnalyzedNewsCard`:** Se creó un componente acordeón que escanéa e incrusta los resultados invocados por las herramientas de la IA y muestra los enlaces directos de los artículos.

## Verificación Recomendada
- Prueba escribir algo en el Chat IA, ciérralo y vuelve a abrirlo (verás que está limpio).
- Pregúntale "Resume las noticias recientes de mi portafolio". Deberías notar cómo la IA invoca las herramientas y muestra los resultados de forma elegante con la tarjeta creada.
