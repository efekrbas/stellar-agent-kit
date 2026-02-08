import { z } from "zod";
import {
  Contract,
  Address,
  Keypair,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  xdr,
  StrKey,
} from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";
import type { NetworkConfig } from "../config/networks";
import { getNetworkConfig, type NetworkName } from "../config/networks";
import { NativeAmmClient } from "./nativeAmmClient";

export interface Asset {
  contractId?: string;
  code?: string;
  issuer?: string;
}

const ContractIdSchema = z.object({
  contractId: z.string().regex(/^C[A-Z2-7]{55}$/, "Invalid Soroban contract ID (C...)"),
});
const ClassicAssetSchema = z.object({
  code: z.string().min(1),
  issuer: z.string().min(56),
});
const AssetSchema = z.union([ContractIdSchema, ClassicAssetSchema]);

function assetToApiString(asset: z.infer<typeof AssetSchema>): string {
  if ("contractId" in asset && asset.contractId) return asset.contractId;
  return `${(asset as { code: string; issuer: string }).code}:${(asset as { code: string; issuer: string }).issuer}`;
}

function hasContractId(asset: z.infer<typeof AssetSchema>): asset is z.infer<typeof ContractIdSchema> {
  return "contractId" in asset && !!asset.contractId;
}

export interface QuoteResponse {
  expectedIn: string;
  expectedOut: string;
  minOut: string;
  route: string[];
  /** Protocol(s) used for the quote when from API: e.g. "soroswap", "phoenix", "aqua" */
  protocol?: string | string[];
  rawData?: unknown;
}

export const QuoteResponseSchema = z.object({
  expectedIn: z.string(),
  expectedOut: z.string(),
  minOut: z.string(),
  route: z.array(z.string()),
  protocol: z.union([z.string(), z.array(z.string())]).optional(),
  rawData: z.unknown().optional(),
});

export type Network = NetworkName;

const SOROSWAP_AGGREGATOR_TESTNET =
  "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD";
const SOROSWAP_AGGREGATOR_MAINNET =
  "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";

const SIMULATION_SOURCE_FALLBACK =
  "GBZOFW7UOPKDWHMFZT4IMUDNAHIM4KMABHTOKEJYFFYCOXLARMMSBLBE";

const SOROSWAP_API_BASE = "https://api.soroswap.finance";

export class SoroSwapClient {
  private readonly sorobanServer: rpc.Server;
  private readonly networkConfig: NetworkConfig;
  private readonly apiKey: string | undefined;
  private readonly nativeAmmClient: NativeAmmClient;

  constructor(networkConfig: NetworkConfig, apiKey?: string) {
    this.networkConfig = networkConfig;
    this.sorobanServer = new rpc.Server(networkConfig.sorobanRpcUrl, {
      allowHttp: networkConfig.sorobanRpcUrl.startsWith("http:"),
    });
    this.apiKey = apiKey ?? process.env.SOROSWAP_API_KEY;
    this.nativeAmmClient = new NativeAmmClient(networkConfig);
  }

