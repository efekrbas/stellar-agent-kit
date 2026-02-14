import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LenisProvider } from "@/components/lenis-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { AccountProvider } from "@/components/account-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Warly — The Agentic Kit",
  description: "Stellar DeFi in plain language. Check balances, swap XLM ↔ USDC, create trustlines, and get quotes—all through an AI agent.",
  generator: "stellar-agent-kit",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <WalletProvider>
          <AccountProvider>
            <LenisProvider>{children}</LenisProvider>
            <Toaster />
          </AccountProvider>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
