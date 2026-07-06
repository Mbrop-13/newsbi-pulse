/**
 * WebBuilder — Helpers de HTML del iframe (ISOMORFOS).
 *
 * Estas funciones construyen el HTML del iframe del preview y le inyectan el
 * inspector de elementos. Son PURAMENTE de manipulación de strings: no dependen
 * de React ni del navegador. Se usan tanto en el servidor (API route que
 * bundlea) como en el cliente (botón "Abrir en pestaña nueva").
 *
 * Por qué están aquí separadas: el bundler del webbuilder se migró al servidor
 * (esbuild nativo). El servidor necesita construir el HTML del iframe, pero NO
 * puede importar webbuilder-bundler.ts ni preview-panel.tsx (que son módulos de
 * cliente con dependencias del navegador). Este archivo es la fuente única de
 * verdad para la estructura del iframe del preview.
 */

// ─── Inspector Injection Helper ───────────────────
// Inyecta en el HTML del iframe: (a) estilos para el hover del inspector, y
// (b) un <script> que escucha clicks en el iframe y los reporta al parent vía
// postMessage. Así el usuario puede clickear un elemento del preview para que
// la IA lo edite.
export function injectInspectorScript(html: string): string {
  if (html.includes("MAVERLANG_ELEMENT_CLICKED")) return html;

  const styleTag = `
    <style>
      .maverlang-inspector-hover {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.1s !important;
      }

      @media (max-width: 768px) {
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        html, body, #root, #app, * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      }
    </style>
  `;

  const scriptTag = `
    <script>
      let isInspectorActive = false;

      window.addEventListener('message', (e) => {
        if (e.data?.type === 'TOGGLE_INSPECTOR') {
          isInspectorActive = e.data.active;
          if (!isInspectorActive) {
            document.querySelectorAll('.maverlang-inspector-hover').forEach(el => el.classList.remove('maverlang-inspector-hover'));
          }
        }
      });

      document.addEventListener('mouseover', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target !== document.body && e.target !== document.documentElement) {
          e.target.classList.add('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target && e.target.classList) {
          e.target.classList.remove('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('click', (e) => {
        if (!isInspectorActive) return;
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) return;

        el.classList.remove('maverlang-inspector-hover');

        const clone = el.cloneNode(false);
        let innerText = el.innerText || '';
        if (innerText.length > 50) innerText = innerText.substring(0, 50) + '...';
        if (innerText) clone.innerText = innerText;

        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const computedStyle = {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          margin: cs.margin,
        };
        const editableText = (el.innerText || '').trim();
        const anchor = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        window.parent.postMessage({
          type: 'MAVERLANG_ELEMENT_CLICKED',
          elementHtml: clone.outerHTML,
          tagName: el.tagName,
          className: el.className || '',
          editableText,
          computedStyle,
          anchor,
        }, '*');

        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);

      window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d) return;
        if (d.type === 'MAVERLANG_MARK_ELEMENT') {
          document.querySelectorAll('[data-maverlang-target]').forEach(n => n.removeAttribute('data-maverlang-target'));
          const candidates = document.querySelectorAll('*');
          for (const node of candidates) {
            const r = node.getBoundingClientRect();
            if (Math.abs(r.top - d.anchor.top) < 3 && Math.abs(r.left - d.anchor.left) < 3 && Math.abs(r.width - d.anchor.width) < 3) {
              node.setAttribute('data-maverlang-target', '1');
              break;
            }
          }
        } else if (d.type === 'MAVERLANG_APPLY_LIVE_STYLE') {
          const target = document.querySelector('[data-maverlang-target]');
          if (target) {
            const s = d.style || {};
            if (s.color) target.style.color = s.color;
            if (s.backgroundColor) target.style.backgroundColor = s.backgroundColor;
            if (s.fontSize) target.style.fontSize = s.fontSize;
            if (s.borderRadius) target.style.borderRadius = s.borderRadius;
            if (s.text !== undefined) target.innerText = s.text;
          }
        }
      });

      window.parent.postMessage({ type: 'MAVERLANG_PREVIEW_LOADED' }, '*');
    </script>
  `;

  let modifiedHtml = html;
  if (modifiedHtml.includes("</head>")) {
    modifiedHtml = modifiedHtml.replace("</head>", styleTag + "</head>");
  } else {
    modifiedHtml = styleTag + modifiedHtml;
  }

  if (modifiedHtml.includes("</body>")) {
    modifiedHtml = modifiedHtml.replace("</body>", scriptTag + "</body>");
  } else {
    modifiedHtml = modifiedHtml + scriptTag;
  }

  return modifiedHtml;
}

/**
 * Construye el HTML completo del iframe del preview a partir del bundle JS.
 *
 * Estructura:
 *  - <head>: captura de errores de runtime (postMessage al parent), Tailwind
 *    Play CDN (para que las clases Tailwind del usuario funcionen en runtime),
 *    y el CSS del usuario (sin directivas @tailwind, que esbuild no procesa).
 *  - <body>: un #root + el bundle JS en un <script type="module">.
 *  - Finalmente se inyecta el inspector de elementos.
 *
 * NOTA sobre el CDN de Tailwind: el warning "should not be used in production"
 * es esperado y aceptable aquí. Este iframe es un sandbox de previsualización
 * de código generado por el usuario, no una página de producción real. No hay
 * alternativa viable: procesar Tailwind con PostCSS requeriría un worker
 * adicional. El CDN de Play es la solución estándar para previews en vivo.
 */
export function buildPreviewHtml(jsCode: string, cssCode: string): string {
  const userCss = cssCode
    ? cssCode.replace(/@tailwind\s+(base|components|utilities);?/g, "")
    : "";
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
// ── Captura de errores de runtime ──
// Sin esto, un error de runtime (ej. undefined.foo, TypeError) deja el
// iframe en blanco sin feedback. El usuario piensa que la app no funciona
// cuando en realidad tiene un bug en su código.
window.addEventListener('error', function(e) {
  window.parent.postMessage({
    type: 'MAVERLANG_RUNTIME_ERROR',
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
  }, '*');
});
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({
    type: 'MAVERLANG_RUNTIME_ERROR',
    message: 'Unhandled Promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)),
    filename: '',
    lineno: 0,
    colno: 0,
  }, '*');
});
</script>
<script>
// ── Suprimir solo el warning del CDN de Tailwind ──
var _origWarn = console.warn;
console.warn = function() {};
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script>console.warn = _origWarn;</script>
${userCss ? `<style>${userCss}</style>` : ""}
</head>
<body>
<div id="root"></div>
<script type="module">
${jsCode}
</script>
</body>
</html>`;
  html = injectInspectorScript(html);
  return html;
}
