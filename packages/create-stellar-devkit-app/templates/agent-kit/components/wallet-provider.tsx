"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { isConnected, isAllowed } from "@stellar/freighter-api"

interface WalletContextType {
  isFreighterAvailable: boolean
  isAllowed: boolean
  checkFreighterAvailability: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false)
  const [isWalletAllowed, setIsWalletAllowed] = useState(false)

  const checkFreighterAvailability = async () => {
    try {

      // Check if we're in browser environment
      if (typeof window === "undefined") {
        setIsFreighterAvailable(false)
        setIsWalletAllowed(false)
        return
      }

      // Use the proper Freighter API to check if extension is available
      const connected = await isConnected()
      const freighterAvailable = !!connected
      
      console.log("Freighter availability check via isConnected:", freighterAvailable, connected)
      setIsFreighterAvailable(freighterAvailable)

      if (freighterAvailable) {
        try {
          // Check if the app is allowed to connect
          const allowed = await isAllowed()
          console.log("Wallet allowed status:", allowed)
          const allowedBool = typeof allowed === "object" && allowed !== null && "isAllowed" in allowed
            ? Boolean((allowed as { isAllowed?: boolean }).isAllowed)
            : Boolean(allowed)
          setIsWalletAllowed(allowedBool)
        } catch (error) {
          console.error("Error checking isAllowed:", error)
          setIsWalletAllowed(false)
        }
      } else {
        setIsWalletAllowed(false)
      }
    } catch (error) {
      console.error("Error checking Freighter availability:", error)
      setIsFreighterAvailable(false)
      setIsWalletAllowed(false)
    }
  }

  useEffect(() => {
    checkFreighterAvailability()
    
    // Also check after a delay to catch late-loading extensions
    const delayedCheck = setTimeout(() => {
      checkFreighterAvailability()
    }, 2000)
    
    return () => clearTimeout(delayedCheck)
  }, [])

  const value: WalletContextType = {
    isFreighterAvailable,
    isAllowed: isWalletAllowed,
    checkFreighterAvailability,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}