/**
 * WebBuilder preview — ESM nativo (un archivo = un módulo).
 *
 * Cada .tsx/.ts se transpila con Babel EN EL IFRAME como módulo de verdad
 * (import/export en el top-level). Después se publica como blob URL y se
 * resuelve vía importmap (`@mod/App.tsx` → blob).
 *
 * Por qué no concatenamos en IIFEs: `export type`, `export interface` y
 * re-exports solo son legales a nivel de módulo. El concatenador propio era
 * un mini-bundler y se rompía con TypeScript real.
 *
 * React se carga una sola vez (importmap + ?external=react en esm.sh).
 */

export type ProjectFiles = Record<string, { code: string } | string>;

export interface RenderResult {
  html: string | null;
  error: string | null;
}

const REACT_VERSION = "18.3.1";
const LUCIDE_VERSION = "0.400.0";
const ESM = "https://esm.sh";
const MOD_PREFIX = "@mod";

const IMPORT_MAP: Record<string, string> = {
  react: `${ESM}/react@${REACT_VERSION}`,
  "react/": `${ESM}/react@${REACT_VERSION}/`,
  "react/jsx-runtime": `${ESM}/react@${REACT_VERSION}/jsx-runtime`,
  "react/jsx-dev-runtime": `${ESM}/react@${REACT_VERSION}/jsx-dev-runtime`,
  "react-dom": `${ESM}/react-dom@${REACT_VERSION}?external=react`,
  "react-dom/": `${ESM}/react-dom@${REACT_VERSION}/`,
  "react-dom/client": `${ESM}/react-dom@${REACT_VERSION}/client?external=react`,
  "framer-motion": `${ESM}/framer-motion@11.18.2?external=react`,
  "lucide-react": `${ESM}/lucide-react@${LUCIDE_VERSION}?external=react`,
  recharts: `${ESM}/recharts@2.12.7?external=react,react-dom`,
  clsx: `${ESM}/clsx@2.1.1`,
  "tailwind-merge": `${ESM}/tailwind-merge@2.5.2`,
  "class-variance-authority": `${ESM}/class-variance-authority@0.7.0`,
  "canvas-confetti": `${ESM}/canvas-confetti@1.9.3`,
  "react-icons/": `${ESM}/react-icons@5.2.1/`,
  "react-router-dom": `${ESM}/react-router-dom@6.28.0?external=react,react-dom`,
  three: `${ESM}/three@0.167.0`,
  "three/": `${ESM}/three@0.167.0/`,
  howler: `${ESM}/howler@2.2.4`,
  "matter-js": `${ESM}/matter-js@0.20.0`,
  zustand: `${ESM}/zustand@4.5.5?external=react`,
};

const ASSET_EXT = /\.(css|scss|sass|png|jpe?g|gif|svg|webp|ico|mp3|wav|ogg|json|glb|gltf)$/i;
const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function lucideClauseToPerIconImports(clause: string): string[] {
  const c = clause.trim();
  if (!c.startsWith("{") || !c.endsWith("}")) return [];
  const names = c
    .slice(1, -1)
    .split(",")
    .map((s) => s.trim())
    .filter((n) => n && !n.startsWith("type "));
  return names
    .map((n) => {
      const parts = n.split(/\s+as\s+/);
      const orig = (parts[0] || "").trim();
      const local = (parts[1] || orig).trim();
      if (!orig) return "";
      const kebab = pascalToKebab(orig);
      return `import ${local} from "${ESM}/lucide-react@${LUCIDE_VERSION}/dist/esm/icons/${kebab}?external=react";`;
    })
    .filter(Boolean);
}

function rewriteBareSpec(spec: string): string {
  if (
    spec === "react" ||
    spec.startsWith("react/") ||
    spec === "react-dom" ||
    spec.startsWith("react-dom/")
  ) {
    return spec;
  }
  if (spec === "lucide-react") {
    return `${ESM}/lucide-react@${LUCIDE_VERSION}?external=react`;
  }
  if (IMPORT_MAP[spec] && !spec.endsWith("/")) {
    return IMPORT_MAP[spec];
  }
  if (spec.startsWith("react-icons/")) {
    return `${ESM}/react-icons@5.2.1/${spec.slice("react-icons/".length)}?external=react`;
  }
  return `${ESM}/${spec}?external=react,react-dom`;
}

