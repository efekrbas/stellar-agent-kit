/**
 * Core x402 middleware – returns 402 with Stellar payment metadata.
 * Framework-agnostic; Hono/Express adapters call this.
 */

import type { X402StellarOptions, PaymentRequiredResponse } from "./types.js";

export type { X402StellarOptions, PaymentRequiredResponse } from "./types.js";

export interface MiddlewareResult {
  allowed: boolean;
  paymentRequired?: PaymentRequiredResponse;
}

/**
 * Create 402 response body and headers for Stellar payment.
 * Client uses: destination, amount, assetCode, issuer, network, memo to create payment.
 */
export function createPaymentRequiredResponse(
  options: X402StellarOptions
): PaymentRequiredResponse {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-402-Amount": options.price,
    "X-402-Asset-Code": options.assetCode,
    "X-402-Network": options.network,
    "X-402-Destination": options.destination,
  };
  if (options.issuer) headers["X-402-Issuer"] = options.issuer;
  if (options.memo) headers["X-402-Memo"] = options.memo;

  return {
    status: 402,
    headers,
    body: {
      error: "Payment Required",
      amount: options.price,
      assetCode: options.assetCode,
      ...(options.issuer && { issuer: options.issuer }),
      network: options.network,
      destination: options.destination,
      ...(options.memo && { memo: options.memo }),
    },
  };
}

/**
 * Process payment check: extract receipt from headers and verify on Horizon.
 */
export async function processPaymentMiddleware(
  requestHeaders: Record<string, string>,
  options: X402StellarOptions
): Promise<MiddlewareResult> {
  const txHash = requestHeaders["x-402-transaction-hash"] ?? requestHeaders["X-402-Transaction-Hash"];
  if (!txHash?.trim()) return { allowed: false };
  const { verifyPaymentOnChain } = await import("./verify.js");
  const { valid, error } = await verifyPaymentOnChain(txHash.trim(), options);
  if (!valid) return { allowed: false };
  return { allowed: true };
}
