import { NextRequest, NextResponse } from "next/server";
import { Asset, TransactionBuilder, Operation, Networks, Horizon } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/lib/agent-kit/config/networks";

function normalizeNetwork(name: string): "testnet" | "mainnet" {
  const n = name?.toLowerCase().trim() ?? "";
  return n === "testnet" ? "testnet" : "mainnet";
}

export async function POST(request: NextRequest) {
  try {
    const { fromAddress, to, amount, assetCode, assetIssuer, network } = await request.json();

    if (!fromAddress || !to || amount == null || amount === "") {
      return NextResponse.json(
        { error: "Missing required parameters: fromAddress, to, amount" },
        { status: 400 }
      );
    }

    const networkName = normalizeNetwork(network ?? "mainnet");
    const config = getNetworkConfig(networkName);
    const horizon = new Horizon.Server(config.horizonUrl);
    const networkPassphrase =
      networkName === "testnet" ? Networks.TESTNET : Networks.PUBLIC;

    const sourceAccount = await horizon.loadAccount(fromAddress);
    const asset =
      assetCode && assetIssuer
        ? new Asset(assetCode, assetIssuer)
        : Asset.native();

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(Operation.payment({ destination: to, asset, amount: String(amount) }))
      .setTimeout(180)
      .build();

    return NextResponse.json({ xdr: tx.toXDR() });
  } catch (error) {
    console.error("Send build error:", error);
    const message = error instanceof Error ? error.message : "Failed to build payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
