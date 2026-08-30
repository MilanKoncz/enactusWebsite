# Deployment

Hosting, environment variables, the domain, and the database/mail backend —
the minimum needed to stand the site up and keep it running.

## Hosting

Vercel, region `fra1` (Frankfurt). Configured via `next.config.ts` and the
`next-intl` plugin — no extra Vercel-side routing config needed.

## Security headers

`src/lib/securityHeaders.ts`, applied via `next.config.ts`'s `headers()` to
every route including `/api/*` — `proxy.ts`'s matcher deliberately excludes
`/api` (locale rewriting has no business running there), so this is the one
place a header can reach both the public pages and the API routes.

Content-Security-Policy, `X-Frame-Options: DENY`, `Referrer-Policy`,
`X-Content-Type-Options: nosniff`, a locked-down `Permissions-Policy`, and
`Strict-Transport-Security`. The CSP allows `'unsafe-inline'` for both
`script-src` and `style-src` — deliberate, not an oversight: a nonce-based
CSP would force every page onto dynamic rendering (a per-request nonce has
to come from somewhere request-scoped, i.e. middleware), directly against
the LCP budget above, and Radix UI / `motion` position and animate elements
via inline `style` attributes that no nonce can ever cover regardless.
`frame-src`/`img-src` carry the two YouTube hosts the click-to-load facade
needs (`youtube-nocookie.com`, `i.ytimg.com`); everything else is `'self'`.

After any change here, load a representative set of pages in a real browser
(or `node`-drive one with Playwright) and check the console for CSP
violations before trusting the change — `tests/unit/lib/securityHeaders.test.ts`
only asserts the header strings, not that a real page actually respects them.

## Environment variables

Copy `.env.example` to `.env.local` for local development. See that file for
the full list and current values.

- `NEXT_PUBLIC_SITE_URL` — absolute origin used by `sitemap.ts`, `robots.ts`,
  OG images, hreflang alternates, and every mail that embeds a link
  (confirmation, unsubscribe). **Confirmed set in Vercel Production**
  (verified 2026-08-30 via a real request: `sitemap.xml` and the
  `/api/reminder/abmelden` redirect both resolve to
  `https://www.enactus-mannheim.com`, not a `*.vercel.app` URL). It must
  also be present in `.env.local` for local development — it is **not**
  part of the Neon integration's `vercel env pull` that generates the rest
  of that file, so a fresh checkout can miss it entirely. When it's missing,
  `src/lib/siteUrl.ts` falls back to Vercel's own deployment URL, then to
  `http://localhost:3000` — and does so silently except for a one-per-process
  `console.warn`. This has already happened once: a `localhost` link went
  out in a real, already-sent reminder confirmation mail on 2026-08-30.
  `npm run mail:test` also warns if this variable is missing.
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
- `ADMIN_PASSWORD` — gates `/admin/bewerbungen`, the board's application
  list. Compared in constant time (`lib/adminAuth.ts`), behind the same
  rate limiting as the public forms. **Must be set in Vercel** (all
  environments the admin page should be reachable from) — with it unset,
  `/api/admin/login` rejects every request rather than falling open. Must be
  genuinely random (`openssl rand -hex 24`), shared via the board's password
  manager rather than spoken — see `ADMIN_SESSION_SECRET` below for why a
  weak, human-memorable password here is directly attackable.
- `ADMIN_SESSION_SECRET` — the HMAC key that signs the admin session cookie,
  deliberately a separate variable from `ADMIN_PASSWORD`. The cookie's
  content (an expiry timestamp) is public, so a valid cookie is effectively
  a plaintext/signature pair; if it were signed with `ADMIN_PASSWORD`
  itself, anyone who obtained a valid cookie (a shared board laptop, a
  browser profile backup, malware) could brute-force the password offline
  at GPU speed — HMAC-SHA256 is fast by design and gives no resistance to
  that on its own. A dedicated secret means a leaked cookie reveals nothing
  about the password. **Must be set in Vercel** (all environments the admin
  page should be reachable from) — with it unset, no session cookie can be
  issued or verified, and `/admin/bewerbungen` is unreachable even with the
  correct password. Generate with `openssl rand -hex 32`; unlike
  `ADMIN_PASSWORD`, nobody ever types this, so there's no tension between
  "random" and "memorable" to resolve.
