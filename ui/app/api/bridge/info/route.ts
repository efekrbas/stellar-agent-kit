import { NextRequest, NextResponse } from "next/server"
import { AllbridgeCoreSdk, nodeRpcUrlsDefault, ChainSymbol } from "@allbridge/bridge-core-sdk"

function chainSymbolToId(symbol: string): string {
  return symbol === ChainSymbol.SRB ? "stellar" : symbol.toLowerCase()
}

export async function GET(request: NextRequest) {
  try {
    const sdk = new AllbridgeCoreSdk(nodeRpcUrlsDefault)
    const chainDetailsMap = await sdk.chainDetailsMap()

    const chains = Object.entries(chainDetailsMap).map(([sym, chain]) => ({
      id: chainSymbolToId(sym),
      name: chain.name,
      symbol: chain.chainSymbol ?? sym,
      chainId: (chain as { chainId?: number })?.chainId,
    }))

    const allTokens = Object.values(chainDetailsMap).flatMap((chain) => chain.tokens ?? [])
    const tokens = Array.from(
      new Map(allTokens.map((t) => [t.symbol, { symbol: t.symbol, name: t.name, decimals: t.decimals }])).values()
    )

    return NextResponse.json({
      success: true,
      chains,
      tokens,
    })
  } catch (error: unknown) {
    console.error("Bridge info error:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: `Failed to get bridge info: ${message}` },
      { status: 500 }
    )
  }
}
