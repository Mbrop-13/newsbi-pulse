/**
 * WebBuilder — Diff línea a línea (LCS) entre versiones de archivos.
 *
 * Se usa para mostrar qué cambió tras una generación/actualización de la IA:
 * un mini-diff +/− por archivo, accesible desde la toolbar de la preview.
 *
 * Algoritmo: LCS clásico (Longest Common Subsequence) sobre arrays de líneas.
 * Es O(n*m) en tiempo y memoria, suficiente para archivos de cientos/miles de
 * líneas (que es lo que maneja el WebBuilder).
 */

export type DiffOp = "equal" | "added" | "removed";

export interface DiffLine {
  type: DiffOp;
  /** Número de línea en la versión nueva (1-based), o null si es "removed". */
  newLineNumber: number | null;
  /** Número de línea en la versión vieja (1-based), o null si es "added". */
  oldLineNumber: number | null;
  text: string;
}

export interface FileDiff {
  /** Ruta del archivo. */
  path: string;
  /** true si el archivo es nuevo (no existía antes). */
  isNew: boolean;
  /** true si el archivo fue eliminado (no existe después). */
  isDeleted: boolean;
  /** Conteo rápido para badges: líneas añadidas / eliminadas. */
  addedCount: number;
  removedCount: number;
  lines: DiffLine[];
}

/**
 * Calcula un diff línea a línea entre dos textos.
 */
export function diffTexts(oldText: string, newText: string): DiffLine[] {
  const oldLines = (oldText ?? "").split("\n");
  const newLines = (newText ?? "").split("\n");

  // Tabla LCS: dp[i][j] = longitud del LCS entre oldLines[0..i) y newLines[0..j)
  const n = oldLines.length;
  const m = newLines.length;
  // Optimización de memoria: solo necesitamos 2 filas, pero para backtracking
  // guardamos la tabla completa. Para archivos grandes se podría refactorizar
  // a Myers diff; aquí es suficiente.
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtracking -> secuencia de operaciones
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldLn = 1;
  let newLn = 1;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: "equal", oldLineNumber: oldLn, newLineNumber: newLn, text: oldLines[i] });
      i++;
      j++;
      oldLn++;
      newLn++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", oldLineNumber: oldLn, newLineNumber: null, text: oldLines[i] });
      i++;
      oldLn++;
    } else {
      result.push({ type: "added", oldLineNumber: null, newLineNumber: newLn, text: newLines[j] });
      j++;
      newLn++;
    }
  }
  while (i < n) {
    result.push({ type: "removed", oldLineNumber: oldLn, newLineNumber: null, text: oldLines[i] });
    i++;
    oldLn++;
  }
  while (j < m) {
    result.push({ type: "added", oldLineNumber: null, newLineNumber: newLn, text: newLines[j] });
    j++;
    newLn++;
  }
  return result;
}

/**
 * Compara dos snapshots de archivos y devuelve el diff por archivo modificado.
 * Los archivos idénticos se omiten.
 */
export function diffFileMaps(
  oldFiles: Record<string, { code: string }>,
  newFiles: Record<string, { code: string }>
): FileDiff[] {
  const result: FileDiff[] = [];
  const allPaths = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);

  for (const path of allPaths) {
    const oldFile = oldFiles[path];
    const newFile = newFiles[path];

    const existedBefore = !!oldFile;
    const existsAfter = !!newFile;

    if (existedBefore && !existsAfter) {
      result.push({
        path,
        isNew: false,
        isDeleted: true,
        addedCount: 0,
        removedCount: oldFile.code.split("\n").length,
        lines: oldFile.code.split("\n").map((t, idx) => ({
          type: "removed" as DiffOp,
          oldLineNumber: idx + 1,
          newLineNumber: null,
          text: t,
        })),
      });
      continue;
    }

    if (!existedBefore && existsAfter) {
      const lines = newFile.code.split("\n");
      result.push({
        path,
        isNew: true,
        isDeleted: false,
        addedCount: lines.length,
        removedCount: 0,
        lines: lines.map((t, idx) => ({
          type: "added" as DiffOp,
          oldLineNumber: null,
          newLineNumber: idx + 1,
          text: t,
        })),
      });
      continue;
    }

    if (existedBefore && existsAfter && oldFile.code !== newFile.code) {
      const lines = diffTexts(oldFile.code, newFile.code);
      result.push({
        path,
        isNew: false,
        isDeleted: false,
        addedCount: lines.filter((l) => l.type === "added").length,
        removedCount: lines.filter((l) => l.type === "removed").length,
        lines,
      });
    }
  }

  return result;
}
