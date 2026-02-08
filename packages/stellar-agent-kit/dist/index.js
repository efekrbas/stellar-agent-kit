// src/agent.ts
import { Keypair as Keypair2, Asset, TransactionBuilder as TransactionBuilder2, Operation, Networks as Networks2, Horizon } from "@stellar/stellar-sdk";

// src/config/networks.ts
import { z } from "zod";
var NetworkConfigSchema = z.object({
  horizonUrl: z.string().url(),
  sorobanRpcUrl: z.string().url(),
  friendbotUrl: z.string().url().optional()
});
var testnet = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org"
};
var mainnet = {
  horizonUrl: "https://horizon.stellar.org",
  sorobanRpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm"
};
var networks = { testnet, mainnet };
function getNetworkConfig(name) {
  const parsed = z.enum(["testnet", "mainnet"]).safeParse(name);
  if (!parsed.success) throw new Error(`Invalid network: ${name}. Use "testnet" or "mainnet".`);
  return networks[parsed.data];
}

// src/dex/soroSwap.ts
import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";
var SOROSWAP_API_BASE = "https://api.soroswap.finance";
function assetToApiString(asset) {
  if (asset.contractId) return asset.contractId;
  if (asset.code && asset.issuer) return `${asset.code}:${asset.issuer}`;
  throw new Error("Asset must have contractId or code+issuer");
}
function parseApiQuote(data) {
  const o = data;
  return {
    expectedIn: String(o?.expectedIn ?? o?.amountIn ?? "0"),
    expectedOut: String(o?.expectedOut ?? o?.amountOut ?? "0"),
    minOut: String(o?.minOut ?? o?.minimumAmountOut ?? o?.expectedOut ?? "0"),
    route: Array.isArray(o?.route) ? o.route : Array.isArray(o?.path) ? o.path : [],
    rawData: data
  };
}
function createSoroSwapDexClient(networkConfig, apiKey) {
  const networkName = networkConfig.horizonUrl.includes("testnet") ? "testnet" : "mainnet";
  const key = apiKey ?? process.env.SOROSWAP_API_KEY;
  async function getQuote(from, to, amount) {
    const url = `${SOROSWAP_API_BASE}/quote?network=${networkName}`;
    const body = {
      assetIn: assetToApiString(from),
      assetOut: assetToApiString(to),
      amount: String(amount).trim(),
      tradeType: "EXACT_IN",
      protocols: ["soroswap", "phoenix", "aqua"]
    };
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = `Bearer ${key}`;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SoroSwap quote failed ${res.status}: ${text}`);
    }
    return parseApiQuote(await res.json());
  }
  async function executeSwap(secretKey, quote) {
    if (!key) throw new Error("executeSwap requires SOROSWAP_API_KEY");
    const keypair = Keypair.fromSecret(secretKey.trim());
    const fromAddress = keypair.publicKey();
    const buildUrl = `${SOROSWAP_API_BASE}/quote/build?network=${networkName}`;
    const buildRes = await fetch(buildUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ quote: quote.rawData ?? quote, from: fromAddress, to: fromAddress })
    });
    if (!buildRes.ok) throw new Error(`SoroSwap build failed ${buildRes.status}: ${await buildRes.text()}`);
    const buildData = await buildRes.json();
    const xdrBase64 = buildData?.xdr;
    if (!xdrBase64 || typeof xdrBase64 !== "string") throw new Error("SoroSwap build response missing xdr");
    const config = getNetworkConfig(networkName);
    const networkPassphrase = config.horizonUrl.includes("testnet") ? Networks.TESTNET : Networks.PUBLIC;
    const tx = TransactionBuilder.fromXDR(xdrBase64, networkPassphrase);
    tx.sign(keypair);
    const server = new rpc.Server(config.sorobanRpcUrl, { allowHttp: config.sorobanRpcUrl.startsWith("http:") });
    const sendResult = await server.sendTransaction(tx);
    if (sendResult.errorResult) throw new Error(`Soroban sendTransaction failed: ${String(sendResult.errorResult)}`);
    return { hash: sendResult.hash, status: sendResult.status ?? "PENDING" };
  }
  return { getQuote, executeSwap };
}

// src/dex/index.ts
function createDexClient(networkConfig, apiKey) {
  return createSoroSwapDexClient(networkConfig, apiKey);
}

// src/agent.ts
var StellarAgentKit = class {
  keypair;
  network;
  config;
  _initialized = false;
  _dex = null;
  _horizon = null;
  constructor(secretKey, network) {
    this.keypair = Keypair2.fromSecret(secretKey.trim());
    this.network = network;
    this.config = getNetworkConfig(network);
  }
  /**
   * Initialize clients (Horizon, Soroban RPC, protocol wrappers).
   * Call after construction before using protocol methods.
   */
  async initialize() {
    this._horizon = new Horizon.Server(this.config.horizonUrl);
    this._dex = createDexClient(this.config, process.env.SOROSWAP_API_KEY);
    this._initialized = true;
    return this;
  }
  ensureInitialized() {
    if (!this._initialized || !this._dex) {
      throw new Error("StellarAgentKit not initialized. Call await agent.initialize() first.");
    }
  }
  // ─── DEX Operations (mirror Mantle agniSwap / executeSwap) ─────────────────
  /**
   * Get a swap quote (exact-in). Uses SoroSwap aggregator (SoroSwap, Phoenix, Aqua).
   */
  async dexGetQuote(fromAsset, toAsset, amount) {
    this.ensureInitialized();
    return this._dex.getQuote(fromAsset, toAsset, amount);
  }
  /**
   * Execute a swap using a prior quote.
   */
  async dexSwap(quote) {
    this.ensureInitialized();
    return this._dex.executeSwap(this.keypair.secret(), quote);
  }
  /**
   * One-shot: get quote and execute swap (convenience).
   */
  async dexSwapExactIn(fromAsset, toAsset, amount) {
    const quote = await this.dexGetQuote(fromAsset, toAsset, amount);
    return this.dexSwap(quote);
  }
  // ─── Payments (Horizon) ────────────────────────────────────────────────────
  /**
   * Send a native or custom-asset payment (Horizon).
   * @param to - Destination account (G...)
   * @param amount - Amount in display units (e.g. "10" for 10 XLM)
   * @param assetCode - Optional; omit for native XLM
   * @param assetIssuer - Optional; required if assetCode is set
   */
  async sendPayment(to, amount, assetCode, assetIssuer) {
    this.ensureInitialized();
    if (!this._horizon) throw new Error("Horizon not initialized");
    const networkPassphrase = this.network === "testnet" ? Networks2.TESTNET : Networks2.PUBLIC;
    const sourceAccount = await this._horizon.loadAccount(this.keypair.publicKey());
    const asset = assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native();
    const tx = new TransactionBuilder2(sourceAccount, {
      fee: "100",
      networkPassphrase
    }).addOperation(Operation.payment({ destination: to, asset, amount })).setTimeout(180).build();
    tx.sign(this.keypair);
    const result = await this._horizon.submitTransaction(tx);
    return { hash: result.hash };
  }
  // ─── Placeholders for lending / oracle / cross-chain (plug later) ────────────
  // async lendingSupply(asset: DexAsset, amount: string): Promise<{ hash: string }> { ... }
  // async lendingBorrow(asset: DexAsset, amount: string): Promise<{ hash: string }> { ... }
  // async getPrice(assetOrFeedId: string): Promise<{ price: string }> { ... }
  // async crossChainSwap(...): Promise<SwapResult> { ... }
};

// src/config/assets.ts
var TESTNET_ASSETS = {
  XLM: { contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" },
  USDC: { contractId: "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM" },
  /** Classic testnet USDC */
  AUSDC: { code: "AUSDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" }
};
var MAINNET_ASSETS = {
  XLM: { contractId: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA" },
  USDC: { contractId: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75" }
};
var SOROSWAP_AGGREGATOR = {
  testnet: "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD",
  mainnet: "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH"
};
export {
  MAINNET_ASSETS,
  SOROSWAP_AGGREGATOR,
  StellarAgentKit,
  TESTNET_ASSETS,
  createDexClient,
  getNetworkConfig,
  networks
};
//# sourceMappingURL=index.js.map