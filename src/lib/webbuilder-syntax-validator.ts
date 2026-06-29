import * as Babel from "@babel/standalone";
// `parse` no está en todas las versiones de @types/babel__standalone, así que
// usamos `transform` con `code: false`: genera el AST (validando sintaxis) sin
// emitir código. Misma detección de SyntaxError que `parse`.

/**
 * Pre-validación sintáctica de archivos JS/TS/JSX/TSX antes de inyectarlos en
 * el bundler de Sandpack.
 *
 * PROBLEMA QUE RESUELVE
 * El worker de Babel que Sandpack descarga del CDN (babel-transpiler.worker.js,
 * versión referenciada como 2-19-8-sandpack.codesandbox.io) tiene un bug: al
 * encontrar un SyntaxError, intenta `error.message = ...` para enriquecer el
 * mensaje, pero `.message` es read-only en los SyntaxError → lanza
 * `TypeError: Cannot assign to read only property 'message'` → el worker se
 * cuelga reintentando la transpilación internamente para siempre. Nunca emite
 * un error procesable, así que el auto-fix no puede interceptarlo y el preview
 * se queda en bucle ("intentando cargar" indefinidamente).
 *
 * SOLUCIÓN
 * Parseamos nosotros mismos cada archivo con @babel/standalone en el thread
 * principal (donde sí podemos capturar el SyntaxError). Si algo falla,
 * devolvemos el { path, line, message } limpio para que el preview muestre la
 * pantalla de error directamente, SIN enviar el código roto al worker de
 * Sandpack. Así el worker buggy nunca ve código inválido y no se cuelga.
 *
 * El parseo con `filename` + `presets` correctos evita falsos positivos
 * (TypeScript, JSX, dynamic import, etc.) — son exactamente las mismas reglas
 * que usaría el bundler, así que lo que pasa nuestra validación también
 * compila en Sandpack.
 */

export interface SyntaxErrorInfo {
  path: string;
  /** 1-based line number, 0 si no se pudo determinar. */
  line: number;
  column?: number;
  message: string;
}

const PARSABLE_EXT = [".tsx", ".ts", ".jsx", ".js"];

function isParsable(path: string): boolean {
  return PARSABLE_EXT.some((ext) => path.endsWith(ext));
}

/**
 * Valida un único archivo. Devuelve null si la sintaxis es correcta, o la info
 * del error si hay un problema de sintaxis.
 */
export function validateFileSyntax(
  path: string,
  code: string
): SyntaxErrorInfo | null {
  if (!isParsable(path)) return null;
  if (!code || !code.trim()) return null;

  // Determinar el preset según la extensión. tsx → TS + JSX, ts → solo TS, etc.
  const isTS = path.endsWith(".tsx") || path.endsWith(".ts");
  const isJSX = path.endsWith(".tsx") || path.endsWith(".jsx");

  try {
    // `transform` con code:false valida el AST (lanza SyntaxError si el código
    // está mal formado) sin emitir/transpilar. Usamos los mismos presets que el
    // bundler de Sandpack para evitar falsos positivos.
    Babel.transform(code, {
      filename: path,
      presets: [
        // Env / modern JS (dynamic import, optional chaining, etc.)
        [
          "env",
          {
            // Solo parseamos; no transpilamos a nada en concreto.
            targets: "defaults",
            modules: false,
          },
        ],
        ...(isTS ? ["typescript"] : []),
        ...(isJSX ? ["react"] : []),
      ],
      // No genera código, solo valida el AST. Más rápido y sin side-effects.
      code: false,
      ast: false,
      sourceType: "unambiguous",
    });
    return null;
  } catch (err: any) {
    // Babel emite SyntaxError con un `loc` { line, column }.
    const line = err?.loc?.line ?? 0;
    const column = err?.loc?.column;
    // Babel incluye el código problemático en el mensaje; lo limpiamos un poco
    // para que la pantalla de error sea legible.
    const rawMessage: string = err?.message || String(err);
    // Quita el prefijo "unknown: " que a veces añade Babel.
    const message = rawMessage.replace(/^unknown:\s*/i, "").trim();

    return { path, line, column, message };
  }
}

/**
 * Valida todos los archivos parseables de un proyecto.
 * Devuelve el PRIMER error encontrado (suficiente para mostrar la pantalla de
 * error; no hace sentido enumerar todos porque el bundler igual compila uno a
 * uno). Si todo está bien, devuelve null.
 *
 * @param files Record<path, { code: string }> o Record<path, string>
 */
export function validateProjectSyntax(
  files: Record<string, { code: string } | string>
): SyntaxErrorInfo | null {
  for (const [path, file] of Object.entries(files)) {
    const code = typeof file === "string" ? file : file?.code ?? "";
    const err = validateFileSyntax(path, code);
    if (err) return err;
  }
  return null;
}

/**
 * Formatea un SyntaxErrorInfo como string legible para la pantalla de error,
 * imitando el formato que usaría el bundler (para que el extractor de ubicación
 * de BuildErrorView funcione sin cambios).
 *
 * Ej: "/App.tsx: Unexpected token (379:52)"
 */
export function formatSyntaxError(err: SyntaxErrorInfo): string {
  const linePart = err.line > 0 ? ` (${err.line}${err.column ? `:${err.column}` : ""})` : "";
  return `${err.path}:${linePart}\n  ${err.message}`;
}
