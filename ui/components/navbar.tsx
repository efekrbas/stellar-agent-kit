"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { GlassSurface } from "./glass-surface"
import { LiquidMetalButton } from "./ui/liquid-metal-button"
import { MobileMenu } from "./mobile-menu"
import { WalletData } from "./wallet-data"
import { NetworkSelector } from "./network-selector"

const NAV_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "/docs", label: "Docs" },
  { href: "/devkit", label: "DevKit" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/pricing", label: "Pricing" },
]

// Onboarding: minimal — Back, Paths, Open Orbit
const ONBOARDING_NAV_LINKS: { href: string; label: string }[] = [
  { href: "/onboarding#paths", label: "Paths" },
]

export function Navbar() {
  const pathname = usePathname()
  const isOnboarding = pathname.startsWith("/onboarding")
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const last = lastScrollYRef.current

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY < last || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > last && currentScrollY > 100) {
        setIsVisible(false)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 px-4 w-max max-w-[calc(100vw-2rem)] transition-all duration-700 ease-in-out ${
        isVisible ? "top-6 opacity-100" : "-top-24 opacity-0"
      }`}
    >
      <GlassSurface
        width="100%"
        height={80}
        borderRadius={9999}
        backgroundOpacity={0.18}
        saturation={1.5}
        blur={16}
        forceDark
        simpleGlass
        className="px-6 sm:px-8 sm:pr-10 py-4 flex items-center justify-between sm:justify-center min-w-0 w-full shadow-lg shadow-black/25"
        contentClassName="p-0 w-full flex items-center justify-between sm:justify-center gap-6 sm:gap-8 min-w-0"
      >
        {/* Centered on desktop: Logo + Nav + Wallet (or onboarding CTA) */}
        <div className="hidden sm:flex items-center justify-center gap-6 sm:gap-8 min-w-0 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white hover:text-zinc-200 transition-colors duration-300 shrink-0"
          >
            <Image src="/brand/orbit/orbit.png" alt="Orbit" width={28} height={28} className="shrink-0" />
            Orbit
          </Link>
          <span className="hidden md:block w-px h-5 bg-zinc-700 shrink-0 mx-4" aria-hidden />
          {isOnboarding ? (
            <>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg text-zinc-400 hover:text-white transition-colors duration-300 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <nav className="flex items-center gap-1 min-w-0 shrink" aria-label="Onboarding">
                {ONBOARDING_NAV_LINKS.map(({ href, label }) => {
                  const isActive = pathname === href || (href !== "/onboarding" && pathname === href.split("#")[0])
                  const className = `px-3 py-2.5 text-sm rounded-lg transition-colors duration-300 whitespace-nowrap ${
                    isActive ? "text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`
                  return (
                    <Link key={label} href={href} className={className}>
                      {label}
                    </Link>
                  )
                })}
              </nav>
              <span className="hidden md:block w-px h-5 bg-zinc-700 shrink-0 mx-4" aria-hidden />
              <LiquidMetalButton href="/" label="Open Orbit" width={140} className="shrink-0" />
            </>
          ) : (
            <>
              <nav className="flex items-center gap-1 min-w-0 shrink" aria-label="Main">
                {NAV_LINKS.map(({ href, label, external }) => {
                  const isActive = !external && (pathname === href || (href !== "/" && pathname.startsWith(href + "/")))
                  const className = `px-3 py-2.5 text-sm rounded-lg transition-colors duration-300 whitespace-nowrap ${
                    isActive ? "text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`
                  if (external) {
                    return (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {label}
                      </a>
                    )
                  }
                  return (
                    <Link key={href} href={href} className={className}>
                      {label}
                    </Link>
                  )
                })}
              </nav>
              <span className="hidden md:block w-px h-5 bg-zinc-700 shrink-0 mx-4" aria-hidden />
              <div className="shrink-0 flex items-center gap-3 ml-1">
                <NetworkSelector />
                <WalletData />
              </div>
            </>
          )}
        </div>

        {/* Mobile: logo left, menu right */}
        <div className="flex sm:hidden items-center w-full justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white hover:text-zinc-200 transition-colors duration-300"
          >
            <Image src="/brand/orbit/orbit.png" alt="Orbit" width={24} height={24} className="shrink-0" />
            Orbit
          </Link>
          <MobileMenu />
        </div>
      </GlassSurface>
    </nav>
  )
}