function normalizePath(p: string): string {
  if (!p) return "/";
  let clean = p.replace(/^\.\//, "");
  if (!clean.startsWith("/")) clean = "/" + clean;
  return clean;
}

function resolveRelativeImport(spec: string, importerPath: string): string {
  const importerDir = importerPath.replace(/\/[^/]*$/, "");
  let base: string;
  if (spec.startsWith("./")) {
    base = importerDir + "/" + spec.slice(2);
  } else if (spec.startsWith("../")) {
    base = importerDir + "/" + spec;
  } else {
    base = spec;
  }
  const segments = base.split("/").filter((s) => s && s !== ".");
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else resolved.push(seg);
  }
  return normalizePath("/" + resolved.join("/"));
}

function resolveWithExtension(
  basePath: string,
  fileMap: Record<string, string>
): string | null {
  if (fileMap[basePath] !== undefined) return basePath;
  for (const ext of PARSABLE_EXT) {
    const withExt = basePath + ext;
    if (fileMap[withExt] !== undefined) return withExt;
  }
  for (const ext of PARSABLE_EXT) {
    const index = basePath + "/index" + ext;
    if (fileMap[index] !== undefined) return index;
  }
  return null;
}

function isRelativeSpec(spec: string): boolean {
  return spec.startsWith("./") || spec.startsWith("../") || (spec.startsWith("/") && !spec.startsWith("//"));
}

function rewriteSpecifier(
  spec: string,
  importerPath: string,
  fileMap: Record<string, string>
): { spec: string; skip: boolean; comment?: string } {
  if (isRelativeSpec(spec)) {
    if (ASSET_EXT.test(spec)) {
      return { spec, skip: true, comment: spec };
    }
    const resolved = resolveWithExtension(resolveRelativeImport(spec, importerPath), fileMap);
    if (!resolved) {
      return { spec, skip: true, comment: `unresolved ${spec}` };
    }
    return { spec: MOD_PREFIX + resolved, skip: false };
  }
  return { spec: rewriteBareSpec(spec), skip: false };
}

/**
 * Reescribe imports/exports para ESM de preview.
 * Los relativos pasan a `@mod/ruta.tsx` (bare, resuelto por importmap).
 * lucide-react named → un import por icono (el barrel 504-ea).
 * CSS/assets relativos se comentan (el CSS ya va en un <style>).
 */
