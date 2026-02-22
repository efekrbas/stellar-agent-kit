import { NextRequest, NextResponse } from "next/server"
import { AllbridgeCoreSdk, nodeRpcUrlsDefault } from "@allbridge/bridge-core-sdk"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signedXdr } = body

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Missing signed transaction XDR" },
        { status: 400 }
      )
    }

    const sdk = new AllbridgeCoreSdk(nodeRpcUrlsDefault)
    const result = await sdk.utils.srb.sendTransactionSoroban(String(signedXdr))

    const hash = result?.hash ?? (result as { hash?: string })?.hash ?? ""
    if (!hash) {
      return NextResponse.json(
        { error: "Submit succeeded but no transaction hash returned" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hash,
      status: (result as { status?: string })?.status ?? "PENDING",
      message: "Bridge transaction submitted successfully",
    })
  } catch (error: unknown) {
    console.error("Bridge submit error:", error)
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { error: `Failed to submit bridge transaction: ${message}` },
      { status: 500 }
    )
  }
}
