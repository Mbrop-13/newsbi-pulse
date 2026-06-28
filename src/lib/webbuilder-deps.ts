/**
 * WebBuilder — Detección automática de dependencias.
 *
 * PROBLEMA: antes las dependencias de Sandpack estaban hardcodeadas en
 * preview-panel.tsx (lucide-react, recharts, framer-motion...). Si la IA
 * generaba código que usaba, por ejemplo, `axios`, `zustand` o `date-fns`, el
 * bundler fallaba con "Module not found" y disparaba auto-fixes innecesarios
 * que rara vez resolvían el problema (falta de deps, no error de código).
 *
 * SOLUCIÓN: escanear todos los .ts/.tsx/.js/.jsx del proyecto, extraer los
 * especificadores de importación, mapearlos a nombres de paquete npm y
 * construir el mapa `dependencies` para Sandpack dinámicamente.
 */

export type FilesMap = Record<string, { code: string } | string>;

/**
 * Dependencias que el template "react-ts" / "vanilla-ts" de Sandpack ya
 * proporciona. NO debemos añadirlas de nuevo (generarían conflictos de versión
 * o duplicados). react / react-dom / @types/* vienen incluidos.
 */
const TEMPLATE_BUILTINS = new Set([
  "react",
  "react-dom",
  "react/jsx-runtime",
  "@types/react",
  "@types/react-dom",
]);

/**
 * Imports que NO son paquetes npm: relativos, absolutos, alias de path o
 * esquemas URL. Se filtran automáticamente por startsWith, pero los
 * mantenemos documentados aquí.
 */
function isRelativeOrBuiltin(spec: string): boolean {
  return (
    spec.startsWith(".") || // ./  ../
    spec.startsWith("/") || // /abs
    spec.startsWith("https://") ||
    spec.startsWith("http://") ||
    spec.startsWith("node:")
  );
}

/**
 * Versiones "known-good" para paquetes sensibles a breaking changes.
 * El resto se resuelve con "latest" (consistente con el comportamiento
 * anterior). Si una detección trae problemas, se puede fijar aquí.
 */
const PINNED_VERSIONS: Record<string, string> = {
  // Por ahora vacío: mantenemos "latest" como antes.
  // Ejemplo de uso futuro: "next": "14.2.5"
};

/**
 * Dependencias base que SIEMPRE incluimos (las que el panel_hardcodeaba),
 * para no romper proyectos existentes que las dan por sentadas. Se mezclan
 * con las detectadas; las detectadas tienen prioridad si colisionan.
 */
const BASELINE_DEPENDENCIES: Record<string, string> = {
  "lucide-react": "latest",
  recharts: "latest",
  "framer-motion": "latest",
  "react-icons": "latest",
  "react-router-dom": "latest",
  clsx: "latest",
  "tailwind-merge": "latest",
  "canvas-confetti": "latest",
  "@types/canvas-confetti": "latest",
};

/**
 * Convierte un especificador de import ("lodash/fp", "@radix-ui/react-dialog",
 * "axios") en el nombre del paquete npm correspondiente.
 *   - "@scope/name/sub" -> "@scope/name"
 *   - "pkg/sub"         -> "pkg"
 */
function specifierToPackage(spec: string): string | null {
  if (!spec) return null;
  if (spec.startsWith("@")) {
    // Scoped: @scope/name (posible subpath)
    const parts = spec.split("/");
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  // Unscoped: primer segmento
  const idx = spec.indexOf("/");
  return idx === -1 ? spec : spec.slice(0, idx);
}

/**
 * Extrae todos los especificadores de import/export de un bloque de código.
 * Cubre:
 *   import x from "pkg"
 *   import { a } from "pkg"
 *   import * as x from "pkg"
 *   import "pkg"            (side-effect)
 *   import type { T } from "pkg"
 *   export { a } from "pkg"
 *   export * from "pkg"
 *  动态 import("pkg")        (dynamic)
 */
const IMPORT_SPECIFIER_REGEX =
  /(?:\bimport|\bexport)(?:\s+[^'"`;]+?\s+from)?\s*['"`]([^'"`]+)['"`]/g;

function extractSpecifiers(code: string): string[] {
  const found: string[] = [];
  let m: RegExpExecArray | null;
  // Reiniciar lastIndex por seguridad (regex con flag g reutilizada).
  IMPORT_SPECIFIER_REGEX.lastIndex = 0;
  while ((m = IMPORT_SPECIFIER_REGEX.exec(code)) !== null) {
    found.push(m[1]);
  }
  return found;
}

/**
 * Escanea el mapa de archivos y devuelve las dependencias que Sandpack debe
 * instalar. Combina:
 *   1. BASELINE_DEPENDENCIES (siempre presentes).
 *   2. Paquetes detectados en los imports del proyecto.
 *
 * @param files Mapa de archivos del WebBuilder (formato store o string plano).
 * @returns Record<paquete, versión> listo para `customSetup.dependencies`.
 */
export function detectDependencies(files: FilesMap): Record<string, string> {
  const deps: Record<string, string> = { ...BASELINE_DEPENDENCIES };

  for (const [path, raw] of Object.entries(files)) {
    const isCode =
      /\.(m?jsx?|tsx?)$/.test(path) && !/\.d\.ts$/.test(path);
    if (!isCode) continue;

    const code = typeof raw === "string" ? raw : raw?.code ?? "";
    if (!code) continue;

    for (const spec of extractSpecifiers(code)) {
      if (isRelativeOrBuiltin(spec)) continue;

      const pkg = specifierToPackage(spec);
      if (!pkg) continue;
      if (TEMPLATE_BUILTINS.has(pkg) || TEMPLATE_BUILTINS.has(spec)) continue;

      // No sobrescribir si ya está (evita pisar versiones fijadas explícitamente).
      if (!(pkg in deps)) {
        deps[pkg] = PINNED_VERSIONS[pkg] ?? "latest";
      }
    }
  }

  return deps;
}