function rewriteImportsForEsm(
  code: string,
  importerPath: string,
  fileMap: Record<string, string>
): string {
  let out = code;

  out = out.replace(
    /\bimport\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g,
    (_m, clause: string, spec: string) => {
      const trimmed = clause.trim();
      if (spec === "lucide-react") {
        const perIcon = lucideClauseToPerIconImports(trimmed);
        if (perIcon.length > 0) return perIcon.join("\n");
      }
      const resolved = rewriteSpecifier(spec, importerPath, fileMap);
      if (resolved.skip) {
        if (ASSET_EXT.test(spec) && /\.(css|scss|sass)$/i.test(spec)) {
          return "/* css inlined globally */";
        }
        if (/^\w+$/.test(trimmed)) {
          return `const ${trimmed} = ${JSON.stringify(spec)};`;
        }
        return `/* ${resolved.comment || spec} */`;
      }
      return `import ${trimmed} from "${resolved.spec}"`;
    }
  );

  out = out.replace(
    /\bimport\s+['"]([^'"]+)['"]/g,
    (_m, spec: string) => {
      const resolved = rewriteSpecifier(spec, importerPath, fileMap);
      if (resolved.skip) {
        return `/* ${resolved.comment || spec} */`;
      }
      return `import "${resolved.spec}"`;
    }
  );

  out = out.replace(
    /\bexport\s+(type\s+)?(\*|\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
    (_m, typeKw: string, clause: string, spec: string) => {
      const resolved = rewriteSpecifier(spec, importerPath, fileMap);
      if (resolved.skip) return `/* re-export skipped: ${spec} */`;
      return `export ${typeKw || ""}${clause} from "${resolved.spec}"`;
    }
  );

  return out;
}

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
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        html, body, #root, #app, * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
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
        if (e.target && e.target.classList) e.target.classList.remove('maverlang-inspector-hover');
      }, true);
      document.addEventListener('click', (e) => {
        if (!isInspectorActive) return;
        e.preventDefault(); e.stopPropagation();
        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) return;
        el.classList.remove('maverlang-inspector-hover');
        const clone = el.cloneNode(false);
        let innerText = el.innerText || '';
        if (innerText.length > 50) innerText = innerText.substring(0, 50) + '...';
        if (innerText) clone.innerText = innerText;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const computedStyle = { color: cs.color, backgroundColor: cs.backgroundColor, fontSize: cs.fontSize, fontWeight: cs.fontWeight, borderRadius: cs.borderRadius, padding: cs.padding, margin: cs.margin };
        const editableText = (el.innerText || '').trim();
        const anchor = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        window.parent.postMessage({ type: 'MAVERLANG_ELEMENT_CLICKED', elementHtml: clone.outerHTML, tagName: el.tagName, className: el.className || '', editableText, computedStyle, anchor }, '*');
        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);
      window.addEventListener('message', (e) => {
        const d = e.data; if (!d) return;
        if (d.type === 'MAVERLANG_MARK_ELEMENT') {
          document.querySelectorAll('[data-maverlang-target]').forEach(n => n.removeAttribute('data-maverlang-target'));
          const candidates = document.querySelectorAll('*');
          for (const node of candidates) {
            const r = node.getBoundingClientRect();
            if (Math.abs(r.top - d.anchor.top) < 3 && Math.abs(r.left - d.anchor.left) < 3 && Math.abs(r.width - d.anchor.width) < 3) {
              node.setAttribute('data-maverlang-target', '1'); break;
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

export function renderProjectToHtml(files: ProjectFiles): RenderResult {
  const fileMap: Record<string, string> = {};
  for (const [p, f] of Object.entries(files)) {
    const code = typeof f === "string" ? f : f?.code ?? "";
    if (typeof code === "string" && code.trim()) {
      fileMap[normalizePath(p)] = code;
    }
  }

  if (Object.keys(fileMap).length === 0) {
    return { html: null, error: null };
  }

  let userCss = "";
  for (const [path, code] of Object.entries(fileMap)) {
    if (path.endsWith(".css")) {
      userCss += "\n" + code.replace(/@tailwind\s+(base|components|utilities);?/g, "");
    }
  }

  const entryCandidates = [
    "/App.tsx",
    "/App.jsx",
    "/index.tsx",
    "/index.jsx",
    "/main.tsx",
    "/main.jsx",
  ];
  let entry = entryCandidates.find((p) => fileMap[p] !== undefined);
  if (!entry) {
    entry = Object.keys(fileMap).find((p) =>
      PARSABLE_EXT.some((e) => p.endsWith(e))
    );
  }
  if (!entry) {
    return {
      html: null,
      error: "No se encontró ningún archivo .tsx/.jsx/.ts/.js para previsualizar.",
    };
  }

  const modules: Record<string, string> = {};
  for (const [path, code] of Object.entries(fileMap)) {
    if (!PARSABLE_EXT.some((e) => path.endsWith(e))) continue;
    modules[path] = rewriteImportsForEsm(code, path, fileMap);
  }

  if (Object.keys(modules).length === 0) {
    return {
      html: null,
      error: "No hay módulos para previsualizar.",
    };
  }

  const html = buildIframeHtml(modules, entry, userCss);
  return { html: injectInspectorScript(html), error: null };
}

function buildIframeHtml(
  modules: Record<string, string>,
  entry: string,
  userCss: string
): string {
  const styleTag = userCss.trim() ? "<style>" + userCss.trim() + "</style>" : "";
  const payload = JSON.stringify({
    entry,
    files: modules,
    importMap: IMPORT_MAP,
  })
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="https://preview.invalid/">
<script>
(function () {
  function ignorable(msg, src) {
    src = (src || '').toLowerCase();
    msg = (msg || '').toLowerCase();
    if (src.indexOf('cdn.tailwindcss.com') !== -1 || src.indexOf('tailwindcss') !== -1) return true;
    if (src.indexOf('preview.invalid') !== -1) return true;
    if ((msg === 'script error.' || msg === 'script error') && !src) return true;
    return false;
  }
  function report(message, lineno, filename) {
    if (ignorable(message, filename)) return;
    window.parent.postMessage({
      type: 'MAVERLANG_RUNTIME_ERROR',
      message: message || 'Error desconocido',
      lineno: lineno || 0,
      filename: filename || '',
    }, '*');
  }
  window.addEventListener('error', function (e) {
    var target = e.target;
    if (target && target !== window && (target.src || target.href)) {
      var resSrc = target.src || target.href || '';
      if (ignorable('', resSrc)) return;
      if (resSrc.indexOf('babel') !== -1 || resSrc.indexOf('@babel') !== -1) {
        report('No se pudo cargar el compilador de la preview (timeout). Reintentá.', 0, resSrc);
        return;
      }
      if (resSrc.indexOf('esm.sh') !== -1 || resSrc.indexOf('jsdelivr') !== -1) {
        report('No se pudo cargar una librería. Suele ser un timeout del CDN. Reintentá la preview.', 0, resSrc);
        return;
      }
      return;
    }
    report((e.error && (e.error.stack || e.error.message)) || e.message, e.lineno, e.filename);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var message = (reason && reason.message) ? reason.message : String(reason || '');
    report('Unhandled Promise rejection: ' + message, 0, '');
  });
  window.addEventListener('click', function (e) {
    var target = e.target;
    while (target && target.tagName !== 'A') target = target.parentNode;
    if (target && target.tagName === 'A') {
      var href = target.getAttribute('href');
      if (href) {
        var isAnchor = href.startsWith('#');
        var isJavascript = href.startsWith('javascript:');
        if (!isAnchor && !isJavascript) {
          e.preventDefault();
          if (href.startsWith('http://') || href.startsWith('https://')) {
            window.open(href, '_blank');
          } else {
            window.parent.postMessage({ type: 'MAVERLANG_PREVIEW_NAVIGATE', href: href }, '*');
          }
        }
      }
    }
  }, true);
})();
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css" crossorigin="anonymous">
<script>
(function () {
  var s = document.createElement('script');
  s.src = 'https://cdn.tailwindcss.com';
  s.async = true;
  s.onerror = function () { s.remove(); };
  document.head.appendChild(s);
})();
</script>
${styleTag}
</head>
<body>
<div id="root"></div>
<script type="application/json" id="__maverlang_payload">${payload}</script>
<script>
(function () {
  var BABEL_URLS = [
    'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
    'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js'
  ];
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function loadBabel(i) {
    if (i >= BABEL_URLS.length) {
      window.parent.postMessage({
        type: 'MAVERLANG_RUNTIME_ERROR',
        message: 'No se pudo cargar el compilador de la preview (timeout de red). Reintentá.',
      }, '*');
      return;
    }
    loadScript(BABEL_URLS[i]).then(run).catch(function () { loadBabel(i + 1); });
  }
  function report(msg, filename) {
    window.parent.postMessage({
      type: 'MAVERLANG_RUNTIME_ERROR',
      message: msg,
      filename: filename || '',
    }, '*');
  }
  function run() {
    if (typeof Babel === 'undefined') {
      report('Babel no está disponible en la preview.');
      return;
    }
    Babel.registerPreset('maverlang', {
      presets: [
        [Babel.availablePresets['typescript'], { allExtensions: true, isTSX: true }],
        [Babel.availablePresets['react'], { runtime: 'automatic' }]
      ]
    });
    var raw = document.getElementById('__maverlang_payload');
    var payload;
    try {
      payload = JSON.parse(raw.textContent);
    } catch (err) {
      report('No se pudo leer el proyecto de la preview.');
      return;
    }
    var files = payload.files || {};
    var entry = payload.entry;
    var transformed = {};
    var paths = Object.keys(files);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      try {
        transformed[path] = Babel.transform(files[path], {
          presets: ['maverlang'],
          filename: path,
          sourceType: 'module'
        }).code;
      } catch (err) {
        var m = (err && err.message) ? err.message : String(err);
        report('Error de sintaxis: ' + path + ': ' + m, path);
        return;
      }
    }
    var imports = Object.assign({}, payload.importMap || {});
    var blobs = {};
    for (var j = 0; j < paths.length; j++) {
      var p = paths[j];
      var blob = new Blob([transformed[p]], { type: 'text/javascript' });
      var url = URL.createObjectURL(blob);
      blobs[p] = url;
      imports['@mod' + p] = url;
      var noExt = p.replace(/\\.(tsx|ts|jsx|js)$/, '');
      if (!imports['@mod' + noExt]) imports['@mod' + noExt] = url;
    }
    var mapEl = document.createElement('script');
    mapEl.type = 'importmap';
    mapEl.textContent = JSON.stringify({ imports: imports });
    document.head.appendChild(mapEl);

    var entrySpec = '@mod' + entry;
    var source = files[entry] || '';
    var hasOwnMount = /createRoot\\s*\\(|ReactDOM\\.render\\s*\\(/.test(source);

    import(entrySpec).then(function (mod) {
      if (hasOwnMount) return;
      var App = mod && mod.default;
      var root = document.getElementById('root');
      if (!root) return;
      if (!App) {
        root.textContent = 'El archivo principal no exporta un componente por defecto.';
        return;
      }
      return import('react').then(function (React) {
        return import('react-dom/client').then(function (ReactDOM) {
          ReactDOM.createRoot(root).render(React.createElement(App));
        });
      });
    }).catch(function (err) {
      var msg = (err && err.message) ? err.message : String(err);
      if (/Failed to fetch|error loading dynamically imported module|504|502|timeout/i.test(msg)) {
        msg = 'No se pudieron cargar las librerías de la preview (timeout del CDN). Reintentá.';
      }
      report(msg, entry);
    });
  }
  loadBabel(0);
})();
</script>
</body>
</html>`;
}
