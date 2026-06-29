import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize untrusted HTML before rendering (ASVS 5.3.3 — output encoding / XSS prevention).
 *
 * Default policy: strip all scripts, event handlers, and dangerous tags/attributes.
 * Use everywhere we render LLM-generated or user-supplied HTML.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "a","b","i","em","strong","u","p","br","hr","ul","ol","li",
      "h1","h2","h3","h4","h5","h6","blockquote","code","pre","span",
      "div","table","thead","tbody","tr","th","td","img","figure","figcaption"
    ],
    ALLOWED_ATTR: ["href","src","alt","title","class","target","rel","width","height"],
    ALLOW_DATA_ATTR: false,
  });
}
