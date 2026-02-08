# Warly — Stellar DevKit UI (Option 1)

Landing, Swap, DevKit, and Protocols. Uses the SDK via `lib/agent-kit` and Freighter for wallet/signing.

## Get the SDK working (Option 1)

1. **From repo root** (installs all workspaces including ui):
   ```bash
   npm install
   npm run dev:ui
   ```
   Or from this folder:
   ```bash
   cd ui
   npm install
   npm run dev
   ```

2. **Env** — Copy env and set your key:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set `SOROSWAP_API_KEY=sk_...` (get from SoroSwap).  
   Without it, **quote** still works; **Swap** (build + submit) will fail until the key is set.

3. **Wallet** — Install [Freighter](https://www.freighter.app/) in the browser, then open http://localhost:3000 → Connect Wallet → Swap.

4. **Test** — On the Swap page: pick XLM → USDC (or vice versa), enter amount, click Swap. You should get a quote; with `SOROSWAP_API_KEY` set, build and sign with Freighter, then submit.

## Pages

- **/** — Landing
- **/swap** — Swap (quote + build + sign with Freighter + submit)
- **/devkit** — Packages, networks, code snippets
- **/protocols** — Stellar DeFi protocols and code per protocol
