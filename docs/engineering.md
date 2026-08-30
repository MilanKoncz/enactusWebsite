# Engineering reference

Forms, data, privacy, performance, SEO, and testing detail.

## Application form (`/mitmachen`)

1. Validate with the shared Zod schema, client and server.
2. **Write to Postgres first**, before anything else in the request.
3. Render a formatted PDF with `@react-pdf/renderer`.
4. Email it via Resend to `info@unimannheim.enactus.team`.
5. If the mail fails, the application is already persisted — log the error and
   still report success to the applicant, because their data is safe.
6. Honeypot field plus a submission timing check, enforced server-side
   against a signed token (`GET /api/bewerbung/token`, `lib/formToken.ts`) —
   not a client-supplied timestamp, which a script could set to anything.
   No CAPTCHA: it is an accessibility and privacy problem.
7. Free-text fields only, no file upload.
8. The route rejects with 409 when no recruiting window is currently open —
   the form only renders while one is, but the route itself is public and
   reachable regardless of what a page already open in some tab still shows.

Open/closed state comes from the `recruiting_windows` table (see
`docs/content-guide.md`), read through a short-lived cache
(`lib/recruitingWindows.ts`) so the page stays static rather than querying
Neon on every visit. Closed → countdown plus reminder signup. Open → the
form.

## Ideathon signup form (`/ideathon`)

A second, independent form using the exact same plumbing as `/mitmachen`'s
application form (shared Zod schema, honeypot, signed timing token, rate
limit, DB-before-mail, `mail_status` trio) but its own table
(`ideathon_signups`, migration `0014`), route (`/api/ideathon`), and
dispatch functions — the two forms are deliberately not variants of one
another and can change independently.

1. The route rejects with 409 when no upcoming `calendar_events` row has its
   "Interner Link" field pointed at `/ideathon` (`lib/ideathonEvent.ts`) —
   the same row the page's own countdown and facts read from, so both can
   never disagree about whether signup is still open.
2. No PDF: the board notification is a plain-text email to
   `APPLICATION_RECIPIENT_EMAIL`, the same recipient the membership
   application uses.
3. The countdown (`IdeathonCountdown.tsx`) shows whole days only when the
   matched row has no `start_time`, and the full days/hours/minutes/seconds
   ticker once one is set — never more precision than the board has actually
   entered.
4. `idea_description` is capped at 1000 characters, in the Zod schema and
   again as a DB `check` constraint: the field can hold a visitor's
   unpublished business idea over a public form and mail pipeline.
5. Retention is 6 months from each row's own `created_at` (same rolling-window
   shape as `applications`), enforced by the same daily `/api/cron/cleanup`
   route as everything else in `content/retention.ts`.
6. `/admin/ideathon-anmeldungen` can delete a single signup, same pattern as
   `/admin/bewerbungen` and `/admin/erinnerungen` (2026-08-30).

