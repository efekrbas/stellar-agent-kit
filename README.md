# Stellar Agent Kit

[![npm version](https://img.shields.io/npm/v/stellar-agent-kit.svg)](https://www.npmjs.com/package/stellar-agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**A developer suite for Stellar.** Ship payments, DEX swaps, lending, oracles, and pay-per-request APIs from TypeScript—without hand-wiring every protocol, middleware stack, and editor integration.

This repository is an **npm workspace**: publishable packages live under `packages/`, with reference frontends and demos in `ui`, `sdk-fe`, `onboarding`, and related apps. Use the SDK in your own app, scaffold a new project in one command, or run the full monorepo to develop and test everything together.

---

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Packages](#packages)
- [Command-line interface](#command-line-interface)
- [Documentation](#documentation)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Unified SDK** — One `StellarAgentKit` surface: balances, payments, path payments, account creation, **DEX** quotes and swaps via **SoroSwap**, **Blend** lending (supply / borrow), and **Reflector** oracle prices. Network helpers and curated **mainnet** asset metadata are included; the SDK is configured for **mainnet** and **testnet** endpoints.
- **CLI agent** — Interactive agent loop with tools: balance lookup, swap quote and execution, **create trustline**, send payment, and related Stellar operations. Uses **Groq** by default; set `GROQ_API_KEY` or pass `--api-key`.
- **MCP server** — **`stellar-devkit-mcp`** exposes Stellar DevKit context to **Cursor** and **Claude**: contract IDs, SDK-oriented snippets, and live quotes where applicable.
- **x402 payments** — **`x402-stellar-sdk`** implements **HTTP 402 Payment Required** for Stellar: server middleware for **Next.js**, **Hono**, and **Express**, plus client **`x402Fetch`** with a pluggable **`payWithStellar`** hook.
- **Scaffolder** — **`create-stellar-devkit-app`** generates either an **Agent Kit** (Next.js + swap / DeFi-oriented starter) or an **x402 API** template; copy `.env` examples and run.
- **Reference UI** — The **`ui`** workspace (**Orbit**) is a Next.js app with Swap, Send, Balance, DevKit overview, and in-app documentation—useful as a demo and as a pattern for wallet-connected flows (e.g. **Freighter**).

---

## Installation

### Use the SDK in your project

```bash
npm install stellar-agent-kit
```

**Optional environment variables**

- **DEX:** [SoroSwap API key](https://soroswap.com) (`SOROSWAP_API_KEY`) improves aggregator quotes; simulation or fallback paths may apply when it is unset—see package docs for current behavior.
- **CLI agent:** `GROQ_API_KEY`, or pass `--api-key` when starting the agent.

### Develop from this repository

Clone and install from the **repository root** so workspace dependencies resolve correctly:

```bash
git clone https://github.com/codewmilan/stellar-agent-kit.git
cd stellar-agent-kit
npm install
npm run build
```

The root **`npm run build`** compiles the root TypeScript CLI, the SDK, the x402 package, and other workspaces that define a build script.

---

## Quick start

```ts
import { StellarAgentKit, MAINNET_ASSETS } from "stellar-agent-kit";

const agent = new StellarAgentKit(process.env.SECRET_KEY, "mainnet");
await agent.initialize();

// Get a swap quote (10 XLM → USDC); XLM uses 7 decimal places
const quote = await agent.dexGetQuote(
  { contractId: MAINNET_ASSETS.XLM.contractId },
  { contractId: MAINNET_ASSETS.USDC.contractId },
  "100000000"
);
const result = await agent.dexSwap(quote);
console.log(result.hash);
```

You can also use the **repository CLI** (after `npm run build`): **`balance`**, **`pay`**, and an interactive **`agent`** that accepts natural language (for example: “What’s the balance of G…?” or “Get a quote to swap 10 XLM to USDC”).

---

## Packages

| Package | Description |
|--------|-------------|
| [**stellar-agent-kit**](https://www.npmjs.com/package/stellar-agent-kit) | Unified TypeScript SDK: payments, DEX, lending, oracles, network configuration, and asset helpers. |
| [**x402-stellar-sdk**](https://www.npmjs.com/package/x402-stellar-sdk) | HTTP **402** middleware and **`x402Fetch`** client—monetize HTTP APIs with on-chain Stellar payment verification. |
| [**create-stellar-devkit-app**](https://www.npmjs.com/package/create-stellar-devkit-app) | Interactive or flag-driven scaffolder for **Agent Kit** or **x402 API** projects. |
| [**stellar-devkit-mcp**](https://www.npmjs.com/package/stellar-devkit-mcp) | **MCP** server for AI IDEs: DevKit documentation, addresses, snippets, and quote-oriented tooling. |

---

## Command-line interface

The **balance**, **pay**, and **agent** commands are implemented in this repo’s root **`src/`** and emitted to **`dist/`** when you run **`npm run build`** (or **`npm run build:root`**).

| Command | Example |
|--------|--------|
| **Balance** | `node dist/index.js balance GABC... [--network=mainnet]` |
| **Pay** | `node dist/index.js pay S... G... 10 [--network=mainnet]` |
| **Agent** | `node dist/index.js agent` (set `GROQ_API_KEY` or use `--api-key`) |

**Balance** prints a JSON array of `{ code, issuer, balance }` entries. **Agent** runs an interactive loop; type **`exit`** to quit.

> **Note:** The published **`stellar-agent-kit`** npm package is the **library** (no `bin` entry). Global **`npx stellar-agent-kit …`**-style usage applies to **`create-stellar-devkit-app`** and **`stellar-devkit-mcp`**, not to the core SDK package.

---

## Documentation

- **[FLOWCHART.md](FLOWCHART.md)** — Architecture, component relationships, and typical flows.
- **[docs/REFERENCE_MANTLE_DEVKIT.md](docs/REFERENCE_MANTLE_DEVKIT.md)** — Package layout and API alignment with the Mantle DevKit reference.
- **In-app docs** — From the repo root, run **`npm run dev:ui`** and open **`/docs`** for the full guide (quick start, SDK, x402, MCP, CLI, scaffolding).

---

## Requirements

- **Node.js** ≥ 18  
- **Agent CLI:** `GROQ_API_KEY` (or `--api-key`)  
- **DEX (optional):** SoroSwap API key for aggregator usage; alternative paths apply when it is omitted  

---

## Contributing

Contributions are welcome. Open an issue or a pull request; for larger changes, please discuss in an issue first.

---

## License

[MIT](LICENSE)
