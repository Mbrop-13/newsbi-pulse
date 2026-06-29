/**
 * Escape user-supplied terms used inside Supabase `.ilike()` / `.or()` filter strings.
 *
 * PostgREST/PostgreSQL ilike treats `%` and `_` as wildcards; an unescaped
 * `%_%_%_%` forces a sequential scan (DoS). The `.or()` filter parser splits on
 * `,` and `.`, so injecting those breaks out of the filter clause (filter injection).
 *
 * ASVS 5.2.4 (parameterized queries) + 5.3.1.
 */

/** Escape a term for safe use inside a `.ilike()` value. Escapes %, _ and backslash. */
export function escapeIlike(term: string): string {
  if (typeof term !== "string") return "";
  return term.replace(/[\\%_]/g, (m) => "\\" + m);
}

/** Build a safe `%term%` ilike value, with optional surrounding wildcards. */
export function buildIlike(term: string, mode: "contains" | "prefix" | "suffix" = "contains"): string {
  const t = escapeIlike(term);
  if (mode === "prefix") return `${t}%`;
  if (mode === "suffix") return `%${t}`;
  return `%${t}%`;
}

/** Escape a term for safe use inside a PostgREST `.or()` filter clause. */
export function escapeOrFilter(term: string): string {
  if (typeof term !== "string") return "";
  // PostgREST .or() splits on `,` and uses `.` as operator separator.
  // Strip both so a term cannot break out of its filter fragment.
  return term.replace(/[,.]/g, " ");
}
