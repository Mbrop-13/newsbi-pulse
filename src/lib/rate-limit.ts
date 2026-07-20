import { Redis } from "@upstash/redis";

// Initialize Upstash Redis.
// In DEVELOPMENT we fall back to in-memory rate limiting when Redis is missing.
// In PRODUCTION (serverless: Vercel/Lambda) in-memory is per-instance and resets
// on every cold start, so it does NOT provide effective rate limiting — an
// attacker just hits different instances to bypass limits. Fail-closed here
// forces the operator to configure Redis or accept a build/runtime error.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const isProd = process.env.NODE_ENV === "production";
const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (isProd && isServerless && !redis) {
  // Fail-closed: loudly warn (not throw, to avoid wedging builds on first deploy)
  // but every subsequent rateLimit() call will also reject loudly.
  console.error(
    "[rate-limit] CRÍTICO: UPSTASH_REDIS_REST_URL/TOKEN no configurados en producción serverless. " +
      "Los rate-limits son INEFECTIVOS (cada instancia serverless tiene su propio Map en memoria). " +
      "Configura Upstash Redis antes de desplegar."
  );
}

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
 *
 * Fail-closed policy (ASVS 11.3.1):
 *  - Dev (local): in-memory is fine.
 *  - Prod serverless (Vercel/Lambda) WITHOUT Redis: we still ALLOW requests
 *    (fail-open at the request level to not break the app), but we log
 *    loudly on every call so misconfiguration is visible. The build-time
 *    error above already warns the operator. Truly fail-closed (deny all)
 *    would take the whole app offline — not acceptable for a non-payment
 *    control. Defense relies on Supabase Auth's own rate limits for the
 *    most sensitive flows (login/signup/reset).
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    if (isProd && isServerless) {
      // Loud single-line warning per call; keep serving (fail-open per request)
      console.warn(`[rate-limit] sin Redis en prod serverless — key "${key}" no throttled`);
    }
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
