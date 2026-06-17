import { createClient } from "@supabase/supabase-js";

// Initialize Supabase using the service role key for full DB access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * Integrates Supabase database-backed rate-limiting for distributed multi-instance serverless setups.
 * Automatically falls back to in-memory rate limiting if the DB table is missing or fails.
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    // 1. Clean up expired record for this key (garbage collection on access)
    await supabase
      .from("api_rate_limits")
      .delete()
      .eq("key", key)
      .lt("reset_at", now.toISOString());

    // 2. Query the current rate limit record
    const { data: entry, error: selectErr } = await supabase
      .from("api_rate_limits")
      .select("requests_count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (selectErr) throw selectErr;

    if (!entry) {
      // Create a new window record
      const resetAt = new Date(Date.now() + config.windowSeconds * 1000);
      const { error: insertErr } = await supabase
        .from("api_rate_limits")
        .insert({
          key,
          requests_count: 1,
          reset_at: resetAt.toISOString(),
        });

      if (insertErr) {
        // If an insert collision occurred, fall back to in-memory or retry
        console.warn("[rateLimit] Collision inserting key, falling back to memory:", insertErr);
        return rateLimitInMemory(key, config);
      }

      return { allowed: true, remaining: config.maxRequests - 1, retryAfterSeconds: 0 };
    }

    const count = entry.requests_count || 0;
    const resetTime = new Date(entry.reset_at).getTime();

    if (count < config.maxRequests) {
      // Increment request count
      const { error: updateErr } = await supabase
        .from("api_rate_limits")
        .update({ requests_count: count + 1 })
        .eq("key", key);

      if (updateErr) throw updateErr;

      return { allowed: true, remaining: config.maxRequests - (count + 1), retryAfterSeconds: 0 };
    }

    // Rate limited
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };

  } catch (dbErr) {
    // Graceful fallback to local memory
    console.warn(`[rateLimit] DB rate limit failed (table might be missing), falling back to memory for key "${key}":`, dbErr);
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
