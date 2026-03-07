"use client"

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

const STELLAR_DOCS = "https://developers.stellar.org"
const STELLAR_DISCORD = "https://discord.gg/stellardev"
const GITHUB_SDK = "https://github.com/stellar/stellar-agent-kit"

const STEPS = [
  {
    step: 3,
    title: "Join the community",
    description: "Ask questions and share what you build in the Stellar developer Discord.",
    links: [
      { name: "Join Discord", href: STELLAR_DISCORD, desc: "Developer community", internal: false },
    ],
  },
  {
    step: 2,
    title: "Use the DevKit",
    description: "Orbit's DevKit gives you one SDK for swap, send, lending, oracles, and MCP for Cursor/Claude.",
    links: [
      { name: "Open DevKit", href: "/devkit", desc: "SDK & tools", internal: true },
    ],
  },
  {
    step: 1,
    title: "Read the docs",
    description: "Stellar's developer documentation covers the network, Soroban, and DeFi building blocks.",
    links: [
      { name: "Docs", href: STELLAR_DOCS, desc: "Stellar docs", internal: false },
    ],
  },
]

function AnimatedStepCard({
  step,
  title,
  description,
  links,
}: {
  step: number
  title: string
  description: string
  links: Array<{ name: string; href: string; desc: string; internal?: boolean }>
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

      <div className="mt-1 flex flex-wrap gap-3">
        {links.map((link) =>
          link.internal ? (
            <LiquidMetalButton
              key={link.name}
              href={link.href}
              label={link.name}
              width={150}
            />
          ) : (
            <LiquidMetalButton
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              label={link.name}
              width={150}
            />
          )
        )}
      </div>
    </div>
  )
}

export default function OnboardingDevelopersPage() {
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
                Developers
              </h1>
              <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto">
                Documentation, DevKit tools, and community support for building on Stellar.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <LiquidMetalButton href="/devkit" label="Open DevKit" width={150} />
                <LiquidMetalButton href={STELLAR_DOCS} target="_blank" rel="noopener noreferrer" label="Stellar docs" width={130} />
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
              <p className="mt-2 text-zinc-400">Documentation, DevKit, and community — your path to building on Stellar.</p>
              <AnimatedList delay={800} className="mt-8 w-full gap-4">
                {STEPS.map(({ step, title, description, links }) => (
                  <AnimatedStepCard
                    key={step}
                    step={step}
                    title={title}
                    description={description}
                    links={links}
                  />
                ))}
              </AnimatedList>
            </div>
          </section>

          <section className="border-t border-zinc-800 px-4 py-10">
            <div className="mx-auto max-w-3xl">
              <div className={`rounded-2xl p-6 sm:p-8 ${SHINY_CLASS}`}>
                <h3 className="text-lg font-semibold text-white">Resources</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Orbit DevKit, Stellar documentation, stellar-agent-kit on GitHub, and the Stellar Discord — everything you need to build.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/devkit" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${SHINY_CLASS}`}>
                    Orbit DevKit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href={STELLAR_DOCS} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${SHINY_CLASS}`}>
                    Stellar documentation
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={GITHUB_SDK} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${SHINY_CLASS}`}>
                    stellar-agent-kit
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={STELLAR_DISCORD} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${SHINY_CLASS}`}>
                    Stellar Discord
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
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
