# Remaining work

Phases in order. Do not start a phase before its prerequisites are met.

**Rules for every phase:** `npm run check` and `next build` green before
committing. Tests and an axe check with every page. Nothing invented — missing
facts become a `Placeholder` plus a row in `ASSETS-TODO.md`. If a phase hits a
real decision, ask in chat and wait — see `CLAUDE.md`.

Deadline context: the application window opens **1 September 2026**.

## Status as of 2026-08-16 (see the 2026-08-30 update below for what changed since)

**Phases 0–4 (the full critical path) are done.** Remaining work is Phases
5–8, all of which the brief already allows to slip past the deadline.
Board-pending facts and assets — the actual "what's still missing" list —
live entirely in `ASSETS-TODO.md`, not duplicated here.

### Update 2026-08-30 — recruiting-release fixes

This table's Phase 5 row is stale (predates the Ideathon page, 2026-08-25,
and several board-photo/asset landings since — `ASSETS-TODO.md` is the
current source of truth, not this table). Five fixes shipped the day before
the HWS26 application window opens:

- Migration `0015_ideathon_signup_fields.sql` had never been applied to
  production, silently breaking every Ideathon signup since 2026-08-26 and
  the admin view along with it — applied, and `scripts/db-verify.mjs` /
  `/admin/system` now both catch a future migration gap directly, not just
  its symptoms.
- The reminder confirmation mail could embed a `localhost:3000` link when
  sent from a local dev server missing `NEXT_PUBLIC_SITE_URL` — fixed, with
  a warning if it happens again.
- Rate limits were a flat 5-per-IP-per-10-minutes across every public form,
  including `/api/bewerbung` — staggered per route so a shared Uni-WLAN
  egress IP can't lock out real applicants on launch day.
- The reminder list ("Benachrichtigung zum Bewerbungsstart", the copy fix
  is also part of this pass) now mails an address that signs up twice,
  rate-limits per address, and normalizes email case before the
  uniqueness check.
- `/admin/bewerbungen`, `/admin/erinnerungen`, and
  `/admin/ideathon-anmeldungen` gained a per-row delete action, the first
  mutation any of the three ever had.

| Phase | Status |
| --- | --- |
| 0 — Small corrections | Done |
| 1 — Privacy policy draft | Done (`/datenschutz`, 18 sections, DE+EN) |
| 2 — Backend infrastructure | Done (schema, `lib/db.ts`, rate limiting, verified against real Neon) |
| 3 — `/mitmachen` | Done |
| 4 — API routes | Done (`/api/bewerbung`, `/api/reminder*`, `/api/kontakt`, `/api/cron/cleanup`) |
| 5 — Assets | Partial — hero video/poster and board photos landed 2026-08-16; rest open |
| 6 — English | Open |
| 7 — Launch | Open |
| 8 — Documentation | Done (`docs/architecture.md`, `docs/content-guide.md`) |

Phase-by-phase detail for 0–4 (what was built, which commit, notable
decisions) is in git history, not repeated here — see `git log`.

---

## Phase 5 — Assets

Hero video/poster (`content/media.ts`) and all five board portraits
(`content/board.ts`) are real as of 2026-08-16. Still open, all tracked with
their own row in `ASSETS-TODO.md`: project photos, project-lead photos,
partner logos as SVG, alumni photos, the Teamwochenende event image, star
project logos, and the mobile hero still image. Once each arrives: swap the
placeholder, verify no layout shift, prune the row from `ASSETS-TODO.md`.

## Phase 6 — English

A real translation pass, not a mirror of the German — see `ASSETS-TODO.md`'s
`messages/en.json` row for the full namespace list still pending.

State plainly in the English FAQ and on `/mitmachen` that club and project
work happen in German. Do not bury it.

Then `hreflang` alternates, localised metadata, and a test that every key
exists in both files.

## Phase 7 — Launch

- Remove `/styleguide`
- Full accessibility pass: tab order, visible focus, alt text, form errors
  with `aria-live`, contrast everywhere (two contrast bugs already fixed
  ahead of this pass — footer LinkedIn icon and `/projekte`'s "Kein Video
  verfügbar" hint — but the full page-by-page pass hasn't happened yet)
- Lighthouse on every page, results recorded
- Verify the performance budget from `docs/engineering.md` against a
  production build
- Confirm the data processing agreements with Vercel, Neon and Resend are
  signed and recorded
- Check every externally linked URL manually in a browser — several were
  only corroborated indirectly because they block automated fetches
  (`enactus.org`, `horbach.de`, E.ON, `mcei.de`)
- Verify quoted partner statements word-for-word against the source
- Re-enable Dependabot's weekly schedule (see its `ASSETS-TODO.md` row)

## Phase 8 — Documentation

Done, 2026-08-16: `docs/architecture.md` (stack, folder map, request flow)
and `docs/content-guide.md` (task-oriented — swap a photo, add a project,
update recruiting windows, translate a string), both linked from
`CLAUDE.md`'s reference docs list.
