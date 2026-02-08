/**
 * x402 client – fetch with automatic 402 handling and Stellar payment flow.
 */

import type { X402ClientOptions, X402PaymentRequest, X402PaymentResponse } from "./types.js";

export type { X402PaymentRequest, X402PaymentResponse, X402ClientOptions } from "./types.js";

function parse402Response(response: Response): X402PaymentRequest | null {
  if (response.status !== 402) return null;
  const amount = response.headers.get("x-402-amount") ?? response.headers.get("X-402-Amount");
  const assetCode = response.headers.get("x-402-asset-code") ?? response.headers.get("X-402-Asset-Code");
  const network = response.headers.get("x-402-network") ?? response.headers.get("X-402-Network");
  const destination = response.headers.get("x-402-destination") ?? response.headers.get("X-402-Destination");
  const issuer = response.headers.get("x-402-issuer") ?? response.headers.get("X-402-Issuer") ?? undefined;
  const memo = response.headers.get("x-402-memo") ?? response.headers.get("X-402-Memo") ?? undefined;
  if (!amount || !assetCode || !network || !destination) return null;
  return { amount, assetCode, network, destination, ...(issuer && { issuer }), ...(memo && { memo }) };
}

function addPaymentHeaders(headers: HeadersInit, payment: X402PaymentResponse): Headers {
  const h = new Headers(headers);
  h.set("X-402-Transaction-Hash", payment.transactionHash);
  if (payment.timestamp) h.set("X-402-Timestamp", payment.timestamp);
  return h;
}

/**
 * Fetch that handles 402: on 402, calls payWithStellar (or throws), then retries with payment headers.
 */
export async function x402Fetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: X402ClientOptions
): Promise<Response> {
  const res = await fetch(input, init);
  const paymentRequest = parse402Response(res);
  if (!paymentRequest) return res;

  const payWithStellar = options?.payWithStellar;
  if (!payWithStellar) {
    throw new Error(
      "402 Payment Required. Provide x402Fetch(..., { payWithStellar }) to handle Stellar payments."
    );
  }

  const payment = await payWithStellar(paymentRequest);
  if (!payment) return res;

  const newHeaders = addPaymentHeaders(init?.headers ?? {}, payment);
  const retryInit = { ...init, headers: newHeaders };
  return fetch(input, retryInit);
}
