# Ad Funnel Tracker

Paid ad campaigns organized by **cloud → product → ad platform → campaign**, viewed as a thread.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `SUPABASE_SECRET_KEY` in `.env.local` (Supabase dashboard → Project Settings → API keys → `service_role`), then:

```bash
npm run dev
```

Without the key the app loads and tells you it can't reach Supabase, rather than crashing.

## How it's structured

- **Clouds** are fixed: Shipping, Marketing, Conversion, Reverse Logistics. They live in `funnel_clouds`.
- **Products** live inside a cloud. Add them from the cloud page.
- **Platforms** are a shared catalog. Add new ones inline while creating a campaign, or from the `⋯` menu → Manage platforms.
- **Campaigns** hang off a product and a platform, and carry a funnel stage (Awareness / Consideration / Conversion / Retention), a status, and optional objective, budget, audience, landing page, and notes.

A platform only appears in a product's thread once it has at least one campaign there.

## Data

Everything lives in Supabase project **Redo Brand Book** (`jjezreqahluvohgxpoma`), in four `funnel_`-prefixed tables that sit alongside that project's existing `videos` table:

| Table | Notes |
| --- | --- |
| `funnel_clouds` | Fixed list, seeded |
| `funnel_products` | FK to cloud, cascades to campaigns on delete |
| `funnel_platforms` | Shared catalog, unique on `lower(name)` |
| `funnel_campaigns` | FK to product and platform, `stage` and `status` are CHECK-constrained |

Because it's a real database, the data is shared across every browser and device rather than trapped in one.

### Security

All four tables have **RLS enabled with no policies**, so `anon` and `authenticated` are denied everything. The only way in is the secret `service_role` key, which is used exclusively in Server Actions (`src/lib/actions.ts`) behind a `server-only` import guard, so it never reaches the browser.

This matters because the project is shared. Its publishable key ships in the brand book app's client bundle and grants full CRUD on `videos`, so anything readable by that key is effectively public. The funnel tables deliberately are not.

Verified: that key returns zero rows on `funnel_products` and gets `42501 row-level security policy` on an insert.

## Viewing it as a GitHub link (Codespaces)

GitHub Pages cannot host this: it is static-only, and the app needs a server to
hold the Supabase secret key. A static build would put a database key in the
browser and could not enforce a password.

Codespaces can, and the forwarded URL is private to your GitHub account:

1. Add the secret once: repo **Settings → Secrets and variables → Codespaces →
   New secret**, named `SUPABASE_SECRET_KEY`.
2. On the repo page, **Code → Codespaces → Create codespace on main**.
3. It installs and starts the dev server on its own. Open the forwarded port 3000
   link (the **Ports** tab, or the popup).

The URL looks like `https://<name>-3000.app.github.dev` and returns 404 for
anyone not signed in as you, so GitHub auth is the password. `.devcontainer/`
sets port 3000 to `private` visibility to keep it that way.

**Caveat:** a codespace is not always-on. It suspends after about 30 minutes idle
and the link goes dead until you reopen it. Fine for checking your own data, not
for sharing a live dashboard. Free personal accounts get 120 core-hours a month.

## Deploying somewhere always-on

Any host that runs a Node server works (Netlify, Cloudflare Pages, Render,
Railway, Fly). All of them need an interactive login, so this step is manual.

`src/proxy.ts` gates the site behind HTTP Basic auth. Next 16 renamed the
`middleware` convention to `proxy`.

| Variable | Required | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | none |
| `SUPABASE_SECRET_KEY` | yes | none |
| `SITE_PASSWORD` | enables the gate | none |
| `SITE_USER` | no | `redo` |

**With `SITE_PASSWORD` unset the gate is off.** That keeps local dev frictionless
and stops a misconfigured deploy from locking you out, so confirm it is set on
the host.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (new-york, neutral) · Supabase · TypeScript
