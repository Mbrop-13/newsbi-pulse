/**
 * WebBuilder — Renderer canvas-style (ISOMORFO).
 *
 * Genera el HTML completo del iframe del preview DIRECTAMENTE desde los
 * archivos del LLM, SIN bundling. Carga React y deps desde esm.sh vía importmap
 * y transpila el TSX con Babel standalone en el navegador.
 *
 * Por qué este enfoque (en vez de esbuild/esm.sh inlineado):
 *  - El importmap con `?external=react` fuerza a TODOS los paquetes a usar la
 *    MISMA instancia de React. Imposible el bug de "React duplicado" /
 *    "useContext null" / "Minified React error #31" que perseguíamos antes.
 *  - Babel standalone transpila TS/TSX correctamente en el navegador. Imposible
 *    el "Unexpected identifier 'as'" que dejaba esbuild-wasm pasar.
 *  - Todo es client-side: funciona igual en local y en Vercel. Imposible el
 *    "Could not resolve" del endpoint serverless.
 *
 * El navegador hace TODO el trabajo. Cero servidor, cero bundler, cero
 * node_modules que resolver.
 */

export type ProjectFiles = Record<string, { code: string } | string>;

// ─── Importmap: paquetes disponibles para el LLM ──────────────────────────
// La clave es `?external=react`: hace que react-dom, framer-motion, etc.
// importen React como bare specifier ("react") en vez de inlinear su propia
// copia. Así todos usan la instancia del importmap → una sola React.
const REACT_VERSION = "18.3.1";
const IMPORT_MAP: Record<string, string> = {
  react: `https://esm.sh/react@${REACT_VERSION}`,
  "react/": `https://esm.sh/react@${REACT_VERSION}/`,
  "react-dom": `https://esm.sh/react-dom@${REACT_VERSION}?external=react`,
  "react-dom/": `https://esm.sh/react-dom@${REACT_VERSION}&external=react/`,
  "react-dom/client": `https://esm.sh/react-dom@${REACT_VERSION}/client?external=react`,
  "framer-motion": `https://esm.sh/framer-motion@11.18.2?external=react`,
  "lucide-react": `https://esm.sh/lucide-react@0.400.0?external=react`,
  recharts: `https://esm.sh/recharts@2.12.7?external=react,react-dom`,
  clsx: `https://esm.sh/clsx@2.1.1`,
  "tailwind-merge": `https://esm.sh/tailwind-merge@2.5.2`,
  "class-variance-authority": `https://esm.sh/class-variance-authority@0.7.0`,
  "canvas-confetti": `https://esm.sh/canvas-confetti@1.9.3`,
  "react-icons/": `https://esm.sh/react-icons@5.2.1&external=react/`,
};

const IMPORT_MAP_JSON = JSON.stringify({ imports: IMPORT_MAP }, null, 2);

const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

// ─── Normalización de rutas ───────────────────────────────────────────────

function normalizePath(p: string): string {
  if (!p) return "/";
  let clean = p.replace(/^\.\//, "");
  if (!clean.startsWith("/")) clean = "/" + clean;
  return clean;
}

/** Resuelve un import relativo (./foo, ../foo) contra el directorio del importador. */
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
  // Normalizar segmentos . y ..
  const segments = base.split("/").filter((s) => s && s !== ".");
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else resolved.push(seg);
  }
  return normalizePath("/" + resolved.join("/"));
}

/** Dado un path sin extensión, prueba extensiones hasta encontrarlo en fileMap. */
function resolveWithExtension(
  basePath: string,
  fileMap: Record<string, string>
): string | null {
  // Si ya tiene extensión válida y existe
  if (fileMap[basePath] !== undefined) return basePath;
  // Probar extensiones
  for (const ext of PARSABLE_EXT) {
    const withExt = basePath + ext;
    if (fileMap[withExt] !== undefined) return withExt;
  }
  // Probar /index
  for (const ext of PARSABLE_EXT) {
    const index = basePath + "/index" + ext;
    if (fileMap[index] !== undefined) return index;
  }
  return null;
}

// ─── Parser de imports ────────────────────────────────────────────────────

