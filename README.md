# Ad Funnel Tracker

Paid ad campaigns organized by **cloud → product → ad platform → campaign**, viewed as a thread.

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## How it's structured

- **Clouds** are fixed: Shipping, Marketing, Conversion, Reverse Logistics. Edit them in `src/lib/seed.ts`.
- **Products** live inside a cloud. Add them from the cloud page.
- **Platforms** are a shared catalog. Add new ones inline while creating a campaign, or from the `⋯` menu → Manage platforms.
- **Campaigns** hang off a product and a platform, and carry a funnel stage (Awareness / Consideration / Conversion / Retention), a status, and optional objective, budget, audience, landing page, and notes.

A platform only appears in a product's thread once it has at least one campaign there.

## Where the data lives

Everything is in the browser's `localStorage` under `ad-funnel-tracker:v1`. There is no database and no account.

**This means data does not travel.** Each browser, each device, and each deployment holds its own separate copy. Your laptop's data will not appear on a deployed URL, and vice versa. To move it, use `⋯` → **Export JSON** on the source and **Import JSON** on the destination.

If you outgrow that, `src/lib/store.tsx` is the only file that touches persistence, so swapping in a real backend is a contained change.

## Deploying with a password

`src/proxy.ts` gates the whole site behind HTTP Basic auth. It is driven by two env vars:

| Variable | Required | Default |
| --- | --- | --- |
| `SITE_PASSWORD` | yes, to enable the gate | none |
| `SITE_USER` | no | `redo` |

**With `SITE_PASSWORD` unset the gate is off.** That keeps local dev frictionless and makes a misconfigured deploy fail open rather than locking you out, so always confirm the variable is set on the host.

To deploy on Vercel's free tier:

1. Go to https://vercel.com/new and import `RedoMarketing/ad-funnel`.
2. Under **Environment Variables**, add `SITE_PASSWORD` with a password of your choice.
3. Deploy. The browser will prompt for a username and password on first visit. Username is `redo` unless you also set `SITE_USER`.

Because it is HTTP Basic auth, the browser caches the credentials for the session, so you enter them once per browser.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (new-york, neutral) · TypeScript
