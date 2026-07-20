import * as crypto from "crypto";

/**
 * OAuth state + PKCE helpers (ASVS 2.5.x — CSRF & code interception protection).
 *
 * `state` previene login-CSRF: un atacante no puede forzar al navegador del
 * victim a completar el flujo OAuth con la cuenta del atacante.
 *
 * `code_verifier` / `code_challenge` (PKCE, RFC 7636) previene interceptación
 * del authorization code incluso si el `client_secret` se filtra.
 */

const COOKIE_NAME = "gdrive_oauth_state";
const PKCE_COOKIE_NAME = "gdrive_oauth_pkce";

/** Par state + cookie para setear en la respuesta del login route. */
export interface OAuthStateResult {
  state: string;
  /** valor a poner en Set-Cookie ( HttpOnly; Secure; SameSite=Lax; Max-Age=600 ) */
  cookieHeader: string;
}

/** Genera un state aleatorio + cookie firmada. */
export function issueOAuthState(): OAuthStateResult {
  const state = crypto.randomBytes(24).toString("hex"); // 192 bits
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${state}.${nonce}`;
  // Firmamos el payload completo para que el callback pueda verificar integridad
  // (no sólo comparar state: también evita tampering del contenido de la cookie).
  const sig = sign(payload);
  const cookieValue = `${payload}.${sig}`;
  const cookieHeader = `${COOKIE_NAME}=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`;
  return { state, cookieHeader };
}

/**
 * Verifica el state contra la cookie. Devuelve true si coincide la firma
 * y el nonce. Falla si la cookie no está, está expirada o la firma no cuadra.
 */
export function verifyOAuthState(stateFromQuery: string | null, cookieHeader: string | null): boolean {
  if (!stateFromQuery || !cookieHeader) return false;
  const cookieValue = parseCookie(cookieHeader, COOKIE_NAME);
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [stateInCookie, _nonce, sig] = parts;
  const payload = `${stateInCookie}.${_nonce}`;
  if (!timingSafeEqualStr(sig, sign(payload))) return false;
  return timingSafeEqualStr(stateInCookie, stateFromQuery);
}

/** Par PKCE: el verifier va en cookie, el challenge va al auth URL. */
export interface PkceResult {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  cookieHeader: string;
}

export function issuePkce(): PkceResult {
  // RFC 7636: 43-128 chars de [A-Z][a-z][0-9]-._~
  const codeVerifier = crypto.randomBytes(32).toString("base64url"); // 43 chars
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const cookieHeader = `${PKCE_COOKIE_NAME}=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`;
  return { codeVerifier, codeChallenge, codeChallengeMethod: "S256", cookieHeader };
}

export function readPkceVerifier(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  return parseCookie(cookieHeader, PKCE_COOKIE_NAME);
}

export function clearOAuthCookies(): string {
  const expired = "=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/";
  return `${COOKIE_NAME}${expired}, ${PKCE_COOKIE_NAME}${expired}`;
}

// ─── internal ───

function sign(payload: string): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.CRON_SECRET || "dev-only-secret";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
}

function parseCookie(headerValue: string, name: string): string | null {
  const cookies = headerValue.split(";").map((c) => c.trim());
  for (const c of cookies) {
    const eq = c.indexOf("=");
    if (eq < 0) continue;
    const k = c.slice(0, eq).trim();
    if (k === name) {
      return decodeURIComponent(c.slice(eq + 1).trim());
    }
  }
  return null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export const OAUTH_STATE_COOKIE = COOKIE_NAME;
export const OAUTH_PKCE_COOKIE = PKCE_COOKIE_NAME;
