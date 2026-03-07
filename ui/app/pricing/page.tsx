"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { Check, X } from "lucide-react"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "forever",
    features: ["Agent Kit basics", "x402 server/client docs", "Community support"],
    cta: "Get started",
    href: "/devkit",
    primary: false,
  },
  {
    id: "builder",
    name: "Builder",
    price: "499",
    currency: "₹",
    period: "/month",
    features: ["Everything in Free", "Pro templates in CLI", "Priority snippets", "Email support"],
    cta: "Upgrade",
    primary: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "999",
    currency: "₹",
    period: "/month",
    features: ["Everything in Builder", "Advanced DEX examples", "Dedicated support", "Early access"],
    cta: "Upgrade",
    primary: false,
  },
]

const INLINE_CONTAINER_ID = "dodo-inline-checkout"

export default function PricingPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successChecked, setSuccessChecked] = useState(false)
  const [inlineCheckoutUrl, setInlineCheckoutUrl] = useState<string | null>(null)
  const sdkInitialized = useRef(false)

  useEffect(() => {
    const paymentId = searchParams.get("payment_id")
    const status = searchParams.get("status")
    if (successChecked || !paymentId || status !== "succeeded") {
      setSuccessChecked(true)
      return
    }
    setSuccessChecked(true)
    fetch("/api/dodo/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof window !== "undefined") {
          window.localStorage.setItem("stellar_devkit_plan_order", data.paymentId)
          window.history.replaceState({}, "", "/pricing?success=1")
        }
      })
      .catch(() => {})
  }, [searchParams, successChecked])

  // Inline checkout: when we have a checkout URL, load SDK and open in container
  useEffect(() => {
    if (!inlineCheckoutUrl || typeof window === "undefined") return

    let closed = false
    const mode = inlineCheckoutUrl.includes("test.dodopayments.com") ? "test" : "live"

    import("dodopayments-checkout").then(({ DodoPayments }) => {
      if (closed) return
      if (!sdkInitialized.current) {
        DodoPayments.Initialize({
          mode,
          displayType: "inline",
          onEvent: (event) => {
            if (event.event_type === "checkout.error") {
              const msg = (event.data as { message?: string })?.message
              setError(msg || "Checkout error")
            }
          },
        })
        sdkInitialized.current = true
      }
      DodoPayments.Checkout.open({
        checkoutUrl: inlineCheckoutUrl,
        elementId: INLINE_CONTAINER_ID,
      })
    })

    return () => {
      closed = true
      import("dodopayments-checkout").then(({ DodoPayments }) => {
        if (typeof DodoPayments.Checkout?.close === "function") {
          DodoPayments.Checkout.close()
        }
      })
    }
  }, [inlineCheckoutUrl])

  const openDodoCheckout = async (planId: string) => {
    setError(null)
    setLoading(planId)
    try {
      const res = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.details
          ? `${data.error || "Checkout failed"}: ${typeof data.details === "string" ? data.details : JSON.stringify(data.details)}`
          : (data.error || "Failed to create checkout")
        setError(msg)
        return
      }
      if (data.checkoutUrl) {
        const isTestMode = data.checkoutUrl.includes("test.dodopayments.com")
        // In test mode the SDK's iframe rejects messages from test.checkout.dodopayments.com,
        // causing a console error. Open in new tab instead; inline works in live mode.
        if (isTestMode) {
          window.open(data.checkoutUrl, "_blank", "noopener,noreferrer")
          return
        }
        setInlineCheckoutUrl(data.checkoutUrl)
        return
      }
      setError("No checkout URL returned")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  const closeInlineCheckout = () => {
    setInlineCheckoutUrl(null)
    setError(null)
  }

  const showSuccess = searchParams.get("success") === "1"
  const [linkAppId, setLinkAppId] = useState("")
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkDone, setLinkDone] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const handleLinkPlan = async () => {
    const paymentId = typeof window !== "undefined" ? window.localStorage.getItem("stellar_devkit_plan_order") : null
    if (!paymentId || !linkAppId.trim()) {
      setLinkError("Enter your DevKit App ID. Create a project in DevKit first if you don't have one.")
      return
    }
    setLinkError(null)
    setLinkLoading(true)
    try {
      const res = await fetch("/api/v1/link-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: linkAppId.trim(), paymentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLinkError(data.error || "Link failed")
        return
      }
      setLinkDone(true)
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "Link failed")
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <Navbar />
      <PageTransition>
        <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white text-center mb-4">Pricing</h1>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Choose the plan that fits your build. Upgrade anytime to unlock Pro templates and support.
          </p>
          {showSuccess && (
            <div className="mb-6 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <p className="text-emerald-400 text-sm text-center font-medium">Payment successful. Your plan is now active.</p>
              {!linkDone ? (
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-zinc-400 text-xs text-center">Link your DevKit App ID to unlock SDK access (Swap, Lending, Price, Send, Balance APIs).</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={linkAppId}
                      onChange={(e) => setLinkAppId(e.target.value)}
                      placeholder="Your App ID from DevKit"
                      className="flex-1 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                    <Button onClick={handleLinkPlan} disabled={linkLoading} className="shrink-0 rounded-lg">
                      {linkLoading ? "Linking…" : "Link plan"}
                    </Button>
                  </div>
                  {linkError && <p className="text-red-400 text-xs text-center">{linkError}</p>}
                </div>
              ) : (
                <p className="text-emerald-400 text-sm text-center">App ID linked. You can use the SDK with this key in the <code className="rounded bg-zinc-800 px-1">x-app-id</code> header or in your env.</p>
              )}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.primary
                    ? "border-zinc-600 bg-zinc-800/30"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.currency ?? ""}{plan.price}
                  </span>
                  <span className="text-zinc-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.id === "free" ? (
                    <Link
                      href={plan.href}
                      className="inline-flex items-center justify-center w-full rounded-full px-6 py-3 text-sm font-medium border border-zinc-500 text-white bg-transparent hover:bg-zinc-800/80 hover:border-zinc-400 transition-all duration-300"
                    >
                      {plan.cta}
                    </Link>
                  ) : plan.primary ? (
                    <LiquidMetalButton
                      label={loading === plan.id ? "Opening…" : plan.cta}
                      onClick={() => openDodoCheckout(plan.id)}
                      disabled={!!loading}
                      fullWidth
                    />
                  ) : (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => openDodoCheckout(plan.id)}
                      disabled={!!loading}
                      className="w-full rounded-full px-6 py-3"
                    >
                      {loading === plan.id ? "Opening…" : plan.cta}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {inlineCheckoutUrl && (
            <div className="mt-10 rounded-xl border border-zinc-700 bg-zinc-900/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Complete your payment</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeInlineCheckout}
                  className="text-zinc-400 hover:text-white shrink-0"
                  aria-label="Close checkout"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div
                id={INLINE_CONTAINER_ID}
                className="min-h-[420px] w-full"
              />
              <p className="mt-4 text-center text-xs text-zinc-500">
                Secure checkout by Dodo Payments. You can close this and return to plans anytime.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-zinc-500">
            Payments powered by Dodo Payments. After payment we store your plan; use the same session or pass
            payment_id for API gating.
          </p>
        </div>
      </PageTransition>
    </main>
  )
}
