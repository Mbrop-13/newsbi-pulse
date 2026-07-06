import { NextRequest, NextResponse } from "next/server";
import * as esbuild from "esbuild";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildPreviewHtml } from "@/lib/webbuilder-html";

/**
 * WebBuilder — Bundling en el SERVIDOR con esbuild nativo.
 *
 * ARQUITECTURA (modo build, igual que el build de producción de Next.js):
 *  Recibe los archivos del proyecto del webbuilder vía POST, los escribe a un
 *  directorio temporal, y los bundlea con esbuild NATIVO contra los node_modules
 *  REALES del proyecto. El resultado es un único módulo ESM con React
 *  (y todas las deps) inlineado, envuelto en el HTML del iframe del preview.
 *
 * Por qué en el servidor y no en el navegador (como antes):
 *  - esbuild nativo deduplica módulos por la ruta REAL del filesystem. React
 *    solo puede existir UNA vez (un solo archivo físico). Imposible el bug de
 *    "useContext null" / "Minified React error #31" / React duplicado que tenía
 *    el bundler de navegador con esm.sh (que inlinea React dentro de react-dom
 *    y resuelve peer-deps a versiones canary).
 *  - esbuild nativo transpila TypeScript correctamente, sin los edge cases del
 *    wasm que dejaban pasar "Unexpected identifier 'as'".
 *  - Sin dependencia de la red a esm.sh (timeouts, 504s, versiones inesperadas).
 *  - React del preview = React del host (19.2.3), no una versión mismatched.
 *
 * Catálogo de paquetes: el LLM solo puede importar paquetes que YA están en el
 * package.json del proyecto (react, react-dom, framer-motion, lucide-react,
 * recharts, clsx, tailwind-merge, class-variance-authority, react-icons,
 * canvas-confetti, ...). Esbuild los resuelve desde node_modules. Si el LLM
 * pide uno que no está, esbuild devolverá un error "Could not resolve" claro.
 */

export const maxDuration = 30;
// Forzar runtime de Node.js (esbuild nativo no funciona en Edge).
export const runtime = "nodejs";

// Límites de seguridad para el input del usuario.
const MAX_FILES = 60;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024; // 2MB total de código fuente
const MAX_FILE_BYTES = 500 * 1024; // 500KB por archivo

const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

interface BundleResponse {
  html: string | null;
  error: string | null;
}

/**
 * Normaliza una ruta del proyecto a una ruta relativa segura (sin `..`, con
 * barra inicial). Ej: "App.tsx" → "/App.tsx", "src/App.tsx" → "/src/App.tsx".
 */
function normalizePath(p: string): string {
  if (!p) return "/";
  let clean = p.replace(/^\.\//, "");
  if (!clean.startsWith("/")) clean = "/" + clean;
  // Rechazar path traversal: ningún segmento puede ser ".." después de normalizar.
  if (clean.split("/").includes("..")) {
    throw new Error(`Ruta inválida (path traversal): ${p}`);
  }
  return clean;
}

/** Devuelve el loader de esbuild apropiado para una extensión. */
function loaderFor(path: string): esbuild.Loader {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".js")) return "js";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "text";
}

