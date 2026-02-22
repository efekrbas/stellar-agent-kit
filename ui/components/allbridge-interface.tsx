"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight, Info, CheckCircle, XCircle } from "lucide-react"
import { useAccount } from "@/hooks/use-account"

// Supported chains and tokens for Allbridge
const BRIDGE_CHAINS = [
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "bsc", name: "BNB Chain", symbol: "BNB" },
  { id: "polygon", name: "Polygon", symbol: "MATIC" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX" },
] as const

const BRIDGE_TOKENS = [
  { symbol: "USDT", name: "Tether USD" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "BTC", name: "Bitcoin" },
] as const

type BridgeChain = typeof BRIDGE_CHAINS[number]
type BridgeToken = typeof BRIDGE_TOKENS[number]

interface BridgeTransaction {
  id: string
  fromChain: string
  toChain: string
  token: string
  amount: string
  status: "pending" | "success" | "error"
  hash?: string
  timestamp: number
}

export function AllbridgeInterface() {
  const { publicKey, isConnected, signTransaction } = useAccount()
  const [fromChain, setFromChain] = useState<BridgeChain>(BRIDGE_CHAINS[0])
  const [toChain, setToChain] = useState<BridgeChain>(BRIDGE_CHAINS[1])
  const [selectedToken, setSelectedToken] = useState<BridgeToken>(BRIDGE_TOKENS[0])
  const [amount, setAmount] = useState("")
  const [toAddress, setToAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([])
  const [supportedTokens, setSupportedTokens] = useState<any[]>([])

  // Load supported tokens and chains
  useEffect(() => {
    const loadBridgeInfo = async () => {
      try {
        const response = await fetch("/api/bridge/info")
        if (response.ok) {
          const data = await response.json()
          setSupportedTokens(data.tokens || [])
        }
      } catch (error) {
        console.error("Failed to load bridge info:", error)
      }
    }
    loadBridgeInfo()
  }, [])

  const handleSwapChains = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
    setError(null)
  }

  const handleBridge = async () => {
    if (!isConnected || !publicKey || !amount || !toAddress) {
      setError("Please connect wallet and fill all fields")
      return
    }

    if (fromChain.id === toChain.id) {
      setError("Source and destination chains must be different")
      return
    }

    const amountNum = parseFloat(amount)
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid positive amount")
      return
    }

    if (fromChain.id === "stellar" && toChain.id === "ethereum" && (selectedToken.symbol === "USDC" || selectedToken.symbol === "USDT")) {
      if (amountNum < 4) {
        setError("For Stellar → Ethereum the bridge fee is ~3–4 USDC/USDT (deducted from amount). Please enter at least 4.")
        return
      }
    }

    if (toChain.id === "ethereum") {
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!ethAddressRegex.test(toAddress.trim())) {
        setError("Please enter a valid Ethereum address (0x followed by 40 hex characters)")
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build bridge transaction
      const response = await fetch("/api/bridge/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChain: fromChain.id,
          toChain: toChain.id,
          asset: selectedToken.symbol,
          amount,
          fromAddress: publicKey,
          toAddress,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        let message = text
        try {
          const json = JSON.parse(text)
          if (typeof json?.error === "string") message = json.error
        } catch {
          // use text as-is
        }
        throw new Error(message || "Failed to build bridge transaction")
      }

      const data = await response.json()
      const xdr = data?.xdr
      if (typeof xdr !== "string" || !xdr.trim()) {
        throw new Error("Invalid response from server: no transaction to sign. Please try again.")
      }

      // Sign transaction with Freighter
      const signedXdr = await signTransaction(xdr, {
        networkPassphrase: "Public Global Stellar Network ; September 2015",
      })

      // Submit signed transaction
      const submitResponse = await fetch("/api/bridge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      })

      if (!submitResponse.ok) {
        const text = await submitResponse.text()
        let message = text
        try {
          const json = JSON.parse(text)
          if (typeof json?.error === "string") message = json.error
        } catch {
          // use text as-is
        }
        throw new Error(message || "Failed to submit transaction")
      }

      const submitData = await submitResponse.json()
      const hash = submitData?.hash
      if (typeof hash !== "string" || !hash.trim()) {
        throw new Error("Submit succeeded but no transaction hash was returned. Check your wallet or explorer.")
      }

      // Add to transaction history
      const newTransaction: BridgeTransaction = {
        id: Date.now().toString(),
        fromChain: fromChain.name,
        toChain: toChain.name,
        token: selectedToken.symbol,
        amount,
        status: "success",
        hash,
        timestamp: Date.now(),
      }
      setTransactions(prev => [newTransaction, ...prev])

      // Reset form
      setAmount("")
      setToAddress("")
    } catch (error) {
      console.error("Bridge error:", error)
      setError(error instanceof Error ? error.message : "Bridge transaction failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Alert className="max-w-md mx-auto">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Connect your Freighter wallet to use Allbridge cross-chain bridge
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Cross-Chain Bridge</CardTitle>
          <CardDescription>
            Transfer assets between Stellar and other blockchains using Allbridge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chain Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-white">From Chain</Label>
              <Select
                value={fromChain.id}
                onValueChange={(value) => {
                  const chain = BRIDGE_CHAINS.find(c => c.id === value)
                  if (chain) setFromChain(chain)
                  setError(null)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600">
                  {BRIDGE_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id} className="text-white hover:bg-zinc-700">
                      {chain.name} ({chain.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapChains}
                className="border-zinc-600 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-white">To Chain</Label>
              <Select
                value={toChain.id}
                onValueChange={(value) => {
                  const chain = BRIDGE_CHAINS.find(c => c.id === value)
                  if (chain) setToChain(chain)
                  setError(null)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600">
                  {BRIDGE_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id} className="text-white hover:bg-zinc-700">
                      {chain.name} ({chain.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Token Selection */}
          <div className="space-y-2">
            <Label className="text-white">Asset</Label>
            <Select
              value={selectedToken.symbol}
              onValueChange={(value) => {
                const token = BRIDGE_TOKENS.find(t => t.symbol === value)
                if (token) setSelectedToken(token)
                setError(null)
              }}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600">
                {BRIDGE_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-zinc-700">
                    <div className="flex items-center gap-2">
                      <span>{token.symbol}</span>
                      <span className="text-zinc-400">({token.name})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-white">Amount</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
                className="bg-zinc-800 border-zinc-600 text-white pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                {selectedToken.symbol}
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Stellar → Ethereum bridge fee is ~3–4 USDC (deducted from amount). Use at least 4 USDC.
            </p>
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label className="text-white">Destination Address</Label>
            <Input
              placeholder={`Enter ${toChain.name} address`}
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value)
                setError(null)
              }}
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleBridge}
            disabled={isLoading || !amount || !toAddress || fromChain.id === toChain.id}
            className="w-full bg-[#a78bfa] hover:bg-[#9333ea] text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bridging...
              </>
            ) : (
              `Bridge ${selectedToken.symbol} to ${toChain.name}`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Bridge Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-center gap-3">
                    {tx.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : tx.status === "error" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {tx.amount} {tx.token}: {tx.fromChain} → {tx.toChain}
                      </p>
                      <p className="text-zinc-400 text-xs">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {tx.hash && (
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a78bfa] hover:underline text-xs"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}