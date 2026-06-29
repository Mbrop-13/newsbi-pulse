import crypto from "crypto";

/**
 * Verifies a MercadoPago webhook signature (x-signature header).
 *
 * Template signed by MP: `{data.id};{request-id};{status};{ts}`
 * Actually MP uses the pattern: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * and signs it with HMAC-SHA256 using the application's WEBHOOK_SECRET.
 *
 * Spec: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Header format: `ts=<timestamp>,v1=<hex-hmac>`
 */
export function verifyMercadoPagoSignature(opts: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | string[] | null;
  secret: string;
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = opts;
  if (!signatureHeader || !secret) return false;

  // Parse "ts=...,v1=..."
  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((kv) => kv.trim().split("="))
      .map(([k, v]) => [k, v])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Build the manifest per MP spec
  const manifest = `id:${Array.isArray(dataId) ? dataId[0] : (dataId ?? "")};request-id:${requestId ?? ""};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // Timing-safe compare
  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
