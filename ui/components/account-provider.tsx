"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { isConnected, isAllowed, getAddress, getNetwork, requestAccess } from "@stellar/freighter-api"

export interface AccountData {
  publicKey: string
  displayName: string
  network: string
}

interface AccountContextType {
  account: AccountData | null
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
  refreshAccount: () => Promise<void>
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

async function checkConnection(): Promise<AccountData | null> {
  if (typeof window === "undefined") return null

  const connected = await isConnected()
  if (!connected) return null

  const allowed = await isAllowed()
  if (!allowed) return null

  const addressResult = await getAddress()
  const address = addressResult.error ? null : (addressResult.address?.trim() || null)
  if (!address) return null

  const networkResult = await getNetwork()
  const networkName =
    typeof networkResult === "object" && networkResult.network
      ? networkResult.network
      : networkResult

  return {
    publicKey: address,
    displayName: `${address.slice(0, 4)}...${address.slice(-4)}`,
    network: networkName,
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAccount = useCallback(async () => {
    try {
      const next = await checkConnection()
      setAccount(next)
    } catch (error) {
      console.error("Error checking wallet connection:", error)
      setAccount(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    checkConnection()
      .then((next) => {
        if (!cancelled) setAccount(next)
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error checking wallet connection:", error)
          setAccount(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection().then(setAccount).catch(() => setAccount(null))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const connect = useCallback(async () => {
    setIsLoading(true)
    try {
      const accessResult = await requestAccess()
      if (accessResult.error) throw new Error(accessResult.error)

      const networkResult = await getNetwork()
      const networkName =
        typeof networkResult === "object" && networkResult.network
          ? networkResult.network
          : networkResult

      setAccount({
        publicKey: accessResult.address,
        displayName: `${accessResult.address.slice(0, 4)}...${accessResult.address.slice(-4)}`,
        network: networkName,
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
  }, [])

  const value: AccountContextType = {
    account,
    isLoading,
    connect,
    disconnect,
    refreshAccount,
  }

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccountContext() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider")
  }
  return context
}
