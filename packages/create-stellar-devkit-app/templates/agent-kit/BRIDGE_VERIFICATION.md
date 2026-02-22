# Bridge flow verification checklist

Use this when testing the Allbridge bridge with real USDC.

## API routes (same as main app)

- **Build** (`/api/bridge/build`): Validates all fields, Ethereum destination format (0x + 40 hex), amount &gt; 0, Stellar-only source. Returns XDR from Allbridge SDK. Fee-insufficient error returns a clear message.
- **Submit** (`/api/bridge/submit`): Submits signed XDR via `sdk.utils.srb.sendTransactionSoroban()`, returns hash.
- **Info** (`/api/bridge/info`): Returns chains and tokens from Allbridge SDK.

## Bridge UI (BridgeInterface)

- Client-side: amount ≥ 4 for Stellar → Ethereum with USDC/USDT; Ethereum address format check.
- After build: validates `xdr` exists before signing.
- After submit: validates `hash` exists before showing success.
- Build/submit errors parsed from JSON for clear messages.

## Safe to test

- Use at least ~4 USDC for Stellar → Ethereum. Confirm amount and destination in Freighter before signing.