interface ParsedImport {
  /** Texto completo del match para reemplazar. */
  raw: string;
  /** Specifier del import: "./components/Foo" o "react" o "framer-motion". */
  specifier: string;
  /** Si es relativo (./ o ../). */
  isRelative: boolean;
}

/** Extrae todos los imports estáticos de un archivo. */
function extractImports(code: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  // import ... from "spec" / import "spec"
  const re =
    /\bimport\b(?:\s+[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const specifier = m[1];
    imports.push({
      raw: m[0],
      specifier,
      isRelative: specifier.startsWith("./") || specifier.startsWith("../"),
    });
  }
  return imports;
}

// ─── Resolver de dependencias (orden topológico) ──────────────────────────

/**
 * Dado el mapa de archivos, devuelve los paths de archivos parsables (.tsx/.ts)
 * en orden topológico: las dependencias (imports relativos) antes que los
 * dependientes. Esto permite concatenarlos sin forward references.
 */
function topoSort(fileMap: Record<string, string>): {
  order: string[];
  error: string | null;
} {
  const parsable = Object.keys(fileMap).filter((p) =>
    PARSABLE_EXT.some((e) => p.endsWith(e))
  );

  // Construir grafo de dependencias: deps[path] = [paths relativos que importa]
  const deps: Record<string, string[]> = {};
  for (const path of parsable) {
    const code = fileMap[path];
    const imports = extractImports(code);
    const relativeDeps: string[] = [];
    for (const imp of imports) {
      if (!imp.isRelative) continue;
      const resolvedPath = resolveWithExtension(
        resolveRelativeImport(imp.specifier, path),
        fileMap
      );
      if (resolvedPath && resolvedPath !== path) {
        relativeDeps.push(resolvedPath);
      }
    }
    deps[path] = [...new Set(relativeDeps)];
  }

  // DFS con marca de "visitando" para detectar ciclos
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  let cycleError: string | null = null;

  const visit = (path: string): void => {
    if (visited.has(path)) return;
    if (visiting.has(path)) {
      cycleError = `Dependencia circular detectada involucrando "${path}". Reorganiza los imports para evitar el ciclo.`;
      return;
    }
    visiting.add(path);
    for (const dep of deps[path] || []) {
      visit(dep);
      if (cycleError) return;
    }
    visiting.delete(path);
    visited.add(path);
    order.push(path);
  };

  for (const path of parsable) {
    visit(path);
    if (cycleError) break;
  }

  return { order, error: cycleError };
}

// ─── Generador de nombres de módulo ───────────────────────────────────────

/** Convierte un path "/components/Header.tsx" → "__mod_components_Header". */
function moduleName(path: string): string {
  const cleaned = path
    .replace(/^\//, "")
    .replace(/\.(tsx|ts|jsx|js)$/, "")
    .replace(/[^a-zA-Z0-9_]/g, "_");
  return "__mod_" + cleaned;
}

// ─── Transformador de imports relativos ───────────────────────────────────

/**
 * Transforma los imports de un archivo para inlineado:
 *  - Imports relativos → const { X } = __mod_xxx; (referencia al módulo inlineado)
 *  - Imports bare → se MANTIENEN como imports estáticos (Babel + importmap los
 *    resuelven en runtime). Se coleccionan para ir TODOS al inicio del módulo
 *    completo (ESM hace hoisting de imports → resuelve el temporal dead zone).
 */
function transformImports(
  code: string,
  importerPath: string,
  fileMap: Record<string, string>
): { code: string; bareImports: string[] } {
  const bareImports: string[] = [];
  let out = code;

  // Caso 1: import ... from "spec"
  out = out.replace(
    /\bimport\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g,
    (fullMatch: string, clause: string, spec: string) => {
      const trimmedClause = clause.trim();
      if (spec.startsWith("./") || spec.startsWith("../")) {
        // Import relativo → resolver al módulo inlineado
        const resolvedPath = resolveWithExtension(
          resolveRelativeImport(spec, importerPath),
          fileMap
        );
        if (resolvedPath) {
          const mod = moduleName(resolvedPath);
          return transformClauseToDestructuring(trimmedClause, mod);
        }
        return `/* unresolved relative: ${spec} */`;
      }
      // Import bare → coleccionar el import ORIGINAL para el inicio del módulo
      bareImports.push(fullMatch);
      return ""; // eliminar del cuerpo (irá al inicio)
    }
  );

  // Caso 2: import "spec" (side-effect, sin cláusula)
  out = out.replace(
    /\bimport\s+['"]([^'"]+)['"]/g,
    (fullMatch: string, spec: string) => {
      if (spec.startsWith("./") || spec.startsWith("../")) {
        return `/* unresolved side-effect relative: ${spec} */`;
      }
      bareImports.push(fullMatch);
      return "";
    }
  );

  return { code: out, bareImports };
}

/**
 * Convierte una cláusula de import en destructuring del objeto módulo.
 *   "Default"           → "const Default = __mod.default;"
 *   "{ A, B as C }"     → "const { A, B: C } = __mod;"
 *   "Default, { A }"    → "const { default: Default, A } = __mod;"
 *   "* as ns"           → "const ns = __mod;"
 */
function transformClauseToDestructuring(clause: string, modVar: string): string {
  const c = clause.trim();
  // import * as ns
  if (/^\*\s+as\s+/.test(c)) {
    const ns = c.replace(/^\*\s+as\s+/, "");
    return `const ${ns} = ${modVar};`;
  }
  // import Default, { A, B as C }
  const mixedMatch = c.match(/^(\w+)\s*,\s*\{([^}]*)\}$/);
  if (mixedMatch) {
    const defaultName = mixedMatch[1];
    const named = mixedMatch[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => n.replace(/\s+as\s+/, ": "));
    return `const { default: ${defaultName}, ${named.join(", ")} } = ${modVar};`;
  }
  // import { A, B as C }
  if (c.startsWith("{") && c.endsWith("}")) {
    const named = c
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => n.replace(/\s+as\s+/, ": "));
    return `const { ${named.join(", ")} } = ${modVar};`;
  }
  // import Default
  if (/^\w+$/.test(c)) {
    return `const ${c} = ${modVar}.default;`;
  }
  // Fallback
  return `const ${c.replace(/\W/g, "_")} = ${modVar};`;
}

