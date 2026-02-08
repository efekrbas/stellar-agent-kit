"use client";

import { useState } from "react";

export default function Home() {
  const [quote, setQuote] = useState<{ in: string; out: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = async () => {
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/quote");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setQuote({ in: data.amountIn ?? "", out: data.amountOut ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Stellar Agent Kit</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Starter app. Set <code>SECRET_KEY</code> and <code>SOROSWAP_API_KEY</code> in{" "}
        <code>.env</code>, then run <code>npm run dev</code>.
      </p>
      <button
        type="button"
        onClick={getQuote}
        disabled={loading}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Loading…" : "Get XLM → USDC quote (1 XLM)"}
      </button>
      {error && <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>}
      {quote && (
        <pre style={{ marginTop: 16, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
          {JSON.stringify(quote, null, 2)}
        </pre>
      )}
    </div>
  );
}
