# Dodo Payments setup (Pricing / subscription)

The Pricing page uses [Dodo Payments](https://dodopayments.com) for checkout. Configure the following so checkout and verification work.

## 1. API key (required)

- **Env name:** `DODO_PAYMENTS_API_KEY`
- **Where:** [Dodo Dashboard](https://app.dodopayments.com/) → **Developer** → **API Keys**
- **What:** Create an API key with **write access** so the app can create checkouts and read payments.
- **Important:** API keys are **per-environment**. For local/dev (default `test_mode`):
  1. In the dashboard, **switch to Test mode** (toggle in the UI).
  2. Then go to **Developer** → **API Keys** → **Add API Key**.
  3. Enable **Write access** (required for creating checkouts).
  4. Copy the key and add it to `ui/.env.local` (if you run the app from the `ui/` folder).
- Add to `.env.local`:
  ```bash
  DODO_PAYMENTS_API_KEY=your_secret_key_here
  ```
  No quotes around the key. Restart the dev server after changing `.env.local`.

## 2. Product IDs (required for paid plans)

You must create **two one-time payment products** in the Dodo dashboard (one for Builder, one for Pro), then set their IDs in env.

- **Where:** Dashboard → **Products** → create two products (e.g. "Stellar DevKit – Builder", "Stellar DevKit – Pro") with your desired price and currency (e.g. ₹499 / ₹999).
- **Env names:**
  - `DODO_PAYMENTS_PRODUCT_BUILDER` = product ID for the Builder plan (e.g. `prod_xxx`)
  - `DODO_PAYMENTS_PRODUCT_PRO` = product ID for the Pro plan (e.g. `prod_yyy`)
- Add to `.env.local`:
  ```bash
  DODO_PAYMENTS_PRODUCT_BUILDER=prod_xxxxxxxx
  DODO_PAYMENTS_PRODUCT_PRO=prod_yyyyyyyy
  ```

## 3. Environment (test vs live)

- **Env name:** `DODO_PAYMENTS_ENVIRONMENT`
- **Values:** `test_mode` (default) or `live_mode`
- Use `test_mode` while developing; switch to `live_mode` for production.
- Optional; defaults to `test_mode` if unset.

## 4. Return URL base (recommended for production)

- **Env name:** `NEXT_PUBLIC_APP_URL`
- **What:** Full origin of your app (e.g. `https://yourdomain.com`). Used as the base for the checkout `return_url` so after payment users are sent back to your site.
- If unset, the app uses the request origin (fine for localhost; set this in production).

## 5. Webhook secret (optional but recommended)

Used to verify `payment.succeeded` webhooks and activate plans even if the user closes the browser before the success page loads.

- **Env name:** `DODO_PAYMENTS_WEBHOOK_SECRET`
- **Where:** Dashboard → **Settings** → **Webhooks** → Add endpoint → **URL:** `https://yourdomain.com/api/dodo/webhook` → subscribe to **payment.succeeded** → copy the **Signing secret**.
- Add to env:
  ```bash
  DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxxxxxxx
  ```

---

## Summary: env vars to add

| Variable | Required | Description |
|----------|----------|-------------|
| `DODO_PAYMENTS_API_KEY` | Yes | API key from Developer → API Keys (write access). |
| `DODO_PAYMENTS_PRODUCT_BUILDER` | Yes | Product ID for Builder plan (create in Products). |
| `DODO_PAYMENTS_PRODUCT_PRO` | Yes | Product ID for Pro plan (create in Products). |
| `DODO_PAYMENTS_ENVIRONMENT` | No | `test_mode` (default) or `live_mode`. |
| `NEXT_PUBLIC_APP_URL` | Recommended (prod) | App origin, e.g. `https://yourdomain.com`. |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | No | Webhook signing secret for `/api/dodo/webhook`. |

After setting these, the Pricing page will create Dodo checkouts and verify payments; with the webhook configured, plans are also activated when Dodo sends `payment.succeeded`.

## 6. SDK access (plan bound to API key)

SDK API routes (swap, lending, price, send, balance) only work for **registered App IDs that have an active plan**. After payment:

1. Create a project in **DevKit** to get your **App ID**.
2. On the **Pricing** success page, enter that App ID and click **Link plan**. This binds your payment to the App ID.
3. Use the same App ID in requests: send header **`x-app-id: <your-app-id>`** (or `Authorization: Bearer <your-app-id>`) when calling the SDK APIs. In your own app you can put the App ID in env as `STELLAR_DEVKIT_APP_ID` and pass it in the header.
4. Validate endpoint: `GET /api/v1/validate?appId=<your-app-id>` returns `valid: true` only when the App ID is registered and has a linked Builder or Pro plan.
