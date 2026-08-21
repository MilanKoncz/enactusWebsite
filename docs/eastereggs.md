# Easter eggs

Seven intentional easter eggs live on this site. They are listed here so the
next Head of IT recognizes them as deliberate features during a future
redesign or accessibility audit, not as bugs to "fix" by deleting. All seven
are beiwerk (extras): wherever one would collide with existing
functionality, accessibility, or privacy, the existing thing wins — none of
them changes a route's status code, skips validation, adds tracking, or
hides content a keyboard/screen-reader user would otherwise get.

## 1. Admin footer credit → mkoncz.me

`src/app/[locale]/admin/layout.tsx`'s footer credit ("Designed and built by
Milan Koncz") is a real link to `https://mkoncz.me`, opening in a new tab
(`rel="noopener noreferrer"`). It uses `.link-underline`, the site's one
hover/focus treatment for prose links — a gold rule grows in under the text
on hover or focus, never gold as the text color itself (gold text on paper
fails contrast outright, no exception here). Nothing else about the credit
line changed; it reads identically to a signed-off, board-visible line, it
just happens to be clickable.

## 2. Hero logo → confetti

Three clicks on the Enactus logo in the homepage hero, within two seconds
of each other, trigger a short (1.4s) confetti burst in the brand colors
(gold, navy, sand) — `src/components/motion/HeroLogoConfetti.tsx`, wrapping
`HomeHero.tsx`'s logo. Self-built with a `<canvas>` and `requestAnimationFrame`,
no library — the actual burst logic lives in
`src/components/motion/ConfettiBurst.tsx`, the one confetti engine on the
site, shared with eggs 4 and 7 below rather than reimplemented per caller.
The canvas mounts only for the burst's own duration and is removed the
moment it ends. Inert entirely under `prefers-reduced-motion` — not a
calmer variant, no effect at all. The logo stays a plain image (no button
role, no added tab stop); the click handler only matters to a mouse/touch
user, and the effect changes nothing else about the page.

## 3. Footer 8-bit mode

