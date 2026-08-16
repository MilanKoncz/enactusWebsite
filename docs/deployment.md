# Deployment

Hosting, environment variables, and the domain — the minimum needed to stand
the site up. Backend provisioning (Neon, Resend) lands with Phase 2/4; this
covers what's already true today.

## Hosting

Vercel, region `fra1` (Frankfurt). Configured via `next.config.ts` and the
`next-intl` plugin — no extra Vercel-side routing config needed.

## Environment variables

Copy `.env.example` to `.env.local` for local development. See that file for
the full list and current values.

- `NEXT_PUBLIC_SITE_URL` — absolute origin used by `sitemap.ts`, `robots.ts`,
  OG images, and hreflang alternates. Local/example value is
  `https://www.enactus-mannheim.com` — the old Webflow site's domain, carried
  over as the working assumption until the board confirms whether the new
  site keeps it. Not yet set in Vercel's project settings (see
  `ASSETS-TODO.md`); `src/lib/siteUrl.ts` falls back to Vercel's own
  deployment URL, then to `localhost`, rather than guessing a domain at
  runtime.
- `DATABASE_URL`, `RESEND_API_KEY`, `APPLICATION_RECIPIENT_EMAIL` — unset
  until Phase 2's backend provisioning (Neon `eu-central-1`, Resend EU
  region). Do not build against mocks in the meantime.

## Domain

No production domain is set in Vercel yet. Once the board confirms one,
set `NEXT_PUBLIC_SITE_URL` in the Vercel project's environment variables —
the code itself needs no change.
