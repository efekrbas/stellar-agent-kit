"use client"

import { useState } from "react"
import { ScrambleText } from "@/components/scramble-text"

const COMMUNITY_PROJECTS = [
  { name: "Stello", href: "https://stello.io", logo: "/brand/partners/stello.png" },
  { name: "Stacy IDE", href: "https://stacyide.xyz", logo: "/brand/partners/stacy.png" },
] as const

const LOGO_HEIGHT = 200
const LOGO_MAX_WIDTH = 360

function CommunityProjectLogo({
  name,
  href,
  logo,
}: {
  name: string
  href: string
  logo: string
}) {
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group shrink-0 inline-flex items-center justify-center transition-all duration-300 hover:scale-105 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      title={name}
      aria-label={`Open ${name}`}
    >
      <span
        className="inline-flex items-center justify-center overflow-hidden rounded-xl transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(167,139,250,0.4)]"
        style={{ width: LOGO_MAX_WIDTH, height: LOGO_HEIGHT }}
      >
        {!logoFailed ? (
          <img
            src={logo}
            alt=""
            width={LOGO_MAX_WIDTH}
            height={LOGO_HEIGHT}
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            style={{ maxWidth: LOGO_MAX_WIDTH, maxHeight: LOGO_HEIGHT }}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-800 font-bold text-lg text-zinc-500">
            {name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2) || name.slice(0, 2)}
          </span>
        )}
      </span>
    </a>
  )
}

export function CommunityProjectsSection() {
  return (
    <section
      id="community-projects"
      className="relative z-20 w-full scroll-mt-24"
    >
      <div className="container mx-auto max-w-5xl px-6 lg:px-12 py-20">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white uppercase mb-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <ScrambleText text="SUPPORTED ECOSYSTEM PROJECTS" as="span" />
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Community-built projects that integrate with Stellar DevKit.
          </p>
        </div>
        <div className="flex flex-nowrap items-center justify-center gap-8 md:gap-12 px-4 overflow-hidden">
          {COMMUNITY_PROJECTS.map((p) => (
            <CommunityProjectLogo key={p.name} name={p.name} href={p.href} logo={p.logo} />
          ))}
        </div>
      </div>
    </section>
  )
}