A small Enactus logo occasionally peeks up from the bottom of the footer
(random position, hidden 5-15s, visible 4-7s — shortened from an original
10-90s hidden window, board feedback: "waited ages, nothing came") and
withdraws again. Clicking it switches the whole site into an 8-bit visual
mode for 60 seconds. `src/components/motion/EightBitEasterEgg.tsx`,
rendered by `Footer.tsx`, owns only the timing state machine and writes a
single `data-eight-bit` attribute (`entering` / `active` / `exiting`) onto
`<html>`; the entire visual side — a second color palette, the self-hosted
Press Start 2P pixel font (`src/fonts/press-start-2p/`, OFL-licensed, same
pattern as Lilita One), zeroed border-radius, no shadows, pixelated
images, and reduced font sizes across the whole type scale (headline steps
the most, since those risked real clipping/overlap; body and mono text a
lighter pass, purely to cut the font's visual weight) so the wider pixel
glyphs don't clip inside containers sized for Geist/Lilita One — lives entirely
in `globals.css`'s `html[data-eight-bit]` rules. No component was
duplicated or modified to build the look itself.

Exits: 60s auto-timeout, Escape, or a visible on-screen off-switch (a
normal, fully tabbable button — unlike the peek button, this one is meant
to be found; px-3/py-1.5 below `sm` rather than the normal px-4/py-2 —
Press Start 2P already reads visually heavier than the same button in
Geist, and a phone screen has the least room to spare for it, board
feedback 2026-08-21). Never survives a pathname change (an immediate
reset, no transition) and never activates at all on `/impressum`,
`/datenschutz`, or anywhere under `/admin`. The ~1s entry/exit transition
is a blur/brightness flicker (`@keyframes eight-bit-flicker`), reachable
only via the peek button, which itself never renders under
`prefers-reduced-motion`.

The whole second palette is contrast-checked in
`tests/unit/contrast.test.ts` ("8-bit mode palette") against every pair
the brand palette relies on (paper-on-ink, ink-on-gold, sand-on-ink,
paper-on-moss, amber/oxblood-on-paper, both 60%-opacity muted-text cases)
— all clear 4.5:1.

A real bug this once had, mobile only (board feedback, 2026-08-21):
Press Start 2P's wider glyphs pushed a hand-tuned `white-space: nowrap`
string (`HomeKpis.tsx`'s `worldRankingDetail` span, measured against
Geist Mono's own width) past its container, and — because nothing clipped
that overflow — the mobile browser's own layout viewport widened to fit
it and stayed that way for as long as the mode was active, not a one-frame
flash. A visitor could pinch/pan into the resulting blank strip on the
right. Fixed in `globals.css`'s `html[data-eight-bit]` block two ways:
`white-space: normal !important` on the same blanket `*` selector that
already swaps the font (the actual fix — this specific span was the
confirmed cause, and the override can't reach any other page since it's
scoped to exactly the two states that swap the font), plus
`overflow-x: hidden` on `html` itself as defense in depth against
anything else this font swap might someday widen. Verified with a real
touch-drag simulation, not just `scrollX`: `window.visualViewport` — the
area a visitor can actually pan to — never moves or grows, even though
`window.innerWidth` itself can still read a stale, wider value (an
internal browser layout metric with no reachable, visible consequence).
`tests/e2e/eightbit.spec.ts` covers this on a real mobile viewport.

## 4. Contact form success → confetti

Submitting the contact form (`/kontakt`) successfully triggers the same
confetti burst as the hero logo click (`ConfettiBurst`, see egg 2) —
`ContactForm.tsx` reads the success message's own rendered position
(`getBoundingClientRect()` on a ref around it, right after mount) and bursts
from there. Only on a real, confirmed success — never on validation
failure, never while pending, and never on the network/mail-provider error
path, which still shows the plain error message with the mailto fallback,
unchanged. The announced confirmation text (`FormStatusMessage`, `role=
"status"`) is identical to before and unaffected either way; the burst
itself is `aria-hidden` and purely decorative. Inert entirely under
`prefers-reduced-motion`, same as egg 2. The application form
(`/mitmachen`) deliberately gets none of this — a Bewerbung is a serious
step, not a moment for particles.

## 5. The 404 page is a small building site

`not-found.tsx` (both locales) reads as a corner of the InnoLab under
construction rather than a plain error page: a handful of real, unmodified
UN SDG icons (`public/sdg/`, via `sdgIconSrc()` — the same source every SDG
reference on the site uses, never recolored or cropped, per the UN's own
usage terms) float gently at the section's edges, a gold-line lattice tower
crane (`ConstructionCrane`, inline SVG — real vector geometry, the same
move `GermanyMap.tsx` already made for a shape no CSS utility approximates
well) hoists one of them by a dashed cable, an `AlertTriangle`
(lucide-react, the same icon `FormStatusMessage.tsx`'s own error state
already uses — a real hazard cue, not a new pictogram) sits tilted near the
tiles, gold/ink hazard-stripe tape (`globals.css`'s `.hazard-stripes`
utility, a `repeating-linear-gradient` — the same two brand tokens
conventional hazard tape already uses, yellow/black) runs along the
section's bottom edge, and two `GateMarker`s (the site's one signature
motif — a gold rule plus a mono label) stand in as a barrier too, labelled
"Baustelle" / "InnoLab". Everything decorative sits in a single
`aria-hidden`, `pointer-events-none` layer, pinned to the corners and edges
and well clear of the centered heading, note, and link list, so the joke
can never get between a visitor and the way back — the heading itself
stays the real, meaningful text (`t("title")`, "404. Diese Seite wird
gerade noch im InnoLab entwickelt."), not a replacement for it. Below the
note, the existing "back to homepage" link is joined by the full main-nav
link list (same `content/navigation.ts` `mainNav` Header and Footer
already read from), so a visitor who lands here from a dead link can
reach any main section directly, not just the homepage.

The crane went through a second pass (board feedback, 2026-08-21: the
first version — one mast, one jib, one dashed cable — read as too abstract
to register as a crane at all). This one is real SVG geometry: a lattice
mast (two rails plus zigzag cross-bracing, not a single flagpole line), a
counter-jib with a solid counterweight block, and the A-frame apex bracing
both arms — the detail that actually makes a tower-crane silhouette
legible at a glance. The cable itself stays a plain CSS div reusing the
site's existing dashed-gold-border vocabulary (the calendar's "tentative"
event treatment, docs/design-system.md) rather than inventing a second
dashed-line style — a tile still "in progress" reads the same way here as
it does on an unconfirmed calendar event. The AlertTriangle and the crane
are both `hidden` below `md` — the same threshold the two GateMarkers
already used, established there for the same reason: at a narrow width the
"oder weiter zu:" link list wraps onto more lines and reaches further down
the section, and a fixed-offset decoration low in the layout collides with
it below that width (confirmed by hand at 390px before adding the guard).
The tiles' float (`animate-construction-float`, `globals.css`) is a plain
transform-only CSS loop, no JavaScript — like every other looping
animation on this site, it collapses to a single near-instant frame under
`prefers-reduced-motion` via the blanket override already in `globals.css`,
rather than carrying its own reduced-motion guard. The route's status code
and Next's own `not-found.tsx` behavior are untouched — this only changes
what renders inside it.

## 6. Header logo → night mode zzZ

Load the site between 22:00 and 06:00 in your browser's local time and a
small zzZ sequence drifts up beside the Enactus logo in the header, as if
it were asleep — `NightModeZzz.tsx`, wrapped around `Header.tsx`'s logo
link. Deliberately the *header's* logo, not the homepage hero's
(`HeroLogoConfetti.tsx`, egg 2, which owns none of this): the header is on
every page, so the sleepy logo is too, not just on `/`. The check runs
exclusively client-side, after mount, off the visitor's own local clock —
never server-evaluated: the pages are static and served from a CDN, so a
server-side check would either freeze at build time or disagree with the
client and cause a hydration mismatch, the exact failure class this
project has already hit twice. It reuses the existing `useNow` hook
(`src/lib/useNow.ts`) rather than a new interval/clock hook — polled once a
minute, not once a second, since the display only needs to catch a
night/day transition, not tick visibly. `useNow`'s documented epoch (`0`)
snapshot for the server and the first client render is what keeps this
egg fully absent at both of those points (`now > 0` gates it) — the exact
same safe-default pattern the hook's own file comment describes for
`/mitmachen`'s recruiting-window check, reused here rather than
reinvented.

The zzZ are `aria-hidden`, absolutely positioned inside the header's own
logo link (which the header link itself is `position: relative` for) so
they can never affect the logo's own box, size, or the surrounding
layout — nothing shifts when they appear after mount. Never rendered under
`prefers-reduced-motion`. The logo itself and its size are completely
unchanged; the zzZ are a sibling overlay, not a modification to the logo
or the link's own dimensions. Sized `text-mono-s`/`text-mono-m` rather
than the smaller `text-mono-xs`/`text-mono-s` the first pass used (board
feedback, 2026-08-21: too easy to miss on a phone) — the header logo
itself doesn't change size between mobile and desktop, so one size
already works everywhere rather than needing a separate mobile bump.

## 7. `/secret` — the party

A hidden page at `/secret` (and `/en/secret`), reachable only by typing the
URL. It is not one of `content/navigation.ts`'s `routes` — not in
`mainNav`, not in the Header, not in the Footer, and therefore not in
`sitemap.ts` either, since that page builds its path list from exactly that
record. `robots.ts` disallows it explicitly on top of that, and the page's
own metadata sets `robots: { index: false, follow: false }` — the same
belt-and-braces layering `/admin/bewerbungen` already uses for its own
noindex. It carries no real data, no form, and no database access — a
party, not a quiet chill-out room: a dark, gold-accented moment
(`Section surface="ink"`) with a real heading ("Du hast die geheime Chill
Area gefunden!"), a short note, a link back to the homepage, a logo mark
that glows through every hue and pulses to a beat, and confetti that keeps
coming back.

The logo (`Logo variant="compact"`) carries two concurrent CSS animations,
`animate-party-glow` and `animate-party-beat` (`globals.css`) — one cycles
a `hue-rotate` filter continuously through the color wheel (with two
gold `drop-shadow`s riding along, since they're composited before the
final hue-rotate stage), the other gives it a snappy, off-beat scale/rotate
pulse. Both are a deliberate, contained exception to
docs/design-system.md's usual transform/opacity-only motion rule — see the
`@keyframes party-glow` comment for why a single decorative element on one
hidden, intentionally over-the-top page doesn't carry the performance risk
that rule otherwise guards against. Both collapse to their neutral resting
frame under `prefers-reduced-motion` via the blanket override already in
`globals.css`, no separate guard needed.

`SecretPartyConfetti.tsx` fires the same `ConfettiBurst` egg 2 and egg 4
use — once on mount, then again every four seconds for as long as the page
stays open, each time from a fresh, slightly randomized point near the top
of the viewport, since unlike those two callers there's no single element
on this page for a burst to be "from". Inert under `prefers-reduced-motion`;
the page itself stays fully reachable and readable either way, it just
never renders a burst.
