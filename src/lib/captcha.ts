/**
 * Optional hCaptcha verification. When HCAPTCHA_SECRET is set in production,
 * public forms (newsletter, leads, guest chat) must send a token.
 */
export async function verifyHCaptcha(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET || "";
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    // Fail-open only in development so local flows still work.
    return !isProd;
  }

  if (typeof token !== "string" || token.length < 8 || token.length > 4000) {
    return false;
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function captchaRequired(): boolean {
  return Boolean(process.env.HCAPTCHA_SECRET);
}
