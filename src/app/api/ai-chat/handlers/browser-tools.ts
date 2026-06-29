import { tool, StreamData } from 'ai';
import { z } from 'zod';
import * as BrowserManager from "@/lib/services/browser-manager";
import { assertSafeFetchUrl } from "@/lib/url-guard";

interface BrowserToolsParams {
  streamData: StreamData;
}

export function getBrowserTools({ streamData }: BrowserToolsParams) {
  return {
    browser_navigate: tool({
      description: 'Navegar a una URL en el navegador virtual. Usar cuando el usuario pida visitar un sitio web, buscar algo en internet, o ver una página específica.',
      parameters: z.object({
        url: z.string().describe('URL completa a navegar, ej: https://google.com'),
      }),
      execute: async ({ url }) => {
        try {
          // ── SSRF protection (ASVS 5.5.3) ──
          const guard = await assertSafeFetchUrl(url);
          if (!guard.ok) {
            return { error: `URL rechazada: ${guard.reason}` };
          }
          const safeUrl = guard.url.toString();

          // Create session if not exists (stored in streamData)
          let sessionId = (streamData as any)?._browserSessionId;
          if (!sessionId) {
            sessionId = await BrowserManager.createSession();
            (streamData as any)._browserSessionId = sessionId;
            streamData.append({ type: 'browser_session', sessionId });
          }
          const result = await BrowserManager.navigateTo(sessionId, safeUrl);
          return { sessionId, url: result.url, title: result.title, textContent: result.textContent.slice(0, 4000) };
        } catch (err: any) {
          return { error: err.message || String(err) };
        }
      }
    }),

    browser_click: tool({
      description: 'Hacer clic en un elemento de la página web actual. Usar selectores CSS para identificar el elemento.',
      parameters: z.object({
        selector: z.string().describe('Selector CSS del elemento a clickear, ej: button.submit, a[href="/login"], #search-btn'),
        description: z.string().optional().describe('Descripción legible de lo que se está haciendo clic'),
      }),
      execute: async ({ selector, description }) => {
        try {
          const sessionId = (streamData as any)?._browserSessionId;
          if (!sessionId) return { error: 'No hay sesión de navegador activa. Usa browser_navigate primero.' };
          return await BrowserManager.clickElement(sessionId, selector, description);
        } catch (err: any) {
          return { error: err.message || String(err) };
        }
      }
    }),

    browser_type: tool({
      description: 'Escribir texto en un campo de entrada de la página web actual (formularios, buscadores, etc.).',
      parameters: z.object({
        selector: z.string().describe('Selector CSS del input, ej: input[name="q"], #search-input, textarea.comment'),
        text: z.string().describe('Texto a escribir en el campo'),
        description: z.string().optional().describe('Descripción legible de la acción'),
      }),
      execute: async ({ selector, text, description }) => {
        try {
          const sessionId = (streamData as any)?._browserSessionId;
          if (!sessionId) return { error: 'No hay sesión de navegador activa. Usa browser_navigate primero.' };
          return await BrowserManager.typeText(sessionId, selector, text, description);
        } catch (err: any) {
          return { error: err.message || String(err) };
        }
      }
    }),

    browser_scroll: tool({
      description: 'Desplazar la página web actual hacia arriba o abajo para ver más contenido.',
      parameters: z.object({
        direction: z.enum(['down', 'up']).describe('Dirección del scroll'),
      }),
      execute: async ({ direction }) => {
        try {
          const sessionId = (streamData as any)?._browserSessionId;
          if (!sessionId) return { error: 'No hay sesión de navegador activa.' };
          return await BrowserManager.scrollPage(sessionId, direction);
        } catch (err: any) {
          return { error: err.message || String(err) };
        }
      }
    }),
  };
}
