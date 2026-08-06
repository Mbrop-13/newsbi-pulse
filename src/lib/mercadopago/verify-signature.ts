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
/** Max age of webhook timestamp (5 minutes) — anti-replay */
const MAX_TS_SKEW_SECONDS = 300;

export function verifyMercadoPagoSignature(opts: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | string[] | null;
  secret: string;
  /** If true (default), reject signatures older than MAX_TS_SKEW_SECONDS */
  enforceTimestamp?: boolean;
}): boolean {
  const {
    signatureHeader,
    requestId,
    dataId,
    secret,
    enforceTimestamp = true,
  } = opts;
  if (!signatureHeader || !secret) return false;

  // Parse "ts=...,v1=..."
  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((kv) => kv.trim().split("="))
      .map(([k, ...rest]) => [k, rest.join("=")])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  if (enforceTimestamp) {
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    // MP ts can be ms or seconds — normalize if clearly ms
    const tsSec = tsNum > 1e12 ? Math.floor(tsNum / 1000) : tsNum;
    if (Math.abs(nowSec - tsSec) > MAX_TS_SKEW_SECONDS) {
      return false;
    }
  }

  const id =
    Array.isArray(dataId) ? String(dataId[0] ?? "") : String(dataId ?? "");

  // Manifest per MP docs: id:{data.id};request-id:{x-request-id};ts:{ts};
  const manifest = `id:${id};request-id:${requestId ?? ""};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
