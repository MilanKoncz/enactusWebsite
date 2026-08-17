# Design system

Read this before building or changing any UI.

## Direction

Light editorial body, punctuated by full-bleed dark sections. Gold is the
signature and is used sparingly and precisely. Restraint is the point: this
should look like a design studio built it, not like a template with a logo
swapped in.

Spend boldness in one place. The gate marker is the memorable element; everything
around it stays quiet and disciplined. Before finishing a section, remove one
decoration.

## Color

```css
@theme {
  --color-ink:     #061031; /* Navy. Primary text, dark sections.     */
  --color-gold:    #FFC321; /* Signature accent. Text colour on ink only. */
  --color-paper:   #f3f5f9; /* Page background.                       */
  --color-sand:    #d2bd80; /* Warm nuance, dark backgrounds only.    */
  --color-oxblood: #300612; /* Rare. Deep emphasis on dark.           */
  --color-moss:    #215c40; /* Project status: active (filled).       */
  --color-amber:   #795c13; /* Project status: paused (outline).      */
}
```

`moss` and `amber` exist for two purposes: `Badge`'s project-status colors
(`ui/Badge.tsx`) — active (moss, filled), spinoff (gold, filled), paused
(amber, outline), cancelled (oxblood, outline) — and `moss` doubles as the
site's one success color (`ui/FormStatusMessage.tsx`, every form's
confirmation), the same "green = active/good" reading in both places.
`amber` stays scoped to `Badge`'s paused state; error messages reuse
oxblood, already the site's one error/emphasis color, rather than adding a
third red. All are muted rather than a vivid green/yellow on purpose: a
saturated yellow or green can't clear 4.5:1 as text against `--color-paper`,
so "reads as its intuitive color" and "passes AA" both push toward the muted
end of the hue. Don't introduce a third color for a fifth state — reuse one
of these four before adding a new token.

Enactus Gold in the global brand kit is `#FFC222`; the local kit uses `#FFC321`.
We use the local value until the board decides otherwise.

**Contrast rules, no exceptions:**

- Text on gold is always `--color-ink`. White on gold is ~1.8:1 and fails at
  every size.
