import { NextRequest, NextResponse } from "next/server"
import { createReflectorOracle, getNetworkConfig } from "stellar-agent-kit"

/**
 * GET /api/price?symbol=XLM or /api/price?contractId=C...
 * Returns Reflector (SEP-40) oracle price for the asset.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")?.trim().toUpperCase()
    const contractId = searchParams.get("contractId")?.trim()

    if (!symbol && !contractId) {
      return NextResponse.json(
        { error: "Provide ?symbol=XLM or ?contractId=C..." },
        { status: 400 }
      )
    }

    const config = getNetworkConfig()
    const oracle = createReflectorOracle({ networkConfig: config })
    const asset = contractId
      ? { contractId }
      : { symbol: symbol! }

    const data = await oracle.lastprice(asset)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get price"
    if (message.includes("Oracle returned no price") || message.includes("no price")) {
      return NextResponse.json(
        { price: null, symbol: searchParams.get("symbol") ?? undefined, contractId: searchParams.get("contractId") ?? undefined, message: "No price available for this asset" },
        { status: 200 }
      )
    }
    console.error("Price error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
