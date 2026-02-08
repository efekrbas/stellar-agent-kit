/**
 * x402 client – payment request from 402 response.
 */

export interface X402PaymentRequest {
  amount: string;
  assetCode: string;
  issuer?: string;
  network: string;
  destination: string;
  memo?: string;
}

export interface X402PaymentResponse {
  transactionHash: string;
  timestamp?: string;
}

export interface X402ClientOptions {
  /** Retry request after payment (default true) */
  autoRetry?: boolean;
  /** Pluggable: perform Stellar payment (e.g. Freighter), return tx hash */
  payWithStellar?: (req: X402PaymentRequest) => Promise<X402PaymentResponse | null>;
}
