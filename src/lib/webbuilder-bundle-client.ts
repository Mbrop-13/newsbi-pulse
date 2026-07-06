/**
 * WebBuilder — Cliente del bundler (NAVEGADOR).
 *
 * Este módulo es el equivalente del navegador al bundler. En lugar de correr
 * esbuild en el navegador (como hacía webbuilder-bundler.ts con esbuild-wasm +
 * esm.sh), delega el bundling al servidor vía POST /api/webbuilder-bundle, donde
 * esbuild nativo con node_modules reales garantiza UNA sola instancia de React.
 *
 * Mantiene la MISMA firma que el bundler anterior (`bundleProject(files)`) para
 * que SelfHostedPreview solo tenga que cambiar el import.
 *
 * Caché en memoria por hash del contenido: si el usuario no cambió los archivos,
 * no se re-hace la petición al servidor.
 */

export type BundlerFiles = Record<string, { code: string } | string>;

export interface BundleResult {
  /** HTML completo para el iframe srcdoc, o null si hubo error. */
  html: string | null;
  /** Mensaje de error limpio si el bundling falló (sintaxis, import roto). */
  error: string | null;
}

const BUNDLE_ENDPOINT = "/api/webbuilder-bundle";
const TIMEOUT_MS = 30_000;

// Caché en memoria: hash del contenido → resultado del último bundle.
// Sin esto, cada re-render de React dispararía un round-trip al servidor.
const cache = new Map<string, BundleResult>();

/** Calcula un hash determinista del contenido de los archivos (clave de caché). */
function hashFiles(files: BundlerFiles): string {
  const sorted = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, f]) => `${p}::${typeof f === "string" ? f : f?.code ?? ""}`);
  return sorted.join("\n").length + ":" + simpleHash(sorted.join(""));
}

/** Hash djb2 (rápido, suficiente para claves de caché locales). */
function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/**
 * Bundlea el proyecto en el servidor y devuelve el HTML del iframe.
 * Misma firma que el bundler anterior para drop-in replacement.
 */
export async function bundleProject(files: BundlerFiles): Promise<BundleResult> {
  const key = hashFiles(files);

  // Caché: si ya bundleamos este contenido, devolver el resultado cacheado.
  const cached = cache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(BUNDLE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error =
        `El servidor de previsualización respondió ${res.status}.` +
        (text ? ` ${text.slice(0, 200)}` : "") +
        (res.status >= 500
          ? " Inténtalo de nuevo en unos segundos."
          : "");
      return { html: null, error };
    }

    const data = (await res.json()) as BundleResult;

    // Solo cachear resultados válidos (con HTML). Los errores no se cachean
    // para que el usuario pueda reintentar tras corregir el código.
    if (data.html) {
      cache.set(key, data);
    }
    return data;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return {
        html: null,
        error:
          "La previsualización tardó demasiado. Verifica tu conexión e inténtalo de nuevo.",
      };
    }
    return {
      html: null,
      error:
        "No se pudo conectar con el servidor de previsualización. " +
        ((err as Error)?.message || "Verifica tu conexión e inténtalo de nuevo."),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Invalida todo el caché de bundling. Útil cuando el usuario fuerza un re-bundle
 * (botón Reintentar / Recargar) o cuando cambia algo que no está en el contenido
 * de los archivos (ej. versión de React del host).
 */
export function invalidateBundleCache(): void {
  cache.clear();
}
