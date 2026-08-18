export type ThreadStop =
  | "partners"
  | "gate-kpis"
  | "kpis"
  | "pillars"
  | "benefits"
  | "gate-calendar"
  | "calendar"
  | "gate-alumni"
  | "alumni"
  | "gate-board"
  | "board"
  | "cta";

export type ThreadWidth = "wide" | "narrow";

type Waypoints = {
  /** x at the section's top edge, in percent of the section's width. */
  from: number;
  /** x at the section's vertical midpoint. */
  bow: number;
  /** x at the section's bottom edge. */
  to: number;
};

/**
 * One waypoint triple per section, per width — see ThreadSegment.tsx for why
 * percent-of-section-width, not pixels, is what lets adjacent segments line
 * up exactly at their seams: `to` of one stop must equal `from` of the next,
 * in both widths (see the continuity test).
 *
 * The thread runs on the homepage and nowhere else. It carried the same
 * signature down /prozess, /projekte, /events, /partner and /kontakt until
 * 2026-08-16; repeating it on every page turned the one memorable element
 * into wallpaper, so those stops are gone rather than commented out.
 *
 * `wide` amplitude is chosen per stop, not globally: preserveAspectRatio="none"
 * scales x and y independently, so the same x-swing reads as a sharp zigzag
 * in a short section (the partner band, the gate dividers) and as an
 * imperceptible drift in a tall one. Gate-divider stops stay perfectly
 * vertical (from = bow = to = 50) so the thread becomes the centered gate
 * rule exactly where the two motifs meet (GateMarker's divider variant is
 * also centered, also 2px, also gold); the swing toward and away from that
 * center happens in the tall section on either side, never in the divider
 * itself.
 *
 * Sides alternate between the four excursions the gate stops carve the page
 * into, so the thread reads as one continuous line finding its way rather
 * than a rule that always leans the same direction: partners enters from the
 * left; kpis/pillars/benefits (the one excursion between gate-kpis and
 * gate-alumni) swings right; alumni swings back left; board/cta (the final
 * excursion, page ends before another gate closes it) swings right again.
 *
 * `narrow` (below `md`) is a deliberately different shape, not a scaled-down
 * `wide`: a thread sweeping from ~40 to ~93 across a 360px screen would
 * repeatedly cross straight through left-aligned body copy. Mobile instead
 * pins the axis at MOBILE_AXIS (~8% of the viewport — just past the
 * container's own left inset, `--container-inset`'s 1rem/16px floor, so the
 * thread runs immediately beside where text starts, the way GateMarker's own
 * `border-l-2` sits immediately beside its label, never "beside" reading as
 * "through"), with every stop's `from`/`to` locked to that axis — the seam
 * math is then trivially continuous — and only the `bow` wandering a few
 * points per section for a small, per-section "breath". It never bows past
 * the axis into the content column (bow ≤ MOBILE_AXIS throughout), only
 * toward the true edge, so it can't drift into the column even at its
 * widest. Stroke width for this variant drops to 1px in ThreadSegment.tsx.
 */
const MOBILE_AXIS = 8;

function narrowAt(bow: number): Waypoints {
  return { from: MOBILE_AXIS, bow, to: MOBILE_AXIS };
}

const ROUTES: Record<ThreadStop, Record<ThreadWidth, Waypoints>> = {
  partners: {
    wide: { from: 42, bow: 46, to: 50 },
    narrow: narrowAt(5),
  },
  "gate-kpis": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: narrowAt(MOBILE_AXIS),
  },
  kpis: {
    wide: { from: 50, bow: 70, to: 82 },
    narrow: narrowAt(6),
  },
  pillars: {
    wide: { from: 82, bow: 74, to: 86 },
    narrow: narrowAt(4),
  },
  // The bow crosses back toward the centre earlier than the amplitude alone
  // would suggest: at `lg` and up, the right-hand third of this section is
  // the tool arc (ToolOrbit), which is also a 2px gold curve. Two of them
  // overlapping read as one broken line rather than as two elements, so the
  // thread clears the arc's band before the arc begins.
  benefits: {
    wide: { from: 86, bow: 58, to: 50 },
    narrow: narrowAt(7),
  },
  "gate-calendar": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: narrowAt(MOBILE_AXIS),
  },
  // A calmer excursion than its neighbours on purpose: the calendar is a
  // list to read, not a moment to look at, so the thread only drifts
  // gently through it rather than repeating benefits' wide swing to the
  // right.
  calendar: {
    wide: { from: 50, bow: 35, to: 50 },
    narrow: narrowAt(5),
  },
  "gate-alumni": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: narrowAt(MOBILE_AXIS),
  },
  alumni: {
    wide: { from: 50, bow: 20, to: 50 },
    narrow: narrowAt(6),
  },
  "gate-board": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: narrowAt(MOBILE_AXIS),
  },
  board: {
    wide: { from: 50, bow: 72, to: 84 },
    narrow: narrowAt(4),
  },
  cta: {
    wide: { from: 84, bow: 76, to: 78 },
    narrow: narrowAt(6),
  },
};

// Iteration order matches the sections' actual order on the homepage
// (src/app/[locale]/(site)/page.tsx) — the order the continuity test walks
// pairwise to check every seam.
export const HOME_STOPS: ThreadStop[] = [
  "partners",
  "gate-kpis",
  "kpis",
  "pillars",
  "benefits",
  "gate-calendar",
  "calendar",
  "gate-alumni",
  "alumni",
  "gate-board",
  "board",
  "cta",
];

export function waypointsFor(stop: ThreadStop, width: ThreadWidth): Waypoints {
  return ROUTES[stop][width];
}

// Two cubic Béziers back to back, each with a vertical tangent at its shared
// endpoint: a straight run into and out of the midpoint keeps both the seam
// with the neighboring segment and the bow at this segment's own midpoint
// free of any visible kink.
export function pathFor(stop: ThreadStop, width: ThreadWidth): string {
  const { from, bow, to } = waypointsFor(stop, width);
  return `M ${from},0 C ${from},20 ${bow},30 ${bow},50 C ${bow},70 ${to},80 ${to},100`;
}