- `FORM_TOKEN_SECRET` — signs the application form's anti-spam timing token
  (`lib/formToken.ts`). `GET /api/bewerbung/token` issues one to anyone
  loading `/mitmachen`, and `POST /api/bewerbung` verifies it before
  accepting a submission — replaces a client-supplied timestamp that a
  script could set to anything at all. Deliberately its own variable rather
  than derived from `ADMIN_SESSION_SECRET`: this token is handed to every
  visitor of a public page, and tying it to the secret that gates applicant
  data would be the same purpose-mixing mistake `ADMIN_SESSION_SECRET`
  exists to avoid, just moved one level down. **Must be set in Vercel** (all
  environments `/mitmachen` should accept applications from) — with it
  unset, every submission is silently rejected the same way a genuinely
  too-fast one is, indistinguishable from a bot being blocked. Generate with
  `openssl rand -hex 32`.
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

`www.enactus-mannheim.com` is the confirmed production domain — see
`NEXT_PUBLIC_SITE_URL` above. If it ever changes, set the new value in the
Vercel project's environment variables — the code itself needs no change —
and also update `PRODUCTION_HOSTS` in `lib/productionDeployment.ts`, a
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

## Mail

Every send goes through `lib/mail.ts` and Resend. Nothing in the send path
is read at module scope, so a missing variable is a **runtime** failure, not
a build failure: `next build` stays green with the whole Resend
configuration unset, and the first sign of trouble is mail silently not
arriving.

Silently is not quite right, though — it is recorded. All three form routes
write to Postgres *before* attempting a send, and a failed send is stored on
the row rather than surfaced to the sender, who is told their message went
through, because it did.

**Look at `/admin/mails` first.** It lists every failed record across all
three tables with the provider's own error and a per-record "resend", which
is faster and safer than a manual query. The SQL below is the fallback when
the admin page itself can't be reached:

```sql
select mail_status, mail_error, created_at from contact_messages
order by created_at desc limit 20;
```

`mail_status` is `pending`, `sent`, or `failed`; `mail_error` holds the
provider's or the code's own message. That column distinguishes "never
reached the mail layer" from "Resend rejected it" without guessing.

To test the delivery path itself:

```
npm run mail:test                    # to RESEND_REPLY_TO_EMAIL
npm run mail:test someone@example.com
```

It sends one real mail with the same `from`, `replyTo`, and account the
contact form uses, then reads the message back from Resend and prints its
`last_event`, so an accepted-but-bounced send is visible too. It checks every
required variable first and stops with a readable list if any is missing,
and it warns if `RESEND_FROM_EMAIL` is not on `enactus-mannheim.com` — the
only domain verified with Resend, so a sender on any other domain is
rejected by the API.

Setting the variables in `.env.local` only fixes local runs. Preview and
Production read Vercel's project environment variables, and each Vercel
environment is configured separately — a key present in Development does
nothing for the deployed site.

## The admin area

`/admin` (German URLs only — `proxy.ts` returns 404 for the `/en`-prefixed
variants, since board tooling has no translated UI worth a second URL).
Eleven sections, all behind the same gate:

| Path | What it's for |
| --- | --- |
| `/admin` | Overview linking every section, plus a compact status bar (applications in the running window, failed mails, whether a future application window is scheduled, last cron run, next calendar event) |
| `/admin/bewerbungen` | Applications by recruiting semester, CSV per group, delete a single application |
| `/admin/mails` | Every failed send across all five tables, with a resend |
| `/admin/bewerbungsfenster` | Create, edit, delete application windows |
| `/admin/termine` | Create, edit, delete the homepage's calendar events |
| `/admin/jobs` | Create, edit, delete partner job postings shown on `/jobs` |
| `/admin/erinnerungen` | Application-start notification list, confirmed/unconfirmed/unsubscribed, CSV, delete a single entry |
| `/admin/ideathon-anmeldungen` | Every Ideathon signup, CSV, delete a single signup |
| `/admin/kontakt` | Contact messages and their delivery status |
| `/admin/loeschanfragen` | GDPR Art. 15 and 17 for one address |
| `/admin/system` | Cron history, dependency reachability, database-schema drift, row counts |

