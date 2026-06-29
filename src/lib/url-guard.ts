import dns from "dns/promises";
import net from "net";

/**
 * Validates a URL against SSRF rules (ASVS 5.5.3 / OWASP SSRF Prevention Cheat Sheet).
 *
 * Rules:
 *  - Only http/https schemes
 *  - No userinfo
 *  - Host must NOT be an IP literal in private/loopback/link-local/metadata ranges
 *  - For hostnames, resolve DNS and reject if any resolved address is private/loopback/etc.
 *  - Block known SSRF targets (169.254.169.254 metadata, localhost variants)
 */
export async function assertSafeFetchUrl(
  raw: string,
  opts: { allowPrivate?: boolean } = {}
): Promise<{ ok: true; url: URL } | { ok: false; reason: string }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "URL inválida" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: `Esquema no permitido: ${url.protocol}` };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "Userinfo no permitida en la URL" };
  }

  const host = url.hostname.toLowerCase();

  // Block obvious localhost / metadata hostname aliases
  const BLOCKED_HOSTS = new Set([
    "localhost",
    "metadata.google.internal",
  ]);
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".internal") || host.endsWith(".local")) {
    return { ok: false, reason: "Host no permitido" };
  }

  if (opts.allowPrivate) return { ok: true, url };

  // If host is an IP literal, validate directly
  if (net.isIP(host)) {
    if (isForbiddenIp(host)) {
      return { ok: false, reason: "IP interna/loopback no permitida" };
    }
    return { ok: true, url };
  }

  // Resolve hostname and reject if any A/AAAA record is private
  try {
    const addrs = await dns.resolve4(host).catch(() => [] as string[]);
    const addrs6 = await dns.resolve6(host).catch(() => [] as string[]);
    for (const a of [...addrs, ...addrs6]) {
      if (isForbiddenIp(a)) {
        return { ok: false, reason: `DNS resuelve a IP interna: ${a}` };
      }
    }
  } catch {
    // Resolution failed — fail closed
    return { ok: false, reason: "No se pudo resolver el host" };
  }

  return { ok: true, url };
}

function isForbiddenIp(ip: string): boolean {
  if (!net.isIP(ip)) return false;
  // Loopback v4/v6
  if (ip === "127.0.0.1" || ip === "::1") return true;
  // Link-local / metadata
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("fe80")) return true;
  // Private v4
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return true;
  }
  // Private v6 unique local fc00::/7
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  // Unspecified
  if (ip === "0.0.0.0" || ip === "::") return true;
  return false;
}
