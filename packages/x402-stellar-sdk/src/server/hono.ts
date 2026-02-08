/**
 * Hono adapter for x402 – use x402Hono(options) as middleware.
 */

import { createPaymentRequiredResponse, processPaymentMiddleware } from "./middleware.js";
import type { X402StellarOptions } from "./types.js";

type HonoContext = {
  req: { header: (name: string) => string | undefined; raw: Request };
  json: (body: unknown, status?: number, headers?: Record<string, string>) => Response;
};
type HonoNext = () => Promise<void>;

/**
 * x402 middleware for Hono. Returns 402 with Stellar payment metadata when payment is missing or invalid.
 */
export function x402Hono(options: X402StellarOptions) {
  if (!options.price || !options.assetCode || !options.destination || !options.network) {
    throw new Error("x402Hono() requires price, assetCode, destination, and network");
  }
  return async (c: HonoContext, next: HonoNext) => {
    const raw = c.req.raw;
    const headers: Record<string, string> = {};
    raw.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    const result = await processPaymentMiddleware(headers, options);
    if (!result.allowed) {
      const payment402 = createPaymentRequiredResponse(options);
      return c.json(payment402.body, 402, payment402.headers);
    }
    await next();
  };
}
