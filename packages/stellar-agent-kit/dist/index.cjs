"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MAINNET_ASSETS: () => MAINNET_ASSETS,
  SOROSWAP_AGGREGATOR: () => SOROSWAP_AGGREGATOR,
  StellarAgentKit: () => StellarAgentKit,
  TESTNET_ASSETS: () => TESTNET_ASSETS,
  createDexClient: () => createDexClient,
  getNetworkConfig: () => getNetworkConfig,
  networks: () => networks
});
module.exports = __toCommonJS(index_exports);

// src/agent.ts
var import_stellar_sdk3 = require("@stellar/stellar-sdk");

// src/config/networks.ts
var import_zod = require("zod");
var NetworkConfigSchema = import_zod.z.object({
  horizonUrl: import_zod.z.string().url(),
  sorobanRpcUrl: import_zod.z.string().url(),
  friendbotUrl: import_zod.z.string().url().optional()
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
  const parsed = import_zod.z.enum(["testnet", "mainnet"]).safeParse(name);
  if (!parsed.success) throw new Error(`Invalid network: ${name}. Use "testnet" or "mainnet".`);
  return networks[parsed.data];
}

// src/dex/soroSwap.ts
var import_stellar_sdk = require("@stellar/stellar-sdk");
var import_stellar_sdk2 = require("@stellar/stellar-sdk");
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
    const keypair = import_stellar_sdk.Keypair.fromSecret(secretKey.trim());
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
    const networkPassphrase = config.horizonUrl.includes("testnet") ? import_stellar_sdk.Networks.TESTNET : import_stellar_sdk.Networks.PUBLIC;
    const tx = import_stellar_sdk.TransactionBuilder.fromXDR(xdrBase64, networkPassphrase);
    tx.sign(keypair);
    const server = new import_stellar_sdk2.rpc.Server(config.sorobanRpcUrl, { allowHttp: config.sorobanRpcUrl.startsWith("http:") });
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
    this.keypair = import_stellar_sdk3.Keypair.fromSecret(secretKey.trim());
    this.network = network;
    this.config = getNetworkConfig(network);
  }
  /**
   * Initialize clients (Horizon, Soroban RPC, protocol wrappers).
   * Call after construction before using protocol methods.
   */
  async initialize() {
    this._horizon = new import_stellar_sdk3.Horizon.Server(this.config.horizonUrl);
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
    const networkPassphrase = this.network === "testnet" ? import_stellar_sdk3.Networks.TESTNET : import_stellar_sdk3.Networks.PUBLIC;
    const sourceAccount = await this._horizon.loadAccount(this.keypair.publicKey());
    const asset = assetCode && assetIssuer ? new import_stellar_sdk3.Asset(assetCode, assetIssuer) : import_stellar_sdk3.Asset.native();
    const tx = new import_stellar_sdk3.TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase
    }).addOperation(import_stellar_sdk3.Operation.payment({ destination: to, asset, amount })).setTimeout(180).build();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MAINNET_ASSETS,
  SOROSWAP_AGGREGATOR,
  StellarAgentKit,
  TESTNET_ASSETS,
  createDexClient,
  getNetworkConfig,
  networks
});
//# sourceMappingURL=index.cjs.map