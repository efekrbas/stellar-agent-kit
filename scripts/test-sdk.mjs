#!/usr/bin/env node
/**
 * Quick test: stellar-agent-kit loads and can initialize (and optionally get a quote).
 * From repo root: node scripts/test-sdk.mjs
 * Set SECRET_KEY and SOROSWAP_API_KEY for full quote test (optional).
 */
import { StellarAgentKit, TESTNET_ASSETS } from "../packages/stellar-agent-kit/dist/index.js";

const secret = process.env.SECRET_KEY || "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD";
async function main() {
  console.log("1. Loading stellar-agent-kit... OK");
  const agent = new StellarAgentKit(secret, "testnet");
  await agent.initialize();
  console.log("2. StellarAgentKit.initialize()... OK");
  if (process.env.SOROSWAP_API_KEY) {
    const quote = await agent.dexGetQuote(TESTNET_ASSETS.XLM, TESTNET_ASSETS.USDC, "10000000");
    console.log("3. dexGetQuote(XLM, USDC, 1)... OK", quote?.protocol ? `(${quote.protocol})` : "");
  } else {
    console.log("3. dexGetQuote... SKIP (set SOROSWAP_API_KEY to test)");
  }
  console.log("Done. stellar-agent-kit works.");
}
main().catch((e) => { console.error(e); process.exit(1); });
