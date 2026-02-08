/**
 * Stellar DevKit MCP resources – networks, contracts, asset addresses.
 */

export const STELLAR_RESOURCES: Record<string, { content: string; description: string }> = {
  "stellar://networks": {
    description: "Stellar network config (Horizon, Soroban RPC)",
    content: `# Stellar Networks

| Network | Horizon | Soroban RPC |
|---------|---------|-------------|
| testnet | https://horizon-testnet.stellar.org | https://soroban-testnet.stellar.org |
| mainnet | https://horizon.stellar.org | https://soroban-rpc.mainnet.stellar.gateway.fm |
`,
  },
  "stellar://contracts": {
    description: "Protocol contract IDs (SoroSwap aggregator)",
    content: `# Contract Addresses (Soroban)

- SoroSwap Aggregator testnet: CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD
- SoroSwap Aggregator mainnet: CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH
`,
  },
  "stellar://assets": {
    description: "Testnet and mainnet asset identifiers",
    content: `# Token / Asset Addresses

Testnet: XLM (wrapped) CDLZFC3..., USDC CBBHRKEP5...; AUSDC classic GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
Mainnet: XLM CAS3J7GY..., USDC CCW67TSZV3...
`,
  },
};
