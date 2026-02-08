/**
 * Minimal x402 API – premium route gated by Stellar payment.
 */
import express from "express";
import { x402 } from "x402-stellar-sdk/server";

const app = express();
app.use(express.json());

const destination = process.env.X402_DESTINATION || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2X";
const network = (process.env.NETWORK === "mainnet" ? "mainnet" : "testnet") as "mainnet" | "testnet";

app.use(
  "/api/premium",
  x402({
    price: "1",
    assetCode: "XLM",
    network,
    destination,
    memo: "premium-api",
  })
);

app.get("/api/premium", (_req, res) => {
  res.json({ data: "Premium content – payment verified." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`x402 API at http://localhost:${port}`));
