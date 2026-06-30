import * as esbuild from "esbuild-wasm";
import { detectDependencies } from "@/lib/webbuilder-deps";
import { injectInspectorScript } from "@/components/webbuilder/preview-panel";

/**
 * Bundler autocontenido para el preview del webbuilder.
 *
 * SUSTITUYE al bundler de Sandpack (que descarga un Web Worker desde
 * sandpack.codesandbox.io y tenía un bug que colgaba el worker ante
 * SyntaxErrors, además de telemetría a csbops.io que la CSP/red bloqueaban).
 *
 * ARQUITECTURA
 * - esbuild-wasm corre EN EL NAVEGADOR (thread principal o worker propio),
 *   cargando el .wasm desde /esbuild.wasm (same-origin, en public/). CERO
 *   dependencia del CDN de CodeSandbox.
 * - Bundlear = tomar el entry (App.tsx) + todos los archivos del proyecto,
 *   resolver imports relativos entre archivos vía un plugin virtual, y dejar
 *   los imports de npm (react, etc.) como EXTERNOS.
 * - Los externos se resuelven en runtime vía un <script type="importmap"> en
 *   el iframe que apunta cada paquete a https://esm.sh/{name}@{version}.
 *   esm.sh es un CDN ESM estándar y estable (no es un worker frágil).
 * - El JS resultante (un módulo ESM) se inyecta en un iframe srcdoc junto al
 *   importmap y al script del inspector. El navegador ejecuta el módulo,
 *   react se carga desde esm.sh, y la app se monta en #root.
 *
 * Por qué es bulletproof frente a los fallos de Sandpack:
 *  - No hay worker remoto: esbuild corre localmente, capturamos el error.
 *  - No hay telemetría a csbops.io.
 *  - Todo same-origin excepto esm.sh (un fetch ESM normal, no un bundler).
 *  - Los SyntaxError se capturan limpiamente (esbuild devuelve mensaje claro).
 */

export type BundlerFiles = Record<string, { code: string } | string>;

let initPromise: Promise<void> | null = null;

/** Inicializa esbuild-wasm una sola vez (carga el .wasm desde /esbuild.wasm). */
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = esbuild
      .initialize({
        wasmURL: "/esbuild.wasm",
        // worker: false → corre en el thread principal. Más simple y evita
        // crear otro Web Worker que gestionar. El bundling es rápido (<500ms
        // para proyectos típicos) y no bloquea la UI perceptiblemente.
        worker: false,
      })
      .catch((err) => {
        // Si falla la init, reseteamos para reintentar la próxima vez.
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

function loaderFor(path: string): esbuild.Loader {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".js")) return "js";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "text";
}

