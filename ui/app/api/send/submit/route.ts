import { NextRequest, NextResponse } from "next/server";
import { TransactionBuilder, Networks, Horizon } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/lib/agent-kit/config/networks";

function normalizeNetwork(name: string): "testnet" | "mainnet" {
  const n = name?.toLowerCase().trim() ?? "";
  return n === "testnet" ? "testnet" : "mainnet";
}

export async function POST(request: NextRequest) {
  try {
    const { signedXdr, network } = await request.json();

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Missing required parameter: signedXdr" },
        { status: 400 }
      );
    }

    const networkName = normalizeNetwork(network ?? "mainnet");
    const config = getNetworkConfig(networkName);
    const horizon = new Horizon.Server(config.horizonUrl);
    const networkPassphrase =
      networkName === "testnet" ? Networks.TESTNET : Networks.PUBLIC;

    const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await horizon.submitTransaction(tx);

    return NextResponse.json({
      hash: result.hash,
      status: result.successful ? "SUCCESS" : "PENDING",
    });
  } catch (error) {
    console.error("Send submit error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
