import { NextResponse } from "next/server";

/**
 * Placeholder validate endpoint for DevKit project keys.
 * Use this URL in your server SDK configuration (e.g. appId validation).
 * For demo purposes, any appId is accepted.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  return NextResponse.json({
    valid: true,
    appId: appId ?? null,
    message: "Use this endpoint in your server SDK configuration.",
  });
}
