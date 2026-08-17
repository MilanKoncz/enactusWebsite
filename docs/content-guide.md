# Content guide

Task-oriented. If you need to change a fact, a photo, or a sentence on the
site and don't want to learn the whole codebase first, find your task
below. Read `docs/architecture.md`'s "Copy vs. facts" section first if
`content/` vs `messages/` is unfamiliar — every task here depends on that
distinction.

After any content change: `npm run check` (typecheck + lint + tests), then
look at the actual page (`npm run dev`) before committing. Content files are
Zod-validated, so a typo that breaks the shape fails `npm run build` loudly
— that is intentional, not a bug to work around.

## Swap a board member's photo

1. Drop the new file in `public/image/board/` (any name, but match the
   existing `Name.jpg` style).
2. Open `src/content/board.ts` and update that member's `photo` field to
   the new path (starting with `/image/board/...`).
3. No aspect ratio conversion needed — portraits render as a 3∶4 crop
   (`aspect-3/4`, `object-cover` via `next/image`) regardless of the
   source image's own proportions, same as project-lead and alumni photos.

## Add, remove, or edit a board member

Edit the `board` array in `src/content/board.ts` — `slug`, `name`, `role`,
`photo`, `email`, `linkedinUrl` (any of the last three can be `null` if not
yet confirmed; never invent one). Then add that member's bio under
`"Board.<slug>.bio"` in **both** `src/messages/de.json` and
`src/messages/en.json` — the page will fail to render (missing translation
key) if you forget one. A bio is prose, so it lives in messages, not in
`board.ts`, exactly like a project's description.

## Add, remove, or edit a project

`src/content/projects.ts`. Facts (`slug`, `status`, `stage`, `year`,
`leads`, `externalUrl`, `linkedinUrl`, `logo`, `images`, `sdgs`) live there;
`oneLiner` and `description` are message keys derived from the slug
(`"Projects.<slug>.oneLiner"` / `.description`) — add both to `de.json` and
`en.json`.

- `status` must be one of `active` / `spinoff` / `cancelled` / `paused` —
  this mirrors the Enactus Germany national database's own vocabulary.
  Check that database before ever needing a fifth value.
- A project moves from "current" (`/projekte`) to "archive"
  (`/projekte/archiv`) automatically the moment its `status` is no longer
  `active` — there is no separate archive list to maintain.
- `leads` is a list (SmileGreen has two) — an empty list means "not
  publicly named yet", not "no lead".
- `sdgs` must be ascending, no duplicates (e.g. `[3, 12, 13]`, not
  `[12, 3, 13]`) — the build fails loudly otherwise. Icons for all 17 goals
  already exist under `public/sdg/`; you only ever list goal numbers here.
- Logos and photos are real files under `public/projects/` (`logo`) and
  referenced directly in `images` — leave a field `null`/`[]` rather than
  pointing at a file that doesn't exist yet.

## Update recruiting windows (application open/close dates)

Application windows live in the `recruiting_windows` table, not in a content
file (as of 2026-08-17 — this replaces the old `recruitingWindows` array).
Manage them at **`/admin/bewerbungsfenster`** (password from
`ADMIN_PASSWORD`, see `docs/deployment.md`): list, create, edit, delete.

Enter times as ordinary local dates — they're interpreted in
`RECRUITING_TIMEZONE` (Europe/Berlin) on the server, not in whatever
timezone your laptop is set to, so the same form gives the same window from
anywhere. The form rejects a label that isn't `HWS26`/`FSS27`-shaped, an end
before its start, and any window overlapping an existing one (naming which).
A change is live on `/mitmachen` immediately — the page's cache is
invalidated by the same request that saved it.

## Update the event calendar (Termine)

