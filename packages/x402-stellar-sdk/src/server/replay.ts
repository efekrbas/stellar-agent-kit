/**
 * In-memory replay protection for x402 Stellar payments.
 * Prevents the same transaction hash from unlocking
 * premium content more than once.
 */

interface CacheEntry {
  verifiedAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class ReplayCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Check if a txHash has already been verified.
   * Returns true if the hash is in the cache and not expired.
   */
  has(txHash: string): boolean {
    const entry = this.cache.get(txHash);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(txHash);
      return false;
    }
    return true;
  }

  /**
   * Mark a txHash as verified. Stores with TTL.
   */
  set(txHash: string): void {
    const now = Date.now();
    this.cache.set(txHash, {
      verifiedAt: now,
      expiresAt: now + this.ttlMs,
    });
    this.evict();
  }

  /**
   * Remove all expired entries to prevent memory growth.
   * Called automatically after every set().
   */
  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Current number of cached entries.
   * Exposed for testing.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all entries.
   * Exposed for testing.
   */
  clear(): void {
    this.cache.clear();
  }
}

/** Singleton cache shared across all middleware instances. */
export const replayCache = new ReplayCache();

/** Exported for testing with custom TTL. */
export { ReplayCache, DEFAULT_TTL_MS };
