# Orbit Onboarding

Stellar onboarding experience — “Choose your path” (Cascade-style) for [Orbit](https://orbitkit.fun).

**In-repo:** The main Orbit app (`ui`) also serves onboarding at **`/onboarding`** (and `/onboarding/beginners`, `/onboarding/explore`, `/onboarding/developers`) so you can build and test in one place. The nav “Onboarding” link points there until you deploy this app to a subdomain.

## Run locally

From repo root:

```bash
npm run dev:onboarding
```

Or from this folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to a subdomain (Vercel)

1. Create a **new Vercel project** for this app (same repo).
2. Set **Root Directory** to **`onboarding`**.
3. Deploy. You get a URL like **`onboarding-xyz.vercel.app`** (or your project name).
4. **Custom subdomain:** In Vercel → Project → Settings → Domains, add:
   - **`onboarding.orbitkit.fun`** (if you own orbitkit.fun), or
   - **`onboarding.orbitkit.vercel.app`** is not a default Vercel pattern — Vercel gives you `*.vercel.app` per *project* (e.g. `orbit-onboarding.vercel.app`). To get `onboarding.orbitkit.vercel.app` you’d need to add a custom domain `orbitkit.vercel.app` at the team/account level and then use subdomains; typically you’d use **`onboarding.orbitkit.fun`** or the project’s default **`<project-name>.vercel.app`**.

After deployment, point the main app’s nav “Onboarding” link to your chosen URL (e.g. `https://onboarding.orbitkit.fun`).

## Standalone / move to another repo

This app has no dependency on other packages in the monorepo. To move it to its own repository:

1. Copy the `onboarding` folder (or its contents) into a new repo.
2. Run `npm install` and `npm run build` in that repo.
3. Deploy with Root Directory = repo root.
