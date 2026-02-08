/**
 * x402 server – Stellar payment-gated middleware.
 * Same ergonomics as x402-mantle-sdk: x402({ price, assetCode, issuer, network, destination }).
 */

import {
  createPaymentRequiredResponse,
  processPaymentMiddleware,
  type X402StellarOptions,
} from "./middleware.js";

export { createPaymentRequiredResponse, processPaymentMiddleware } from "./middleware.js";
export { verifyPaymentOnChain } from "./verify.js";
export type { X402StellarOptions, PaymentRequiredResponse } from "./types.js";

/** Express-style request (headers) and response (status + json). */
export type X402Request = { headers: Record<string, string | string[] | undefined> };
export type X402Response = { status(n: number): { json(b: unknown): void }; json(b: unknown): void };
export type X402Next = () => void | Promise<void>;

/**
 * x402 middleware – use in Express/Hono/Next.
 * On missing/invalid payment: respond 402 with Stellar payment metadata.
 * On valid payment: call next().
 */
export function x402(options: X402StellarOptions) {
  if (!options.price || !options.assetCode || !options.destination || !options.network) {
    throw new Error("x402() requires price, assetCode, destination, and network");
  }
  return async (req: X402Request, res: X402Response, next: X402Next) => {
    const headers: Record<string, string> = {};
    if (typeof req.headers === "object") {
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers[k.toLowerCase()] = v;
      }
    }
    const result = await processPaymentMiddleware(headers, options);
    if (result.allowed) return next();
    const payment402 = createPaymentRequiredResponse(options);
    res.status(402).json(payment402.body);
  };
}