/**
 * Genera el código dinámico de import() para los bare imports al inicio del IIFE.
 * Ej: `const { Heart } = await import("lucide-react");`
 */
function generateBareImportBlock(
  bareImports: { spec: string; clauses: string }[]
): string {
  if (bareImports.length === 0) return "";
  // Agrupar por specifier para evitar importar el mismo módulo varias veces.
  const bySpec = new Map<string, string[]>();
  for (const bi of bareImports) {
    if (!bi.clauses) continue;
    const existing = bySpec.get(bi.spec) || [];
    existing.push(bi.clauses);
    bySpec.set(bi.spec, existing);
  }
  const lines: string[] = [];
  for (const [spec, clausesList] of bySpec) {
    // Tomar la primera cláusula (suficiente; las duplicadas son inofensivas)
    const clause = clausesList[0];
    if (clause.includes("{") || clause.includes("*") || /^\w+$/.test(clause)) {
      // Transformar la cláusula a destructuring de await import()
      const tempVar = `__imp_${spec.replace(/[^a-zA-Z0-9]/g, "_")}`;
      lines.push(`const ${tempVar} = await import(${JSON.stringify(spec)});`);
      // Aplicar destructuring según la cláusula
      const c = clause.trim();
      if (/^\*\s+as\s+/.test(c)) {
        const ns = c.replace(/^\*\s+as\s+/, "");
        lines.push(`const ${ns} = ${tempVar};`);
      } else if (c.startsWith("{") && c.endsWith("}")) {
        const named = c
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => n.replace(/\s+as\s+/, ": "));
        lines.push(`const { ${named.join(", ")} } = ${tempVar};`);
      } else if (/^\w+$/.test(c)) {
        lines.push(`const ${c} = ${tempVar}.default;`);
      } else {
        const mixedMatch = c.match(/^(\w+)\s*,\s*\{([^}]*)\}$/);
        if (mixedMatch) {
          const defaultName = mixedMatch[1];
          const named = mixedMatch[2]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((n) => n.replace(/\s+as\s+/, ": "));
          lines.push(
            `const { default: ${defaultName}, ${named.join(", ")} } = ${tempVar};`
          );
        }
      }
    }
  }
  return lines.join("\n");
}

