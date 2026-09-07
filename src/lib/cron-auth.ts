import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Fail-closed cron / machine-to-machine auth.
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when the env exists.
 */
export function assertCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET || "";
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      console.error("[cron-auth] CRON_SECRET missing — refusing request");
      return NextResponse.json({ error: "Forbidden" }, { status: 503 });
    }
    return null;
  }

  const header = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
