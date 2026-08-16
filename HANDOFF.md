# Handoff

Autonomous sequence from 2026-08-15/16, AUFGABE 0–5. All six tasks finished;
no STOP was hit. Every task's `npm run check` and `next build` were green
before its commit. One HANDOFF-relevant addition below: a body of pre-existing
uncommitted work found at the start of the session.

## What's done

**Before AUFGABE 0** — the working tree already had a finished, passing, but
never-committed feature (Impressum and Prozess pages built out, `/team`
retired, real logo/partner assets, content facts filled in). Verified it was
green and committed it first (`0b96b59`) so it wouldn't get tangled into
AUFGABE 0's own commit.

**AUFGABE 0** — `CONTENT-BRIEF.md` was untracked, so deleting it left nothing
for git to commit. No commit exists for this step; the file is simply gone.

**AUFGABE 1 — `/projekte`** (`c8d3ed6`). Active-project cards expand in
place via `motion/react`'s `layout` prop — the first real use of the `motion`
package in this codebase (it was installed but unused everywhere else).
Stars grid with a click-to-load YouTube facade. `/projekte/archiv` lists
every project, active and archived, Differgy shown with the gold spin-off
badge. `/projekte/[slug]` renders through one shared `ProjectDetailPage`
layout component. Added a `year` field to `content/projects.ts` for the
archive grid (null for everyone — no year is documented anywhere).

**AUFGABE 2 — `/events`** (`5aea88c`). Four formats as a desktop tablist
(Radix Tabs, shared panel) / mobile accordion (Radix Accordion), both driven
by one selection state. Journeys history, network stats, and five sibling
teams — every team URL fetched and confirmed live on 2026-08-15.

**AUFGABE 3 — `/partner`** (`3068031`). Benefits, four tiers, statements,
2€/month membership, mailto contact. Eleven of twelve partner URLs
confirmed live; MCEI's domain is behind a maintenance-mode auth wall.

**AUFGABE 4 — `/kontakt`** (`f68324e`). FAQ (Radix accordion, three
categories) plus a fully Zod-validated, intentionally unwired contact form.

**AUFGABE 5 — redirects/SEO** (`c18af6f`). 301 redirect map, `sitemap.ts`,
`robots.ts`.

## Decisions made along the way

- **Project cards expand on click, not hover.** design-system.md names
  project cards as an exception where hover is allowed to hide content, but
  that guidance was written for ProcessTimeline's absolutely-positioned,
  non-reflowing panel. Here expanding a card visibly pushes the cards below
  it down — reflowing the page because a pointer drifted past a card would
  be worse, not better, so it's click/tap/keyboard-Enter instead, same as
  the brief's own wording ("Klick erweitert die Karte").
- **`/projekte/archiv` lists every project, not just inactive ones** — reads
  as "the full history," which seemed like the more useful page than a
  duplicate of the four cards already shown above it.
- **Radix Tabs and Radix Accordion, both previously installed and unused,
  now do real work** (`/events` formats, `/kontakt` FAQ).
- **Partner-page source text: raw HTML, not WebFetch's AI summary.** Two
  summarized fetches of the old partner page disagreed on two of the four
  testimonial quotes — one attributed a quote to the wrong person entirely.
  Pulled the raw HTML via `curl` and stripped tags manually to get exact
  text before quoting anyone. Worth remembering for any future word-for-word
  sourcing task.
- **"Advisor" is a real fourth partner tier** (confirmed via the old site's
  own "Modelle einer Partnerschaft" section) with zero partners currently
  assigned to it. Rendered with a visible empty-state note rather than
  dropped, so the category isn't silently lost.
- **No contact-form success theater.** The stub submit handler validates for
  real but shows an honest "not connected yet, email us" notice instead of a
  fake confirmation — pretending a message sent when it didn't would be
  worse than the alternative.
- **`statusCode: 301`, not `permanent: true`.** Next.js's `permanent` flag
  issues a 308. Functionally equivalent for SEO, but the brief asked for
  literal 301s, and Next exposes `statusCode` specifically for this.
  Verified against a real production server, not just read from docs.
- **No production domain exists anywhere in this repo.** `sitemap.ts` /
  `robots.ts` derive their base URL from `NEXT_PUBLIC_SITE_URL`, falling
  back to Vercel's own deployment URL, rather than guessing a domain.
- **Golden thread extended to every new page** (`/projekte`, `/events`,
  `/partner`, `/kontakt`), even though only AUFGABE 1 asked for it
  explicitly — leaving three of five new pages without the site's signature
  motif would have read as an inconsistency the design system doesn't allow.

## What I noticed

- `mafinex.de` itself has a TLS certificate mismatch (serves a `your-server.de`
  cert); linked `mafinex.next-mannheim.de` instead, which resolves correctly.
- `horbach.de` and the E.ON Inhouse Consulting page on `eon.com` both block
  automated fetches (403) but are corroborated by multiple independent
  search results — linked anyway, flagged in ASSETS-TODO.md for a manual
  browser check before launch, same pattern already used for `enactus.org`.
- `mcei.de` returns HTTP 401 with `WWW-Authenticate: Basic realm="Wartung"`
  — the domain exists but is locked behind maintenance mode. Left unlinked.

## Next steps

- Board sign-off needed on: the eight FAQ drafts, the four event-format
  descriptions, and confirmation of the Advisor-tier gap (is there really no
  current Advisor partner, or is one just not recorded yet).
- `NEXT_PUBLIC_SITE_URL` needs setting in Vercel once the production domain
  is decided — until then, sitemap/robots fall back to Vercel's own URL.
- `MCEI`'s partner URL: recheck `mcei.de` once its maintenance mode lifts.
- The `/mitmachen` contact form's real API route (and the `/kontakt` form's,
  once the backend exists) still need building — both are explicitly out of
  scope for this sequence.
- Full `ASSETS-TODO.md` still has the pre-existing gaps (photos, hero video,
  the English translation pass, the two accepted dependency advisories) —
  none of that changed in this sequence beyond what's listed above.
