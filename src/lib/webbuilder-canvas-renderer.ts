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
const LUCIDE_VERSION = "0.400.0";
const ESM = "https://esm.sh";

const IMPORT_MAP: Record<string, string> = {
  react: `${ESM}/react@${REACT_VERSION}`,
  "react/": `${ESM}/react@${REACT_VERSION}/`,
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

/** PascalCase icon → kebab-case file (AlertCircle → alert-circle). */
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Reescribe `import { Sword, Heart as H } from "lucide-react"` a un import
 * por icono. El barrel de lucide-react en esm.sh suele tardar tanto que
 * Vercel/CDN responden 504 y el preview muere con "Script error".
 */
function lucideClauseToPerIconImports(clause: string): string[] {
  const c = clause.trim();
  if (!c.startsWith("{") || !c.endsWith("}")) return [];
  const names = c
    .slice(1, -1)
    .split(",")
    .map((s) => s.trim())
    .filter((n) => n && !n.startsWith("type "));
  return names.map((n) => {
    const parts = n.split(/\s+as\s+/);
    const orig = (parts[0] || "").trim();
    const local = (parts[1] || orig).trim();
    if (!orig) return "";
    const kebab = pascalToKebab(orig);
    return `import ${local} from "${ESM}/lucide-react@${LUCIDE_VERSION}/dist/esm/icons/${kebab}?external=react";`;
  }).filter(Boolean);
}

/** Convierte un specifier npm a URL de esm.sh, dejando react/* en bare (importmap). */
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
    const sub = spec.slice("react-icons/".length);
    return `${ESM}/react-icons@5.2.1/${sub}?external=react`;
  }
  return `${ESM}/${spec}?external=react,react-dom`;
}

const ASSET_EXT = /\.(css|scss|sass|png|jpe?g|gif|svg|webp|ico|mp3|wav|ogg|json|glb|gltf)$/i;

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
/** Quita `type Foo` de `{ Foo, type Bar }` para no importar tipos como valor. */
function dropInlineTypeImports(clause: string): string {
  return clause.replace(/\{([^}]*)\}/g, (_m, inner: string) => {
    const names = inner
      .split(",")
      .map((s) => s.trim())
      .filter((n) => n && !/^type\s/.test(n));
    return `{ ${names.join(", ")} }`;
  });
}

/**
 * Los archivos se envuelven en un IIFE. `export type` / `import type` solo son
 * válidos a nivel de módulo, así que hay que bajarlos a `type`/`interface` o
 * eliminarlos ANTES de wrappear. Si no, Babel tira:
 *   'import' and 'export' may only appear at the top level
 */
