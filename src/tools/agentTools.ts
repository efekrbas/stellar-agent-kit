import { z } from "zod";
import { getNetworkConfig } from "../config/networks.js";
import { StellarClient } from "../core/stellarClient.js";
import {
  SoroSwapClient,
  TESTNET_ASSETS,
  type QuoteResponse,
  type Asset,
} from "../defi/index.js";

/** Resolve "XLM" | "USDC" | contractId (C...) to Soroban Asset for testnet. */
function resolveAssetSymbol(symbol: string, network: string): Asset {
  const s = symbol.trim().toUpperCase();
  if (network !== "testnet") {
    if (s.startsWith("C") && s.length === 56) return { contractId: symbol.trim() };
    throw new Error(
      `swap_asset on mainnet requires contract IDs (C...). Got: ${symbol}`
    );
  }
  if (s === "XLM") return { contractId: TESTNET_ASSETS.XLM };
  if (s === "USDC") return { contractId: TESTNET_ASSETS.USDC };
  if (s.startsWith("C") && symbol.length === 56) return { contractId: symbol.trim() };
  throw new Error(
    `Unknown asset "${symbol}". Use XLM, USDC, or a Soroban contract ID (C...).`
  );
}

/** Convert human amount to raw units (7 decimals for XLM, 6 for USDC on testnet). */
function toRawAmount(amount: string, assetSymbol: string): string {
  const a = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(a)) return a;
  const upper = assetSymbol.trim().toUpperCase();
  const decimals = upper === "XLM" ? 7 : upper === "USDC" ? 6 : 7;
  const num = Number(a);
  if (!Number.isFinite(num) || num < 0) return a;
  const raw = Math.floor(num * 10 ** decimals);
  return String(raw);
}

export const tools = [
  {
    name: "check_balance",
    description: "Get all token balances for a Stellar address",
    parameters: z.object({
      address: z.string().describe("Stellar public key (starts with G)"),
      network: z.enum(["testnet", "mainnet"]).optional().default("testnet"),
    }),
    execute: async ({
      address,
      network,
    }: {
      address: string;
      network: "testnet" | "mainnet";
    }) => {
      const config = getNetworkConfig(network);
      const client = new StellarClient(config);
      const balances = await client.getBalance(address);
      return { balances };
    },
  },
  {
    name: "swap_asset",
    description:
      "Get quote and execute token swap via SoroSwap DEX (testnet: XLM, USDC or contract IDs)",
    parameters: z.object({
      fromAsset: z
        .string()
        .describe("XLM or ASSET_CODE:ISSUER or Soroban contract ID (C...)"),
      toAsset: z.string().describe("Same format as fromAsset"),
      amount: z.string().describe("Amount to swap (e.g. '10' for 10 XLM)"),
      address: z.string().describe("Your Stellar public key (G...)"),
      network: z.enum(["testnet", "mainnet"]).default("testnet"),
      privateKey: z
        .string()
        .optional()
        .describe("Secret key for signing (DEMO ONLY). If omitted, returns quote only."),
    }),
    execute: async ({
      fromAsset,
      toAsset,
      amount,
      address,
      network,
      privateKey,
    }: {
      fromAsset: string;
      toAsset: string;
      amount: string;
      address: string;
      network: "testnet" | "mainnet";
      privateKey?: string;
    }) => {
      const config = getNetworkConfig(network);
      const soroSwapClient = new SoroSwapClient(config);

      const from = resolveAssetSymbol(fromAsset, network);
      const to = resolveAssetSymbol(toAsset, network);
      const rawAmount = toRawAmount(amount, fromAsset);

      const quote: QuoteResponse = await soroSwapClient.getQuote(
        from,
        to,
        rawAmount
      );

      if (!privateKey) {
        return {
          success: false as const,
          quote,
          message:
            "No privateKey provided. Set privateKey to execute the swap (DEMO ONLY).",
        };
      }

      const result = await soroSwapClient.executeSwap(
        privateKey,
        quote,
        network
      );

      return {
        success: true as const,
        txHash: result.hash,
        status: result.status,
        quote,
      };
    },
  },
];
