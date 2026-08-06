import * as crypto from "crypto";

/**
 * Hashea una IP antes de almacenarla o usarla como clave (ASVS 7.1.4).
 *
 * Las IPs en claro son PII bajo GDPR/CCPA. Además, en `guest_usage` se usan
 * como PK — si alguien dumpea la BD, obtiene el historial completo de IPs
 * de cada invitado. Hashing con sal por-despliegue evita correlación
 * cross-tenant y rainbow tables.
 *
 * El salt debe estar en una variable de entorno (IP_HASH_SALT). Si no está
 * configurado, se usa un valor de desarrollo y se lanza un warning en prod.
 */
const isProd = process.env.NODE_ENV === "production";
const envSalt = process.env.IP_HASH_SALT || "";

if (isProd && !envSalt) {
  console.error(
    "[ip-hash] CRÍTICO: IP_HASH_SALT no configurado en producción. " +
      "Configúralo en Vercel para no usar un salt predecible."
  );
}

// En prod sin env: salt derivado de service role (mejor que literal fijo, peor que IP_HASH_SALT dedicado)
const SALT =
  envSalt ||
  (isProd
    ? `prod-fallback:${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 24) || "missing"}`
    : "dev-only-insecure-salt-change-in-prod");

/**
 * Devuelve un hash hex de 64 chars (sha256) de la IP normalizada + sal.
 * No es reversible: no se puede recuperar la IP original a partir del hash.
 */
export function hashIp(ip: string | null | undefined): string {
  const normalized = (ip || "").trim().toLowerCase();
  if (!normalized) {
    // Hash determinista de cadena vacía: que la columna NOT NULL no pete,
    // pero que sea distinguible de una IP real.
    return crypto.createHash("sha256").update(`${SALT}:empty`).digest("hex");
  }
  return crypto.createHash("sha256").update(`${SALT}:${normalized}`).digest("hex");
}
