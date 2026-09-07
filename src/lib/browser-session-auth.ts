import { Redis } from "@upstash/redis";

/**
 * Bind Playwright/browser sessions to the authenticated user so SSE
 * frames and click coordinates cannot be stolen with a guessed sessionId.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redis =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const memoryOwners = new Map<string, { userId: string; exp: number }>();
const TTL_SECONDS = 60 * 60;

function sweepMemory() {
  const now = Date.now();
  for (const [id, row] of memoryOwners) {
    if (row.exp < now) memoryOwners.delete(id);
  }
}

export async function bindBrowserSession(sessionId: string, userId: string): Promise<void> {
  if (!sessionId || !userId) return;
  memoryOwners.set(sessionId, { userId, exp: Date.now() + TTL_SECONDS * 1000 });
  if (redis) {
    await redis.set(`browser:owner:${sessionId}`, userId, { ex: TTL_SECONDS });
  }
}

export async function assertBrowserOwner(
  sessionId: string,
  userId: string
): Promise<boolean> {
  if (!sessionId || !userId) return false;
  sweepMemory();
  const mem = memoryOwners.get(sessionId);
  if (mem && mem.exp >= Date.now() && mem.userId === userId) return true;

  if (redis) {
    const owner = await redis.get<string>(`browser:owner:${sessionId}`);
    if (typeof owner === "string" && owner === userId) return true;
    // Fail closed if Redis has a different owner or no owner in prod.
    if (owner && owner !== userId) return false;
    if (process.env.NODE_ENV === "production") return false;
  }

  // Without Redis in dev, only the in-memory bind counts.
  return false;
}
