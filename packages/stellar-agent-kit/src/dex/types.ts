/**
 * DEX / swap types (Stellar: asset = code+issuer or contractId).
 */

export interface DexAsset {
  contractId?: string;
  code?: string;
  issuer?: string;
}

export interface QuoteResult {
  expectedIn: string;
  expectedOut: string;
  minOut: string;
  route: string[];
  rawData?: unknown;
}

export interface SwapResult {
  hash: string;
  status: string;
}
