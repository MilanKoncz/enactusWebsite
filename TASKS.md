# Remaining work

Phases in order. Do not start a phase before its prerequisites are met.

**Rules for every phase:** `npm run check` and `next build` green before
committing. Tests and an axe check with every page. Nothing invented — missing
facts become a `Placeholder` plus a row in `ASSETS-TODO.md`. If a phase hits a
real decision, stop and write it to `HANDOFF.md` rather than guessing.

Deadline context: the application window opens **1 September 2026**. Phases 1–4
are the critical path. Everything after that can slip.

---

## Phase 0 — Small corrections

- `/projekte/archiv` currently lists every project including the four active
  ones. Restrict it to non-active projects. The four active ones already appear
  directly above on `/projekte`; repeating them makes the archive a duplicate
  page rather than a history, and search engines will read it that way too.
- Set `NEXT_PUBLIC_SITE_URL` to `https://www.enactus-mannheim.com` as the local
  fallback in `.env.example` and document it in `docs/deployment.md`.

## Phase 1 — Privacy policy draft

**Blocks the launch of any form.** Nothing that collects personal data may go
live without this.

Write a complete German draft at `/datenschutz`, clearly marked as a draft until
reviewed. It must cover, accurately and specifically:

- Responsible party (from `content/org.ts`), and that no DPO is appointed
- Hosting: Vercel, region `fra1`, with the legal basis and the US transfer
- Database: Neon, `eu-central-1`, what is stored and for how long
- Email: Resend, EU region
- Analytics: Vercel Analytics, cookieless, no consent banner required — and say
  plainly that no cookies are set for tracking
- Fonts: self-hosted, no request to Google
- YouTube embeds: click-to-load facade, nothing loads before interaction, with
  a note that YouTube's own policy applies after the click
- Application form: every field collected, purpose, legal basis, retention
  period, who has access
- Reminder list: double opt-in, what proof of consent is stored, how to
  unsubscribe
- Contact form: same treatment
- Data subject rights, right to complain to a supervisory authority

Do not copy from the old Webflow site — it describes a different stack and
contains an unfilled placeholder.

Add a matching English version. Structure it so a single sentence can be flipped
from "draft" to "reviewed" once the Enactus Germany data protection officer has
signed off.

## Phase 2 — Backend infrastructure

**Prerequisites:** Neon database provisioned in `eu-central-1`, Resend account
with a verified sending domain, both connection strings present in the
environment. Without these, stop — do not build against mocks.

- Schema and migrations: `applications`, `reminder_signups` (token, confirmed,
  confirmed_at, ip), `contact_messages`
- A single `lib/db.ts` boundary; no SQL outside it
- Rate limiting shared across all form routes
- Verify a real write against the actual database before committing

## Phase 3 — `/mitmachen`

The board rejected the old version as too long and too generic. Structure:

1. **"Was wir von dir erwarten"** and **"Was du bekommst"**, four fields each.
   Content always visible, hover adds detail.
   Key term **Agency** — the ability to assess a situation, decide, and act.
   Define it inline in half a sentence, never as an external link. On a
   conversion page you do not send people away.
2. Immediately below, prominent and **not** a footnote: you do not need to meet
   everything. Around 80% is a fit. Every skill set helps.
3. Compact horizontal process timeline. Much shorter than the old six steps.
4. Application form, open/closed state from `content/recruiting.ts`
   (01.09.2026 00:00 – 13.09.2026 23:59, Europe/Berlin). Closed shows the
   countdown plus reminder signup; open shows the form.
5. Closing CTA.

No FAQ here, no alumni statements — those live elsewhere now.

### Form fields

No file upload, by decision. CV content is captured as structured fields so
every application is comparable:

- Vorname, Nachname, E-Mail
- Studiengang, Fachsemester, Hochschule
- Bisheriges Engagement / Berufserfahrung (freetext, ~600 chars)
- Sprachen, weitere Kenntnisse (freetext, ~300 chars)
- Motivation (freetext, ~1500 chars) — with a short prompt above it about what
  to address, so answers are comparable
- Wunschbereich (multi-select from the projects and the board departments)
- Verfügbarkeit in Stunden pro Woche
- Wie bist du auf uns aufmerksam geworden
- Required consent checkbox linking to `/datenschutz`

Honeypot field plus a submission timing check. No CAPTCHA — an accessibility and
privacy problem.

## Phase 4 — API routes

- `/api/bewerbung`: validate server-side with the shared Zod schema, **write to
  Postgres first**, then render the PDF, then send via Resend to
  `info@unimannheim.enactus.team`. If mail fails, the application is already
  persisted — log the error and still report success to the applicant.
- PDF via `@react-pdf/renderer`: clean typography, Enactus colours, fields
  grouped so a reader can scan an application in under a minute.
- `/api/reminder` and `/api/reminder/bestaetigen`: double opt-in. Unconfirmed
  rows are never mailed. Store confirmation timestamp and IP as proof of
  consent. Every mail carries a working one-click unsubscribe.
- `/api/kontakt`: wire up the existing stubbed form.
- Integration tests. The load-bearing one: **an application is persisted even
  when the mail provider throws.**

Email copy is placeholder for now — the board will supply it. Keep it short and
easy to swap.

## Phase 5 — Assets

Once photos, logos and the hero video arrive: swap every placeholder, remove the
temporary gradient behind the hero, verify no layout shift appears, and prune
`ASSETS-TODO.md` accordingly.

## Phase 6 — English

A real translation pass, not a mirror of the German. Written for international
students and for partners.

State plainly in the English FAQ and on `/mitmachen` that club and project work
happen in German. Do not bury it.

Then `hreflang` alternates, localised metadata, and a test that every key exists
in both files.

## Phase 7 — Launch

- Remove `/styleguide`
- Full accessibility pass: tab order, visible focus, alt text, form errors with
  `aria-live`, contrast everywhere
- Lighthouse on every page, results recorded
- Verify the performance budget from `docs/engineering.md` against a production
  build
- Confirm the data processing agreements with Vercel, Neon and Resend are signed
  and recorded
- Check every externally linked URL manually in a browser — several were only
  corroborated indirectly because they block automated fetches
  (`enactus.org`, `horbach.de`, E.ON, `mcei.de`)
- Verify quoted partner statements word-for-word against the source. Automated
  fetches of that page have already returned conflicting text once.

## Phase 8 — Documentation

`docs/architecture.md`, `docs/content-guide.md`, `docs/deployment.md`.

Short and task-oriented. The reader is next year's Head of IT, who has never
seen this codebase and needs to swap a board member's photo in ten minutes.

---

## Waiting on the board

Tracked in full in `ASSETS-TODO.md`. The ones that block work rather than just
leaving a placeholder:

- Sign-off on the eight FAQ drafts and the four event format descriptions
- The four gate checklists on `/prozess` — cannot be guessed
- Whether the Advisor partner tier really has no members
- ReSoap's project lead (surname and email)
- Confirmation of the five KPI figures
- The four unnamed spin-offs, if the figure is to rise above five
