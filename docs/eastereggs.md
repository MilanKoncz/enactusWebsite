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

A small Enactus logo occasionally peeks out from the bottom of the footer
and withdraws again after a few seconds. Clicking it switches the entire
site into an 8-bit visual mode for 60 seconds. See
`src/components/layout/Footer.tsx` and the 8-bit CSS layer in
`globals.css` (update this line once built) for the mechanism.
