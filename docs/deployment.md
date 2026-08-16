# Deployment

Hosting, environment variables, the domain, and the database/mail backend —
the minimum needed to stand the site up and keep it running.

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
- `DATABASE_URL` — Neon connection string, `eu-central-1` (Frankfurt).
  Required at runtime by every route in `app/api/`, but never read at
  module scope (`lib/db.ts` builds its client lazily) — `next build` stays
  green with this unset, since Next collects route metadata without
  running a request handler. Only a real deployment (or `npm run
  db:migrate` / `npm run db:verify`) actually needs it present.
- `RESEND_API_KEY` — Resend API key, EU-region sending. Same lazy-read
  contract as `DATABASE_URL`, in `lib/mail.ts`.
- `APPLICATION_RECIPIENT_EMAIL` — mailbox that receives the PDF for every
  new application (`info@unimannheim.enactus.team`).
- `RESEND_FROM_EMAIL` — sender address on every outgoing mail
  (`bewerbung@enactus-mannheim.com`). Resend only accepts sends from
  `enactus-mannheim.com`, the one domain verified there — a different
  sending domain will fail at send time, not at build time.
- `RESEND_REPLY_TO_EMAIL` — Reply-To on every outgoing mail
  (`info@unimannheim.enactus.team`) — a real, actively read inbox, not the
  sending address above. Also where `/api/kontakt` forwards contact
  messages.
- `CRON_SECRET` — shared secret `/api/cron/cleanup` checks against the
  `Authorization: Bearer <value>` header. Vercel sends that header
  automatically once this variable is set as a project env var (see
  "Scheduled cleanup" below); with it unset, the route rejects every
  request rather than running unauthenticated.
- `VERCEL_ENV` — **not** in `.env.example`: this is a Vercel System
  Environment Variable, only ever set by Vercel itself, never by hand. It
  gates indexing (`docs/engineering.md`'s SEO section,
  `lib/productionDeployment.ts`) — the real site is only crawlable when this
  is `production` *and* the request host is the confirmed production
  domain. Both `robots.ts` and `proxy.ts` read it server-side, where Vercel
  always populates it with no project configuration required — unlike its
  `NEXT_PUBLIC_` counterpart, it needs no "Automatically expose System
  Environment Variables" setting turned on.

## Domain

No production domain is set in Vercel yet. Once the board confirms one,
set `NEXT_PUBLIC_SITE_URL` in the Vercel project's environment variables —
the code itself needs no change. If the confirmed domain ends up being
something other than `enactus-mannheim.com` / `www.enactus-mannheim.com`,
also update `PRODUCTION_HOSTS` in `lib/productionDeployment.ts` — that's a
separate, deliberately hardcoded list (not derived from
`NEXT_PUBLIC_SITE_URL`), so an unset or misconfigured site URL can never
accidentally widen which hosts are allowed to be indexed.

## Database

Schema lives in `migrations/*.sql`, applied in filename order by
`scripts/migrate.mjs` — there's no migration framework installed, the
schema is small enough that numbered `.sql` files plus that runner are the
whole tool. `lib/db.ts` is the only file that writes SQL; every route in
`app/api/` goes through its typed functions, never a raw query.

```
npm run db:migrate   # applies any migration not yet in schema_migrations
npm run db:verify    # writes/reads/deletes one throwaway row per table
```

Both read `.env.local` via Node's `--env-file` flag — copy `.env.example`
first. Run `db:verify` after every schema change and before trusting a
deploy: it's a real write against the real database, not a mock, and it's
what confirms the driver and the schema actually agree with each other.

## Scheduled cleanup

`content/retention.ts` states how long each table keeps a row; nothing
enforces that on its own — `/api/cron/cleanup` does, once a day, deleting
whatever `lib/retentionCutoff.ts` says has expired. Wired up two ways,
not as alternatives to each other but as a primary path and a fallback:

1. **Vercel Cron** (`vercel.json`) calls the route once a day at 03:00 UTC
   with `Authorization: Bearer $CRON_SECRET`. Vercel's Hobby plan allows up
   to two cron jobs at daily granularity, so this fits without a paid plan
   — but Cron itself still has to be confirmed working after the first
   deploy (Vercel's dashboard shows recent cron invocations under the
   project's "Cron Jobs" tab).
2. **`npm run db:cleanup`** calls the same route over HTTP by hand — against
   a local `npm run build && npm run start` by default, or against
   production with `CLEANUP_URL=https://www.enactus-mannheim.com npm run
   db:cleanup`. Requires `CRON_SECRET` in `.env.local` to match whatever's
   set in Vercel. Use this if Cron turns out to be unavailable for this
   project, or just to check the routine ran correctly.

Retention periods themselves are stated in `content/retention.ts` with a
`confirmedByBoard: false` flag on each one — set, not a placeholder, but
still awaiting the board's sign-off. Update the numbers there (and the
matching `Datenschutz` copy in `src/messages/{de,en}.json`) once confirmed,
not in the cleanup route itself.
