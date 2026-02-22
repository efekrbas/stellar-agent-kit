"use client";

import { useState } from "react";
import { useAccount } from "@/hooks/use-account";
import { Link2, ExternalLink, ArrowRight } from "lucide-react";
import { ConnectButton } from "./connect-button";
import { toast } from "sonner";
import { signTransaction } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

const SUPPORTED_CHAINS = [
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "bsc", name: "BSC", symbol: "BNB" },
  { id: "polygon", name: "Polygon", symbol: "MATIC" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "tron", name: "Tron", symbol: "TRX" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
  { id: "base", name: "Base", symbol: "BAS" },
];

const SUPPORTED_ASSETS = [
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "USDT", name: "Tether USD" },
];

export function BridgeInterface() {
  const { account } = useAccount();
  const [fromChain, setFromChain] = useState("stellar");
  const [toChain, setToChain] = useState("ethereum");
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBridge = async () => {
    if (!account?.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!toAddress.trim()) {
      toast.error("Please enter destination address");
      return;
    }

    if (fromChain === toChain) {
      toast.error("Please select different source and destination chains");
      return;
    }

    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (fromChain === "stellar" && toChain === "ethereum" && (asset === "USDC" || asset === "USDT")) {
      if (amountNum < 4) {
        toast.error("For Stellar → Ethereum the bridge fee is ~3–4 USDC/USDT (deducted from amount). Please enter at least 4.");
        return;
      }
    }

    if (toChain === "ethereum") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress.trim())) {
        toast.error("Please enter a valid Ethereum address (0x followed by 40 hex characters)");
        return;
      }
    }

    setLoading(true);
    try {
      const buildResponse = await fetch("/api/bridge/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChain,
          toChain,
          asset,
          amount,
          fromAddress: account.publicKey,
          toAddress: toAddress.trim(),
        }),
      });

      const buildText = await buildResponse.text();
      if (!buildResponse.ok) {
        let message = buildText;
        try {
          const json = JSON.parse(buildText);
          if (typeof json?.error === "string") message = json.error;
        } catch {
          // use text as-is
        }
        throw new Error(message || "Failed to build bridge transaction");
      }

      let buildData: { xdr?: string; sourceChain?: string; destChain?: string };
      try {
        buildData = JSON.parse(buildText);
      } catch {
        throw new Error("Invalid response from server. Please try again.");
      }

      const xdr = buildData?.xdr;
      if (typeof xdr !== "string" || !xdr.trim()) {
        throw new Error("Invalid response from server: no transaction to sign. Please try again.");
      }

      const networkPassphrase = Networks.PUBLIC;
      const signResult = await signTransaction(xdr, { networkPassphrase });

      if (signResult.error) {
        if (signResult.error.message?.toLowerCase().includes("rejected") ||
            signResult.error.message?.toLowerCase().includes("denied")) {
          toast.info("Bridge transaction cancelled");
          return;
        }
        throw new Error(signResult.error.message || "Failed to sign transaction");
      }

      const signedXdr = (signResult as { signedTxXdr?: string }).signedTxXdr ?? (signResult as { signedXDR?: string }).signedXDR;
      if (!signedXdr || typeof signedXdr !== "string") {
        throw new Error("Wallet did not return a signed transaction");
      }

      const submitResponse = await fetch("/api/bridge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      });

      const submitText = await submitResponse.text();
      if (!submitResponse.ok) {
        let message = submitText;
        try {
          const json = JSON.parse(submitText);
          if (typeof json?.error === "string") message = json.error;
        } catch {
          // use text as-is
        }
        throw new Error(message || "Failed to submit transaction");
      }

      let submitData: { hash?: string };
      try {
        submitData = JSON.parse(submitText);
      } catch {
        throw new Error("Invalid response from server. Please try again.");
      }

      const hash = submitData?.hash;
      if (typeof hash !== "string" || !hash.trim()) {
        throw new Error("Submit succeeded but no transaction hash was returned. Check your wallet or explorer.");
      }

      toast.success(`Successfully bridged ${amount} ${asset}!`, {
        description: `From ${buildData.sourceChain ?? "Stellar"} to ${buildData.destChain ?? toChain}. Hash: ${hash}`,
        action: {
          label: "View on Stellar Expert",
          onClick: () => window.open(`https://stellar.expert/explorer/public/tx/${hash}`, "_blank"),
        },
      });

      setAmount("");
      setToAddress("");
    } catch (error) {
      console.error("Bridge error:", error);
      const message = error instanceof Error ? error.message : "Failed to initiate bridge transaction";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const swapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link2 className="h-6 w-6 text-[#a78bfa]" />
        <h3 className="text-xl font-medium text-white">Allbridge Core</h3>
      </div>

      {!account?.publicKey ? (
        <div className="text-center py-8">
          <p className="mb-4 text-zinc-400">Connect your wallet to bridge assets cross-chain</p>
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chain Selection */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-2">From</label>
              <select
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-[#5100fd] focus:outline-none"
              >
                {SUPPORTED_CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name} ({chain.symbol})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={swapChains}
              className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-2">To</label>
              <select
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-[#5100fd] focus:outline-none"
              >
                {SUPPORTED_CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name} ({chain.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Asset</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-[#5100fd] focus:outline-none"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#5100fd] focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Stellar → Ethereum bridge fee is ~3–4 USDC (deducted from amount). Use at least 4 USDC.
            </p>
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Destination Address ({SUPPORTED_CHAINS.find(c => c.id === toChain)?.name})
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="Enter destination address"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#5100fd] focus:outline-none"
            />
          </div>

          {/* Bridge Button */}
          <button
            type="button"
            onClick={handleBridge}
            disabled={loading || !amount || !toAddress || fromChain === toChain}
            className="w-full rounded-xl bg-[#5100fd] py-3 font-medium text-white transition-colors hover:bg-[#6610ff] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Bridging..." : `Bridge ${asset}`}
          </button>

          {/* Info */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400 mb-2">
              Bridge from Stellar to Ethereum, BSC, Polygon, Solana, and more via Allbridge Core. Select Stellar as &quot;From&quot; chain.
            </p>
            <a
              href="https://docs-core.allbridge.io/sdk/guides/stellar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#a78bfa] hover:underline"
            >
              SDK Documentation <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}