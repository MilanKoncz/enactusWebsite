export type ThreadStop =
  | "partners"
  | "gate-kpis"
  | "kpis"
  | "pillars"
  | "benefits"
  | "gate-alumni"
  | "alumni"
  | "gate-board"
  | "board"
  | "cta";

export type ThreadWidth = "wide" | "narrow";

type Waypoints = {
  /** x at the section's top edge, in percent of section width. */
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
 * in both widths. Enforced by threadRoute.test.ts, not just by convention.
 *
 * Amplitude is chosen per stop, not globally: preserveAspectRatio="none"
 * scales x and y independently, so the same x-swing reads as a sharp zigzag
 * in a short section (the partner band, the gate dividers) and as an
 * imperceptible drift in a tall one. Gate-divider stops stay perfectly
 * vertical (from = bow = to = 50) so the thread becomes the centered gate
 * rule exactly where the two motifs meet (GateMarker's divider variant is
 * also centered, also 2px, also gold); the swing toward and away from that
 * center happens in the tall section on either side, never in the divider
 * itself.
 */
const ROUTES: Record<ThreadStop, Record<ThreadWidth, Waypoints>> = {
  partners: {
    wide: { from: 42, bow: 46, to: 50 },
    narrow: { from: 40, bow: 45, to: 50 },
  },
  "gate-kpis": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  kpis: {
    wide: { from: 50, bow: 30, to: 18 },
    narrow: { from: 50, bow: 22, to: 10 },
  },
  pillars: {
    wide: { from: 18, bow: 26, to: 14 },
    narrow: { from: 10, bow: 14, to: 7 },
  },
  benefits: {
    wide: { from: 14, bow: 22, to: 50 },
    narrow: { from: 7, bow: 16, to: 50 },
  },
  "gate-alumni": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  alumni: {
    wide: { from: 50, bow: 20, to: 50 },
    narrow: { from: 50, bow: 12, to: 50 },
  },
  "gate-board": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  board: {
    wide: { from: 50, bow: 28, to: 16 },
    narrow: { from: 50, bow: 20, to: 8 },
  },
  cta: {
    wide: { from: 16, bow: 24, to: 22 },
    narrow: { from: 8, bow: 14, to: 12 },
  },
};

// Iteration order matches the stops' actual order on the homepage
// (src/app/[locale]/(site)/page.tsx) — the order the continuity test walks
// pairwise to check every seam.
export const THREAD_STOPS: ThreadStop[] = [
  "partners",
  "gate-kpis",
  "kpis",
  "pillars",
  "benefits",
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
// endpoint (y=0, y=50, y=100): a straight vertical run into and out of the
// midpoint keeps both the seam with the neighboring segment and the bow at
// this segment's own midpoint free of any visible kink.
export function pathFor(stop: ThreadStop, width: ThreadWidth): string {
  const { from, bow, to } = waypointsFor(stop, width);
  return `M ${from},0 C ${from},20 ${bow},30 ${bow},50 C ${bow},70 ${to},80 ${to},100`;
}
