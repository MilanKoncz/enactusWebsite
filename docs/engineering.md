# Engineering reference

Forms, data, privacy, performance, SEO, and testing detail.

## Application form (`/mitmachen`)

1. Validate with the shared Zod schema, client and server.
2. **Write to Postgres first**, before anything else in the request.
3. Render a formatted PDF with `@react-pdf/renderer`.
4. Email it via Resend to `it@unimannheim.enactus.team`.
5. If the mail fails, the application is already persisted — log the error and
   still report success to the applicant, because their data is safe.
6. Honeypot field plus a submission timing check. No CAPTCHA: it is an
   accessibility and privacy problem.
7. Free-text fields only, no file upload.

Open/closed state comes from the application window in `content/recruiting.ts`.
Closed → countdown plus reminder signup. Open → the form.

## Reminder list

Notifying people when applications open is marketing email under German law and
requires **double opt-in**. This is also explicitly on the Enactus Germany data
protection checklist.

1. Submission writes a row with `confirmed: false` and a random token.
2. Confirmation email links to `/api/reminder/bestaetigen?token=...`.
3. Only confirmed rows are ever mailed.
4. Store confirmation timestamp and IP as proof of consent.
5. Every mail carries a working one-click unsubscribe.

## Data protection

- All regions EU: Vercel `fra1`, Neon `eu-central-1`, Resend EU.
- Collect the minimum. A field not used in selection does not belong on the form.
- Data processing agreements required with Vercel, Neon, and Resend. Track their
  status in `ASSETS-TODO.md`.
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

- `generateMetadata` per route and locale, with OG images.
- `hreflang` alternates between locales.
- **301 redirects from the old Webflow URLs** in `next.config.ts`: `/team`,
  `/projekte`, `/innolab`, `/mitmachen`, `/faq`, `/kontakt`, `/partner`, and the
  individual project pages. Losing these throws away years of ranking.
- `sitemap.ts` and `robots.ts` generated from the route tree.

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
