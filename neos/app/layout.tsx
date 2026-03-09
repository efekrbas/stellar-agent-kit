import type React from "react";
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Stellar DevKit — Developer suite for Stellar",
  description: "One SDK for payments, DEX swaps, lending, and oracles. Monetize APIs with HTTP 402. Scaffold apps. AI-assisted dev with MCP.",
  icons: {
    icon: "/brand/orbit/orbit.png",
    apple: "/brand/orbit/orbit.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fontMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
