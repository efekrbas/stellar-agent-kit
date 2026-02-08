"use client"

import { useState } from "react"
import { ExternalLink, Copy, Check, ChevronDown, ChevronUp, Code } from "lucide-react"
import { Navbar } from "@/components/navbar"

const PROTOCOLS = [
  {
    name: "Soroswap",
    description:
      "First DEX and exchange aggregator on Stellar. AMM with liquidity pools and multi-protocol swap aggregation for optimal routing.",
    category: "DEX / AMM / Aggregator",
    url: "https://soroswap.finance",
    codeSnippet: `import { StellarAgentKit, MAINNET_ASSETS } from "stellar-agent-kit";

const agent = new StellarAgentKit(process.env.SECRET_KEY!, "mainnet");
await agent.initialize();

const quote = await agent.dexGetQuote(
  { contractId: MAINNET_ASSETS.XLM.contractId },
  { contractId: MAINNET_ASSETS.USDC.contractId },
  "10000000" // 1 XLM in stroops
);
const result = await agent.dexSwap(quote);
console.log("Swap tx hash:", result.hash);`,
  },
  {
    name: "Phoenix",
    description:
      "DeFi hub on Soroban. DEX with liquidity pools, token swaps, asset tracking, and low fees powered by Stellar.",
    category: "DEX / AMM",
    url: "https://www.phoenix-hub.io",
    codeSnippet: `// Phoenix liquidity is routed via Soroswap aggregator.
import { StellarAgentKit, MAINNET_ASSETS } from "stellar-agent-kit";

const agent = new StellarAgentKit(process.env.SECRET_KEY!, "mainnet");
await agent.initialize();

const quote = await agent.dexGetQuote(
  { contractId: MAINNET_ASSETS.XLM.contractId },
  { contractId: MAINNET_ASSETS.USDC.contractId },
  "10000000"
);
const result = await agent.dexSwap(quote);
console.log("Swap tx hash:", result.hash);`,
  },
  {
    name: "Aqua (Aquarius)",
    description:
      "Community-driven AMM with liquidity incentives and AQUA governance for directing rewards to markets.",
    category: "AMM / Governance",
    url: "https://aqua.network",
    codeSnippet: `// Aqua AMM – direct integration (npm install @stellar/stellar-sdk)
import * as StellarSdk from "@stellar/stellar-sdk";
const AQUA_ROUTER_ID = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";
const AQUA_AMM_API = "https://amm-api.aqua.network/api/external/v1";
const keypair = StellarSdk.Keypair.fromSecret(process.env.SECRET_KEY);
const res = await fetch(\`\${AQUA_AMM_API}/find-path/\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token_in_address: "...", token_out_address: "...", amount: "10000000" }),
});
const data = await res.json();
// Build and submit swap_chained tx via Soroban + Horizon.`,
  },
  {
    name: "SDEX",
    description:
      "Stellar Decentralized Exchange — native order book and path payments on the Stellar network.",
    category: "DEX / Order book",
    url: "https://stellar.org/learn/sdex",
    codeSnippet: `import * as StellarSdk from "@stellar/stellar-sdk";
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");
const keypair = StellarSdk.Keypair.fromSecret(process.env.SECRET_KEY!);
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const sourceAccount = await server.loadAccount(keypair.publicKey());
const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.PUBLIC,
})
  .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
    sendAsset: StellarSdk.Asset.native(),
    sendAmount: "1",
    destination: "GDEST...",
    destAsset: new StellarSdk.Asset("USDC", USDC_ISSUER),
    destMin: "0.99",
    path: [],
  }))
  .setTimeout(180)
  .build();
tx.sign(keypair);
await server.submitTransaction(tx);`,
  },
  {
    name: "StellarX",
    description:
      "Decentralized trading platform for Stellar assets with a simple interface for swaps and liquidity.",
    category: "DEX",
    url: "https://stellarx.com",
    codeSnippet: `import * as StellarSdk from "@stellar/stellar-sdk";
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");
const paths = await server.strictSendPaths(
  StellarSdk.Asset.native(),
  "10",
  [new StellarSdk.Asset("USDC", USDC_ISSUER)]
).call();
const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.PUBLIC,
})
  .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
    sendAsset: StellarSdk.Asset.native(),
    sendAmount: "10",
    destination: destPublicKey,
    destAsset: new StellarSdk.Asset("USDC", USDC_ISSUER),
    destMin: "9.5",
    path: paths.records[0]?.path ?? [],
  }))
  .setTimeout(180)
  .build();
tx.sign(keypair);
await server.submitTransaction(tx);`,
  },
]

function ProtocolCodeBlock({ code, protocolName }: { code: string; protocolName: string }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-5 py-4 text-left text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Code className="h-4 w-4 shrink-0" />
          Code example — {protocolName}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>
      {expanded && (
        <div className="relative border-t border-zinc-800">
          <pre className="p-5 text-xs text-zinc-400 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed [word-break:break-word]">
            <code>{code}</code>
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProtocolsPage() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Navbar />

      <section className="relative z-20 py-16 md:py-24">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8 lg:px-12">
          <header className="mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-balance tracking-tight">
              Stellar DeFi protocols
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
              DEXs, AMMs, and aggregators on Soroban and the Stellar network. Use StellarAgentKit for SoroSwap and Phoenix; reference examples for Aqua, SDEX, and StellarX.
            </p>
          </header>

          <ul className="flex flex-col gap-12">
            {PROTOCOLS.map((proto) => (
              <li
                key={proto.name}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-8 md:p-10 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">{proto.name}</h2>
                    <span className="mt-1 inline-block text-xs text-zinc-500">{proto.category}</span>
                  </div>
                  <a
                    href={proto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 hover:border-zinc-600 transition-colors"
                    aria-label={`Open ${proto.name}`}
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-zinc-400 text-base leading-relaxed max-w-3xl">
                  {proto.description}
                </p>
                <ProtocolCodeBlock code={proto.codeSnippet} protocolName={proto.name} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
