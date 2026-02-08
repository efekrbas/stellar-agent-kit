"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { WalletData } from "./wallet-data"

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 text-white hover:text-zinc-300 transition-colors" aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-zinc-950 border-zinc-800">
        <div className="flex flex-col gap-6 pt-8">
          <div className="pb-4 border-b border-zinc-800">
            <WalletData />
          </div>
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            className="text-left text-lg text-white hover:text-zinc-300 transition-colors"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollTo("capabilities")}
            className="text-left text-lg text-white hover:text-zinc-300 transition-colors"
          >
            Capabilities
          </button>
          <Link
            href="/devkit"
            onClick={() => setOpen(false)}
            className="text-left text-lg text-white hover:text-zinc-300 transition-colors"
          >
            DevKit
          </Link>
          <Link
            href="/swap"
            onClick={() => setOpen(false)}
            className="text-left text-lg text-white hover:text-zinc-300 transition-colors"
          >
            Swap
          </Link>
          <a
            href="https://github.com/stellar/stellar-agent-kit"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-lg text-[#5100fd] hover:text-[#6610ff] transition-colors"
          >
            Get started
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
