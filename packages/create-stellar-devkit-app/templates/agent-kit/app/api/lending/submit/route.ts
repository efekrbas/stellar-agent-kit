import { NextRequest, NextResponse } from "next/server";
import { TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "stellar-agent-kit";

const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

function friendlyBlendError(errorResult: string): string {
  const str = String(errorResult);
  const match = str.match(/#(\d+)\)/);
  const code = match ? parseInt(match[1], 10) : null;
  const messages: Record<number, string> = {
    1205: "Health factor would be too low. Supply more collateral or borrow a smaller amount.",
    1204: "This operation is not allowed in the current pool status.",
    1206: "Invalid pool status. The Blend pool may be frozen or in a restricted state. Check pool status at blend.capital or try again later.",
    1223: "This asset is currently disabled for this operation. Try a different asset.",
    1224: "Minimum collateral requirement not met. Supply more assets as collateral.",
    1210: "Price is stale; try again in a moment.",
    1003: "Insufficient funds in the lending pool. Try a smaller amount or try later.",
    1216: "Invalid amount for this operation. Check the amount and try again.",
    1208: "Maximum number of positions exceeded.",
  };
  if (code !== null && messages[code]) {
    return messages[code];
  }
  return `Transaction failed: ${str}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signedXdr, network = "mainnet" } = body;

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Missing signed transaction XDR" },
        { status: 400 }
      );
    }

    const networkConfig = getNetworkConfig(network);
    const server = new rpc.Server(networkConfig.sorobanRpcUrl, {
      allowHttp: networkConfig.sorobanRpcUrl.startsWith("http:"),
    });

    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(tx);

    if (result.errorResult) {
      const message = friendlyBlendError(String(result.errorResult));
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      hash: result.hash,
      status: result.status ?? "PENDING",
      message: "Transaction submitted successfully",
    });
  } catch (error: unknown) {
    console.error("Transaction submit error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to submit transaction: ${message}` },
      { status: 500 }
    );
  }
}
