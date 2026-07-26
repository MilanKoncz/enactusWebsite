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
  --color-gold:    #FFC321; /* Signature accent. Never a text color.  */
  --color-paper:   #f3f5f9; /* Page background.                       */
  --color-sand:    #d2bd80; /* Warm nuance, dark backgrounds only.    */
  --color-oxblood: #300612; /* Rare. Deep emphasis on dark.           */
}
```

Enactus Gold in the global brand kit is `#FFC222`; the local kit uses `#FFC321`.
We use the local value until the board decides otherwise.

**Contrast rules, no exceptions:**

- Text on gold is always `--color-ink`. White on gold is ~1.8:1 and fails at
  every size.
- Gold is never a text color on paper (~1.6:1).
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