  async getQuote(
    fromAsset: Asset,
    toAsset: Asset,
    amount: string,
    sourceAddress?: string
  ): Promise<QuoteResponse> {
    const fromParsed = AssetSchema.safeParse(fromAsset);
    const toParsed = AssetSchema.safeParse(toAsset);
    if (!fromParsed.success) {
      throw new Error(`Invalid fromAsset: ${fromParsed.error.message}`);
    }
    if (!toParsed.success) {
      throw new Error(`Invalid toAsset: ${toParsed.error.message}`);
    }
    const amountStr = String(amount).trim();
    if (!amountStr || !/^\d+$/.test(amountStr)) {
      throw new Error("Amount must be a non-negative integer string (raw units)");
    }

    if (this.apiKey) {
      try {
        return await this.getQuoteViaApi(
          assetToApiString(fromParsed.data),
          assetToApiString(toParsed.data),
          amountStr
        );
      } catch (apiErr) {
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        const isTestnet = this.networkConfig.horizonUrl.includes("testnet");

        if (
          isTestnet &&
          (msg.includes("Invalid Stellar address") ||
            msg.includes("No path found") ||
            msg.includes("No liquidity path found"))
        ) {
          try {
            return await this.nativeAmmClient.getQuote(
              assetToApiString(fromParsed.data),
              assetToApiString(toParsed.data),
              amountStr
            );
          } catch {
            throw new Error(
              "No liquidity available via SoroSwap or Stellar AMM for this pair on testnet. Try different assets or amounts."
            );
          }
        }

        if (
          isTestnet &&
          hasContractId(fromParsed.data) &&
          hasContractId(toParsed.data) &&
          (msg.includes("invalid checksum") || msg.includes("invalid encoded"))
        ) {
          return this.getQuoteViaContract(
            { contractId: fromParsed.data.contractId },
            { contractId: toParsed.data.contractId },
            amountStr,
            sourceAddress
          );
        }
        throw apiErr;
      }
    }
    if (!hasContractId(fromParsed.data) || !hasContractId(toParsed.data)) {
      throw new Error(
        "Classic assets (e.g. AUSDC) require SOROSWAP_API_KEY for quotes. Set it for testnet XLM/AUSDC swaps."
      );
    }
    return this.getQuoteViaContract(
      { contractId: fromParsed.data.contractId },
      { contractId: toParsed.data.contractId },
      amountStr,
      sourceAddress
    );
  }

  private async getQuoteViaApi(
    assetIn: string,
    assetOut: string,
    amount: string
  ): Promise<QuoteResponse> {
    const network =
      this.networkConfig.horizonUrl.includes("testnet") ? "testnet" : "mainnet";
    const url = `${SOROSWAP_API_BASE}/quote?network=${network}`;
    const body = {
      assetIn,
      assetOut,
      amount,
      tradeType: "EXACT_IN",
      protocols: ["soroswap", "phoenix", "aqua"],
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && text.includes("No path found")) {
        throw new Error(
          "No liquidity path found for this pair on this network. Try a different pair or amount, or try again later."
        );
      }
      let message = `SoroSwap API error ${res.status}: ${text}`;
      if (res.status === 403) {
        message =
          "SoroSwap API 403: check SOROSWAP_API_KEY (Bearer sk_...) and base URL.";
      }
      throw new Error(message);
    }

