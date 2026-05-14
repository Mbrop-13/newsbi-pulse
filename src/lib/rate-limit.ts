/**
 * Lightweight in-memory rate limiter for API route protection.
 * 
 * This prevents burst abuse (e.g., bots hammering the AI endpoint).
 * Plan-level quotas (monthly limits, lifetime limits) are handled separately
 * by check-limits.ts / Supabase.
 * 
 * On Vercel serverless, each cold-start resets the map — this is fine because
 * the goal is burst protection, not persistent quotas.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a given key (usually `userId` or `ip`).
 * Returns whether the request is allowed and how many remain.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(key, { count: 1, resetTime: now + config.windowSeconds * 1000 });
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
