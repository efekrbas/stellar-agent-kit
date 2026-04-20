import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReplayCache, DEFAULT_TTL_MS } from "../server/replay.js";

describe("ReplayCache", () => {
  let cache: ReplayCache;

  beforeEach(() => {
    cache = new ReplayCache();
  });

  it("returns false for unknown hash", () => {
    expect(cache.has("unknown_hash")).toBe(false);
  });

  it("returns true after hash is set", () => {
    cache.set("tx_hash_abc");
    expect(cache.has("tx_hash_abc")).toBe(true);
  });

  it("returns false for different hash", () => {
    cache.set("tx_hash_abc");
    expect(cache.has("tx_hash_xyz")).toBe(false);
  });

  it("expires entries after TTL", () => {
    const shortTtl = 100; // 100ms
    const shortCache = new ReplayCache(shortTtl);
    shortCache.set("tx_hash_expire");
    expect(shortCache.has("tx_hash_expire")).toBe(true);

    // Advance time past TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(shortTtl + 1);
    expect(shortCache.has("tx_hash_expire")).toBe(false);
    vi.useRealTimers();
  });

  it("evicts expired entries on set()", () => {
    vi.useFakeTimers();
    const shortCache = new ReplayCache(50);
    shortCache.set("tx_old");
    expect(shortCache.size()).toBe(1);

    vi.advanceTimersByTime(100);
    shortCache.set("tx_new");

    // tx_old should be evicted, only tx_new remains
    expect(shortCache.size()).toBe(1);
    expect(shortCache.has("tx_old")).toBe(false);
    expect(shortCache.has("tx_new")).toBe(true);
    vi.useRealTimers();
  });

  it("clear() removes all entries", () => {
    cache.set("tx_1");
    cache.set("tx_2");
    cache.set("tx_3");
    expect(cache.size()).toBe(3);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it("size() returns correct count", () => {
    expect(cache.size()).toBe(0);
    cache.set("tx_a");
    expect(cache.size()).toBe(1);
    cache.set("tx_b");
    expect(cache.size()).toBe(2);
  });

  it("DEFAULT_TTL_MS is 24 hours", () => {
    expect(DEFAULT_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("verifyPaymentOnChain replay protection", () => {
  beforeEach(() => {
    // Reset singleton cache between tests
    // Using simple clear() since we can't easily re-require in ESM without cache busting
    // But since we are importing from the same file, it should work.
  });

  it("rejects already-verified hash on second call", async () => {
    const { replayCache } = await import("../server/replay.js");
    const { verifyPaymentOnChain } = await import(
      "../server/verify.js"
    );

    // Reset for this test
    replayCache.clear();

    // Pre-seed the cache as if hash was already verified
    replayCache.set("already_used_hash");

    const result = await verifyPaymentOnChain("already_used_hash", {
      price: "1",
      assetCode: "XLM",
      network: "testnet",
      destination: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    } as any);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("replay attack prevented");
  });
});
