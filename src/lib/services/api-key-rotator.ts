/**
 * ── API Key Pool Rotator for OpenCode / LLM Providers ──
 * Allows configuring multiple API keys via environment variables (e.g. OPENCODE_API_KEYS="key1,key2,key3").
 * When rate limits (429), quota errors (402/403), or balance exhaustion occur on one key,
 * the system automatically and silently rotates to the next available key in the pool.
 */

const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown before retrying a failed key

interface KeyState {
  key: string;
  cooldownUntil: number;
  failureCount: number;
}

class ApiKeyRotator {
  private keyStates: KeyState[] = [];
  private activeIndex: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.initPool();
  }

  /**
   * Initializes the pool from environment variables.
   */
  private initPool(): void {
    const rawKeys: string[] = [];

    // 1. OPENCODE_API_KEYS (comma separated)
    if (process.env.OPENCODE_API_KEYS) {
      const split = process.env.OPENCODE_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
      rawKeys.push(...split);
    }

    // 2. OPENCODE_API_KEY
    if (process.env.OPENCODE_API_KEY && !rawKeys.includes(process.env.OPENCODE_API_KEY.trim())) {
      rawKeys.push(process.env.OPENCODE_API_KEY.trim());
    }

    // 3. LLM_API_KEYS (comma separated)
    if (process.env.LLM_API_KEYS) {
      const split = process.env.LLM_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
      for (const k of split) {
        if (!rawKeys.includes(k)) rawKeys.push(k);
      }
    }

    // 4. LLM_API_KEY / MIMO_API_KEY
    const singleLlmKey = process.env.LLM_API_KEY || process.env.MIMO_API_KEY;
    if (singleLlmKey && !rawKeys.includes(singleLlmKey.trim())) {
      rawKeys.push(singleLlmKey.trim());
    }

    // Deduplicate
    const uniqueKeys = Array.from(new Set(rawKeys));

    this.keyStates = uniqueKeys.map(key => ({
      key,
      cooldownUntil: 0,
      failureCount: 0,
    }));

    this.activeIndex = 0;
    this.isInitialized = true;
  }

  /**
   * Returns current list of configured keys (for diagnostic/log purposes).
   */
  public getKeyCount(): number {
    if (!this.isInitialized || this.keyStates.length === 0) {
      this.initPool();
    }
    return this.keyStates.length;
  }

  /**
   * Gets the currently active key for making requests.
   */
  public getActiveKey(): { key: string; index: number; total: number } {
    if (!this.isInitialized || this.keyStates.length === 0) {
      this.initPool();
    }

    if (this.keyStates.length === 0) {
      return { key: '', index: 0, total: 0 };
    }

    const now = Date.now();

    // Look for a key starting from activeIndex that is not in cooldown
    for (let i = 0; i < this.keyStates.length; i++) {
      const idx = (this.activeIndex + i) % this.keyStates.length;
      if (this.keyStates[idx].cooldownUntil <= now) {
        this.activeIndex = idx;
        return {
          key: this.keyStates[idx].key,
          index: idx,
          total: this.keyStates.length,
        };
      }
    }

    // If all keys are in cooldown, pick the one whose cooldown expires earliest
    let earliestIdx = 0;
    let minCooldown = Infinity;
    for (let i = 0; i < this.keyStates.length; i++) {
      if (this.keyStates[i].cooldownUntil < minCooldown) {
        minCooldown = this.keyStates[i].cooldownUntil;
        earliestIdx = i;
      }
    }

    this.activeIndex = earliestIdx;
    return {
      key: this.keyStates[earliestIdx].key,
      index: earliestIdx,
      total: this.keyStates.length,
    };
  }

  /**
   * Marks a key as exhausted or rate limited and advances to the next available key.
   */
  public markKeyExhausted(exhaustedKey: string, cooldownMs: number = DEFAULT_COOLDOWN_MS): { nextKey: string; nextIndex: number } {
    const now = Date.now();
    const targetIdx = this.keyStates.findIndex(s => s.key === exhaustedKey);

    if (targetIdx !== -1) {
      this.keyStates[targetIdx].cooldownUntil = now + cooldownMs;
      this.keyStates[targetIdx].failureCount += 1;
      
      const maskedKey = `${exhaustedKey.slice(0, 4)}...${exhaustedKey.slice(-4)}`;
      console.warn(
        `[KEY_ROTATOR] Account key #${targetIdx + 1} (${maskedKey}) marked exhausted/rate-limited. Cooldown for ${Math.round(cooldownMs / 1000 / 60)} min.`
      );
    }

    // Advance index to next key
    this.activeIndex = (this.activeIndex + 1) % Math.max(1, this.keyStates.length);
    const active = this.getActiveKey();

    if (active.key && active.key !== exhaustedKey) {
      const maskedNext = `${active.key.slice(0, 4)}...${active.key.slice(-4)}`;
      console.info(`[KEY_ROTATOR] Rotated seamlessly to account key #${active.index + 1} (${maskedNext}).`);
    } else {
      console.warn(`[KEY_ROTATOR] All ${this.keyStates.length} account keys are currently exhausted or in cooldown.`);
    }

    return { nextKey: active.key, nextIndex: active.index };
  }

  /**
   * Determines whether an HTTP error status or message indicates a rate limit or quota failure.
   */
  public isRateLimitOrQuotaError(status: number, errorMessage: string = ''): boolean {
    if (status === 429 || status === 402 || status === 403) {
      return true;
    }

    const lowerMsg = errorMessage.toLowerCase();
    const rateLimitKeywords = [
      'rate limit',
      'rate_limit',
      'quota',
      'insufficient',
      'balance',
      'too many requests',
      'limit reached',
      'exceeded',
      'capacity',
    ];

    return rateLimitKeywords.some(keyword => lowerMsg.includes(keyword));
  }
}

// Singleton instance
export const apiKeyRotator = new ApiKeyRotator();
