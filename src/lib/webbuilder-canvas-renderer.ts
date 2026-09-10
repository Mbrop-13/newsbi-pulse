/**
 * WebBuilder preview — estilo CodePen.
 * React/ReactDOM UMD + Babel (TSX → JS + CommonJS). Sin importmap, sin esm.sh,
 * sin blob modules. require("react") es window.React.
 */

export type ProjectFiles = Record<string, { code: string } | string>;

export interface RenderResult {
  html: string | null;
  error: string | null;
}

const MOD_PREFIX = "@mod";

const ASSET_EXT = /\.(css|scss|sass|png|jpe?g|gif|svg|webp|ico|mp3|wav|ogg|json|glb|gltf)$/i;
const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

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
  return { spec: spec, skip: false };
}

function addDualDefaultExport(code: string): string {
  const extras: string[] = [];
  let out = code;
  out = out.replace(/\bexport\s+default\s+function\s+(\w+)/g, (_m, name: string) => {
    extras.push(name);
    return "function " + name;
  });
  out = out.replace(/\bexport\s+default\s+class\s+(\w+)/g, (_m, name: string) => {
    extras.push(name);
    return "class " + name;
  });
  out = out.replace(/\bexport\s+default\s+(\w+)\s*;/g, (_m, name: string) => {
    if (name === "function" || name === "class" || name === "abstract") return _m;
    extras.push(name);
    return "/* default as named */";
  });
  if (extras.length === 0) return code;
  const unique = [...new Set(extras)];
  return out + "\nexport { " + unique.join(", ") + " };\nexport default " + unique[0] + ";\n";
}

