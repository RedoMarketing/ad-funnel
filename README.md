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

## Deploying with a password

`src/proxy.ts` gates the site behind HTTP Basic auth. Next 16 renamed the `middleware` convention to `proxy`.

| Variable | Required | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | none |
| `SUPABASE_SECRET_KEY` | yes | none |
| `SITE_PASSWORD` | enables the gate | none |
| `SITE_USER` | no | `redo` |

**With `SITE_PASSWORD` unset the gate is off.** That keeps local dev frictionless and stops a misconfigured deploy from locking you out, so confirm it's set on the host.

To deploy on Vercel's free tier:

1. Import `RedoMarketing/ad-funnel` at https://vercel.com/new
2. Add all four environment variables
3. Deploy

The browser prompts once per session for username `redo` and your password.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (new-york, neutral) · Supabase · TypeScript
