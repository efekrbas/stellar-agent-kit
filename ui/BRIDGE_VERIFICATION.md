# Bridge flow verification checklist

Use this when testing the Allbridge bridge with real USDC to ensure nothing is wrong on our side.

## What was audited (our code)

### 1. Build route (`/api/bridge/build`)
- [x] All required fields validated (fromChain, toChain, asset, amount, fromAddress, toAddress)
- [x] Source ≠ destination chain
- [x] Chains and tokens resolved from Allbridge SDK only (no hardcoded addresses)
- [x] Amount must be a positive number
- [x] **Ethereum destination**: address must be `0x` + 40 hex chars (server-side)
- [x] Only Stellar (SRB) allowed as source (sign-in-browser flow)
- [x] SendParams use request body as-is: `fromAccountAddress` = user wallet, `toAccountAddress` = user-entered destination
- [x] Returns only the XDR from `sdk.bridge.rawTxBuilder.send()` (no modification)
- [x] Fee-insufficient error mapped to a clear user message

### 2. Submit route (`/api/bridge/submit`)
- [x] Accepts only `signedXdr` (the signed transaction from Freighter)
- [x] Submits via `sdk.utils.srb.sendTransactionSoroban(signedXdr)` (official Allbridge/Soroban API)
- [x] Returns `hash` from the SDK response; 500 if hash missing
- [x] No alteration of the signed XDR

### 3. UI (`AllbridgeInterface`)
- [x] Sends build: `fromChain.id`, `toChain.id`, `asset`, `amount`, `fromAddress: publicKey`, `toAddress`
- [x] **Client-side**: Stellar → Ethereum with USDC/USDT requires amount ≥ 4 (avoids fee error)
- [x] **Client-side**: Ethereum destination must match `0x` + 40 hex (format check)
- [x] After build: checks `data.xdr` is a non-empty string before signing (no sign with invalid/missing XDR)
- [x] Passes build XDR to `signTransaction(xdr, { networkPassphrase, address })` (AccountProvider uses `address`)
- [x] Sends only `signedXdr` to submit (no extra or modified payload)
- [x] After submit: checks `hash` is present before marking success and adding to history
- [x] Build and submit errors parsed from JSON so user sees `error` message, not raw body

### 4. AccountProvider (signing)
- [x] Uses Freighter option `address` (not `accountToSign`) per docs
- [x] Returns signed XDR only when Freighter returns it; throws on `result.error` or missing signed XDR

## Data flow (no substitution of your funds)

1. **Build**: Your wallet address (`publicKey`) and your entered amount/destination go to the API. The SDK builds one transaction: “move this amount from your Stellar account to the bridge, destination = your entered address.” No address or amount is swapped.
2. **Sign**: Freighter shows you that transaction; you approve. The returned signed XDR is that same transaction, signed.
3. **Submit**: We send that signed XDR to the network as-is. We do not modify or re-use it.

## Safe to test with real USDC

- Validations and checks above are in place so we never build/submit with wrong amount or destination format, and we never mark success without a hash.
- **You still must**: confirm amount and destination in the Freighter popup before signing, and use an amount ≥ ~4 USDC for Stellar → Ethereum so the fee is covered.

## When you test

1. Use a **small amount** first (e.g. 4–5 USDC).
2. Use the **correct Ethereum address** (0x + 40 hex) for the destination.
3. In Freighter, **verify** amount, asset, and destination before approving.
4. After submit, open the returned link (Stellar explorer) and confirm the transaction and status.

If anything doesn’t match what you entered (amount, destination, or chain), do not sign and report the issue.