function stripTypeOnlySyntax(code: string): string {
  let out = code;
  out = out.replace(/\bimport\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, "");
  out = out.replace(/\bexport\s+type\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?;?/g, "");
  out = out.replace(/\bexport\s+type\s+/g, "type ");
  out = out.replace(/\bexport\s+interface\s+/g, "interface ");
  out = out.replace(/\bexport\s+declare\s+/g, "declare ");
  return out;
}

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
      let trimmedClause = dropInlineTypeImports(clause.trim());
      if (/^type(\s|{)/.test(trimmedClause) || trimmedClause === "{  }" || trimmedClause === "{}") {
        return "";
      }
      if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) {
        if (ASSET_EXT.test(spec)) {
          if (/^\w+$/.test(trimmedClause)) {
            return `const ${trimmedClause} = ${JSON.stringify(spec)};`;
          }
          return `/* asset import skipped: ${spec} */`;
        }
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
      if (spec === "lucide-react") {
        const perIcon = lucideClauseToPerIconImports(trimmedClause);
        if (perIcon.length > 0) {
          bareImports.push(...perIcon);
          return "";
        }
      }
      const rewritten = rewriteBareSpec(spec);
      bareImports.push(`import ${trimmedClause} from "${rewritten}";`);
      return "";
    }
  );

  // Caso 2: import "spec" (side-effect, sin cláusula)
  out = out.replace(
    /\bimport\s+['"]([^'"]+)['"]/g,
    (fullMatch: string, spec: string) => {
      if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) {
        return `/* unresolved side-effect relative: ${spec} */`;
      }
      const rewritten = rewriteBareSpec(spec);
      bareImports.push(`import "${rewritten}";`);
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
    stripTypeOnlySyntax(code),
    path,
    fileMap
  );

  const exportNames: string[] = [];
  let body = transformed;

  // Quitar "export" de export const/function/class/let/enum (quedan como declarations)
  body = body.replace(
    /\bexport\s+(async\s+function|const\s+enum|function|class|enum|const|let|var)\s+(\w+)/g,
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

  // Quitar re-exports no soportados y cualquier `export` residual (type/interface
  // ya deberían estar strippeados; esto evita el error de Babel "may only appear
  // at the top level" si queda alguno dentro del IIFE).
  body = body.replace(/\bexport\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?;?/g, "");
  body = body.replace(/\bexport\s*\*\s+(?:as\s+\w+\s+)?from\s*['"][^'"]+['"];?/g, "");
  body = stripTypeOnlySyntax(body);
  body = body.replace(/\bexport\s+(?=type\b|interface\b|enum\b|declare\b|async\b|function\b|class\b|const\b|let\b|var\b|default\b|{)/g, "");

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

  const fullCode = stripTypeOnlySyntax(
    "// === imports (hoisted por ESM) ===\n" +
    uniqueImports.join("\n") +
    "\n\n" +
    moduleBlocks.join("\n\n") +
    "\n\n" +
    bootstrap
  );

  // 7. Generar HTML
  const html = buildIframeHtml(fullCode, userCss);
  return { html: injectInspectorScript(html), error: null };
}

/** Construye el HTML del iframe con importmap, Babel, Tailwind y el código. */
function buildIframeHtml(jsCode: string, userCss: string): string {
  const styleTag = userCss.trim()
    ? "<style>" + userCss.trim() + "</style>"
    : "";
  const safeCode = jsCode.replace(/<\/script/gi, "<\\/script");
  const importMapJson = JSON.stringify({ imports: IMPORT_MAP }, null, 2);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="https://preview.invalid/">
<script type="importmap">
${importMapJson}
</script>
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
  function report(message, lineno, filename, ignorableFlag) {
    if (ignorableFlag || ignorable(message, filename)) return;
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
        report('No se pudo cargar el compilador de la preview (timeout). Reintentá.', 0, resSrc, false);
        return;
      }
      if (resSrc.indexOf('esm.sh') !== -1 || resSrc.indexOf('jsdelivr') !== -1) {
        report('No se pudo cargar una librería (' + resSrc + '). Suele ser un timeout del CDN. Reintentá la preview.', 0, resSrc, false);
        return;
      }
      return;
    }
    report((e.error && (e.error.stack || e.error.message)) || e.message, e.lineno, e.filename, false);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var message = (reason && reason.message) ? reason.message : String(reason || '');
    report('Unhandled Promise rejection: ' + message, 0, '', false);
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
<script type="text/plain" id="__maverlang_src">${safeCode}</script>
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
  function run() {
    if (typeof Babel === 'undefined') {
      window.parent.postMessage({
        type: 'MAVERLANG_RUNTIME_ERROR',
        message: 'Babel no está disponible en la preview.',
      }, '*');
      return;
    }
    Babel.registerPreset('typescript-custom', {
      presets: [
        [Babel.availablePresets['typescript'], { allExtensions: true, isTSX: true }],
        Babel.availablePresets['react']
      ]
    });
    var src = document.getElementById('__maverlang_src');
    var code = src ? src.textContent : '';
    var transformed;
    try {
      transformed = Babel.transform(code, {
        presets: ['typescript-custom'],
        filename: 'App.tsx',
        sourceType: 'module'
      }).code;
    } catch (err) {
      window.parent.postMessage({
        type: 'MAVERLANG_RUNTIME_ERROR',
        message: 'Error de sintaxis: ' + (err && err.message ? err.message : String(err)),
      }, '*');
      return;
    }
    var blob = new Blob([transformed], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    import(url).catch(function (err) {
      var msg = (err && err.message) ? err.message : String(err);
      if (/Failed to fetch|error loading dynamically imported module|504|502|timeout/i.test(msg)) {
        msg = 'No se pudieron cargar las librerías de la preview (timeout del CDN). Reintentá.';
      }
      window.parent.postMessage({
        type: 'MAVERLANG_RUNTIME_ERROR',
        message: msg,
      }, '*');
    });
  }
  loadBabel(0);
})();
</script>
</body>
</html>`;
}
