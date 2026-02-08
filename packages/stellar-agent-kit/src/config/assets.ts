/**
 * Stellar asset identifiers and contract addresses.
 * Centralized for mainnet/testnet (mirrors Mantle DevKit "Token Addresses").
 */

export type StellarAsset = { code: string; issuer: string } | { contractId: string };

export const TESTNET_ASSETS = {
  XLM: { contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" },
  USDC: { contractId: "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM" },
  /** Classic testnet USDC */
  AUSDC: { code: "AUSDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
} as const;

export const MAINNET_ASSETS = {
  XLM: { contractId: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA" },
  USDC: { contractId: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75" },
} as const;

export const SOROSWAP_AGGREGATOR = {
  testnet: "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD",
  mainnet: "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH",
} as const;
