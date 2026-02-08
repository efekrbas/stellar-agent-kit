/**
 * Next.js adapter for x402 – verify payment in API routes and return 402 or continue.
 */

import { createPaymentRequiredResponse, processPaymentMiddleware } from "./middleware.js";
import type { X402StellarOptions } from "./types.js";

export type { X402StellarOptions } from "./types.js";

/**
 * Use in Next.js API route (App Router or Pages API).
 * Pass the request headers and your x402 options; returns null if paid, or a NextResponse with 402 if not.
 */
export async function withX402(
  requestHeaders: Headers,
  options: X402StellarOptions
): Promise<Response | null> {
  const headers: Record<string, string> = {};
  requestHeaders.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const result = await processPaymentMiddleware(headers, options);
  if (result.allowed) return null;
  const payment402 = createPaymentRequiredResponse(options);
  return new Response(JSON.stringify(payment402.body), {
    status: 402,
    headers: { "Content-Type": "application/json", ...payment402.headers },
  });
}

/**
 * Example App Router usage:
 *
 *   // app/api/premium/route.ts
 *   import { withX402 } from "x402-stellar-sdk/server/next";
 *
 *   const options = { price: "1", assetCode: "XLM", network: "testnet", destination: "G..." };
 *   export async function GET(req: Request) {
 *     const res402 = await withX402(req.headers, options);
 *     if (res402) return res402;
 *     return Response.json({ data: "Premium content" });
 *   }
 */
