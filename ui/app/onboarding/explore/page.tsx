"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { DotPattern } from "@/components/dot-pattern"
import { PageTransition } from "@/components/page-transition"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { AnimatedList } from "@/components/ui/animated-list"
import { TextAnimate } from "@/components/ui/text-animate"

const SHINY_CLASS =
  "rounded-xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-white/20 hover:bg-white/10"

const SOROBAN_RUST_GUIDE = "https://developers.stellar.org/docs/learn/fundamentals/contract-development"
const STELLAR_DEX = "https://developers.stellar.org/docs/defi/direct-dex"
const ALLBRIDGE = "https://allbridge.io"
const ORBIT_TUTORIAL_VIDEO = "https://youtu.be/UKmEJYdP6Mg?si=lofJKGqCnKCpuLfE"

const DEFI_PROTOCOLS = [
  {
    name: "SoroSwap",
    href: "https://soroswap.finance",
    logo: "/brand/partners/soroswap.svg",
    description: "The native decentralized exchange on Stellar. Swap any token pair with deep liquidity.",
  },
  {
    name: "Blend",
    href: "https://blend.capital",
    logo: "/brand/partners/blend.svg",
    description: "Supply assets to earn yield or borrow against your collateral on Stellar.",
  },
  {
    name: "Allbridge",
    href: "https://allbridge.io",
    logo: "/brand/partners/allbridge.svg",
    description: "Bridge tokens between Stellar and other major blockchains quickly and cheaply.",
  },
]

const STEPS = [
  {
    step: 4,
    title: "Bridge & move assets",
    description: "Bring assets from other chains to Stellar or move value across the network.",
    links: [
      { name: "Allbridge", href: ALLBRIDGE, desc: "Cross-chain bridge", internal: false },
      { name: "Stellar DEX", href: STELLAR_DEX, desc: "Learn DEX & liquidity", internal: false },
    ],
    showProtocols: false,
  },
  {
    step: 3,
    title: "Build with Soroban",
    description: "Write smart contracts and understand the Stellar smart contract platform.",
    links: [
      { name: "Rust Guide", href: SOROBAN_RUST_GUIDE, desc: "Official guide", internal: false },
      { name: "Watch tutorial", href: ORBIT_TUTORIAL_VIDEO, desc: "Video guide", internal: false },
    ],
    showProtocols: false,
  },
  {
    step: 2,
    title: "DeFi protocols on Stellar",
    description: "Swap, lend, borrow, and bridge — explore the ecosystem built on Stellar.",
    links: [],
    showProtocols: true,
  },
  {
    step: 1,
    title: "On Orbit",
    description: "Swap tokens on Stellar DEX (SoroSwap) and interact with lending and other DeFi protocols in one place.",
    links: [
      { name: "Open Swap", href: "/swap", desc: "Try swap", internal: true },
      { name: "My Protocols", href: "/protocols#try", desc: "Supply, borrow", internal: true },
    ],
    showProtocols: false,
  },
]

function AnimatedStepCard({
  step,
  title,
  description,
  links,
  showProtocols,
}: {
  step: number
  title: string
  description: string
  links: Array<{ name: string; href: string; desc: string; internal?: boolean }>
  showProtocols?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-3 py-4"
      style={{ fontFamily: "var(--font-space-grotesk)" }}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold tabular-nums text-white sm:text-5xl">{step}.</span>
        <h3 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h3>
      </div>
      <p className="text-xl text-zinc-400 sm:text-2xl">{description}</p>

      {showProtocols && (
        <div className="mt-6 grid grid-cols-3 gap-x-8 gap-y-10">
          {DEFI_PROTOCOLS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center gap-4 transition-opacity hover:opacity-80"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Image
                src={p.logo}
                alt={p.name}
                width={80}
                height={80}
                className="w-20 h-20 object-contain"
                unoptimized={p.logo.startsWith("http")}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-base font-semibold text-white">{p.name}</span>
                <p className="text-sm text-zinc-500 leading-relaxed">{p.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-3">
        {links.map((link) =>
          link.internal ? (
            <LiquidMetalButton
              key={link.name}
              href={link.href}
              label={link.name}
              width={150}
              noGradient={link.name === "Watch tutorial"}
            />
          ) : (
            <LiquidMetalButton
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              label={link.name}
              width={150}
              noGradient={link.name === "Watch tutorial"}
            />
          )
        )}
      </div>
    </div>
  )
}

export default function OnboardingExplorePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <PageTransition>
        <main>
          <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden border-b border-zinc-800/50">
            <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen" aria-hidden>
              <DotPattern fixed={false} baseColor="#52525b" glowColor="#71717a" gap={22} dotSize={2.5} proximity={140} waveSpeed={0.4} baseOpacityMin={0.28} baseOpacityMax={0.48} />
            </div>
            <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Seasoned Web3 Users
              </h1>
              <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto">
                Bridge assets, trade tokens, and use DeFi on Stellar. Orbit connects you to protocols in one place.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <LiquidMetalButton href="/swap" label="Open Swap" width={140} />
                <LiquidMetalButton href="/protocols#try" label="My Protocols" width={150} />
              </div>
            </div>
          </section>

          <section className="px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-3xl">
              <TextAnimate
                as="h2"
                animation="slideUp"
                by="word"
                duration={1}
                className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                How to get started
              </TextAnimate>
              <p className="mt-2 text-zinc-400">Explore the Stellar ecosystem — swap, bridge, and build with the tools below.</p>
              <AnimatedList delay={800} className="mt-8 w-full gap-4">
                {STEPS.map(({ step, title, description, links, showProtocols }) => (
                  <AnimatedStepCard
                    key={step}
                    step={step}
                    title={title}
                    description={description}
                    links={links}
                    showProtocols={showProtocols}
                  />
                ))}
              </AnimatedList>
            </div>
          </section>

          <section className="border-t border-zinc-800 px-4 py-10">
            <div className="mx-auto max-w-3xl">
              <div className={`rounded-2xl p-6 sm:p-8 ${SHINY_CLASS}`}>
                <h3 className="text-lg font-semibold text-white">One place for Stellar DeFi</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Orbit gives you swap, lending, and protocol UIs so you don't have to jump between multiple apps.
                </p>
                <Link href="/" className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${SHINY_CLASS}`}>
                  Open Orbit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/onboarding#paths" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-300 ${SHINY_CLASS}`}>
                  ← Back to paths
                </Link>
                <Link href="/" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${SHINY_CLASS}`}>
                  Open Orbit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </PageTransition>
    </div>
  )
}