// ─── Generador del código concatenado ─────────────────────────────────────

/**
 * Convierte un archivo parsable en un bloque que asigna su namespace a una
 * variable local: `const __mod_xxx = (() => { ...body...; return { default, ...named }; })();`
 *
 * Los imports bare NO se inlinean aquí: se coleccionan y van TODOS al inicio
 * del módulo completo (ESM hace hoisting de imports estáticos, así se evita
 * el temporal dead zone). Los imports relativos se resuelven a referencias
 * a las variables `__mod_yyy` de otros módulos inlineados.
 */
function wrapFileAsModule(
  path: string,
  code: string,
  fileMap: Record<string, string>
): { code: string; bareImports: string[]; error: string | null } {
  const { code: transformed, bareImports } = transformImports(
    code,
    path,
    fileMap
  );

  const exportNames: string[] = [];
  let body = transformed;

  // Quitar "export" de export const/function/class/let (quedan como declarations)
  body = body.replace(
    /\bexport\s+(const|let|var|function|class|async\s+function)\s+(\w+)/g,
    (_m, kw: string, name: string) => {
      exportNames.push(name);
      return `${kw} ${name}`;
    }
  );

  // Quitar "export default" dejando la declaración
  let defaultExpr = "undefined";
  if (body.includes("export default")) {
    const fnMatch = body.match(/\bexport\s+default\s+function\s+(\w+)\s*\(/);
    if (fnMatch) {
      body = body.replace(/\bexport\s+default\s+function/, "function");
      defaultExpr = fnMatch[1];
    } else {
      const clsMatch = body.match(/\bexport\s+default\s+class\s+(\w+)/);
      if (clsMatch) {
        body = body.replace(/\bexport\s+default\s+class/, "class");
        defaultExpr = clsMatch[1];
      } else {
        body = body.replace(
          /\bexport\s+default\s+/,
          "const __default_export = "
        );
        defaultExpr = "__default_export";
      }
    }
  }

  // Quitar re-exports no soportados
  body = body.replace(/\bexport\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?;?/g, "");
  body = body.replace(/\bexport\s*\*\s+from\s*['"][^'"]+['"];?/g, "");

  const namespaceEntries = [
    `default: ${defaultExpr}`,
    ...exportNames.map((n) => `${n}: ${n}`),
  ];

  const modVar = moduleName(path);

  // IIFE síncrono (NO async): los imports bare van al inicio del módulo
  // completo, no aquí. Esto evita el temporal dead zone.
  const wrapped = `const ${modVar} = (() => {
${body}
return { ${namespaceEntries.join(", ")} };
})();`;

  return { code: wrapped, bareImports, error: null };
}

// ─── Inspector de elementos (migrado de webbuilder-html.ts) ───────────────

/**
 * Inyecta en el HTML del iframe: (a) estilos para el hover del inspector, y
 * (b) un <script> que escucha clicks en el iframe y los reporta al parent vía
 * postMessage. Así el usuario puede clickear un elemento del preview para que
 * la IA lo edite.
 */
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

// ─── Función principal: renderProjectToHtml ───────────────────────────────

export interface RenderResult {
  /** HTML completo para el iframe srcdoc, o null si hubo error. */
  html: string | null;
  /** Mensaje de error limpio si el render falló. */
  error: string | null;
}

/**
 * Genera el HTML completo del iframe del preview desde los archivos del LLM.
 * Es la única función pública del módulo.
 */
/**
 * Fusiona imports bare del mismo specifier para evitar conflictos de
 * identificadores duplicados. Ej:
 *   import { useContext } from "react";
 *   import { createContext, useState } from "react";
 * →
 *   import { useContext, createContext, useState } from "react";
 *
 * También fusiona default + named del mismo specifier:
 *   import React from "react";
 *   import { useState } from "react";
 * →
 *   import React, { useState } from "react";
 *
 * Los imports side-effect (import "x") y namespace (import * as x) se dejan
 * intactos (no se fusionan).
 */
function mergeBareImports(imports: string[]): string[] {
  const bySpec = new Map<
    string,
    { defaults: string[]; named: Set<string>; sideEffect: boolean; namespace: string[] }
  >();

  for (const imp of imports) {
    // import "spec" (side-effect)
    const sideMatch = imp.match(/^import\s+['"]([^'"]+)['"];?$/);
    if (sideMatch) {
      const spec = sideMatch[1];
      const entry = bySpec.get(spec) || { defaults: [], named: new Set(), sideEffect: false, namespace: [] };
      entry.sideEffect = true;
      bySpec.set(spec, entry);
      continue;
    }
    // import * as ns from "spec"
    const nsMatch = imp.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?$/);
    if (nsMatch) {
      const ns = nsMatch[1];
      const spec = nsMatch[2];
      const entry = bySpec.get(spec) || { defaults: [], named: new Set(), sideEffect: false, namespace: [] };
      entry.namespace.push(ns);
      bySpec.set(spec, entry);
      continue;
    }
    // import Default, { A, B as C } from "spec"
    const mixedMatch = imp.match(
      /^import\s+(\w+)\s*,\s*\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?$/
    );
    if (mixedMatch) {
      const def = mixedMatch[1];
      const namedStr = mixedMatch[2];
      const spec = mixedMatch[3];
      const entry = bySpec.get(spec) || { defaults: [], named: new Set(), sideEffect: false, namespace: [] };
      entry.defaults.push(def);
      for (const n of namedStr.split(",").map((s) => s.trim()).filter(Boolean)) {
        entry.named.add(n);
      }
      bySpec.set(spec, entry);
      continue;
    }
    // import { A, B as C } from "spec"
    const namedMatch = imp.match(/^import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?$/);
    if (namedMatch) {
      const namedStr = namedMatch[1];
      const spec = namedMatch[2];
      const entry = bySpec.get(spec) || { defaults: [], named: new Set(), sideEffect: false, namespace: [] };
      for (const n of namedStr.split(",").map((s) => s.trim()).filter(Boolean)) {
        entry.named.add(n);
      }
      bySpec.set(spec, entry);
      continue;
    }
    // import Default from "spec"
    const defaultMatch = imp.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?$/);
    if (defaultMatch) {
      const def = defaultMatch[1];
      const spec = defaultMatch[2];
      const entry = bySpec.get(spec) || { defaults: [], named: new Set(), sideEffect: false, namespace: [] };
      entry.defaults.push(def);
      bySpec.set(spec, entry);
      continue;
    }
  }

  // Reconstruir imports fusionados
  const result: string[] = [];
  for (const [spec, entry] of bySpec) {
    if (entry.sideEffect && entry.defaults.length === 0 && entry.named.size === 0 && entry.namespace.length === 0) {
      result.push(`import "${spec}";`);
      continue;
    }
    const parts: string[] = [];
    if (entry.defaults.length > 0) {
      // Si hay múltiples defaults del mismo spec (raro), tomar el primero.
      parts.push(entry.defaults[0]);
    }
    for (const ns of entry.namespace) {
      parts.push(`* as ${ns}`);
    }
    if (entry.named.size > 0) {
      parts.push(`{ ${[...entry.named].join(", ")} }`);
    }
    const clause = parts.join(", ");
    result.push(`import ${clause} from "${spec}";`);
  }
  return result;
}