Events live in the `calendar_events` table, not in a content file — the same
move recruiting windows made. Manage them at **`/admin/termine`**: list,
create, edit, delete. Each event has a category (fixed set of seven — see
`docs/design-system.md`'s calendar color layer), a start date, an optional
end date for multi-day events, optional start/end times, an optional
location and description, and a "not yet confirmed" flag that shows a
dashed border and a note on the public page instead of a firm date.

Titles and descriptions are entered in German; the optional English fields
fall back to the German text when left blank — the board maintains this
table directly, and a second-language pass wasn't asked for. A change is
live on the homepage immediately, the same cache-invalidation-on-save
arrangement as the recruiting windows above.

The page also warns, standing, when no window with a future end date exists:
that's the state in which `/mitmachen` says "closed" indefinitely.

`src/content/recruiting.ts` still holds the shared `RecruitingWindow` type
and its Zod validation, but no data — it's the type definition both the
admin form and the public site's open/closed logic
(`src/lib/recruitingStatus.ts`) read from, not a place to edit facts.

Editing the table by hand (rather than through the admin form) skips the
cache invalidation, so `/mitmachen` can lag by up to an hour
(`revalidate: 3600` in `lib/recruitingWindows.ts`). Use the admin page.

The public `/mitmachen` page reads the window list through a short-lived
cache (`src/lib/recruitingWindows.ts`) rather than querying on every visit —
a change in the admin area invalidates that cache immediately, so it never
takes up to an hour to show up. The site automatically shows whichever window
contains "now", or the soonest future one if none does.

Every application gets tagged with the matching window's `semester` label
automatically (`src/lib/recruitingSemester.ts`) — nothing else to update.

## Check or export submitted applications

`/admin/bewerbungen` (password from `ADMIN_PASSWORD`, see
`docs/deployment.md`). Lists every application grouped by recruiting
semester, newest first, with a "Als CSV herunterladen" button per group.

If a row says its mail failed, `/admin/mails` shows why and offers a
resend. `/admin` links every section; `docs/deployment.md` describes them.

## Update KPIs, network stats, or "since 2003"

- Homepage KPI tiles: `src/content/kpis.ts`.
- Network-wide figures (students, universities, countries) on `/events`:
  `src/content/network.ts` — re-confirm against `enactus.de/network` before
  editing, these are network-wide, not this club's own numbers.
- Founding year in the footer: `src/content/org.ts`.

## Add or edit a partner

`src/content/partners.ts` — `name`, `tier`, `logo` (path under
`public/brand/partners/`, SVG preferred over a raster export), `url`. Only
add a `url` once you've actually opened it in a browser — several existing
entries note in a comment why a given one was hard to verify automatically.

## Add an FAQ entry, an event, or a milestone checklist item

- FAQ: `src/content/faq.ts` for the question's `category`/order, the
  question and answer text under `"Faq.<key>.question"` /
  `.answer"` in messages.
- Events calendar: see "Update the event calendar (Termine)" above — the
  `calendar_events` table, not a content file.
- Process-page gate checklists: `messages/{de,en}.json`'s
  `"Process.steps.<milestone>.checklist"` — never invent a checkpoint; leave
  the placeholder tokens (`PRÜFPUNKT_n`) until the board confirms one.

## Translate a string / add English copy

Every UI string lives in `src/messages/de.json` and its mirror in `en.json`
— same key path in both. German is the source of truth (no URL prefix,
existing rankings depend on it); English is a deliberate second pass, not a
literal mirror — see `ASSETS-TODO.md` for which English sections are still
placeholder-quality. When adding a **new** key, add it to both files in the
same place, or the English site will throw a missing-translation error for
that route.

## Understand a `Placeholder` / `PlaceholderMark` on the live site

These are not bugs. `Placeholder` (a whole dashed block, e.g. "FOTO —
SmileGreen") stands in for a missing photo or logo; `PlaceholderMark`
(inline, dashed underline) stands in for a missing sentence or fact. Both
read from `ASSETS-TODO.md`, which lists exactly what's missing and why. To
resolve one: get the real asset/fact, update the relevant `content/*.ts` or
`messages/*.json` entry, delete the corresponding row from
`ASSETS-TODO.md`. Never fill either in with an invented value.

## Run the site locally

```
npm install
cp .env.example .env.local        # fill in real values for whichever parts you're testing
npm run dev                        # http://localhost:3000
```

Most content edits don't need any environment variable at all — only the
forms, the admin page, and the cron cleanup route touch the database or
mail. `npm run check` and a manual look in the browser are enough to verify
a content-only change.
