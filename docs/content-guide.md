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

## Add or edit a STAR project (the eight former flagships on `/projekte`)

`src/content/stars.ts`, separate from `projects.ts` — a STAR entry is a
former flagship shown near the bottom of `/projekte`, not a current or
archived project card. `logo` is a real file under `public/stars/` (two of
eight have one so far); `description` is a message key under
`"Stars.<key>.description"`. If a STAR project also has its own
`projects.ts` archive entry for the same real-world project (as Moufense
does), point both `logo` fields at the same file rather than duplicating it
under two paths.

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
live on **`/termine`** (English: `/en/calendar`) immediately, the same
cache-invalidation-on-save arrangement as the recruiting windows above. The
calendar moved off the homepage onto this dedicated page on 2026-08-18 — it
had grown into the homepage's biggest single section.

`/termine` shows the same event data two ways depending on screen width —
a month grid from tablet width up, a compact one-line-per-event list below
that — so don't be surprised if a laptop and a phone show a genuinely
different layout for the same table; see `docs/design-system.md`'s "Two
views, one set of rules" for what each looks like.

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

## Manage job postings (the Jobwall)

Partner companies' open positions live in the `job_postings` table, not a
content file — the same move recruiting windows and the event calendar
made. Manage them at **`/admin/jobs`**: list, create, edit, delete. Each
posting has a company, title, employment type (`praktikum` /
`werkstudent` / `abschlussarbeit` / `einstieg`), an optional location, a
remote setting (`vor_ort` / `hybrid` / `remote`), an optional short
description, an absolute https application link, an expiry date, and an
optional partner (matched against `src/content/partners.ts` by slug — set
this to show that partner's logo on the public card, leave it unset for a
company that isn't a listed partner).

There is no partner self-service and no partner login: the board is the
only one who ever enters a posting, the same as every other admin-managed
list on this site.

The expiry date can't be in the past when a posting is first created, but
editing an already-expired one to fix a typo stays possible — that
restriction is create-only. Once a posting's expiry date has passed it
stops appearing on the public page automatically (filtered server-side, not
just hidden in the UI) and is swept by the daily cron cleanup twelve months
after it expires — see `docs/deployment.md`.

Live at **`/jobs`** (English: `/en/jobs`), filterable by employment type.
The page itself is always reachable and stays in the sitemap even with zero
postings — the "Jobs" link in the header nav and footer is the only thing
that's conditional, appearing only while at least one non-expired posting
exists. There is no application form on this site for any posting: every
"Zur Stellenanzeige" button opens the listing on the partner's own site in
a new tab. Never build one — that would mean collecting applicant data on
their behalf, which this feature deliberately does not do.

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

## Update the Germany map on `/events` (`GermanyMap.tsx`)

The outline is a static SVG path baked into `GermanyMap.tsx` at
`OUTLINE_PATH` — no map library, no tile provider, no request at runtime,
per CLAUDE.md's third-party-script rule.

**Source and license.** The path is Germany's Admin-0 country boundary from
[Natural Earth](https://www.naturalearthdata.com/) v4.1.0, 1:10m resolution
— public domain, no attribution required. Fetched via the
[`world-atlas`](https://github.com/topojson/world-atlas) npm package
(`countries-10m.json`, a TopoJSON redistribution of the same Natural Earth
release), not hand-drawn and not copied from any map provider's own
rendered tiles or graphic.

**Simplification.** A one-off Node script (not checked into the repo —
recreate from this description if the outline ever needs regenerating):

1. `topojson-client` extracts Germany's feature (ISO 3166-1 numeric `276`)
   from `world-atlas`'s `countries-10m.json`.
2. `topojson-simplify`'s `presimplify`/`simplify` (weight `0.9`) reduces the
   ring to ~20 vertices — enough to keep the coastline's real shape (the
   Jutland notch, the Oder bulge east, the Alpine edge south, the Rhine
   indent west) recognizable at the small size this graphic is ever shown,
   without the thousands of points the raw 1:10m boundary carries.
3. Any polygon ring under 0.2% of the mainland ring's area is dropped (a
   handful of small North Sea islets render as stray specks at this scale,
   not as visible islands).
4. The remaining ring is projected with `d3-geo`'s `geoConicEqualArea`,
   standard parallels 48.66°N/53.66°N, centered on 10.45°E — the same
   equal-area conic German federal mapping agencies use for the country's
   own territory, chosen so the outline's proportions read correctly
   instead of stretching the way a world-scale Mercator would at this
   latitude range.
5. The projected path's coordinates are rounded to one decimal place.

**Points.** `MANNHEIM_POINT` and `TEAM_POINTS` in `GermanyMap.tsx` are the
same six cities' real center coordinates (decimal degrees, public
knowledge — Mannheim, München, Münster, Hamburg, Köln, Karlsruhe) run
through the identical projection instance, not eyeballed. To add a
seventh point, project its lon/lat through the same `geoConicEqualArea`
setup (parallels/rotate above, `fitExtent` against the current outline) so
it lands consistently with the rest.

## Edit the four Enactus Germany event cards on `/events`

`src/content/egEvents.ts` — a fixed set of four (`nc`/`esa`/`oew`/`twe`),
same shape as `content/eventFormats.ts`. Each holds only `order` and a real
photo under `public/events/`; the abbreviation, title, and description are
message keys under `"EgEvents.<key>.abbreviation"` / `.title` / `.description`
in `de.json`/`en.json`, plus an `.imageAlt` describing the photo itself.

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
- Process-page checklists: `messages/{de,en}.json`'s
  `"Process.steps.<key>.checklist"` — a gate's gating criteria or a phase's
  benefits, board-confirmed text like any other message key. Two of the
  eight steps (`kickOff`, `ideation`) intentionally have no checklist at
  all — `content/process.ts`'s `hasChecklist` flag controls whether
  `ProcessTimeline.tsx` renders a panel for a step, so a step without one
  never needs an empty or invented array. Never add a checklist item that
  isn't board-confirmed.

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