/** Normaliza un path: asegura '/' inicial, sin extensiones dobles. */
function normalizePath(p: string): string {
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

/**
 * Resuelve un import relativo (./foo, ../bar, /baz) contra el directorio del
 * importador, probando extensiones. Devuelve el path del archivo en fileMap o
 * null si no se encuentra.
 */
function resolveRelative(spec: string, importer: string, fileMap: Record<string, string>): string | null {
  const importDir = importer ? importer.replace(/\/[^/]*$/, "") : "";
  let base = spec;
  if (base.startsWith("./")) base = base.slice(2);
  if (base.startsWith("../")) {
    // Subir un directorio desde importDir.
    const parts = importDir.split("/").filter(Boolean);
    base = base.replace(/^(\.\.\/)+/, "");
    const ups = (spec.match(/^\.\.\//g) || []).length;
    parts.splice(parts.length - ups + 1, ups);
    base = parts.join("/") + "/" + base;
  }
  if (base.startsWith("/")) base = base.slice(1);
  const dir = importDir.replace(/^\//, "");
  const candidate = (dir ? dir + "/" : "") + base;
  // Probar con extensiones y sin extensión.
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

export interface BundleResult {
  /** HTML completo para el iframe srcdoc, o null si hubo error. */
  html: string | null;
  /** Mensaje de error limpio si el bundling falló (sintaxis, import roto). */
  error: string | null;
}

/**
 * Bundles el proyecto y devuelve el HTML para el iframe.
 *
 * @param files mapa path -> { code }
 * @param deps dependencias detectadas (de detectDependencies) para el importmap
 */
export async function bundleProject(
  files: BundlerFiles,
  deps: Record<string, string>
): Promise<BundleResult> {
  // Normalizar files a Record<string,string>
  const fileMap: Record<string, string> = {};
  for (const [p, f] of Object.entries(files)) {
    fileMap[normalizePath(p)] = typeof f === "string" ? f : f?.code ?? "";
  }

  // Encontrar el entry. Buscamos el App.tsx típico de CRA/vite, o cualquier
  // archivo con render/createRoot como fallback.
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
    return { html: null, error: "No se encontró ningún archivo .tsx/.jsx/.ts/.js para previsualizar." };
  }

  // Bootstrap: monta el componente por defecto del entry en #root. Lo escribimos
  // como un módulo virtual que importa el entry real.
  const entryRel = "./" + entry.replace(/^\//, "").replace(/\.(tsx|ts|jsx|js)$/, "");
  const bootstrap = `import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import App from "${entryRel}";
const root = document.getElementById("root");
if (root && App) {
  createRoot(root).render(h(App));
} else if (root) {
  // El entry no tiene export default; intentar montar como función.
  createRoot(root).render(h("div", null, "El archivo principal no exporta un componente por defecto."));
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
      // write:false + outfile garantiza que outputFiles tenga exactamente un
      // elemento con el JS completo (path = el outfile). Sin outfile, esbuild-wasm
      // a veces no popula outputFiles o usa paths inconsistentes → "El bundling
      // no produjo código JS".
      write: false,
      outfile: "/bundle.js",
      sourcemap: false,
      // Externos: react, react-dom y cualquier paquete npm detectado.
      // Se resuelven en runtime vía importmap → esm.sh.
      external: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "react-dom/jsx-runtime",
        ...Object.keys(deps).filter(
          (d) =>
            !d.startsWith("react") &&
            !d.startsWith("@types") &&
            !["react", "react-dom"].includes(d)
        ),
      ],
      plugins: [
        {
          name: "maverlang-virtual",
          setup(build) {
            // Resolver imports relativos → archivos del proyecto (virtual).
            build.onResolve({ filter: /^\.\/|^\.\.\// }, (args) => {
              const resolved = resolveRelative(args.path, args.importer, fileMap);
              if (resolved) {
                return { path: resolved, namespace: "maverlang" };
              }
              return {
                path: args.path,
                namespace: "maverlang",
                external: false,
                errors: [
                  {
                    text: `No se pudo resolver "${args.path}" desde ${args.importer}`,
                  },
                ],
              };
            });
            // Resolver imports absolutos desde / (ej. /components/Foo).
            build.onResolve({ filter: /^\// }, (args) => {
              const resolved = resolveRelative(args.path, "/", fileMap) ?? (() => {
                const t = normalizePath(args.path);
                return fileMap[t] !== undefined ? t : null;
              })();
              if (resolved) {
                return { path: resolved, namespace: "maverlang" };
              }
              return {
                errors: [{ text: `No se pudo resolver "${args.path}"` }],
              };
            });
            // Cargar archivos del proyecto desde el fileMap.
            build.onLoad({ filter: /.*/, namespace: "maverlang" }, (args) => {
              const code = fileMap[args.path] ?? "";
              return { contents: code, loader: loaderFor(args.path) };
            });
          },
        },
      ],
    });

    if (result.warnings.length > 0) {
      // No es error fatal; lo registramos pero seguimos.
      console.warn("[Bundler] warnings:", result.warnings.map((w) => w.text));
    }

    // Diagnóstico de outputFiles: logueamos qué paths produjo esbuild para que,
    // si algo vuelve a fallar, tengamos info en consola en vez de un mensaje
    // genérico.
    const outPaths = result.outputFiles?.map((f) => f.path) ?? [];
    console.log("[Bundler] outputFiles paths:", outPaths);

    // Estrategia robusta para encontrar el JS:
    //  1. outfile explícito (/bundle.js)
    //  2. cualquier .js
    //  3. el primer outputFile (a veces el path no tiene extensión clara)
    const jsFile =
      result.outputFiles?.find((f) => f.path === "/bundle.js") ||
      result.outputFiles?.find((f) => f.path.endsWith(".js")) ||
      result.outputFiles?.[0];
    const cssFile = result.outputFiles?.find(
      (f) => f.path.endsWith(".css") && f.text && f.text.trim().length > 0
    );
    if (!jsFile || !jsFile.text) {
      console.error(
        "[Bundler] outputFiles vacío o sin texto. paths:",
        outPaths,
        "errors:",
        result.errors
      );
      return {
        html: null,
        error:
          "El bundling no produjo código JS. Esto puede indicar un problema de inicialización del compilador (esbuild-wasm). Recarga la página e inténtalo de nuevo.",
      };
    }
    const jsCode = jsFile.text;
    const cssCode = cssFile ? cssFile.text : "";

    return { html: buildPreviewHtml(jsCode, cssCode, deps), error: null };
  } catch (err: any) {
    // esbuild devuelve errores con messages[]; extraemos el primero legible.
    const msgs = err?.errors?.map((e: any) => e.text).join("\n");
    return { html: null, error: msgs || err?.message || String(err) };
  }
}

/**
 * Construye el HTML del iframe (srcdoc). Incluye:
 *  - importmap: mapea react/react-dom + deps a esm.sh
 *  - CSS bundleado como <style>
 *  - script del inspector (inyectado, igual que en Sandpack)
 *  - el JS bundleado como <script type="module">
 */
function buildPreviewHtml(
  jsCode: string,
  cssCode: string,
  deps: Record<string, string>
): string {
  // Importmap: react siempre, + cada dep detectada.
  const imports: Record<string, string> = {
    react: "https://esm.sh/react@18.3.1",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@18.3.1/jsx-dev-runtime",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react-dom/jsx-runtime": "https://esm.sh/react-dom@18.3.1/jsx-runtime",
  };
  for (const [name, version] of Object.entries(deps)) {
    if (name.startsWith("@types")) continue;
    if (imports[name]) continue;
    const v = version && version !== "latest" ? `@${version}` : "";
    imports[name] = `https://esm.sh/${name}${v}`;
    // Subpath imports (ej. lucide-react/icons/foo) → wildcard.
    imports[name + "/"] = `https://esm.sh/${name}${v}/`;
  }
  const importmap = JSON.stringify({ imports });

  // HTML base. Inyectamos el inspector (que añade su <style> + <script> para
  // el modo inspeccionar) y luego nuestro CSS y JS.
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="importmap">${importmap}</script>
${cssCode ? `<style>${cssCode}</style>` : ""}
</head>
<body>
<div id="root"></div>
<script type="module">
${jsCode}
</script>
</body>
</html>`;
  // El inspector script del preview-panel se inyecta para mantener el modo
  // "inspeccionar elemento" del webbuilder. Reutilizamos la misma función.
  html = injectInspectorScript(html);
  return html;
}
