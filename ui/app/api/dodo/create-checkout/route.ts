import DodoPayments from "dodopayments"
import { NextResponse } from "next/server"

function getConfig() {
  const rawKey = process.env.DODO_PAYMENTS_API_KEY
  const apiKey =
    typeof rawKey === "string"
      ? rawKey.trim().replace(/^["']|["']$/g, "")
      : ""
  const env = (
    process.env.DODO_PAYMENTS_ENVIRONMENT ||
    "test_mode"
  )
    .trim()
    .toLowerCase()
  const environment =
    env === "live_mode" ? ("live_mode" as const) : ("test_mode" as const)
  return {
    apiKey,
    environment,
    productIds: {
      builder: (process.env.DODO_PAYMENTS_PRODUCT_BUILDER || "").trim(),
      pro: (process.env.DODO_PAYMENTS_PRODUCT_PRO || "").trim(),
    },
  }
}

export async function POST(req: Request) {
  const { apiKey, environment, productIds } = getConfig()

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Dodo Payments not configured",
        details:
          "DODO_PAYMENTS_API_KEY is missing or empty. Add it to .env.local (in the ui folder if you run from ui/) and restart the dev server.",
      },
      { status: 500 }
    )
  }

  let body: { planId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const planId = (body.planId || "").toLowerCase()
  if (planId !== "builder" && planId !== "pro") {
    return NextResponse.json(
      { error: "Invalid planId. Use 'builder' or 'pro'." },
      { status: 400 }
    )
  }
  const productId = productIds[planId as keyof typeof productIds]
  if (!productId) {
    return NextResponse.json(
      {
        error: `Product not configured for plan '${planId}'. Set DODO_PAYMENTS_PRODUCT_BUILDER and DODO_PAYMENTS_PRODUCT_PRO in .env.local.`,
      },
      { status: 500 }
    )
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || ""
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (origin ? new URL(origin).origin : "http://localhost:3000")
  const returnUrl = `${appBaseUrl}/pricing`

  try {
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment,
    })

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: returnUrl,
      metadata: { plan_id: planId },
    })

    const checkoutUrl =
      session && typeof session === "object" && "checkout_url" in session
        ? (session as { checkout_url?: string | null }).checkout_url
        : null

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: "No checkout URL returned from Dodo Payments",
          details:
            "Create session succeeded but checkout_url was missing. Check your Dodo product configuration.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      checkoutUrl,
      sessionId:
        session && typeof session === "object" && "session_id" in session
          ? (session as { session_id?: string }).session_id
          : undefined,
      planId,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err)
    const status = err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined
    console.error("[create-checkout] Dodo SDK error:", status, message, err)

    const isAuthError = status === 401 || status === 403
    const devHint =
      process.env.NODE_ENV === "development"
        ? ` Key length in env: ${apiKey.length}.`
        : ""

    const authChecklist = isAuthError
      ? [
          "Dodo keys are per-environment: use a key created in Test mode for test.dodopayments.com (our default).",
          "In Dodo Dashboard: switch to Test mode (toggle), then Developer → API Keys → Add API Key.",
          "Create the key with 'Write access' enabled (required for creating checkouts).",
          "Paste the key into ui/.env.local as DODO_PAYMENTS_API_KEY (no quotes), then restart the dev server.",
        ].join(" ")
      : ""

    return NextResponse.json(
      {
        error: "Checkout creation failed",
        details: isAuthError
          ? `Dodo returned ${status}. ${authChecklist}${devHint} Raw: ${message}`
          : message,
      },
      { status: 502 }
    )
  }
}