export async function POST(req: NextRequest) {
  const tmpDir = await mkdtemp(join(tmpdir(), "wb-bundle-"));
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<BundleResponse>(
        { html: null, error: "Cuerpo de la petición inválido (se esperaba JSON)." },
        { status: 400 }
      );
    }

    const files = (body as { files?: unknown })?.files;
    if (!files || typeof files !== "object" || Array.isArray(files)) {
      return NextResponse.json<BundleResponse>(
        { html: null, error: 'Se requiere un campo "files" con los archivos del proyecto.' },
        { status: 400 }
      );
    }

    const entries = Object.entries(files as Record<string, unknown>);
    if (entries.length === 0) {
      return NextResponse.json<BundleResponse>(
        { html: null, error: "No se encontró ningún archivo para previsualizar." },
        { status: 400 }
      );
    }
    if (entries.length > MAX_FILES) {
      return NextResponse.json<BundleResponse>(
        { html: null, error: `Demasiados archivos (${entries.length}). Máximo ${MAX_FILES}.` },
        { status: 400 }
      );
    }

    // Escribir cada archivo al directorio temporal, validando tamaño y rutas.
    let totalBytes = 0;
    const fileMap: Record<string, string> = {};
    for (const [rawPath, rawCode] of entries) {
      const code =
        typeof rawCode === "string"
          ? rawCode
          : (rawCode as { code?: string })?.code ?? "";
      if (typeof code !== "string") continue;

      if (Buffer.byteLength(code) > MAX_FILE_BYTES) {
        return NextResponse.json<BundleResponse>(
          { html: null, error: `Archivo demasiado grande: ${rawPath}. Máximo ${MAX_FILE_BYTES} bytes.` },
          { status: 400 }
        );
      }
      totalBytes += Buffer.byteLength(code);
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json<BundleResponse>(
          { html: null, error: `Proyecto demasiado grande. Máximo ${MAX_TOTAL_BYTES} bytes totales.` },
          { status: 400 }
        );
      }

      let normalized: string;
      try {
        normalized = normalizePath(rawPath);
      } catch (e) {
        return NextResponse.json<BundleResponse>(
          { html: null, error: (e as Error).message },
          { status: 400 }
        );
      }
      fileMap[normalized] = code;
    }

    // Encontrar el entry point (misma heurística que el bundler anterior).
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
      entry = Object.keys(fileMap).find((p) =>
        PARSABLE_EXT.some((e) => p.endsWith(e))
      );
    }
    if (!entry) {
      return NextResponse.json<BundleResponse>(
        {
          html: null,
          error: "No se encontró ningún archivo .tsx/.jsx/.ts/.js para previsualizar.",
        },
        { status: 400 }
      );
    }

    // Escribir archivos a disco dentro del tmpDir.
    await Promise.all(
      Object.entries(fileMap).map(async ([path, code]) => {
        // Quitar la barra inicial para que sea relativo a tmpDir.
        const rel = path.replace(/^\//, "");
        const abs = join(tmpDir, rel);
        const dir = join(abs, "..");
        await mkdir(dir, { recursive: true });
        await writeFile(abs, code, "utf8");
      })
    );

    // Bootstrap: monta React en #root. Resuelve el entry con ruta relativa "./".
    const entryRel = "./" + entry.replace(/^\//, "").replace(/\.(tsx|ts|jsx|js)$/, "");
    const bootstrapPath = join(tmpDir, "__bootstrap.tsx");
    const bootstrap = `import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import App from "${entryRel}";
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(App ? h(App) : h("div", null, "El archivo principal no exporta un componente por defecto."));
}
`;
    await writeFile(bootstrapPath, bootstrap, "utf8");

    // Bundling con esbuild nativo. resolveDir = tmpDir para que los imports
    // relativos y los bare specifiers (react, framer-motion...) resuelvan contra
    // tmpDir y los node_modules del proyecto (subiendo desde tmpDir).
    let result: esbuild.BuildResult;
    try {
      // nodePaths: rutas absolutas donde esbuild buscará node_modules para
      // resolver bare specifiers (react, framer-motion, ...). El tmpDir donde
      // se escriben los archivos del proyecto NO tiene node_modules, así que
      // apuntamos al del proyecto real (process.cwd() en Vercel = raíz del
      // deploy). Sin esto, esbuild no encontraría nada que importar.
      const projectNodeModules = resolve(process.cwd(), "node_modules");
      result = await esbuild.build({
        entryPoints: [bootstrapPath],
        bundle: true,
        format: "esm",
        target: "es2020",
        jsx: "automatic",
        write: false,
        outfile: "bundle.js",
        sourcemap: false,
        // SIN external: react/react-dom se inlinean. Es la única forma de
        // garantizar UNA instancia de React (deduplicación por path del FS).
        logLevel: "silent",
        absWorkingDir: tmpDir,
        nodePaths: [projectNodeModules],
      });
    } catch (err) {
      // esbuild lanza con .errors cuando hay errores de build.
      const e = err as { errors?: { text: string }[] };
      const msgs = e.errors?.map((er) => er.text).join("\n");
      return NextResponse.json<BundleResponse>(
        { html: null, error: msgs || (err as Error).message || "Error desconocido en el bundling." },
        { status: 200 }
      );
    }

    if (result.errors && result.errors.length > 0) {
      const msgs = result.errors.map((e) => e.text).join("\n");
      return NextResponse.json<BundleResponse>(
        { html: null, error: msgs },
        { status: 200 }
      );
    }

    const jsFile =
      result.outputFiles?.find((f) => f.path.endsWith("bundle.js")) ||
      result.outputFiles?.find((f) => f.path.endsWith(".js")) ||
      result.outputFiles?.[0];
    const cssFile = result.outputFiles?.find(
      (f) => f.path.endsWith(".css") && f.text && f.text.trim().length > 0
    );

    if (!jsFile || !jsFile.text) {
      return NextResponse.json<BundleResponse>(
        {
          html: null,
          error: "El bundling no produjo código JS. Revisa que el código sea válido.",
        },
        { status: 200 }
      );
    }

    if (result.warnings && result.warnings.length > 0) {
      console.warn(
        "[webbuilder-bundle] warnings:",
        result.warnings.map((w) => w.text)
      );
    }

    const html = buildPreviewHtml(jsFile.text, cssFile ? cssFile.text : "");
    return NextResponse.json<BundleResponse>({ html, error: null });
  } catch (err) {
    console.error("[webbuilder-bundle] error inesperado:", err);
    return NextResponse.json<BundleResponse>(
      {
        html: null,
        error:
          (err as Error)?.message ||
          "Error inesperado durante el bundling. Inténtalo de nuevo.",
      },
      { status: 500 }
    );
  } finally {
    // Limpiar el directorio temporal SIEMPRE (incluso si hay error).
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      /* noop: best-effort cleanup */
    }
  }
}
