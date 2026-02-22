import { NextRequest, NextResponse } from "next/server"
import {
  AllbridgeCoreSdk,
  nodeRpcUrlsDefault,
  ChainSymbol,
  Messenger,
  AmountFormat,
  FeePaymentMethod,
  type SendParams,
} from "@allbridge/bridge-core-sdk"

const CHAIN_ID_TO_SYMBOL: Record<string, string> = {
  stellar: "SRB",
  srb: "SRB",
  ethereum: "ETH",
  eth: "ETH",
  bsc: "BSC",
  polygon: "POL",
  pol: "POL",
  avalanche: "AVA",
  ava: "AVA",
  solana: "SOL",
  sol: "SOL",
  tron: "TRX",
  trx: "TRX",
  arbitrum: "ARB",
  arb: "ARB",
  base: "BAS",
  bas: "BAS",
  celo: "CEL",
  cel: "CEL",
  optimism: "OPT",
  opt: "OPT",
  sui: "SUI",
  linea: "LIN",
  lin: "LIN",
}

function toChainSymbol(chainId: string): string {
  const key = String(chainId || "").toLowerCase().trim()
  return CHAIN_ID_TO_SYMBOL[key] || key.toUpperCase().slice(0, 3)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromChain, toChain, asset, amount, fromAddress, toAddress } = body

    if (!fromChain || !toChain || !asset || !amount || !fromAddress || !toAddress) {
      return NextResponse.json(
        { error: "Missing required fields: fromChain, toChain, asset, amount, fromAddress, toAddress" },
        { status: 400 }
      )
    }

    if (fromChain === toChain) {
      return NextResponse.json(
        { error: "Source and destination chains must be different" },
        { status: 400 }
      )
    }

    const sdk = new AllbridgeCoreSdk(nodeRpcUrlsDefault)
    const chainDetailsMap = await sdk.chainDetailsMap()

    const fromSym = toChainSymbol(fromChain)
    const toSym = toChainSymbol(toChain)
    const sourceChain = chainDetailsMap[fromSym as ChainSymbol]
    const destChain = chainDetailsMap[toSym as ChainSymbol]

    if (!sourceChain) {
      const available = Object.keys(chainDetailsMap).join(", ")
      return NextResponse.json(
        { error: `Unsupported source chain "${fromChain}". Available: ${available}` },
        { status: 400 }
      )
    }
    if (!destChain) {
      const available = Object.keys(chainDetailsMap).join(", ")
      return NextResponse.json(
        { error: `Unsupported destination chain "${toChain}". Available: ${available}` },
        { status: 400 }
      )
    }

    const sourceToken = sourceChain.tokens.find(
      (t) => t.symbol.toLowerCase() === String(asset).toLowerCase()
    )
    if (!sourceToken) {
      const symbols = sourceChain.tokens.map((t) => t.symbol).join(", ")
      return NextResponse.json(
        { error: `Token ${asset} not supported on ${sourceChain.name}. Available: ${symbols}` },
        { status: 400 }
      )
    }

    const destToken = destChain.tokens.find(
      (t) => t.symbol.toLowerCase() === String(asset).toLowerCase()
    )
    if (!destToken) {
      const symbols = destChain.tokens.map((t) => t.symbol).join(", ")
      return NextResponse.json(
        { error: `Token ${asset} not supported on ${destChain.name}. Available: ${symbols}` },
        { status: 400 }
      )
    }

    const amountStr = String(amount).trim()
    if (!amountStr || Number.isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      )
    }

    const toAddressStr = String(toAddress).trim()
    if (toSym === "ETH") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(toAddressStr)) {
        return NextResponse.json(
          { error: "Invalid Ethereum destination address. Must be 0x followed by 40 hex characters." },
          { status: 400 }
        )
      }
    }

    const sendParams: SendParams = {
      amount: amountStr,
      fromAccountAddress: String(fromAddress).trim(),
      toAccountAddress: toAddressStr,
      sourceToken,
      destinationToken: destToken,
      messenger: Messenger.ALLBRIDGE,
      extraGas: "1.15",
      extraGasFormat: AmountFormat.FLOAT,
      gasFeePaymentMethod: FeePaymentMethod.WITH_STABLECOIN,
    }

    if (fromSym !== ChainSymbol.SRB) {
      return NextResponse.json(
        { error: "Only Stellar as source chain is currently supported. Use from: Stellar." },
        { status: 400 }
      )
    }

    const xdr = (await sdk.bridge.rawTxBuilder.send(sendParams)) as string
    if (!xdr || typeof xdr !== "string") {
      return NextResponse.json(
        { error: "Failed to build bridge transaction: no XDR returned" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      xdr,
      sourceChain: sourceChain.name,
      destChain: destChain.name,
      sourceToken: sourceToken.symbol,
      destToken: destToken.symbol,
      message: `Transaction ready to bridge ${amount} ${asset} from ${sourceChain.name} to ${destChain.name}`,
    })
  } catch (error: unknown) {
    console.error("Bridge build error:", error)
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes("Amount not enough to pay fee") ||
      message.includes("stables is missing")
    ) {
      return NextResponse.json(
        {
          error:
            "The amount is lower than the bridge fee. For Stellar → Ethereum the fee is about 3–4 USDC (deducted from the amount). Please enter at least 4 USDC (or more to receive funds on the other side).",
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: `Failed to build bridge transaction: ${message}` },
      { status: 500 }
    )
  }
}
