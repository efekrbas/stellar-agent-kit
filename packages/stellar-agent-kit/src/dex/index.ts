/**
 * DEX module – swap, quote, aggregator (SoroSwap).
 * Pluggable: add more DEXes by implementing DexClient.
 */

import type { NetworkConfig } from "../config/networks.js";
import type { DexAsset, QuoteResult, SwapResult } from "./types.js";
import { createSoroSwapDexClient } from "./soroSwap.js";

export type { DexAsset, QuoteResult, SwapResult } from "./types.js";
export { createSoroSwapDexClient } from "./soroSwap.js";

export interface DexClient {
  getQuote(fromAsset: DexAsset, toAsset: DexAsset, amount: string): Promise<QuoteResult>;
  executeSwap(secretKey: string, quote: QuoteResult): Promise<SwapResult>;
}

/**
 * Build a DEX client for the given network (SoroSwap aggregator).
 */
export function createDexClient(networkConfig: NetworkConfig, apiKey?: string): DexClient {
  return createSoroSwapDexClient(networkConfig, apiKey);
}
