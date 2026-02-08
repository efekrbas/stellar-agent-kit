# Publishing to npm

This guide covers publishing the four packages to npm and getting them to work for users.

---

## Before you publish

1. **Set the repository URL**  
   In each package’s `package.json`, replace `https://github.com/codewmilan/stellar-agent-kit.git` with your real repo URL (e.g. `https://github.com/YOUR_ORG/stellar-agent-kit.git`). You can do this once in the root and keep the monorepo link.

2. **Create an npm account**  
   Sign up at [npmjs.com](https://www.npmjs.com/signup) if you don’t have one.

3. **Login from the CLI**
   ```bash
   npm login
   ```
   Use your npm username, password, and (if enabled) OTP.

4. **Check package names**  
   These names must be free on npm (or under your scope):
   - `stellar-agent-kit`
   - `x402-stellar-sdk`
   - `create-stellar-devkit-app`
   - `stellar-devkit-mcp`  

   If a name is taken, use a scope, e.g. `@yourusername/stellar-agent-kit`, and set that in the package’s `"name"` and run `npm publish --access public` (required for scoped packages).

---

## Build and publish (from repo root)

### 1. Build all packages

```bash
npm run build
```

This builds:

- `packages/stellar-agent-kit` → `dist/`
- `packages/x402-stellar-sdk` → `dist/`
- `packages/create-stellar-devkit-app` → `dist/` (and keeps `templates/`)
- `packages/stellar-devkit-mcp` → `dist/`

### 2. Publish each package

Each package has `prepublishOnly: "npm run build"`, so publishing will run a fresh build in that package before uploading. You can publish from the repo root using `--workspaces` or by `cd`-ing into each package.

**Option A – Publish from root (recommended)**

```bash
npm publish -w stellar-agent-kit --access public
npm publish -w x402-stellar-sdk --access public
npm publish -w create-stellar-devkit-app --access public
npm publish -w stellar-devkit-mcp --access public
```

**Option B – Publish from each package**

```bash
cd packages/stellar-agent-kit && npm publish --access public && cd ../..
cd packages/x402-stellar-sdk && npm publish --access public && cd ../..
cd packages/create-stellar-devkit-app && npm publish --access public && cd ../..
cd packages/stellar-devkit-mcp && npm publish --access public && cd ../..
```

(`--access public` is required for unscoped packages that are public; scoped packages default to restricted so use `--access public` if you want them public.)

#### If you get `403 Forbidden` (two-factor authentication required)

npm requires either:

- **Interactive 2FA:** Enable 2FA on your account at [npmjs.com](https://www.npmjs.com) → Account → Enable 2FA. Then run `npm publish` from a terminal; npm will prompt for your one-time password (OTP).
- **Automation / granular token:** Create a token that can publish without a prompt:
  1. On npmjs.com: Account → Access Tokens → Generate New Token.
  2. Choose “Granular Access Token” (or “Automation”).
  3. Set permissions to allow publishing; enable **“Bypass 2FA for publish”** (or use Automation type).
  4. Run `npm config set //registry.npmjs.org/:_authToken=YOUR_TOKEN` (or set `NPM_TOKEN` in CI).

After that, run the same `npm publish -w <package> --access public` again.

### 3. Version bumps

- To release a new version, bump `version` in the relevant `package.json` (e.g. `1.0.1`), then run the same publish command again.
- For a monorepo you can use something like [changesets](https://github.com/changesets/changesets) later; for now, manual bump + publish is enough.

---

## After publishing – getting it to work (for users)

### Install from npm

**SDK (swap, quote, send in your own app)**

```bash
npm install stellar-agent-kit
```

```ts
import { StellarAgentKit, MAINNET_ASSETS } from "stellar-agent-kit";

const agent = new StellarAgentKit(process.env.SECRET_KEY!, "testnet");
await agent.initialize();

const quote = await agent.dexGetQuote(
  { contractId: MAINNET_ASSETS.XLM.contractId },
  { contractId: MAINNET_ASSETS.USDC.contractId },
  "10000000"
);
const result = await agent.dexSwap(quote);
console.log(result.hash);
```

**x402 (payment-gated APIs)**

```bash
npm install x402-stellar-sdk
```

Use `x402` from `x402-stellar-sdk/server` and `x402Fetch` from `x402-stellar-sdk/client` as in DEVKIT_README.md.

**Scaffold a new app**

```bash
npx create-stellar-devkit-app my-app
cd my-app
cp .env.example .env
# Edit .env: SECRET_KEY, SOROSWAP_API_KEY (for swap execute)
npm install
npm run dev
```

**MCP server (for Claude / LLM tools)**

```bash
npm install -g stellar-devkit-mcp
# Or: npx stellar-devkit-mcp
```

Then point your MCP client at the `stellar-devkit-mcp` command (stdio). No need to clone the repo.

---

## Env vars (so it works end-to-end)

| Variable            | Where        | Purpose |
|---------------------|-------------|--------|
| `SECRET_KEY`        | Server/CLI  | Stellar secret key (S...) for agent/swap execute. Never expose in the browser. |
| `SOROSWAP_API_KEY`  | Server/API  | Required for **building and executing** swaps. Quote-only works without it. Get from [SoroSwap](https://soroswap.finance). |
| `OPENAI_API_KEY`    | CLI only    | For `node dist/index.js agent` (chat with tools). |
| `NETWORK`           | Optional    | `testnet` or `mainnet`; defaults vary by app. |

For the **Warly UI** in this repo (swap/send), set `SOROSWAP_API_KEY` in `ui/.env.local` so the Swap page can build and submit transactions.

---

## Troubleshooting

- **“Package name already taken”**  
  Use a scoped name (e.g. `@yourusername/stellar-agent-kit`) and publish with `npm publish --access public`.

- **“Cannot find module” after install**  
  Ensure the package’s `files` includes `dist` (and `templates` for the CLI). All four packages are already configured with the right `files`.

- **CLI “Templates directory not found”**  
  When using `npx create-stellar-devkit-app`, the package is run from the npm cache; the CLI looks for `templates` next to `dist`. The published tarball must include `templates` (see `create-stellar-devkit-app`’s `"files": ["dist", "templates"]`). If you see this, re-publish and ensure `templates` is not in `.npmignore`.

- **403 Forbidden on publish**  
  Run `npm login` again; for scoped packages, ensure your account is allowed to publish under that scope.

---

## Quick checklist

- [ ] Set real `repository.url` in each package (or leave as-is for a fork).
- [ ] `npm login`.
- [ ] `npm run build` at repo root.
- [ ] Publish: `npm publish -w stellar-agent-kit --access public` (and same for the other three).
- [ ] Test install: `npm install stellar-agent-kit` in a new folder and run a small script.
- [ ] Test CLI: `npx create-stellar-devkit-app test-app` and run the app with the right env vars.

After that, “publish to npm and getting it to work” is done for all four packages.
