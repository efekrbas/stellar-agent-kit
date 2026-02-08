import { Keypair } from '@stellar/stellar-sdk';
import { z } from 'zod';

declare const NetworkConfigSchema: z.ZodObject<{
    horizonUrl: z.ZodString;
    sorobanRpcUrl: z.ZodString;
    friendbotUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    horizonUrl: string;
    sorobanRpcUrl: string;
    friendbotUrl?: string | undefined;
}, {
    horizonUrl: string;
    sorobanRpcUrl: string;
    friendbotUrl?: string | undefined;
}>;
type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
declare const networks: {
    readonly testnet: {
        horizonUrl: string;
        sorobanRpcUrl: string;
        friendbotUrl?: string | undefined;
    };
    readonly mainnet: {
        horizonUrl: string;
        sorobanRpcUrl: string;
        friendbotUrl?: string | undefined;
    };
};
type NetworkName = keyof typeof networks;
declare function getNetworkConfig(name: string): NetworkConfig;

/**
 * DEX / swap types (Stellar: asset = code+issuer or contractId).
 */
interface DexAsset {
    contractId?: string;
    code?: string;
    issuer?: string;
}
interface QuoteResult {
    expectedIn: string;
    expectedOut: string;
    minOut: string;
    route: string[];
    rawData?: unknown;
}
interface SwapResult {
    hash: string;
    status: string;
}

/**
 * DEX module – swap, quote, aggregator (SoroSwap).
 * Pluggable: add more DEXes by implementing DexClient.
 */

interface DexClient {
    getQuote(fromAsset: DexAsset, toAsset: DexAsset, amount: string): Promise<QuoteResult>;
    executeSwap(secretKey: string, quote: QuoteResult): Promise<SwapResult>;
}
/**
 * Build a DEX client for the given network (SoroSwap aggregator).
 */
declare function createDexClient(networkConfig: NetworkConfig, apiKey?: string): DexClient;

/**
 * StellarAgentKit – unified DeFi agent (MNTAgentKit-style API for Stellar).
 * Constructor(secretKey, network) + initialize() then protocol methods.
 */

type StellarNetwork = "mainnet" | "testnet";
declare class StellarAgentKit {
    readonly keypair: Keypair;
    readonly network: StellarNetwork;
    readonly config: NetworkConfig;
    private _initialized;
    private _dex;
    private _horizon;
    constructor(secretKey: string, network: StellarNetwork);
    /**
     * Initialize clients (Horizon, Soroban RPC, protocol wrappers).
     * Call after construction before using protocol methods.
     */
    initialize(): Promise<this>;
    private ensureInitialized;
    /**
     * Get a swap quote (exact-in). Uses SoroSwap aggregator (SoroSwap, Phoenix, Aqua).
     */
    dexGetQuote(fromAsset: DexAsset, toAsset: DexAsset, amount: string): Promise<QuoteResult>;
    /**
     * Execute a swap using a prior quote.
     */
    dexSwap(quote: QuoteResult): Promise<SwapResult>;
    /**
     * One-shot: get quote and execute swap (convenience).
     */
    dexSwapExactIn(fromAsset: DexAsset, toAsset: DexAsset, amount: string): Promise<SwapResult>;
    /**
     * Send a native or custom-asset payment (Horizon).
     * @param to - Destination account (G...)
     * @param amount - Amount in display units (e.g. "10" for 10 XLM)
     * @param assetCode - Optional; omit for native XLM
     * @param assetIssuer - Optional; required if assetCode is set
     */
    sendPayment(to: string, amount: string, assetCode?: string, assetIssuer?: string): Promise<{
        hash: string;
    }>;
}

/**
 * Stellar asset identifiers and contract addresses.
 * Centralized for mainnet/testnet (mirrors Mantle DevKit "Token Addresses").
 */
type StellarAsset = {
    code: string;
    issuer: string;
} | {
    contractId: string;
};
declare const TESTNET_ASSETS: {
    readonly XLM: {
        readonly contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
    };
    readonly USDC: {
        readonly contractId: "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM";
    };
    /** Classic testnet USDC */
    readonly AUSDC: {
        readonly code: "AUSDC";
        readonly issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
    };
};
declare const MAINNET_ASSETS: {
    readonly XLM: {
        readonly contractId: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
    };
    readonly USDC: {
        readonly contractId: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
    };
};
declare const SOROSWAP_AGGREGATOR: {
    readonly testnet: "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD";
    readonly mainnet: "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";
};

export { type DexAsset, type DexClient, MAINNET_ASSETS, type NetworkConfig, type NetworkName, type QuoteResult, SOROSWAP_AGGREGATOR, StellarAgentKit, type StellarAsset, type StellarNetwork, type SwapResult, TESTNET_ASSETS, createDexClient, getNetworkConfig, networks };
