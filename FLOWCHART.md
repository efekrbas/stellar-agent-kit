# Architecture and flows

This document is a high-level map of the **Stellar Agent Kit** monorepo. For package-by-package alignment with the Mantle DevKit reference, see [docs/REFERENCE_MANTLE_DEVKIT.md](docs/REFERENCE_MANTLE_DEVKIT.md).

## System overview

```text
Applications (ui, sdk-fe, onboarding, …)
        │
        ▼
stellar-agent-kit (SDK) ◄── Horizon / Soroban / protocols (SoroSwap, Blend, Reflector, …)
        │
        ├── x402-stellar-sdk — 402 responses, payment verification, x402Fetch client
        ├── stellar-devkit-mcp — MCP tools for editors (docs, addresses, quotes)
        └── create-stellar-devkit-app — templates (Agent Kit app, x402 API)

Repository CLI (root `src/`) — balance, pay, interactive agent (Groq + tools)
```

## Typical flows

- **App / script** — Import `StellarAgentKit`, call `initialize()`, then payments, DEX, lending, or oracle methods.
- **Monetized API** — Server attaches x402 middleware; client uses `x402Fetch` and `payWithStellar` to pay and retry with `X-402-Transaction-Hash`.
- **AI-assisted dev** — Run `stellar-devkit-mcp` in Cursor or Claude to pull contract context and snippets without leaving the editor.
- **Greenfield project** — Run `create-stellar-devkit-app`, choose Agent Kit or x402 API, configure `.env`, and start building.

## Progress and testing

Track integration coverage, manual test passes, and release notes in your team’s usual place (issues, changelog, or PR descriptions). This file stays intentionally short so it does not duplicate the npm README or in-app `/docs`.
