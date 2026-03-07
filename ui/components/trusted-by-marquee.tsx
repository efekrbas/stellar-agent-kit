"use client"

import Image from "next/image"

// All logos in brand/partners — colored, larger, with spacing
const PARTNER_LOGOS = [
  { src: "/brand/partners/allbridge.svg", alt: "Allbridge", width: 100, height: 100 },
  { src: "/brand/partners/blend.svg", alt: "Blend", width: 100, height: 100 },
  { src: "/brand/partners/FxDAO.svg", alt: "FxDAO", width: 100, height: 100 },
  { src: "/brand/partners/relflector.svg", alt: "Reflector", width: 64, height: 64 },
  { src: "/brand/partners/soroswap.svg", alt: "SoroSwap", width: 120, height: 44 },
  { src: "/brand/partners/stellar.png", alt: "Stellar", width: 140, height: 38 },
]

function LogoStrip() {
  return (
    <div className="flex shrink-0 items-center gap-16 md:gap-20">
      {PARTNER_LOGOS.map((logo) => (
        <div
          key={logo.alt}
          className="flex shrink-0 items-center justify-center opacity-90 transition-all duration-300 hover:opacity-100"
          style={{ minWidth: logo.width + 32 }}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="h-12 w-auto object-contain md:h-14"
            unoptimized={logo.src.endsWith(".svg")}
          />
        </div>
      ))}
    </div>
  )
}

export function TrustedByMarquee() {
  return (
    <section className="relative py-16 overflow-hidden border-y border-zinc-800/60 bg-zinc-950 isolate contain-[layout_paint]">
      <p className="text-center text-sm font-medium uppercase tracking-widest text-zinc-500 mb-10">
        Trusted by
      </p>
      <div className="relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee-infinite">
          <LogoStrip />
          <LogoStrip />
          <LogoStrip />
        </div>
      </div>
    </section>
  )
}