- Gold is never a text color on paper (1.47:1). On ink it measures 11.6:1 and
  is allowed — sparingly, for one emphasised word, never for a run of copy.
  The hero's rotating term is the reference case; where a dark section has a
  photo or video behind it, measure against the brightest frame the scrim can
  let through, not against the token (the hero's worst case is 6.4:1).
- Sand is legible only on ink, never on paper.
- Muted text on paper: ink at 60% opacity minimum. Subtlety comes from size and
  weight, not from illegibility.

Navy, paper, and gold carry the design. Sand appears occasionally. Oxblood is
almost never needed — if you reach for it, question the layout instead.

## Typography

- **Display — Instrument Serif.** Headlines only, large, tight tracking. Never
  below 28px. Never for UI or labels. It is the voice for statements, not for
  structure.
- **Body and UI — Geist.** All copy, navigation, buttons, forms.
- **Data and eyebrows — Geist Mono.** Uppercase, wide tracking, small.

The type scale is defined once in `@theme`. Never write arbitrary `text-[42px]`
values in a component. If a size is missing from the scale, add it to the scale.

## Spacing

There is no named spacing scale (no `--spacing-sm`, `--spacing-md`, ...). Use
Tailwind's own numeric scale for padding, gap, and margin — `p-4`, `gap-6`,
`py-24` — all multiples of the base `--spacing: 0.25rem`. Steps actually in
use across the codebase: `1` (0.25rem) · `2` (0.5rem) · `3` (0.75rem) ·
`4` (1rem) · `6` (1.5rem) · `10` (2.5rem) · `16` (4rem) · `24` (6rem) ·
`36` (9rem).

This is deliberate, not an oversight: Tailwind v4 resolves `w-*`, `min-w-*`,
`max-w-*`, `basis-*`, and `size-*` against `--spacing` before falling back to
the built-in `--container-*` scale. A named step here (`--spacing-sm`, say)
would silently win over the built-in `--container-sm` (24rem) any time one of
those utilities used the same name — `max-w-sm` would quietly become 1rem
instead of 24rem, no build error, just a collapsed layout. Reach for the
numeric scale instead; it can't collide because it's never a bare word.

## The signature: gate markers

The organisation runs on **gates** — Inno Gating, Operations Gating — moments
where a project is approved to continue or stopped. That is the most
characteristic thing about how this initiative actually works, so it becomes the
visual device.

A gate marker is a 2px vertical gold rule with a mono uppercase label set against
it. It appears as:

- the milestone marker on the Ideation Process timeline
- the divider between major homepage sections
- the left edge of a project status badge

One motif, carried consistently. Do not introduce a competing second motif.

## Structure

Structural devices — eyebrows, dividers, numbering — encode something true about
the content, never decorate it. Numbered markers (01 / 02 / 03) are only
appropriate where the content genuinely is a sequence, such as the process
timeline. Do not apply them to unordered card grids.

Section eyebrows are mono, small, and restrained, but never below 4.5:1 contrast.

## Motion

1. **Hover enhances, hover never hides.** Content readable without interaction.
   Exceptions: project cards and the Ideation timeline, where expanding saves
   real space. On touch devices those expand on tap, not hover.

   Everything else that used to fade text in on hover — the pillars, the
   benefits cards, the `/mitmachen` expectations and offers, the board
   portraits' LinkedIn mark — shows its text at all times. Those boxes carry
   `.hover-grow` instead: `scale(1.02)` on hover or focus, and nothing else.
   Inert on touch and under `prefers-reduced-motion`.
2. **CSS first.** Scroll reveals use `IntersectionObserver` or CSS scroll-driven
   animations — compositor work, no main thread cost. Reach for `motion` only for
   the orchestrated hero sequence and a small number of shared layout
   transitions.
3. **One orchestrated moment beats ten scattered effects.** The hero is where the
   animation budget is spent.
4. **`prefers-reduced-motion: reduce`** disables transforms and parallax entirely,
   leaving instant state changes. Not a degraded experience — a calm one.
5. **Never animate `width`, `height`, `top`, or `left`.** Transform and opacity
   only. This governs continuous and scroll-linked animation — a repeated
   effect across many elements, where per-frame layout cost is the risk. A
   discrete state toggle on a single `fixed`/out-of-flow element (the header's
   scroll-compact padding, for instance) is a different risk class: it can't
   reflow anything else, and it fires at most a handful of times per session.
   That's the one documented exception, not a loophole — don't extend it to
   anything still in normal document flow.
6. If an animation pushes LCP over 2.0s or introduces layout shift, it is removed,
   not optimised.

## Interaction

Two tokens carry every hover and active state in the codebase. No component
reaches for its own duration or easing value.

```css
@theme {
  /* Registered as a Tailwind theme token — used directly as `ease-signature`.
     A slight overshoot, not ease-in-out: hover states should feel like they
     have a little intent, not a mechanical fade. */
  --ease-signature: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* A line growing from 0 to full width (the prose-link underline) needs a
     clean sweep, not a bounce — the overshoot above is right for a scale/lift
     that settles back, wrong for a scaleX. */
  --ease-grow: cubic-bezier(0.65, 0, 0.35, 1);
}

:root {
  /* Tailwind v4 has no named duration-* theme namespace (only the numeric
     scale), so these stay plain variables, referenced as
     duration-[var(--duration-fast)]. */
  --duration-fast: 150ms; /* Hover: color, transform, opacity. */
  --duration-calm: 400ms; /* State changes: a scroll-triggered toggle, an
                              open/close — not a passive hover response. */
}
```

Rules, no exceptions:

- Transform, opacity, and filter only — motion rule 5 above holds for
  interaction states, not just scroll-linked animation. Never `width`,
  `height`, `top`, `left`.
- No layout shift: a hover/active transform never changes an element's
  footprint in its parent. Scale from the center, or scale a nested element
  inside an `overflow-hidden` crop — never resize the box itself.
- **Focus gets the same visual treatment as hover, not a lesser one.** A
  keyboard user's state is never an afterthought next to a mouse user's.
- Disabled entirely under `prefers-reduced-motion: reduce` — handled globally
  in `globals.css`, not per component.

Component specifics:

- **Button** — hover: `scale(1.02)` plus a slight lift (`translateY(-1px)`).
  Active: `scale(0.99)`, so a click reads as a physical press. Primary
  (gold): a soft diagonal shine sweeps across the fill once on hover — subtle,
  never a department-store gloss. Glass: `backdrop-blur` with a saturation
  boost, a translucent border brighter than the fill, a hairline light edge on
  top, a faint inner shadow underneath.
- **Card** — hover/focus: the same lift as Button, plus the border
  brightening from `ink/10` toward `ink/20`. `interaction="grow"` swaps that
  for `.hover-grow` on the cards that carry an always-visible detail
  sentence. A card is defined by its border, never by a fill: the section
  under it already paints the same surface, and an opaque card would hide
  the golden thread passing behind it.
- **Badge** — hover/focus: a barely-there lift only, no color change — color
  already carries the status and shouldn't shift with the pointer.
- **Prose links** — hover/focus: an underline that grows in from the left
  (`.link-underline` in `globals.css`), never an instant `text-decoration`
  toggle.
- **Alumni prev/next buttons, board portraits** — buttons get the same lift as
  Button; portraits zoom on the image crop itself (`scale` on the image inside
  its `overflow-hidden` wrapper), never on the outer card, so neighboring
  content never shifts.

All of the above is demoed side by side in the styleguide's "Interaction"
section — hover and tab through it there to compare states directly.

## Copy

Words are design material, not decoration. Name things by what people control and
recognise. Active voice: "Bewerbung absenden," not "Absenden." An action keeps the
same name through the whole flow. Errors say what went wrong and how to fix it,
without apologising. Empty states are an invitation to act, not a mood.

Sentence case throughout. No filler. Specific beats clever.

## Watch out for

CSS specificity collisions between section-level and element-level classes,
especially on vertical padding. Two rules that cancel each other out is the most
common source of inconsistent spacing.
