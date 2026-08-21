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

## Reminder list

Notifying people when applications open is marketing email under German law and
requires **double opt-in**. This is also explicitly on the Enactus Germany data
protection checklist.

1. Submission writes a row with `confirmed: false` and a random token.
2. Confirmation email links to `/api/reminder/bestaetigen?token=...`.
3. Only confirmed rows are ever mailed.
4. Store confirmation timestamp and IP as proof of consent.
5. Every mail carries a working one-click unsubscribe.
6. Whether that confirmation mail actually went out is recorded on the row
   (`mail_status`, `mail_error`), same as the other two forms — otherwise a
   subscriber whose link never arrived is indistinguishable from one who
   chose not to click. `/admin/mails` lists the failures and can resend.
7. Both the confirm and unsubscribe links land on `/erinnerung-status`, a
   real confirmation page with four states (confirmed, already confirmed,
   unsubscribed, invalid/expired) — noindex and excluded from the sitemap,
   same as `/secret`.

`/admin/erinnerungen` shows the list with confirmed, unconfirmed, and
unsubscribed counted separately; only the confirmed figure is the number of
people who may be mailed. Its CSV export deliberately carries no tokens.

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
