import { Redis } from "@upstash/redis";

// Initialize Upstash Redis
// We fall back to memory if the URL or Token are not provided in the environment
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback store
const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup stale in-memory entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetTime) memoryStore.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a given key (usually `userId` or `ip`).
 * Integrates Upstash Redis for distributed multi-instance serverless setups.
 * Automatically falls back to in-memory rate limiting if Redis is missing or fails.
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return rateLimitInMemory(key, config);
  }

  try {
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      // First request in the window, set expiration
      await redis.expire(key, config.windowSeconds);
      return { allowed: true, remaining: config.maxRequests - 1, retryAfterSeconds: 0 };
    }

    if (currentCount <= config.maxRequests) {
      return { allowed: true, remaining: config.maxRequests - currentCount, retryAfterSeconds: 0 };
    }

    // Rate limited
    const ttl = await redis.ttl(key);
    const retryAfter = Math.max(1, ttl);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };

  } catch (err) {
    console.warn(`[rateLimit] Redis rate limit failed, falling back to memory for key "${key}":`, err);
    return rateLimitInMemory(key, config);
  }
}

/**
 * Synchronous local in-memory fallback rate-limiter.
 */
function rateLimitInMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    memoryStore.set(key, { count: 1, resetTime: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterSeconds: 0 };
  }

  // Rate limited
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
}

/**
 * Create a rate-limit Response (429 Too Many Requests)
 */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos.",
      code: "RATE_LIMITED",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

// ══════════════════════════════════════════════
// Pre-configured limiters for different API tiers
// ══════════════════════════════════════════════

/** AI Chat: 10 requests per 60 seconds per user */
export const AI_CHAT_LIMIT: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 };

/** TTS Audio: 5 requests per 60 seconds per user */
export const TTS_LIMIT: RateLimitConfig = { maxRequests: 5, windowSeconds: 60 };

/** General API (search, news, finance): 30 requests per 60 seconds per user */
export const GENERAL_API_LIMIT: RateLimitConfig = { maxRequests: 30, windowSeconds: 60 };

/** Newsletter subscribe: 3 per 60 seconds per IP */
export const NEWSLETTER_LIMIT: RateLimitConfig = { maxRequests: 3, windowSeconds: 60 };

/** Auth-related (password reset): 3 per 300 seconds per IP */
export const AUTH_LIMIT: RateLimitConfig = { maxRequests: 3, windowSeconds: 300 };
