# Handoff — unattended run, 2026-08-17

Started after plan approval for Aufgabe A (Event-Kalender), with six
corrections from the review round. Running A → F unattended per instruction.
Decisions and their reasoning are recorded here as they're made; this file is
temporary and gets folded into commit messages / docs / ASSETS-TODO.md before
the run ends, not left behind as permanent documentation.

## Corrections applied to the approved plan

1. **Seed as its own migration.** `0006_calendar_events.sql` creates the table
   only. `0007_calendar_events_seed.sql` seeds the 22 confirmed dates, with a
   `unique index (category, start_date, title)` added first so `on conflict do
   nothing` has something to key on. Reason: migrations are "applied" by
   filename in `schema_migrations` — rows added to 0006 after it already ran
   against Neon would never execute.
2. **Natural-key uniqueness checked, not assumed.** Counted by hand across all
   22 seed rows: no two share `(category, start_date, title)`. Three titles
   repeat across different dates (Kick-off ×2, Initiativenmarkt ×2,
   Bewerbungsgespräche ×2, ConnectUs ×3) — none collide because the date
   differs each time. The unique index will not need loosening.
3. **Wettkaempfe stays filled when past.** Measured `ink` blended over
   `--color-cal-wettkaempfe` (gold) at various opacities against WCAG AA
   (4.5:1 normal text):
   - ink/60 → `#6a582b` → **4.30:1 — fails**
   - ink/65 → `#5d4f2b` → 4.99:1
   - ink/70 → `#51462c` → **5.78:1 — used**
   `ink/60` is the site's documented minimum *on paper specifically*
   (`docs/design-system.md`); it does not transfer to a gold fill, which is
   much brighter than paper. Past wettkaempfe rows keep the gold fill and use
   `ink/70` for title/meta text instead of the `ink/60` the six outline
   categories use on paper. Wandering back into design-system.md as a
   documented exception, with the measured value.
4. **`content/events.ts` confirmed dead, not the Journeys data.** Grepped
   `content/journeys.ts` (four real, board-confirmed trips: FSS26 St. Gallen,
   FSS25 Berlin, HWS24 München, FSS24 Berlin — different schema: `key/order/
   destination/year`) against `content/events.ts` (four `null`-everything
   placeholders, schema `slug/title/date/location/externalUrl`, `title` a
   message key `Events.event-N.title`). Grepped `src/messages/{de,en}.json`
   for `Events.event` — zero matches, the key was never even added to the
   catalogs. Grepped the whole repo for `content/events` imports — only
   `tests/unit/content/events.test.ts`. `/events` renders `JourneysSection`
   from `content/journeys.ts` entirely separately. Confirmed genuinely dead:
   deleted, alongside its test.
5. **22 events, not 23.** Recounted per category: bewerbung 12, innolab 1,
   wettkaempfe 1, socials 7, workshops 1 = 22. My earlier "23" silently
   double-counted "ConnectUs und offenes Social" (05.09.) — it's one event,
   not two.
6. **English columns added now.** `title_en`, `description_en` — both
   nullable — added to `calendar_events` in 0006. Admin form gets two
   optional fields; empty means fall back to the German text at render time.
   Titles stay German for the 22 seeded rows (the board maintains this table
   directly in German) — noted, not fought.
7. **Timezone rename isolated.** `content/timezone.ts` (new, `SITE_TIMEZONE`)
   with `content/recruiting.ts`'s `RECRUITING_TIMEZONE` re-exporting it, done
   as its own commit before anything (A3's day-boundary logic and A4's ICS
   export) depends on it, with the full recruiting test suite green before
   moving on. Placed before A3, not just before A4, since A3 was found to
   need Europe/Berlin-correct "today" too (see below).

## Notes / open items

- **A3 design call: month-collapse split uses the server's own render-time
  clock, not the ticking `useNow()`.** `EventCalendar` receives
  `initialNowMs` from `page.tsx` (via `getServerNowMs()`, a plain function
  outside any component — `Date.now()` directly inside the page's render
  trips `react-hooks/purity`'s "impure call during render" check). That
  value drives which event is highlighted, which months collapse behind
  "Frühere Termine", and which rows dim as past — all fixed for the
  lifetime of that render, so nothing reorganises itself right after
  hydration. `useNow(60_000)` (real hook, ticking, starting at 0) drives
  only the highlight card's countdown *phrase* — guarded on `now > 0` so
  the server output is the bare date, per the brief, and no nonsense
  day-count against the Unix epoch ever renders. Considered computing month
  boundaries from the ticking clock too, rejected: at `now === 0` every
  real month is "current or later" (1970 < everything), so once the real
  clock arrived, any genuinely past month would visibly vanish behind the
  collapse a moment after mount — a layout shift the "no layout shift on
  load" floor rules out. `getServerNowMs()`/`getCalendarEvents()` share the
  homepage's inherited 1-hour ISR window (confirmed in the build output:
  `/[locale]` now shows `1h / 1y`, matching `/mitmachen`'s existing
  pattern), so "now" is at most an hour stale — irrelevant at day
  granularity.
- **The highlighted event is excluded from the grouped list below it** —
  showing the same event twice (once large, once in the agenda) read as a
  rendering bug in testing, not emphasis.
- **`content/events.ts` and its test are deleted** (see correction 4 above)
  — `docs/content-guide.md`'s events-calendar pointer updated to the new
  admin flow, and its `ASSETS-TODO.md` row removed. `/events` itself is
  unchanged; it never read that file.
- **Known pre-existing flake, not caused by this work:**
  `tests/e2e/projekte.spec.ts`'s "never introduces a horizontal scrollbar…"
  failed once under Mobile Safari with 6 parallel workers, passed cleanly
  alone and on a retry. That spec doesn't touch the homepage or anything
  this run has changed — matches the WebKit-under-load flakiness
  `playwright.config.ts`'s own comment already documents.
