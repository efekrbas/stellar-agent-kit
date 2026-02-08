"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MobileMenu } from "./mobile-menu"
import { WalletData } from "./wallet-data"

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 px-6 w-full max-w-7xl transition-all duration-700 ease-in-out ${
        isVisible ? "top-8 opacity-100" : "-top-24 opacity-0"
      }`}
    >
      <div className="bg-black/50 backdrop-blur-[120px] rounded-full px-8 py-3 flex items-center gap-8 shadow-lg border border-white/10 w-full">
        {/* Logo */}
        <button
          type="button"
          onClick={() => scrollTo("hero")}
          className="flex items-center text-xl font-semibold text-white hover:text-zinc-300 transition-colors"
        >
          Warly
        </button>

        {/* Desktop Menu Links */}
        <div className="hidden md:flex items-center justify-end gap-4 flex-1 pr-4">
          <button
            type="button"
            onClick={() => scrollTo("capabilities")}
            className="px-4 py-2 text-white hover:text-zinc-300 transition-colors"
          >
            Capabilities
          </button>
          <Link
            href="/devkit"
            className="px-4 py-2 text-white hover:text-zinc-300 transition-colors"
          >
            DevKit
          </Link>
          <Link
            href="/swap"
            className="px-4 py-2 text-white hover:text-zinc-300 transition-colors"
          >
            Swap
          </Link>
          <WalletData />
          <a
            href="https://github.com/stellar/stellar-agent-kit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-[18px] py-[10px] rounded-full border border-[#5100fd] bg-[#5100fd]/50 text-white font-medium hover:scale-105 transition-transform duration-500"
          >
            Get started
          </a>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center justify-end flex-1 pr-4">
          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}
