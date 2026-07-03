import { NextResponse } from "next/server";
import { requireUser, getClientIp } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse, GENERAL_API_LIMIT } from "@/lib/rate-limit";
import { getReferralStats } from "@/lib/referrals";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const userId = auth.data.user.id;

  // Rate limit (misma pauta que el resto de APIs generales).
  const ip = getClientIp(request);
  const rl = await rateLimit(`referrals:${userId}:${ip}`, GENERAL_API_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const stats = await getReferralStats(userId);
  return NextResponse.json({ stats });
}
