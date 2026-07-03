import * as esbuild from "esbuild-wasm";
import { injectInspectorScript } from "@/components/webbuilder/preview-panel";

/**
 * Bundler autocontenido para el preview del webbuilder — MODO BUILD.
 *
 * ARQUITECTURA (igual que el build de producción de Next.js: UN solo bundle
 * con todo dentro, react incluido. Sin importmap, sin externals, sin CDN en
 * runtime).
 *
 *  1. esbuild-wasm corre en el navegador, cargando /esbuild.wasm (same-origin).
 *  2. Los archivos del proyecto se resuelven vía un plugin virtual (imports
 *     relativos ./  ../  y absolutos / del proyecto).
 *  3. Los paquetes npm (react, react-dom, lucide-react, ...) los resuelve un
 *     plugin "esm-sh" que hace fetch a https://esm.sh/{pkg}, reescribe los
 *     imports internos a URLs absolutas, y los inlinea en el bundle.
 *  4. El resultado es UN único módulo ESM con TODO dentro (React es una sola
 *     instancia en el closure del bundle) → imposibles los errores #185, #31,
 *     "useContext null" y "Unexpected identifier 'as'" que venían de tener
 *     React repartido entre el bundle y el importmap.
 *  5. El HTML del iframe solo tiene `<script type="module">bundle</script>` —
 *     sin importmap. Cero resolution en runtime.
 *
 * Por qué es bulletproof:
 *  - No hay worker remoto de Sandpack.
 *  - No hay telemetría.
 *  - Una sola instancia de React (siempre).
 *  - Los SyntaxError del código del usuario se capturan y muestran limpios.
 */

export type BundlerFiles = Record<string, { code: string } | string>;

let initPromise: Promise<void> | null = null;

/** Inicializa esbuild-wasm una sola vez (carga el .wasm desde /esbuild.wasm). */
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = esbuild
      .initialize({
        wasmURL: "/esbuild.wasm",
        // worker:false → corre en el thread principal. Más simple, sin otro
        // Web Worker que gestionar. El bundling es rápido (<1s) para proyectos
        // típicos y no bloquea la UI perceptiblemente.
        worker: false,
      })
      .catch((err) => {
        initPromise = null;
        // Provide a clear error so the user knows what went wrong instead of
        // a cryptic "Cannot read properties of undefined" from esbuild-wasm.
        throw new Error(
          `No se pudo cargar el bundler (esbuild.wasm). ` +
          `Verifica que /esbuild.wasm exista en public/ y que la conexión sea estable. ` +
          `Detalle: ${err?.message || String(err)}`
        );
      });
  }
  return initPromise;
}

function loaderFor(path: string): esbuild.Loader {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".js")) return "js";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "text";
}

