import { z } from "zod";
import { getNetworkConfig } from "../config/networks.js";
import { StellarClient } from "../core/stellarClient.js";
import {
  SoroSwapClient,
  type QuoteResponse,
  type Asset,
} from "../defi/index.js";
import {
  Keypair,
  Asset as StellarAsset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Horizon,
} from "@stellar/stellar-sdk";

const MAINNET_ASSETS = {
  XLM: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  USDC: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
} as const;

/** Resolve "XLM" | "USDC" | contractId (C...) to Asset (mainnet only). */
function resolveAssetSymbol(symbol: string): Asset {
  const s = symbol.trim().toUpperCase();
  if (s === "XLM") return { contractId: MAINNET_ASSETS.XLM };
  if (s === "USDC") return { contractId: MAINNET_ASSETS.USDC };
  if (s.startsWith("C") && s.length === 56) return { contractId: symbol.trim() };
  throw new Error(
    `Unknown asset "${symbol}". Use XLM, USDC, or a Soroban contract ID (C...).`
  );
}

/** Convert human amount to raw units (7 decimals for XLM, 6 for USDC/AUSDC on testnet). */
function toRawAmount(amount: string, assetSymbol: string): string {
  const a = amount.trim().replace(/\s*(XLM|USDC|AUSDC)$/i, '');
  if (!/^\d+(\.\d+)?$/.test(a)) return a;
  const upper = assetSymbol.trim().toUpperCase();
  const decimals = upper === "XLM" ? 7 : upper === "USDC" || upper === "AUSDC" ? 6 : 7;
  const num = Number(a);
  if (!Number.isFinite(num) || num < 0) return a;
  const raw = Math.floor(num * 10 ** decimals);
  return String(raw);
}