    const data = (await res.json()) as unknown;
    return parseApiQuoteToQuoteResponse(data);
  }

  private async getQuoteViaContract(
    fromAsset: Asset,
    toAsset: Asset,
    amount: string,
    sourceAddress?: string
  ): Promise<QuoteResponse> {
    if (!fromAsset.contractId || !toAsset.contractId) {
      throw new Error(
        "Contract path requires contract IDs. Classic assets (AUSDC) need SOROSWAP_API_KEY."
      );
    }
    if (!StrKey.isValidContract(fromAsset.contractId)) {
      throw new Error(
        `Invalid token contract ID (from): checksum or format error. Got: ${fromAsset.contractId.slice(0, 12)}...`
      );
    }
    if (!StrKey.isValidContract(toAsset.contractId)) {
      throw new Error(
        `Invalid token contract ID (to): checksum or format error. Got: ${toAsset.contractId.slice(0, 12)}...`
      );
    }
    const contractId = this.networkConfig.horizonUrl.includes("testnet")
      ? SOROSWAP_AGGREGATOR_TESTNET
      : SOROSWAP_AGGREGATOR_MAINNET;

    const contract = new Contract(contractId);
    const fromAddr = new Address(fromAsset.contractId);
    const toAddr = new Address(toAsset.contractId);
    const amountScVal = nativeToScVal(amount, { type: "i128" });

    const pathScVal = xdr.ScVal.scvVec([
      nativeToScVal(fromAddr),
      nativeToScVal(toAddr),
    ]);
    const op = contract.call("get_amounts_out", amountScVal, pathScVal);

    const networkPassphrase = this.networkConfig.horizonUrl.includes("testnet")
      ? Networks.TESTNET
      : Networks.PUBLIC;

    const simSource =
      sourceAddress?.trim() && StrKey.isValidEd25519PublicKey(sourceAddress.trim())
        ? sourceAddress.trim()
        : SIMULATION_SOURCE_FALLBACK;
    let sourceAccount: Awaited<ReturnType<rpc.Server["getAccount"]>>;
    try {
      sourceAccount = await this.sorobanServer.getAccount(simSource);
    } catch (getAccErr) {
      const m = getAccErr instanceof Error ? getAccErr.message : String(getAccErr);
      throw new Error(
        `Quote simulation needs a funded account. ${m}. Set SOROSWAP_API_KEY for API-based quotes.`
      );
    }
    const tx = new TransactionBuilder(sourceAccount, {
      fee: "10000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    let sim: Awaited<ReturnType<rpc.Server["simulateTransaction"]>>;
    try {
      sim = await this.sorobanServer.simulateTransaction(tx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const useApi =
        "Quote via contract is not available. Set SOROSWAP_API_KEY for API-based quotes.";
      if (msg.includes("MismatchingParameterLen") || msg.includes("UnexpectedSize")) {
        throw new Error(useApi);
      }
      throw new Error(`SoroSwap quote simulation failed: ${msg}. ${useApi}`);
    }

    if ("error" in sim && sim.error) {
      const errStr = JSON.stringify(sim.error);
      const useApi = "Set SOROSWAP_API_KEY for API-based quotes.";
      if (
        errStr.includes("MismatchingParameterLen") ||
        errStr.includes("UnexpectedSize")
      ) {
        throw new Error(`Quote via contract not supported for this aggregator. ${useApi}`);
      }
      throw new Error(`SoroSwap quote simulation error: ${errStr}. ${useApi}`);
    }

    const result = sim as { result?: { retval?: string } };
    const retvalB64 = result?.result?.retval;
    if (!retvalB64) {
      throw new Error(
        "SoroSwap quote: no retval in simulation. Use SOROSWAP_API_KEY for API quotes."
      );
    }

    const retval = xdr.ScVal.fromXDR(retvalB64, "base64");
    const vec = retval.vec();
    if (!vec || vec.length < 2) {
      throw new Error(
        "SoroSwap quote: unexpected contract return format. Use SOROSWAP_API_KEY for API quotes."
      );
    }

    const amountInVal = vec[0];
    const amountOutVal = vec[1];
    const expectedIn = scValToI128String(amountInVal);
    const expectedOut = scValToI128String(amountOutVal);
    const route = [fromAsset.contractId!, toAsset.contractId!];

    return QuoteResponseSchema.parse({
      expectedIn,
      expectedOut,
      minOut: expectedOut,
      route,
    });
  }

  /**
   * Build unsigned swap transaction XDR. Caller signs with wallet (e.g. Freighter) then submits via submitSignedTransaction.
   */
  async buildSwapTransaction(
    quote: QuoteResponse,
    fromAddress: string,
    network: Network
  ): Promise<{ xdr: string }> {
    const config = getNetworkConfig(network);
    if (!this.apiKey) {
      throw new Error(
        "buildSwapTransaction requires SoroSwap API. Set SOROSWAP_API_KEY."
      );
    }
    const networkName = config.horizonUrl.includes("testnet") ? "testnet" : "mainnet";
    const buildUrl = `${SOROSWAP_API_BASE}/quote/build?network=${networkName}`;
    const quoteForBuild = quote.rawData || quote;
    const buildBody = {
      quote: quoteForBuild,
      from: fromAddress,
      to: fromAddress,
    };
    const buildRes = await fetch(buildUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(buildBody),
    });
    if (!buildRes.ok) {
      const text = await buildRes.text();
      throw new Error(`SoroSwap build failed ${buildRes.status}: ${text}`);
    }
    const buildData = (await buildRes.json()) as { xdr?: string };
    const xdrBase64 = buildData?.xdr;
    if (!xdrBase64 || typeof xdrBase64 !== "string") {
      throw new Error("SoroSwap build response missing xdr");
    }
    return { xdr: xdrBase64 };
  }

  /**
   * Submit a signed transaction XDR (signed by wallet) to the network.
   */
  async submitSignedTransaction(
    signedXdr: string,
    network: Network
  ): Promise<{ hash: string; status: string }> {
    const config = getNetworkConfig(network);
    const networkPassphrase = config.horizonUrl.includes("testnet")
      ? Networks.TESTNET
      : Networks.PUBLIC;
    const server = new rpc.Server(config.sorobanRpcUrl, {
      allowHttp: config.sorobanRpcUrl.startsWith("http:"),
    });
    const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const sendResult = await server.sendTransaction(tx);
    if (sendResult.errorResult) {
      throw new Error(
        `Soroban sendTransaction failed: ${String(sendResult.errorResult)}`
      );
    }
    return {
      hash: sendResult.hash,
      status: sendResult.status ?? "PENDING",
    };
  }

  async executeSwap(
    fromSecret: string,
    quote: QuoteResponse,
    network: Network
  ): Promise<{ hash: string; status: string }> {
    const secret = fromSecret.trim();
    if (secret.length === 56 && secret.startsWith("G")) {
      throw new Error(
        "Expected a secret key (S...) to execute the swap, but received a public address (G...). For a quote only, do not provide a secret key."
      );
    }
    const keypair = Keypair.fromSecret(secret);
    const fromAddress = keypair.publicKey();
    const { xdr } = await this.buildSwapTransaction(quote, fromAddress, network);
    const config = getNetworkConfig(network);
    const networkPassphrase = config.horizonUrl.includes("testnet")
      ? Networks.TESTNET
      : Networks.PUBLIC;
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    tx.sign(keypair);
    return this.submitSignedTransaction(tx.toXDR(), network);
  }
}

function parseApiQuoteToQuoteResponse(data: unknown): QuoteResponse {
  const o = data as Record<string, unknown>;
  const expectedIn = String(o?.expectedIn ?? o?.amountIn ?? "0");
  const expectedOut = String(o?.expectedOut ?? o?.amountOut ?? "0");
  const minOut = String(o?.minOut ?? o?.minimumAmountOut ?? expectedOut);
  const route = Array.isArray(o?.route)
    ? (o.route as string[])
    : Array.isArray(o?.path)
      ? (o.path as string[])
      : [];
  const protocol = o?.protocol ?? o?.dex ?? o?.protocols;
  return QuoteResponseSchema.parse({
    expectedIn,
    expectedOut,
    minOut,
    route,
    protocol: Array.isArray(protocol) ? protocol : typeof protocol === "string" ? protocol : undefined,
    rawData: data,
  });
}

function scValToI128String(scv: xdr.ScVal): string {
  const iv =
    scv.i128?.() ??
    (scv as { value?: () => { lo?: () => unknown; hi?: () => unknown } }).value?.();
  if (!iv) return "0";
  const lo =
    typeof iv.lo === "function"
      ? (iv.lo as () => { toString: () => string })()?.toString()
      : String((iv as { lo?: unknown }).lo ?? 0);
  const hi =
    typeof iv.hi === "function"
      ? (iv.hi as () => { toString: () => string })()?.toString()
      : String((iv as { hi?: unknown }).hi ?? 0);
  if (hi === "0" || hi === "undefined") return lo;
  try {
    return (BigInt(hi) * (1n << 64n) + BigInt(lo)).toString();
  } catch {
    return lo;
  }
}