/** Evita map[y][x] = v cuando y/x son NaN o la fila no existe. */
function patch2dGridAssign(code: string): string {
  const prelude =
    "function __idx(n){n=Number(n);return isFinite(n)?(n|0):0;}\n" +
    "function __ensureRow(g,y){if(!g||typeof g!==\"object\")return [];y=__idx(y);if(!g[y]||typeof g[y]!==\"object\")g[y]=[];return g[y];}\n" +
    "function __safeMap(arr, fn, ctx){if(arr==null||typeof arr.map!==\"function\")return [];return arr.map(fn, ctx);}\n";
  let next = code.replace(/useState\s*(?:<[^>]*>)?\s*\(\s*\)/g, "useState([])");
  next = next.replace(
    /function\s+(generateRandomMap|generateMap|createMap|initMap|buildMap)\s*\(([^)]*)\)\s*\{/g,
    (_m, name: string, args: string) => {
      const names = args.split(",").map((s) =>
        s.split("=")[0].replace(/[?:].*$/, "").trim()
      ).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
      let inject = "";
      if (names[0]) {
        inject += `${names[0]}=Number(${names[0]});if(!isFinite(${names[0]})||${names[0]}<1)${names[0]}=16;`;
      }
      if (names[1]) {
        inject += `${names[1]}=Number(${names[1]});if(!isFinite(${names[1]})||${names[1]}<1)${names[1]}=12;`;
      }
      return "function " + name + "(" + args + "){" + inject;
    }
  );
  next = next.replace(
    /((?:this\.)?[A-Za-z_$][\w.$]*)\[([^\[\]]+)\]\[([^\[\]]+)\]\s*=(?!=)/g,
    "__ensureRow($1, $2)[__idx($3)] ="
  );
  next = next.replace(
    /((?:this\.)?[A-Za-z_$][\w.$]*)\.map\s*\(/g,
    (_m, obj: string) => {
      if (obj === "Children" || obj.endsWith(".Children") || obj === "__safeMap") return _m;
      return "__safeMap(" + obj + ", ";
    }
  );
  return prelude + next;
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
    if (path === "/index.tsx" || path === "/index.jsx") continue;
    modules[path] = patch2dGridAssign(
      addDualDefaultExport(rewriteImportsForEsm(code, path, fileMap))
    );
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
  })
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<style>html,body,#root{margin:0;min-height:100%;background:#fff;color:#111}</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" crossorigin="anonymous">
${styleTag}
</head>
<body>
<div id="root"></div>
<script type="application/json" id="__maverlang_payload">${payload}</script>
<script>
(function () {
  function report(msg, filename) {
    window.parent.postMessage({ type: 'MAVERLANG_RUNTIME_ERROR', message: String(msg || ''), filename: filename || '' }, '*');
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src)); };
      document.body.appendChild(s);
    });
  }
  function loadFirst(urls) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error(urls[0]));
      return loadScript(urls[i++]).catch(next);
    }
    return next();
  }
  var CHAINS = [
    [
      'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.development.js',
      'https://unpkg.com/react@18.3.1/umd/react.development.js'
    ],
    [
      'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.development.js',
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js'
    ],
    [
      'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js',
      'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js'
    ]
  ];
  function boot(k) {
    if (k >= CHAINS.length) { run(); return; }
    loadFirst(CHAINS[k]).then(function () { boot(k + 1); }).catch(function (err) {
      report('No se pudo cargar ' + String(err && err.message || err) + '. Reintentá la preview.');
    });
  }
  function cjsPlugin() {
    var p = Babel.availablePlugins || {};
    if (p['transform-modules-commonjs']) return p['transform-modules-commonjs'];
    var keys = Object.keys(p);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('transform-modules-commonjs') !== -1) return p[keys[i]];
    }
    return null;
  }
  function lucideStub(React) {
    function icon(props) {
      props = props || {};
      return React.createElement('svg', {
        width: props.size || 24,
        height: props.size || 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        className: props.className
      });
    }
    return new Proxy({ __esModule: true, default: icon }, {
      get: function (t, name) {
        if (name in t) return t[name];
        return icon;
      }
    });
  }
  function motionStub(React) {
    var motion = new Proxy({}, {
      get: function () {
        return function (props) {
          props = props || {};
          return React.createElement(props.as || 'div', props);
        };
      }
    });
    return { __esModule: true, motion: motion, AnimatePresence: function (p) { return (p && p.children) || null; } };
  }
  window.addEventListener('error', function (e) {
    var msg = (e.error && e.error.message) || e.message;
    if (msg) report(msg);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    report((r && r.message) ? r.message : String(r || 'Promise rejection'));
  });
  function run() {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    if (!React || !ReactDOM || typeof Babel === 'undefined') {
      report('React o Babel no cargaron.');
      return;
    }
    var raw = document.getElementById('__maverlang_payload');
    var payload;
    try { payload = JSON.parse(raw.textContent); } catch (e) { report('No se pudo leer el proyecto.'); return; }
    var files = payload.files || {};
    var entry = payload.entry;
    var plugin = cjsPlugin();
    var factories = {};
    var paths = Object.keys(files);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var isTsx = /\\.(tsx|jsx)$/.test(path);
      try {
        var opts = {
          presets: [
            [Babel.availablePresets['typescript'], { allExtensions: true, isTSX: isTsx }],
            [Babel.availablePresets['react'], { runtime: 'classic', development: true }]
          ],
          filename: (path || 'mod').replace(/^\\//, '') || 'mod.js',
          sourceType: 'module'
        };
        if (plugin) opts.plugins = [plugin];
        factories[path] = Babel.transform(files[path], opts).code;
      } catch (err) {
        report('Error de sintaxis: ' + path + ': ' + (err && err.message ? err.message : err), path);
        return;
      }
    }
    var cache = {};
    function resolveId(id) {
      if (id.indexOf('@mod') === 0) id = id.slice(4);
      if (factories[id]) return id;
      var exts = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
      for (var e = 0; e < exts.length; e++) {
        if (factories[id + exts[e]]) return id + exts[e];
      }
      return id;
    }
    function flattenExports(mod) {
      if (!mod || typeof mod !== 'object') return mod;
      var def = mod.default;
      if (typeof def === 'function' && def.name && mod[def.name] === undefined) {
        mod[def.name] = def;
      }
      if (def && typeof def === 'object' && !def.$$typeof && !Array.isArray(def)) {
        Object.keys(def).forEach(function (k) {
          if (mod[k] === undefined) mod[k] = def[k];
        });
      }
      return mod;
    }
    function reactLike(lib) {
      var o = { __esModule: true, default: lib };
      try { Object.keys(lib).forEach(function (k) { o[k] = lib[k]; }); } catch (e) {}
      return o;
    }
    function req(id) {
      if (id === 'react' || id.indexOf('react/') === 0) return reactLike(React);
      if (id === 'react-dom' || id.indexOf('react-dom') === 0) return reactLike(ReactDOM);
      if (id === 'lucide-react' || id.indexOf('lucide-react') === 0) return lucideStub(React);
      if (id === 'framer-motion') return motionStub(React);
      if (id === 'clsx') return function () { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };
      var path = resolveId(id);
      if (cache[path]) return cache[path].exports;
      var code = factories[path];
      if (!code) return {};
      var module = { exports: {} };
      cache[path] = module;
      try {
        var fn = new Function('require', 'module', 'exports', 'React', 'ReactDOM', code);
        fn(req, module, module.exports, React, ReactDOM);
        flattenExports(module.exports);
        ['generateRandomMap','generateMap','createMap','initMap','buildMap'].forEach(function (name) {
          var fnMap = module.exports[name] || (module.exports.default && module.exports.default[name]);
          var isDefault = module.exports.default === fnMap;
          if (typeof fnMap !== 'function') return;
          var wrapped = function (a, b, c) {
            if (a === undefined || (typeof a === 'number' && !isFinite(a))) a = 16;
            if (b === undefined || (typeof b === 'number' && !isFinite(b))) b = 12;
            var result = null;
            try { result = fnMap.call(this, a, b, c); } catch (e) { result = null; }
            if (!Array.isArray(result)) {
              result = [];
              var hh = Number(b) || 12;
              var ww = Number(a) || 16;
              for (var yy = 0; yy < hh; yy++) {
                result[yy] = [];
                for (var xx = 0; xx < ww; xx++) result[yy][xx] = 0;
              }
            }
            return result;
          };
          module.exports[name] = wrapped;
          if (module.exports.default && module.exports.default[name]) module.exports.default[name] = wrapped;
          if (isDefault) module.exports.default = wrapped;
        });
      } catch (err) {
        report('Error en ' + path + ': ' + (err && err.message ? err.message : err), path);
        throw err;
      }
      return module.exports;
    }
    function Boundary(props) {
      React.Component.call(this, props);
      this.state = { error: null };
    }
    Boundary.prototype = Object.create(React.Component.prototype);
    Boundary.prototype.componentDidCatch = function (err) {
      var msg = err && err.message ? err.message : String(err);
      this.setState({ error: msg });
      report(msg);
    };
    Boundary.prototype.render = function () {
      if (this.state.error) {
        return React.createElement('div', {
          style: { padding: 16, fontFamily: 'sans-serif', color: '#111', background: '#ffffff', minHeight: '100vh', whiteSpace: 'pre-wrap' }
        }, this.state.error);
      }
      return this.props.children;
    };
    var rootEl = document.getElementById('root');
    try {
      var exp = req(entry);
      var App = exp && (exp.default || exp);
      if (typeof App !== 'function' && !(App && App.$$typeof)) {
        rootEl.innerHTML = '<div style="padding:16px;font-family:sans-serif;color:#111">El archivo principal no exporta un componente.</div>';
        return;
      }
      var tree = React.createElement(Boundary, null, React.createElement(App));
      if (ReactDOM.createRoot) ReactDOM.createRoot(rootEl).render(tree);
      else ReactDOM.render(tree, rootEl);
    } catch (err) {
      report(err && err.message ? err.message : err, entry);
    }
  }
  boot(0);
})();
</script>
</body>
</html>`;
}
