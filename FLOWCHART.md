# Stellar DeFi Agent Kit — Flowchart & Progress

High-level plan and current progress for the hackathon agent kit.

---

## 1. Overall architecture (target)

```mermaid
flowchart LR
    subgraph User
        U[User / Chat]
    end

    subgraph Agent Layer["Agent layer (to build)"]
        A[LLM / Orchestrator]
    end

    subgraph Tools["Tools (done)"]
        T1[check_balance]
        T2[swap_asset]
    end

    subgraph Core["Core & DeFi (done)"]
        C[StellarClient]
        D[SoroSwapClient]
    end

    subgraph Config["Config (done)"]
        N[networks]
    end

    subgraph External["External"]
        H[Horizon]
        R[Soroban RPC]
        API[SoroSwap API]
    end

    U --> A
    A --> T1
    A --> T2
    T1 --> C
    T2 --> D
    C --> N
    D --> N
    C --> H
    D --> R
    D --> API
    N --> H
    N --> R
```

---

## 2. Progress: what’s done vs what’s next

```mermaid
flowchart TB
    subgraph Done["✅ Done"]
        D1[config/networks.ts]
        D2[core/stellarClient.ts]
        D3[defi/soroSwapClient.ts]
        D4[tools/agentTools.ts]
        D5[CLI: balance, pay]
    end

    subgraph Next["🔲 To build"]
        N1[Agent/orchestrator loop]
        N2[Wire tools to LLM]
        N3[CLI or chat entrypoint]
        N4[Optional: more tools]
    end

    D1 --> D2
    D1 --> D3
    D2 --> D4
    D3 --> D4
    D4 --> N1
    N1 --> N2
    N2 --> N3
```

---

## 3. check_balance flow (current)

```mermaid
flowchart LR
    A[check_balance tool] --> B[getNetworkConfig]
    B --> C[StellarClient]
    C --> D[Horizon Server]
    D --> E[GET /accounts/:id]
    E --> F[balances array]
    F --> G[return balances]
```

---

## 4. swap_asset flow (current)

```mermaid
flowchart TB
    A[swap_asset tool] --> B{Resolve assets}
    B --> C[XLM / USDC / C...]
    C --> D[toRawAmount]
    D --> E[SoroSwapClient.getQuote]
    E --> F{API key?}
    F -->|Yes| G[API /quote]
    F -->|No| H[Contract simulate]
    G --> I[QuoteResponse]
    H --> I
    I --> J{privateKey?}
    J -->|No| K[return quote only]
    J -->|Yes| L[API /quote/build]
    L --> M[Sign tx]
    M --> N[Soroban RPC sendTransaction]
    N --> O[return txHash + quote]
```

---

## 5. Module dependency map

```mermaid
flowchart TD
    index["index.ts (CLI)"]
    agentTools["tools/agentTools.ts"]
    stellarClient["core/stellarClient.ts"]
    soroSwapClient["defi/soroSwapClient.ts"]
    networks["config/networks.ts"]

    index --> networks
    index --> stellarClient
    agentTools --> networks
    agentTools --> stellarClient
    agentTools --> defi["defi/index.js"]
    stellarClient --> networks
    soroSwapClient --> networks
    defi --> soroSwapClient
```

---

## 6. Legend

| Symbol | Meaning |
|--------|--------|
| ✅ Done | Implemented and in repo |
| 🔲 To build | Planned next steps |
| Agent layer | LLM/orchestrator that chooses and calls tools |
| Tools | LLM-ready functions (name, description, parameters, execute) |

---

## 7. Suggested next steps (order)

1. **Agent loop** — Prompt + LLM call + parse tool choice + call `tools[].execute` with parsed params.
2. **Wire to LLM** — Map `tools` to your provider’s tool format (e.g. OpenAI function calling / structured outputs).
3. **Entrypoint** — CLI command (e.g. `agent "swap 10 XLM to USDC"`) or simple chat server that runs the loop.
4. **Optional** — More tools (e.g. `send_payment` wrapping `StellarClient.sendPayment`), tests, README update for agent usage.