export const tools = [
  {
    name: "check_balance",
    description: "Get token balances for a Stellar address",
    parameters: z.object({
      address: z.string().describe("Stellar address"),
      network: z.literal("mainnet").optional().default("mainnet"),
    }),
    execute: async ({
      address,
      network = "mainnet",
    }: {
      address: string;
      network?: "testnet" | "mainnet";
    }) => {
      if (!address || address.length !== 56 || !address.startsWith('G')) {
        throw new Error(`Invalid Stellar address. Must be 56 characters starting with G.`);
      }
      const config = getNetworkConfig(network);
      const client = new StellarClient(config);
      const balances = await client.getBalance(address);
      return { balances };
    },
  },
  {
    name: "swap_asset",
    description: "Swap tokens via SoroSwap. Use XLM and USDC on mainnet.",
    parameters: z.object({
      fromAsset: z.string().describe("Asset to swap from (XLM or USDC)"),
      toAsset: z.string().describe("Asset to swap to (XLM or USDC)"),
      amount: z.string().describe("Amount to swap (number only)"),
      address: z.string().describe("Stellar address"),
      network: z.literal("mainnet").default("mainnet"),
      privateKey: z.string().optional().describe("56-character secret key starting with S"),
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
      network: "mainnet";
      privateKey?: string;
    }) => {
      if (!address || address.length !== 56 || !address.startsWith('G')) {
        throw new Error(`Invalid Stellar address. Must be 56 characters starting with G.`);
      }
      if (privateKey && (privateKey.length !== 56 || !privateKey.startsWith('S'))) {
        throw new Error(`Invalid private key. Must be exactly 56 characters starting with S.`);
      }
      const config = getNetworkConfig();
      const soroSwapClient = new SoroSwapClient(config);
      const from = resolveAssetSymbol(fromAsset.trim());
      const to = resolveAssetSymbol(toAsset.trim());
      const rawAmount = toRawAmount(amount, fromAsset.trim());

      let quote: QuoteResponse;
      try {
        quote = await soroSwapClient.getQuote(from, to, rawAmount);
      } catch (err) {
        throw err;
      }

      if (!privateKey) {
        return {
          success: false as const,
          quote,
          message: "No privateKey provided. Provide privateKey to execute the swap, or omit for quote only.",
        };
      }

      let result: { hash: string; status: string };
      try {
        result = await soroSwapClient.executeSwap(privateKey, quote, "mainnet");
      } catch (err) {
        throw new Error(`Swap failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      return {
        success: true as const,
        txHash: result.hash,
        status: result.status,
        quote,
      };
    },
  },
  {
    name: "create_trustline",
    description: "Create a trustline to receive tokens like USDC",
    parameters: z.object({
      address: z.string().describe("Stellar address"),
      assetCode: z.string().describe("Asset code (e.g. USDC)"),
      network: z.literal("mainnet").default("mainnet"),
      privateKey: z.string().describe("56-character secret key starting with S"),
    }),
    execute: async ({
      address,
      assetCode,
      network,
      privateKey,
    }: {
      address: string;
      assetCode: string;
      network: "testnet" | "mainnet";
      privateKey: string;
    }) => {
      if (!address || address.length !== 56 || !address.startsWith('G')) {
        throw new Error(`Invalid Stellar address. Must be 56 characters starting with G.`);
      }
      if (!privateKey || privateKey.length !== 56 || !privateKey.startsWith('S')) {
        throw new Error(`Invalid private key. Must be exactly 56 characters starting with S.`);
      }

      const config = getNetworkConfig();
      const server = new Horizon.Server(config.horizonUrl);
      const MAINNET_USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
      
      let asset: StellarAsset;
      if (assetCode.toUpperCase() === "USDC") {
        asset = new StellarAsset(assetCode.toUpperCase(), MAINNET_USDC_ISSUER);
      } else {
        throw new Error(`Unsupported asset: ${assetCode}. Currently only USDC is supported.`);
      }

      try {
        const keypair = Keypair.fromSecret(privateKey);
        const account = await server.loadAccount(address);
        const existingTrustline = account.balances.find(
          (balance: any) => balance.asset_code === assetCode.toUpperCase() && balance.asset_issuer === asset.getIssuer()
        );
        if (existingTrustline) {
          return { success: true as const, message: `Trustline for ${assetCode.toUpperCase()} already exists`, existing: true };
        }

        const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.PUBLIC })
          .addOperation(Operation.changeTrust({ asset }))
          .setTimeout(30)
          .build();

        transaction.sign(keypair);
        const result = await server.submitTransaction(transaction);
        return { success: true as const, txHash: result.hash, message: `Trustline created for ${assetCode.toUpperCase()}`, existing: false };
      } catch (error) {
        throw new Error(`Failed to create trustline: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  },
  {
    name: "send_payment",
    description: "Send XLM or a custom asset (e.g. USDC) from your account to a destination address.",
    parameters: z.object({
      privateKey: z.string().describe("56-character secret key (S...) of the sender"),
      destination: z.string().describe("Stellar destination address (G...)"),
      amount: z.string().describe("Amount to send (e.g. 10 or 10.5)"),
      assetCode: z.string().optional().describe("Asset code (omit for XLM; use USDC for USD Coin)"),
      assetIssuer: z.string().optional().describe("Issuer address (G...) for custom assets; required when assetCode is set"),
      network: z.literal("mainnet").optional().default("mainnet"),
    }),
    execute: async ({
      privateKey,
      destination,
      amount,
      assetCode,
      assetIssuer,
      network = "mainnet",
    }: {
      privateKey: string;
      destination: string;
      amount: string;
      assetCode?: string;
      assetIssuer?: string;
      network?: "mainnet";
    }) => {
      if (!privateKey || privateKey.startsWith("S") === false) throw new Error("Invalid private key.");
      if (!destination || destination.startsWith("G") === false) throw new Error("Invalid destination.");

      const MAINNET_USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
      const code = assetCode?.trim().toUpperCase();
      let issuer = assetIssuer?.trim();

      if (code && code !== "XLM" && !issuer) {
        if (code === "USDC") issuer = MAINNET_USDC_ISSUER;
        else throw new Error("assetIssuer is required for custom assets.");
      }

      const config = getNetworkConfig(network);
      const client = new StellarClient(config);
      const result = await client.sendPayment(privateKey, destination, amount, code && code !== "XLM" ? code : undefined, issuer);
      return { success: true as const, txHash: result.hash, message: `Payment sent: ${amount} ${code || "XLM"} to ${destination.slice(0, 8)}...` };
    },
  },
  {
    name: "create_claimable_balance",
    description: "Send assets that the recipient can claim later. Useful if the recipient hasn't set up a trustline yet.",
    parameters: z.object({
      privateKey: z.string().describe("Your 56-character secret key (S...)"),
      recipient: z.string().describe("The Stellar address (G...) authorized to claim the balance"),
      amount: z.string().describe("Amount to send"),
      assetCode: z.string().optional().describe("Asset code (XLM by default)"),
      assetIssuer: z.string().optional().describe("Issuer address (required for custom assets except USDC)"),
    }),
    execute: async ({
      privateKey,
      recipient,
      amount,
      assetCode,
      assetIssuer,
    }: {
      privateKey: string;
      recipient: string;
      amount: string;
      assetCode?: string;
      assetIssuer?: string;
    }) => {
      const config = getNetworkConfig("mainnet");
      const server = new Horizon.Server(config.horizonUrl);
      const keypair = Keypair.fromSecret(privateKey);
      const account = await server.loadAccount(keypair.publicKey());

      const code = assetCode?.trim().toUpperCase();
      const MAINNET_USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
      
      let asset: StellarAsset;
      if (!code || code === "XLM") {
        asset = StellarAsset.native();
      } else {
        const issuer = (code === "USDC" && !assetIssuer) ? MAINNET_USDC_ISSUER : assetIssuer;
        if (!issuer) throw new Error("assetIssuer is required for custom assets.");
        asset = new StellarAsset(code, issuer);
      }

      const operation = Operation.createClaimableBalance({
        asset,
        amount,
        claimants: [new Horizon.Claimant(recipient, Operation.canClaimUntil("0"))],
      });

      const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.PUBLIC })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      const result = await server.submitTransaction(transaction);

      return {
        success: true as const,
        txHash: result.hash,
        message: `Claimable balance of ${amount} ${code || "XLM"} created for ${recipient.slice(0, 8)}...`,
      };
    },
  },
  {
    name: "get_swap_quote",
    description: "Get a quote for token swap without executing it",
    parameters: z.object({
      fromAsset: z.string().describe("Asset to swap from (XLM or USDC)"),
      toAsset: z.string().describe("Asset to swap to (XLM or USDC)"),
      amount: z.string().describe("Amount to swap (number only)"),
      network: z.literal("mainnet").default("mainnet"),
    }),
    execute: async ({
      fromAsset,
      toAsset,
      amount,
      network,
    }: {
      fromAsset: string;
      toAsset: string;
      amount: string;
      network: "mainnet";
    }) => {
      const config = getNetworkConfig();
      const soroSwapClient = new SoroSwapClient(config, process.env.SOROSWAP_API_KEY);
      const from = resolveAssetSymbol(fromAsset.trim());
      const to = resolveAssetSymbol(toAsset.trim());
      const rawAmount = toRawAmount(amount, fromAsset.trim());

      try {
        const quote = await soroSwapClient.getQuote(from, to, rawAmount);
        const fromDecimals = fromAsset.trim().toUpperCase() === "XLM" ? 7 : 6;
        const toDecimals = toAsset.trim().toUpperCase() === "XLM" ? 7 : 6;
        const expectedInHuman = (parseInt(quote.expectedIn) / Math.pow(10, fromDecimals)).toFixed(fromDecimals);
        const expectedOutHuman = (parseInt(quote.expectedOut) / Math.pow(10, toDecimals)).toFixed(toDecimals);

        return {
          success: true as const,
          quote: { fromAsset: fromAsset.trim().toUpperCase(), toAsset: toAsset.trim().toUpperCase(), amountIn: expectedInHuman, amountOut: expectedOutHuman, route: quote.route },
          message: `Quote: ${expectedInHuman} ${fromAsset.trim().toUpperCase()} → ${expectedOutHuman} ${toAsset.trim().toUpperCase()}`,
        };
      } catch (error) {
        throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  },
];