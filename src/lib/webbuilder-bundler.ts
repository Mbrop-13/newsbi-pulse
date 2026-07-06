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

/**
 * Verifica que esbuild esté realmente listo para usarse. Si initialize()
 * falló (ej. el .wasm no cargó por Content-Type incorrecto o red caída),
 * no podemos bundlear: devolver falso para que el caller muestre un error
 * en lugar de inyectar código TS crudo en el iframe.
 */
async function isEsbuildReady(): Promise<boolean> {
  try {
    await ensureInit();
    return true;
  } catch {
    return false;
  }
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
 *
 * Implementación: concatena importDir + spec y luego normaliza (resuelve . y ..).
 * Esto evita el bug anterior donde el cálculo de "subir N directorios" con
 * splice era incorrecto y además se volvía a prepend importDir al candidate.
 */
function resolveRelative(
  spec: string,
  importer: string,
  fileMap: Record<string, string>
): string | null {
  const importDir = importer ? importer.replace(/\/[^/]*$/, "") : "";

  // Construir el path completo concatenando dir + spec
  let fullPath: string;
  if (spec.startsWith("./")) {
    fullPath = (importDir || "") + "/" + spec.slice(2);
  } else if (spec.startsWith("../")) {
    fullPath = (importDir || "") + "/" + spec;
  } else if (spec.startsWith("/")) {
    fullPath = spec;
  } else {
    fullPath = spec;
  }

  // Normalizar: resolver . y .. segmento a segmento
  const segments = fullPath.split("/").filter((s) => s && s !== ".");
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") {
      resolved.pop();
    } else {
      resolved.push(seg);
    }
  }
  const normalized = normalizePath(resolved.join("/"));

  // Probar con extensiones y /index
  const tries = [
    normalized,
    normalized + ".tsx",
    normalized + ".ts",
    normalized + ".jsx",
    normalized + ".js",
    normalized + "/index.tsx",
    normalized + "/index.ts",
    normalized + "/index.jsx",
    normalized + "/index.js",
  ];
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