export function renderProjectToHtml(files: ProjectFiles): RenderResult {
  // 1. Normalizar el input a Record<string, string>
  const fileMap: Record<string, string> = {};
  for (const [p, f] of Object.entries(files)) {
    const code = typeof f === "string" ? f : f?.code ?? "";
    if (typeof code === "string" && code.trim()) {
      fileMap[normalizePath(p)] = code;
    }
  }

  if (Object.keys(fileMap).length === 0) {
    return { html: null, error: null }; // sin código, sin preview
  }

  // 2. Separar CSS de código
  let userCss = "";
  for (const [path, code] of Object.entries(fileMap)) {
    if (path.endsWith(".css")) {
      userCss += "\n" + code.replace(/@tailwind\s+(base|components|utilities);?/g, "");
    }
  }

  // 3. Encontrar el entry (priorizar /App.tsx)
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

  // 4. Orden topológico de archivos parsables
  const { order, error: topoError } = topoSort(fileMap);
  if (topoError) {
    return { html: null, error: topoError };
  }

  // 5. Envolver cada archivo como módulo y recolectar imports bare
  const moduleBlocks: string[] = [];
  const allBareImports: string[] = [];
  for (const path of order) {
    const { code: wrapped, bareImports, error: wrapError } = wrapFileAsModule(
      path,
      fileMap[path],
      fileMap
    );
    if (wrapError) {
      return { html: null, error: wrapError };
    }
    moduleBlocks.push(`// === ${path} ===\n${wrapped}`);
    allBareImports.push(...bareImports);
  }

  // 6. Imports bare al inicio (con hoisting de ESM, evita temporal dead zone).
  //    Hay que FUSIONAR imports del mismo specifier: si App.tsx importa
  //    `{ useContext }` de "react" y Badge.tsx también, no podemos tener dos
  //    `import { useContext } from "react"` (chocarían). Los fusionamos en uno.
  const reactImports = [
    'import React from "react";',
    'import { createRoot } from "react-dom/client";',
  ];
  // Asegurar que React y createRoot estén importados (el bootstrap los usa).
  const hasReactDefaultImport = allBareImports.some((i) =>
    /^import\s+React\s+from\s+["']react["']/.test(i)
  );
  const hasCreateRootImport = allBareImports.some((i) =>
    /from\s+["']react-dom\/client["']/.test(i)
  );
  const bootstrapImports = [
    !hasReactDefaultImport ? reactImports[0] : null,
    !hasCreateRootImport ? reactImports[1] : null,
  ].filter((x): x is string => x !== null);
  // Fusionar imports bare del usuario por specifier.
  const uniqueImports = mergeBareImports([...bootstrapImports, ...allBareImports]);

  // 7. Bootstrap: monta el entry en #root.
  //    Como los imports están arriba (hoisting), React y createRoot están
  //    disponibles. __entry es el namespace del módulo entry (IIFE síncrono).
  const entryMod = moduleName(entry);
  const bootstrap = `
// === bootstrap ===
const __entry = ${entryMod};
const root = document.getElementById("root");
if (root) {
  const App = __entry.default;
  createRoot(root).render(App ? React.createElement(App) : React.createElement("div", null, "El archivo principal no exporta un componente por defecto."));
}`;

  const fullCode =
    "// === imports (hoisted por ESM) ===\n" +
    uniqueImports.join("\n") +
    "\n\n" +
    moduleBlocks.join("\n\n") +
    "\n\n" +
    bootstrap;

  // 7. Generar HTML
  const html = buildIframeHtml(fullCode, userCss);
  return { html: injectInspectorScript(html), error: null };
}

/** Construye el HTML del iframe con importmap, Babel, Tailwind y el código. */
function buildIframeHtml(jsCode: string, userCss: string): string {
  const styleTag = userCss.trim()
    ? "<style>" + userCss.trim() + "</style>"
    : "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="importmap">
${IMPORT_MAP_JSON}
</script>
<script>
window.addEventListener('error', function(e) {
  window.parent.postMessage({
    type: 'MAVERLANG_RUNTIME_ERROR',
    message: e.error?.stack || e.message,
    lineno: e.lineno,
  }, '*');
});
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({
    type: 'MAVERLANG_RUNTIME_ERROR',
    message: 'Unhandled Promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)),
    lineno: 0,
  }, '*');
});
window.addEventListener('click', function(e) {
  var target = e.target;
  while (target && target.tagName !== 'A') {
    target = target.parentNode;
  }
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
          window.parent.postMessage({
            type: 'MAVERLANG_PREVIEW_NAVIGATE',
            href: href
          }, '*');
          console.log('[Maverlang Preview] Navegación interceptada a: ' + href);
        }
      }
    }
  }
}, true);
</script>
<script>
var _origWarn = console.warn;
console.warn = function() {};
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
<script>
console.warn = _origWarn;
if (typeof Babel !== 'undefined') {
  Babel.registerPreset('typescript-custom', {
    presets: [
      [Babel.availablePresets['typescript'], { allExtensions: true, isTSX: true }],
      Babel.availablePresets['react']
    ]
  });
}
</script>
${styleTag}
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-type="module" data-presets="typescript-custom">
${jsCode}
</script>
</body>
</html>`;
}