function normalizePath(p: string): string {
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

/**
 * Resuelve un import relativo (./foo, ../bar, /baz) contra el directorio del
 * importador, probando extensiones. Devuelve el path del archivo en fileMap o
 * null si no se encuentra.
 */
function resolveRelative(
  spec: string,
  importer: string,
  fileMap: Record<string, string>
): string | null {
  const importDir = importer ? importer.replace(/\/[^/]*$/, "") : "";
  let base = spec;
  if (base.startsWith("./")) base = base.slice(2);
  if (base.startsWith("../")) {
    const parts = importDir.split("/").filter(Boolean);
    base = base.replace(/^(\.\.\/)+/, "");
    const ups = (spec.match(/^\.\.\//g) || []).length;
    parts.splice(parts.length - ups + 1, ups);
    base = parts.join("/") + "/" + base;
  }
  if (base.startsWith("/")) base = base.slice(1);
  const dir = importDir.replace(/^\//, "");
  const candidate = (dir ? dir + "/" : "") + base;
  const tries = [
    candidate,
    candidate + ".tsx",
    candidate + ".ts",
    candidate + ".jsx",
    candidate + ".js",
    candidate + "/index.tsx",
    candidate + "/index.ts",
    candidate + "/index.jsx",
    candidate + "/index.js",
  ].map(normalizePath);
  for (const t of tries) {
    if (fileMap[t] !== undefined) return t;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Plugin esm.sh: resuelve e inlinea paquetes npm en tiempo de bundling.
//
// esm.sh devuelve ESM cuyos imports internos son rutas relativas (./  ../) o
// absolutas en su host (/v135/...). esbuild-wasm no sabe resolver URLs http
// relativas por sí mismo, así que reescribimos todos los specifiers del fuente
// a URLs https absolutas dentro de onLoad. Así esbuild siempre ve imports
// "https://esm.sh/..." y vuelve a entrar al plugin → fetch → inlinear.
// Resultado: un único bundle con TODO dentro, una sola instancia de React.
// ---------------------------------------------------------------------------

// Versiones pinneadas para los paquetes críticos (evita mezclar versiones
// entre react y react/jsx-runtime, que causaba las dos instancias de React).
const PINNED: Record<string, string> = {
  react: "18.3.1",
  "react-dom": "18.3.1",
};

function isBareSpecifier(s: string): boolean {
  return (
    !!s &&
    !s.startsWith(".") &&
    !s.startsWith("/") &&
    !s.startsWith("https://") &&
    !s.startsWith("http://") &&
    !s.startsWith("node:")
  );
}

/** Construye la URL de esm.sh para un specifier bare, aplicando versión pinneada. */
function esmShUrl(specifier: string): string {
  // Subpaths tipo "react/jsx-runtime", "react-dom/client".
  const head = specifier.split("/")[0].startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
  const sub = specifier.slice(head.length); // resto ("/jsx-runtime", "", etc.)
  const ver = PINNED[head];
  const withVersion = ver ? `${head}@${ver}` : head;
  // Conservamos el subpath; esm.sh resuelve la ruta interna.
  return `https://esm.sh/${withVersion}${sub}`;
}

/**
 * Reescribe los specifiers de import/export de un módulo de esm.sh a URLs
 * https absolutas (maneja ./  ../  y /absoluto). Los bare y los https ya
 * absolutos se dejan igual (esbuild los reenvía al plugin esm-sh).
 */
function rewriteEsmImports(code: string, importerUrl: string): string {
  let origin = "https://esm.sh";
  try {
    origin = new URL(importerUrl).origin;
  } catch {
    /* noop */
  }
  const resolve = (spec: string): string => {
    if (spec.startsWith("./") || spec.startsWith("../")) {
      try {
        return new URL(spec, importerUrl).href;
      } catch {
        return spec;
      }
    }
    if (spec.startsWith("/")) {
      return origin + spec;
    }
    return spec;
  };
  // import/export [clauses] from "spec"
  code = code.replace(
    /(import|export)(\b[^'"`;]*?\bfrom\s*)['"]([^'"]+)['"]/g,
    (_m, kw, mid, spec) => `${kw}${mid}"${resolve(spec)}"`
  );
  // import "spec" (side-effect) — evita los que ya tienen 'from'
  code = code.replace(
    /(import)(\s+)['"]([^'"]+)['"]/g,
    (_m, kw, sp, spec) => `${kw}${sp}"${resolve(spec)}"`
  );
  // dynamic import("spec")
  code = code.replace(
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    (_m, spec) => `import("${resolve(spec)}")`
  );
  return code;
}

export interface BundleResult {
  /** HTML completo para el iframe srcdoc, o null si hubo error. */
  html: string | null;
  /** Mensaje de error limpio si el bundling falló (sintaxis, import roto). */
  error: string | null;
}

/**
 * Bundles el proyecto completo (proyecto + deps de esm.sh) en un único módulo
 * ESM y devuelve el HTML del iframe.
 */
export async function bundleProject(
  files: BundlerFiles
): Promise<BundleResult> {
  const fileMap: Record<string, string> = {};
  for (const [p, f] of Object.entries(files)) {
    fileMap[normalizePath(p)] = typeof f === "string" ? f : f?.code ?? "";
  }

  // Encontrar el entry.
  const entryCandidates = [
    "/App.tsx",
    "/App.jsx",
    "/src/App.tsx",
    "/src/App.jsx",
    "/index.tsx",
    "/index.jsx",
    "/src/index.tsx",
    "/src/main.tsx",
  ];
  let entry = entryCandidates.find((p) => fileMap[p] !== undefined);
  if (!entry) {
    entry = Object.keys(fileMap).find((p) => PARSABLE_EXT.some((e) => p.endsWith(e)));
  }
  if (!entry) {
    return {
      html: null,
      error: "No se encontró ningún archivo .tsx/.jsx/.ts/.js para previsualizar.",
    };
  }

  const entryRel = "./" + entry.replace(/^\//, "").replace(/\.(tsx|ts|jsx|js)$/, "");
  const bootstrap = `import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import App from "${entryRel}";
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(App ? h(App) : h("div", null, "El archivo principal no exporta un componente por defecto."));
}
`;

  try {
    await ensureInit();

    const result = await esbuild.build({
      stdin: {
        contents: bootstrap,
        resolveDir: "/",
        sourcefile: "__bootstrap.tsx",
        loader: "tsx",
      },
      bundle: true,
      format: "esm",
      target: "es2020",
      jsx: "automatic",
      write: false,
      outfile: "/bundle.js",
      sourcemap: false,
      // SIN external: react/react-dom se inlinean en el bundle. Es la única
      // forma de garantizar UNA instancia de React (mata #185/#31/useContext null).
      logLevel: "silent",
      plugins: [
        {
          name: "maverlang-virtual",
          setup(build) {
            // Resolver imports relativos → archivos del proyecto.
            build.onResolve({ filter: /^\.\/|^\.\.\// }, (args) => {
              const resolved = resolveRelative(args.path, args.importer, fileMap);
              if (resolved) {
                return { path: resolved, namespace: "maverlang" };
              }
              return {
                errors: [
                  {
                    text: `No se pudo resolver "${args.path}" desde ${args.importer}. Revisa que el archivo exista y la ruta sea correcta.`,
                  },
                ],
              };
            });
            // Resolver imports absolutos desde / raíz del proyecto.
            // IMPORTANTE: esm.sh sirve módulos con imports internos absolutos
            // (ej: import "/motion-utils@^12.39.0?target=es2022"). rewriteEsmImports
            // intenta convertirlos a URLs https, pero no captura todos los casos.
            // Si un path / no está en el fileMap del proyecto, es casi seguro un
            // specifier interno de esm.sh → redirigir al plugin esm-sh en vez de
            // fallar. Los archivos reales del proyecto SIEMPRE están en fileMap.
            build.onResolve({ filter: /^\// }, (args) => {
              const t = normalizePath(args.path);
              if (fileMap[t] !== undefined) {
                return { path: t, namespace: "maverlang" };
              }
              const resolved = resolveRelative(args.path, "/", fileMap);
              if (resolved) {
                return { path: resolved, namespace: "maverlang" };
              }
              // No es archivo del proyecto → es un specifier interno de esm.sh
              // (con @version, ?query, o nombre de paquete). Mandarlo al plugin
              // esm-sh con la URL absoluta. Origen por defecto: esm.sh.
              return {
                path: `https://esm.sh${args.path}`,
                namespace: "esm-sh",
              };
            });
            // Cargar archivos del proyecto desde el fileMap.
            build.onLoad({ filter: /.*/, namespace: "maverlang" }, (args) => {
              const code = fileMap[args.path] ?? "";
              return { contents: code, loader: loaderFor(args.path) };
            });
          },
        },
        {
          name: "maverlang-esm-sh",
          setup(build) {
            // Bare specifiers (react, lucide-react, recharts...) → esm.sh.
            build.onResolve({ filter: /.*/ }, (args) => {
              if (!isBareSpecifier(args.path)) return null;
              return { path: esmShUrl(args.path), namespace: "esm-sh" };
            });
            // URLs https:// → esm-sh (incluye las reescritas dentro de módulos).
            build.onResolve({ filter: /^https?:\/\// }, (args) => ({
              path: args.path,
              namespace: "esm-sh",
            }));
            build.onLoad(
              { filter: /.*/, namespace: "esm-sh" },
              async (args) => {
                try {
                  // AbortController con timeout: sin esto, si esm.sh acepta la
                  // conexión pero no responde (o tarda mucho), el await cuelga
                  // indefinidamente. Como el bundler corre en el main thread
                  // (worker:false), eso congela la UI para siempre. 15s es
                  // suficiente para cualquier módulo de esm.sh.
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 15000);
                  const res = await fetch(args.path, {
                    redirect: "follow",
                    signal: controller.signal,
                  });
                  clearTimeout(timeoutId);
                  if (!res.ok) {
                    return {
                      errors: [
                        {
                          text: `No se pudo cargar "${args.path}" (HTTP ${res.status}). El paquete no existe o la versión es inválida.`,
                        },
                      ],
                    };
                  }
                  let text = await res.text();
                  // Reescribir imports internos a URLs absolutas para que
                  // esbuild los resuelva de vuelta por este plugin.
                  text = rewriteEsmImports(text, args.path);
                  // loader "ts" (NO "tsx" ni "js"):
                  //  - "js" pasa TypeScript crudo → "Unexpected identifier 'as'"
                  //    cuando esm.sh sirve código con type assertions.
                  //  - "tsx" interpreta `<` como JSX → rompe comparaciones como
                  //    `x < 5` en el JS compilado de las dependencias.
                  //  - "ts" transpila TypeScript (as, interfaces, generics) pero
                  //    NO parsea JSX. Perfecto: esm.sh ya compiló el JSX a JS.
                  return {
                    contents: text,
                    loader: "ts",
                  };
                } catch (err: any) {
                  return {
                    errors: [
                      {
                        text: `Error de red cargando "${args.path}": ${err?.message ?? err}. Revisa tu conexión.`,
                      },
                    ],
                  };
                }
              }
            );
          },
        },
      ],
    });

    if (result.warnings.length > 0) {
      console.warn(
        "[Bundler] warnings:",
        result.warnings.map((w) => w.text)
      );
    }

    const jsFile =
      result.outputFiles?.find((f) => f.path === "/bundle.js") ||
      result.outputFiles?.find((f) => f.path.endsWith(".js")) ||
      result.outputFiles?.[0];
    const cssFile = result.outputFiles?.find(
      (f) => f.path.endsWith(".css") && f.text && f.text.trim().length > 0
    );
    if (!jsFile || !jsFile.text) {
      console.error("[Bundler] sin salida JS. errors:", result.errors);
      return {
        html: null,
        error:
          result.errors?.[0]?.text ||
          "El bundling no produjo código JS. Recarga la página e inténtalo de nuevo.",
      };
    }

    return {
      html: buildPreviewHtml(jsFile.text, cssFile ? cssFile.text : ""),
      error: null,
    };
  } catch (err: any) {
    const msgs = err?.errors?.map((e: any) => e.text).join("\n");
    return { html: null, error: msgs || err?.message || String(err) };
  }
}

/**
 * HTML del iframe: solo `<script type="module">bundle</script>`.
 * SIN importmap — todo está inline en el bundle (modo build).
 */
function buildPreviewHtml(jsCode: string, cssCode: string): string {
  // Filtramos las directivas @tailwind del CSS del usuario: esbuild-wasm no las
  // procesa (necesita PostCSS), y dejarlas como <style> no hace nada útil.
  // En su lugar, inyectamos el Tailwind Play CDN que genera utilidades en
  // runtime desde las clases que aparece en el DOM. Sin esto, las apps que
  // usan clases Tailwind se ven "sin diseño" (HTML puro).
  const userCss = cssCode
    ? cssCode.replace(/@tailwind\s+(base|components|utilities);?/g, "")
    : "";
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
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