Migration `0015_ideathon_signup_fields.sql` (`university` dropped,
`team_members`/`motivation_experience`/`dietary_preference` added) shipped
2026-08-26 but wasn't applied to production until 2026-08-30 — the code and
the schema drifted apart for four days, breaking the admin view and every
new signup silently (the insert failed, the visitor saw a real error, but
nobody who could fix it ever found out). `npm run db:verify` now includes a
check that every file in `migrations/` has a matching row in
`schema_migrations`, and `/admin/system` shows the same comparison as a
live status indicator (`lib/migrations.ts`'s `LATEST_MIGRATION`,
`lib/serviceHealth.ts`'s `checkMigrations`) — both catch this exact failure
mode directly rather than waiting for one of its symptoms. A failed insert
on `/api/bewerbung` or `/api/ideathon` also now emails
`APPLICATION_RECIPIENT_EMAIL` a rate-limited alert
(`lib/insertFailureAlert.ts`), so the board hears about a broken form even
if nobody happens to be looking at `/admin/system`.

## Application-start notification ("reminder list" in code and routes)

User-facing copy calls this the "Benachrichtigung zum Bewerbungsstart" /
"application-start notification" (sharpened from the generic "reminder"
wording, 2026-08-30) — but the code, the table (`reminder_signups`), the
routes (`/api/reminder/*`), and the status page (`/erinnerung-status`) all
keep their original names, deliberately: renaming those would break the
confirm and unsubscribe links already sitting in mail inboxes.

Notifying people when applications open is marketing email under German law and
requires **double opt-in**. This is also explicitly on the Enactus Germany data
protection checklist.

1. Submission writes a row with `confirmed: false` and a random token. The
   email is trimmed and lowercased before the uniqueness check
   (`lib/reminderSignupSchema.ts`) — `reminder_signups.email` has a unique
   constraint on the raw column, so without normalizing, two different
   capitalizations of the same address used to create two rows.
2. Confirmation email links to `/api/reminder/bestaetigen?token=...`.
3. Only confirmed rows are ever mailed the "window just opened" notice. An
   address that submits again after already confirming gets a distinct
   "you're already registered" mail instead (`dispatchReminderAlreadyRegistered`,
   added 2026-08-30) — the UI's own response stays the same neutral success
   either way, so this can't be used to probe who's signed up.
4. Store confirmation timestamp and IP as proof of consent.
5. Every mail carries a working one-click unsubscribe.
6. Whether a mail actually went out is recorded on the row (`mail_status`,
   `mail_error`), same as the other forms — otherwise a subscriber whose
   link never arrived is indistinguishable from one who chose not to click.
   `/admin/mails` lists the failures and can resend either mail, depending
   on whether the row has since confirmed.
7. Both the confirm and unsubscribe links land on `/erinnerung-status`, a
   real confirmation page with five states (confirmed, already confirmed,
   unsubscribed, invalid/expired, rate-limited) — noindex and excluded from
   the sitemap, same as `/secret`. The rate-limited state is its own,
   distinct from invalid (added 2026-08-30): a request arriving while its
   route's own rate limit was exceeded redirected to "invalid" before,
   telling a visitor with a perfectly working link that it was broken — a
   real scenario when many applicants share one Uni-WLAN egress IP.
8. Rate-limited per IP (`lib/rateLimit.ts`'s per-route ceilings) **and** per
   address (`reminder-address` bucket, keyed on the normalized email) — the
   per-IP limit alone doesn't stop a flood of requests naming the same
   victim address from many different IPs.

`/admin/erinnerungen` shows the list with confirmed, unconfirmed, and
unsubscribed counted separately; only the confirmed figure is the number of
people who may be mailed. Its CSV export deliberately carries no tokens. A
board member can delete a single entry directly from this page.

## Data protection

- All regions EU: Vercel `fra1`, Neon `eu-central-1`, Resend EU.
- Collect the minimum. A field not used in selection does not belong on the form.
- Data processing agreements required with Vercel, Neon, and Resend. Track their
  status in `ASSETS-TODO.md`.
- Access and erasure requests (GDPR Art. 15 and 17) are served by
  `/admin/loeschanfragen`: search one address across all three tables, see
  every stored field, delete after confirming the address twice.
- Enactus Germany provides a data protection officer who advises student teams
  free of charge. The privacy policy draft goes to him before launch, clearly
  marked as a draft until then.
- Analytics is cookieless, so the site carries no consent banner. Adding any
  cookie-setting service would change that — ask first.

## Performance

**Budget:** LCP under 2.0s on throttled 4G, CLS under 0.05, initial JS under
150kB gzipped. Verify against `next build` output before calling a page done.

- `next/image` everywhere with explicit dimensions. `priority` only on the hero.
- Hero video: `muted playsinline preload="metadata"` with a poster frame, static
  image fallback on mobile.
- Route-level code splitting; no barrel imports that pull in unused components.

## SEO

- `generateMetadata` per route and locale, with OG images, a real
  per-page/per-locale description, and a canonical URL — all three via the
  shared `pageAlternates()` helper (`src/lib/seo.ts`) plus each page's own
  `Seo.<key>` message, so a route can't end up with a canonical or hreflang
  pair that doesn't match what it actually renders.
- `hreflang` alternates between locales, reciprocal in both directions plus
  `x-default` pointing at German (`pageAlternates()` again).
- Organization structured data (JSON-LD, `components/OrganizationJsonLd.tsx`)
  on the homepage only, sourced entirely from `content/org.ts` /
  `content/navigation.ts` — never a fact invented for the schema alone.
- **301 redirects from the old Webflow URLs** in `next.config.ts`: `/team`
  (→ `/`, since there's no dedicated team route on this site — the Vorstand
  only appears on the homepage), `/projekte`, `/innolab`, `/mitmachen`,
  `/faq`, `/kontakt`, `/partner`, and the individual project pages. Losing
  these throws away years of ranking.
- `sitemap.ts` and `robots.ts` generated from the route tree.
- **Only the confirmed production domain gets indexed.** `robots.ts` checks
  the request's Host header and `VERCEL_ENV` (via
  `lib/productionDeployment.ts`) and disallows everything unless both the
  environment is `production` *and* the host is `enactus-mannheim.com` or
  `www.enactus-mannheim.com` — this catches Vercel preview builds, the
  auto-generated `*.vercel.app` alias, and local development alike.
  `proxy.ts` backs this up with an `X-Robots-Tag: noindex` response header
  in the same non-production cases, since a URL that's `disallow`ed in
  `robots.txt` can still appear in search results (without a snippet) if
  something else links to it. Both checks run server-side, where Vercel
  populates `VERCEL_ENV` automatically — no project setting to remember to
  turn on, unlike the `NEXT_PUBLIC_` variant.

## i18n

German is the default locale with **no** URL prefix. Existing rankings sit on
German URLs and must not break. English lives at `/en`.

No German string literals inside components — everything through `next-intl`.
Build German first; English is a dedicated final pass. Until then `en.json` may
mirror German values, but every fallback is logged in `ASSETS-TODO.md`.

Honest content requirement: club and project work happen in German. The English
FAQ and application page must say so plainly rather than hide it.

## Testing

### What each layer covers

**Unit (Vitest).** Zod content schemas — a malformed `projects.ts` must fail
loudly. Form validation rules. PDF data mapping. Token generation and expiry for
double opt-in.

**Component (Testing Library).** Every `ui/` primitive in all states. Query by
role and accessible name, never by test id or class. Assert keyboard behaviour:
Enter and Space on buttons, Escape closing dialogs, focus trapped in the mobile
menu and returned on close.

**Integration (Vitest, mocked Resend and Neon).** API routes. The load-bearing
test: *an application is persisted even when the mail provider throws.* Also:
double opt-in cannot be bypassed, an unconfirmed row is never mailed, rate
limiting rejects a flood.

**E2E (Playwright).** Application submission end to end. Locale switch preserving
the current route. Mobile navigation open, navigate, close. Full keyboard
traversal of the homepage without a mouse.

**Accessibility.** `axe-core` assertions in component tests and on every page in
e2e. Zero violations is the passing bar.

### Conventions

- `tests/unit`, `tests/integration`, `tests/e2e`.
- Test names read as sentences: `persists the application when email delivery fails`.
- No snapshot tests of rendered markup — they break on every refactor and assert
  nothing meaningful.
- Fixtures live in `tests/fixtures`, never inline in a dozen files.

### CI

GitHub Actions on every push: typecheck → lint → unit → integration → build →
e2e. Red build does not merge. Keep the whole run under five minutes; if it grows
past that, parallelise rather than cutting coverage.
