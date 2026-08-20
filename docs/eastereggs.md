# Easter eggs

Three intentional, board-approved easter eggs live on this site. They are
listed here so the next Head of IT recognizes them as deliberate features
during a future redesign or accessibility audit, not as bugs to "fix" by
deleting.

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
no library. The canvas mounts only for the burst's own duration and is
removed the moment it ends. Inert entirely under `prefers-reduced-motion`
— not a calmer variant, no effect at all. The logo stays a plain image (no
button role, no added tab stop); the click handler only matters to a
mouse/touch user, and the effect changes nothing else about the page.

## 3. Footer 8-bit mode

A small Enactus logo occasionally peeks up from the bottom of the footer
(random position, hidden 10-90s, visible 3-6s) and withdraws again.
Clicking it switches the whole site into an 8-bit visual mode for 60
seconds. `src/components/motion/EightBitEasterEgg.tsx`, rendered by
`Footer.tsx`, owns only the timing state machine and writes a single
`data-eight-bit` attribute (`entering` / `active` / `exiting`) onto
`<html>`; the entire visual side — a second color palette, the self-hosted
Press Start 2P pixel font (`src/fonts/press-start-2p/`, OFL-licensed, same
pattern as Lilita One), zeroed border-radius, no shadows, pixelated
images, and reduced headline-scale font sizes so the wider pixel glyphs
don't clip inside containers sized for Geist/Lilita One — lives entirely
in `globals.css`'s `html[data-eight-bit]` rules. No component was
duplicated or modified to build the look itself.

Exits: 60s auto-timeout, Escape, or a visible on-screen off-switch (a
normal, fully tabbable button — unlike the peek button, this one is meant
to be found). Never survives a pathname change (an immediate reset, no
transition) and never activates at all on `/impressum`, `/datenschutz`,
or anywhere under `/admin`. The ~1s entry/exit transition is a blur/
brightness flicker (`@keyframes eight-bit-flicker`), reachable only via
the peek button, which itself never renders under
`prefers-reduced-motion`.

The whole second palette is contrast-checked in
`tests/unit/contrast.test.ts` ("8-bit mode palette") against every pair
the brand palette relies on (paper-on-ink, ink-on-gold, sand-on-ink,
paper-on-moss, amber/oxblood-on-paper, both 60%-opacity muted-text cases)
— all clear 4.5:1.
