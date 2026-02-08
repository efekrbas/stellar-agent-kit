#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// src/resources/stellar.ts
var STELLAR_RESOURCES = {
  "stellar://networks": {
    description: "Stellar network config (Horizon, Soroban RPC)",
    content: `# Stellar Networks

| Network | Horizon | Soroban RPC |
|---------|---------|-------------|
| testnet | https://horizon-testnet.stellar.org | https://soroban-testnet.stellar.org |
| mainnet | https://horizon.stellar.org | https://soroban-rpc.mainnet.stellar.gateway.fm |
`
  },
  "stellar://contracts": {
    description: "Protocol contract IDs (SoroSwap aggregator)",
    content: `# Contract Addresses (Soroban)

- SoroSwap Aggregator testnet: CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD
- SoroSwap Aggregator mainnet: CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH
`
  },
  "stellar://assets": {
    description: "Testnet and mainnet asset identifiers",
    content: `# Token / Asset Addresses

Testnet: XLM (wrapped) CDLZFC3..., USDC CBBHRKEP5...; AUSDC classic GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
Mainnet: XLM CAS3J7GY..., USDC CCW67TSZV3...
`
  }
};

// src/index.ts
var server = new Server(
  { name: "stellar-devkit-mcp", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: Object.entries(STELLAR_RESOURCES).map(([uri, info]) => ({
    uri,
    name: uri.replace("stellar://", ""),
    description: info.description,
    mimeType: "text/markdown"
  }))
}));
server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const r = STELLAR_RESOURCES[req.params.uri];
  if (!r) throw new Error(`Resource not found: ${req.params.uri}`);
  return { contents: [{ uri: req.params.uri, mimeType: "text/markdown", text: r.content }] };
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_stellar_contract",
      description: "Use this tool when the user asks for a Stellar/Soroban contract ID, contract address, or protocol address (e.g. SoroSwap mainnet or testnet). Returns the Soroban contract ID for the given protocol and network. Call with protocol (e.g. 'soroswap') and optional network ('mainnet' or 'testnet', default testnet).",
      inputSchema: {
        type: "object",
        properties: {
          protocol: { type: "string", description: "Protocol name, e.g. soroswap" },
          network: { type: "string", enum: ["testnet", "mainnet"], description: "Network; default testnet" }
        },
        required: ["protocol"]
      }
    },
    {
      name: "get_sdk_snippet",
      description: "Use this tool when the user asks for Stellar DevKit code, SDK snippet, or example (swap, quote, x402 server/client). Returns copy-paste code for stellar-agent-kit or x402-stellar-sdk. Call with operation: 'swap' | 'quote' | 'x402-server' | 'x402-client'.",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string", enum: ["swap", "quote", "x402-server", "x402-client"], description: "Which snippet to return" }
        },
        required: ["operation"]
      }
    }
  ]
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  if (name === "get_stellar_contract") {
    const protocol = args?.protocol?.toLowerCase() || "";
    const network = (args?.network || "testnet").toLowerCase();
    const ids = protocol === "soroswap" ? { testnet: "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD", mainnet: "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH" } : null;
    const text = ids ? `${protocol} ${network}: ${ids[network]}` : `Unknown protocol: ${protocol}`;
    return { content: [{ type: "text", text }] };
  }
  if (name === "get_sdk_snippet") {
    const op = args?.operation?.toLowerCase() || "";
    const snippets = {
      swap: "const agent = new StellarAgentKit(secretKey, 'testnet'); await agent.initialize(); const quote = await agent.dexGetQuote(fromAsset, toAsset, amount); await agent.dexSwap(quote);",
      quote: "await agent.dexGetQuote({ contractId: '...' }, { contractId: '...' }, amount);",
      "x402-server": "app.use('/api/premium', x402({ price: '1', assetCode: 'XLM', network: 'testnet', destination: 'G...' }));",
      "x402-client": "await x402Fetch(url, init, { payWithStellar: async (req) => { /* Freighter payment */ return { transactionHash: txHash }; } });"
    };
    const text = snippets[op] || `Unknown operation: ${op}. Use: ${Object.keys(snippets).join(", ")}`;
    return { content: [{ type: "text", text }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stellar DevKit MCP running on stdio");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