`/admin/bewerbungen`, `/admin/erinnerungen`, and `/admin/ideathon-anmeldungen`
each have a per-row delete (`AdminDeleteButton`, `components/admin/`), added
2026-08-30 — a confirm dialog naming the affected row, a `DELETE` to that
resource's own `/api/admin/<resource>/[id]` route (session-gated like every
other admin route), and `router.refresh()` on success rather than an
optimistic local update. The other admin sections already had their own
create/edit/delete flow (`*Manager.tsx` client components); these three had
none until then.

Status everywhere — the overview bar, `/admin/system`, and the mail-status
column on `/admin/bewerbungen` and `/admin/kontakt` — goes through one shared
`StatusIndicator` component (`components/admin/StatusIndicator.tsx`): four
levels (ok/warning/error/neutral), each pairing a color with an icon and the
label text, never color alone.

Gated by `ADMIN_PASSWORD` with the session cookie signed by
`ADMIN_SESSION_SECRET` (both above) — no account system, one shared
password. A correct password sets a signed, httpOnly, 8-hour cookie
(`lib/adminAuth.ts`); `/api/admin/login` is rate-limited the same way the
public forms are. Every page and every `/api/admin/*` route checks the
cookie itself *before* querying anything (`lib/adminSession.ts`) — the
layout's check only decides whether to draw the nav, because a layout
cannot stop its children from running. Every page carries `noindex`
metadata, and `/admin` is excluded from both `robots.ts` and `sitemap.ts`.

Two sections are worth knowing about before you need them:

- **`/admin/mails`** is the answer to "the notification never arrived". A
  resend reuses the exact same composition the original send used
  (`lib/mailDispatch.ts`), so a retry can't quietly differ from what the
  sender was promised. A retry that fails again says so and overwrites the
  row's error with the newest reason.
- **`/admin/loeschanfragen`** is the only irreversible action here, on data
  no backup in this project restores. It requires the address to be typed
  twice and logs what it removed, because that log is the only remaining
  record afterwards.

## Scheduled cleanup

`content/retention.ts` states how long each table keeps a row; nothing
enforces that on its own — `/api/cron/cleanup` does, once a day, deleting
whatever `lib/retentionCutoff.ts` says has expired. Wired up two ways,
not as alternatives to each other but as a primary path and a fallback:

1. **Vercel Cron** (`vercel.json`) calls the route once a day at 03:00 UTC
   with `Authorization: Bearer $CRON_SECRET`. Vercel's Hobby plan allows up
   to two cron jobs at daily granularity, so this fits without a paid plan.

   **This has already failed silently once.** On 2026-08-17 the job was
   registered correctly (`npx vercel crons ls` confirmed it) and still did
   not fire at its 03:00 UTC slot, and nothing in the product noticed —
   runtime logs are kept for a day on this plan, so the evidence was gone
   before anyone looked. Every run now writes a row to `cron_runs`
   (`migrations/0005`), and **`/admin/system`** shows the last run, the next
   scheduled one, and raises a standing alert when no successful run is on
   record for over 48 hours. Check that page rather than the dashboard.
2. **`npm run db:cleanup`** calls the same route over HTTP by hand — against
   a local `npm run build && npm run start` by default, or against
   production with `CLEANUP_URL=https://www.enactus-mannheim.com npm run
   db:cleanup`. Requires `CRON_SECRET` in `.env.local` to match whatever's
   set in Vercel. Use this if Cron turns out to be unavailable for this
   project, or just to check the routine ran correctly.

Retention periods themselves are stated in `content/retention.ts`, each
with its own `confirmedByBoard` flag — most are `false` (set, not a
placeholder, but still awaiting the board's sign-off); `rateLimitHits` and
`jobPostings` are `true`, the latter a direct board instruction rather than
a guess. Update the numbers there (and the matching `Datenschutz` copy in
`src/messages/{de,en}.json`) once confirmed, not in the cleanup route
itself. Every period anchors to each row's own `created_at` except
`jobPostings`, which anchors to `expires_at` — a posting is swept twelve
months after it lapses, not twelve months after it was entered.

`job_postings` cleanup runs in this same route but isn't part of the counts
written to `cron_runs`: that table (`migrations/0005`) has no
`deleted_job_postings` column, and `job_postings` (`migrations/0008`) is
purely additive, so adding one was out of scope alongside it. The deleted
count still appears in the route's own JSON response, just not in
`/admin/system`'s persisted run history — a job posting's row count there
comes from `countRowsPerTable` directly, same as every other table.
