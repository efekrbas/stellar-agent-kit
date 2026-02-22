import { NextRequest, NextResponse } from "next/server";
import {
  TransactionBuilder,
  Networks,
  xdr,
  Horizon,
  rpc,
} from "@stellar/stellar-sdk";
import { PoolContract, RequestType, type Request } from "@blend-capital/blend-sdk";
import { getNetworkConfig, MAINNET_ASSETS } from "stellar-agent-kit";

/** Default active pool (FixedV2). Frozen pool: YieldBloxV2 = CCCCIQSDILITHMM7PBSLVDT5MISSY7R26MNZXCX4H7J5JQ5FPIYOGYFS */
const DEFAULT_POOL_ID = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD";

function toSmallestUnits(amount: string): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
  return Math.round(num * 1e7).toString();
}

function resolveAsset(asset: string): string {
  const s = String(asset).trim();
  const bySymbol = MAINNET_ASSETS[s as keyof typeof MAINNET_ASSETS]?.contractId;
  if (bySymbol) return bySymbol;
  if (s.length >= 56 && /^C[A-Z0-9]+$/.test(s)) return s;
  throw new Error(`Unsupported asset: ${asset}. Use USDC, XLM, or a contract ID.`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, amount, publicKey, network = "mainnet", poolId } = body;

    if (!asset || !amount || !publicKey) {
      return NextResponse.json(
        { error: "Missing required fields: asset, amount, publicKey" },
        { status: 400 }
      );
    }

    const assetContractId = resolveAsset(asset);
    const amountInSmallestUnit = toSmallestUnits(String(amount));
    const amountBigInt = BigInt(amountInSmallestUnit);
    if (amountBigInt <= BigInt(0)) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const networkConfig = getNetworkConfig(network);
    const effectivePoolId = (typeof poolId === "string" && poolId.trim()) ? poolId.trim() : DEFAULT_POOL_ID;
    const pool = new PoolContract(effectivePoolId);

    const requests: Request[] = [
      {
        request_type: RequestType.SupplyCollateral,
        address: assetContractId,
        amount: amountBigInt,
      },
    ];

    const submitOpXdr = pool.submit({
      from: publicKey,
      spender: publicKey,
      to: publicKey,
      requests,
    });

    const op = xdr.Operation.fromXDR(submitOpXdr, "base64");
    const networkPassphrase = Networks.PUBLIC;
    const horizon = new Horizon.Server(networkConfig.horizonUrl);
    const sourceAccount = await horizon.loadAccount(publicKey);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "10000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(180)
      .build();

    const server = new rpc.Server(networkConfig.sorobanRpcUrl, {
      allowHttp: networkConfig.sorobanRpcUrl.startsWith("http:"),
    });
    const prepared = await server.prepareTransaction(tx);

    return NextResponse.json({
      success: true,
      xdr: prepared.toXDR(),
      message: `Transaction ready to supply ${amount} to Blend`,
    });
  } catch (error: unknown) {
    console.error("Lending supply build error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to build supply transaction: ${message}` },
      { status: 500 }
    );
  }
}