// Caché en memoria para módulos de esm.sh. Sin esto, cada re-bundle
// (disparado por cualquier cambio de código tras 400ms de debounce) vuelve
// a descargar TODOS los paquetes npm desde esm.sh. Para un proyecto típico
// con react + react-dom + lucide-react + framer-motion son ~8-12 fetchs
// por re-bundle. El caché es por URL y dura toda la sesión del navegador.
const esmShCache = new Map<string, { text: string; status: number }>();

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
  // IMPORTANTE: esm.sh sirve módulos MINIFICADOS en una sola línea con varios
  // imports pegados por ';'. No podemos anclar a ^ (inicio de línea) porque
  // solo matchearía el PRIMERO de cada línea y dejaría los demás sin reescribir
  // (bug que rompía framer-motion@12.x: "No se pudo resolver ../sequence/create.mjs").
  // En su lugar exigimos un separador de statement antes de import/export
  // (^, ;, {}, (), =, o whitespace) para evitar falsos positivos dentro de
  // strings/comentarios.
  // Grupos: 1=prefix(sep), 2=keyword, 3=mid, 4=quote, 5=specifier.
  code = code.replace(
    /(^|[;{}()\s=])(import|export)([^'";]*?\bfrom\s*)(['"])([^'"]+)\4/g,
    (_m, p, kw, mid, _q, spec) => `${p}${kw}${mid}"${resolve(spec)}"`
  );
  // import "spec" (side-effect) — evita los que ya tienen 'from'. Mismo
  // razonamiento: separador previo en vez de ^ para soportar código minificado.
  code = code.replace(
    /(^|[;{}()\s=])(import)(\s+)(['"])([^'"]+)\4/g,
    (_m, p, kw, sp, _q, spec) => `${p}${kw}${sp}"${resolve(spec)}"`
  );
  // dynamic import("spec") — no se puede anclar a inicio de línea porque es
  // una expresión. \b antes de import reduce falsos positivos.
  code = code.replace(
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    (_m, spec) => `import("${resolve(spec)}")`
  );
  return code;
}

/**
 * Detecta "type assertions" de TypeScript residuales (`x as Type`) en un bundle
 * JS YA transpilado por esbuild. Si las hay, el bundle fallará en runtime con
 * un críptico "Unexpected identifier 'as'". Esta función las detecta ANTES de
 * inyectar el bundle en el iframe y devuelve un error claro con la línea exacta.
 *
 * Por qué es necesario: esbuild a veces NO transpila `as` cuando:
 *  - Un módulo de esm.sh se carga con loader "js" en lugar de "ts" (edge case).
 *  - El código del usuario llega por un camino que no pasa por loaderFor correctamente.
 *  - Una aserción queda dentro de un contexto que el parser automático no toca.
 *
 * Tracker de contexto: un `as` es LEGAL dentro de braces de import/export
 * (`import { foo as bar }`). Por eso trackeamos `importExportDepth`.
 */
function detectStrayTypeAssertion(code: string): {
  line: number;
  column: number;
  snippet: string;
} | null {
  const n = code.length;
  let i = 0;
  let pendingImportExport = false;
  let importExportDepth = 0;

  const isWordChar = (ch: string) =>
    ch.length === 1 && /[a-zA-Z0-9_$]/.test(ch);
  const isWordAt = (pos: number) => pos >= 0 && pos < n && isWordChar(code[pos]);
  const readWordAt = (pos: number) => {
    let j = pos;
    while (j < n && isWordChar(code[j])) j++;
    return code.slice(pos, j);
  };

  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];

    // Comentarios
    if (c === "/" && c2 === "/") {
      i += 2;
      while (i < n && code[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && c2 === "*") {
      i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // Strings (incluye template literals con ${})
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++;
      while (i < n && code[i] !== quote) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (quote === "`" && code[i] === "$" && code[i + 1] === "{") {
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            if (code[i] === "\\") {
              i += 2;
              continue;
            }
            if (code[i] === "{") depth++;
            else if (code[i] === "}") depth--;
            i++;
          }
          continue;
        }
        i++;
      }
      i++;
      pendingImportExport = false;
      continue;
    }

    // import/export statement → marca para ignorar `as` dentro de sus braces
    if ((c === "i" || c === "e") && !isWordAt(i - 1)) {
      const word = readWordAt(i);
      if (word === "import" || word === "export") {
        let prev = i - 1;
        while (prev >= 0 && /\s/.test(code[prev])) prev--;
        if (prev < 0 || code[prev] !== ".") {
          pendingImportExport = true;
        }
        i += word.length;
        continue;
      }
    }

    if (c === "{") {
      if (pendingImportExport && importExportDepth === 0) {
        importExportDepth = 1;
        pendingImportExport = false;
      } else if (importExportDepth > 0) {
        importExportDepth++;
      }
      i++;
      continue;
    }
    if (c === "}") {
      if (importExportDepth > 0) importExportDepth--;
      i++;
      continue;
    }
    if (c === ";" || c === "(" || c === "=" || c === "*" || c === "\n") {
      if (importExportDepth === 0) pendingImportExport = false;
      i++;
      continue;
    }

    // `as` residual FUERA de import/export braces → type assertion no transpilada.
    // Un cast TS tiene forma `expr as Type`: después de "as" debe haber un
    // identificador (el tipo). Esto descarta `function as(`, `obj.as(`, etc.
    // donde "as" es un nombre propio.
    if (c === "a" && c2 === "s" && !isWordAt(i - 1) && !isWordAt(i + 2)) {
      // Saltar espacios después de "as" y verificar que sigue un identificador
      let k = i + 2;
      while (k < n && (code[k] === " " || code[k] === "\t")) k++;
      const typeStartsWithIdentifier = k < n && isWordChar(code[k]);
      if (importExportDepth === 0 && typeStartsWithIdentifier) {
        let j = i - 1;
        while (j >= 0 && /\s/.test(code[j])) j--;
        if (
          j >= 0 &&
          (code[j] === ")" || code[j] === "]" || isWordChar(code[j]) || code[j] === ">")
        ) {
          let line = 1;
          let lineStart = 0;
          for (let k2 = 0; k2 < i; k2++) {
            if (code[k2] === "\n") {
              line++;
              lineStart = k2 + 1;
            }
          }
          let lineEnd = code.indexOf("\n", i);
          if (lineEnd === -1) lineEnd = n;
          return {
            line,
            column: i - lineStart,
            snippet: code.slice(lineStart, lineEnd).trim(),
          };
        }
      }
      i += 2;
      continue;
    }

    i++;
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
    // Verificar que esbuild está realmente listo antes de intentar bundlear.
    // Si el .wasm no cargó (Content-Type incorrecto en Vercel, red caída),
    // devolvemos error claro en lugar de inyectar código TS crudo en el iframe.
    const ready = await isEsbuildReady();
    if (!ready) {
      return {
        html: null,
        error:
          "No se pudo cargar el motor de previsualización (esbuild.wasm). " +
          "Esto suele ocurrir cuando el archivo .wasm se sirve con un " +
          "Content-Type incorrecto (debe ser application/wasm). " +
          "Recarga la página e inténtalo de nuevo.",
      };
    }

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
                  // Caché: si ya descargamos este módulo en esta sesión,
                  // usar la versión cacheada en lugar de volver a hacer fetch.
                  const cached = esmShCache.get(args.path);
                  if (cached) {
                    if (cached.status >= 400) {
                      return {
                        errors: [
                          {
                            text: `No se pudo cargar "${args.path}" (HTTP ${cached.status}, cacheado). El paquete no existe o la versión es inválida.`,
                          },
                        ],
                      };
                    }
                    let text = cached.text;
                    text = rewriteEsmImports(text, args.path);
                    return { contents: text, loader: "ts" };
                  }

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
                    // Guardar el error en caché para no reintentar fetchs fallidos.
                    esmShCache.set(args.path, { text: "", status: res.status });
                    return {
                      errors: [
                        {
                          text: `No se pudo cargar "${args.path}" (HTTP ${res.status}). El paquete no existe o la versión es inválida.`,
                        },
                      ],
                    };
                  }
                  let text = await res.text();
                  // Guardar en caché ANTES de reescribir imports (la versión
                  // cruda de esm.sh es la que cacheamos; rewriteEsmImports se
                  // aplica en cada uso porque args.path puede cambiar).
                  esmShCache.set(args.path, { text, status: res.status });
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

    // Guardia de robustez: detectar type assertions de TS (`x as Type`) que
    // sobrevivieron al bundling. Si las hay, el iframe fallaría en runtime con
    // un críptico "Unexpected identifier 'as'". Lo interceptamos aquí para dar
    // un error claro con la línea exacta del bundle.
    const stray = detectStrayTypeAssertion(jsFile.text);
    if (stray) {
      console.error(
        `[Bundler] type assertion residual en línea ${stray.line}:`,
        stray.snippet
      );
      return {
        html: null,
        error:
          `Se detectó una aserción de TypeScript sin transpilar ("as") en el ` +
          `bundle final (línea ${stray.line}). Esto suele ocurrir cuando una ` +
          `dependencia se cargó con el loader equivocado. ` +
          `Snippet: ${stray.snippet.slice(0, 120)}`,
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
  //
  // NOTA: el warning "cdn.tailwindcss.com should not be used in production" es
  // esperado y aceptable aquí. Este iframe es un sandbox de previsualización
  // de código generado por el usuario, no una página de producción real.
  // No hay alternativa viable: procesar Tailwind con PostCSS en el navegador
  // requeriría un worker adicional y ~2MB extra de payload. El CDN de Play
  // es la solución estándar para previews en vivo (usada por StackBlitz,
  // CodeSandbox, etc.).
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
// Guardamos el original ANTES de reemplazar, y lo restauramos después.
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
