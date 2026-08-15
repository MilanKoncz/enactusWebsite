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
  | "cta"
  | "process-intro"
  | "process-timeline"
  | "process-guide"
  | "process-cta"
  | "projects-intro"
  | "projects-active"
  | "projects-stars"
  | "events-intro"
  | "events-formats"
  | "events-journeys"
  | "events-network"
  | "partner-intro"
  | "partner-tiers"
  | "partner-statements"
  | "partner-membership"
  | "partner-contact"
  | "kontakt-content";

export type ThreadWidth = "wide" | "narrow";

// "y" (the default, every homepage stop) is a vertical run down a section:
// `from`/`bow`/`to` are x-positions at the top edge, midpoint, and bottom
// edge. "x" is the same S-curve transposed onto the horizontal axis — the
// values become y-positions at the left edge, midpoint, and right edge of a
// section that runs sideways instead of down. Only the /prozess timeline (in
// its wide, horizontal layout) ever sets "x"; every other stop, and that same
// timeline stop's own narrow/stacked layout, relies on the "y" default.
export type ThreadAxis = "x" | "y";

type Waypoints = {
  /** At axis "y": x at the section's top edge. At axis "x": y at the
      section's left edge, in percent. */
  from: number;
  /** At axis "y": x at the section's vertical midpoint. At axis "x": y at
      the section's horizontal midpoint, in percent. */
  bow: number;
  /** At axis "y": x at the section's bottom edge. At axis "x": y at the
      section's right edge, in percent. */
  to: number;
  axis?: ThreadAxis;
};

/**
 * One waypoint triple per section, per width — see ThreadSegment.tsx for why
 * percent-of-section-width, not pixels, is what lets adjacent segments line
 * up exactly at their seams: `to` of one stop must equal `from` of the next,
 * in both widths, among stops that share an axis (see the continuity test
 * for the one named exception this creates).
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
 *
 * Sides alternate between the four excursions the gate stops carve the page
 * into, so the thread reads as one continuous line finding its way rather
 * than a rule that always leans the same direction: partners enters from the
 * left; kpis/pillars/benefits (the one excursion between gate-kpis and
 * gate-alumni) swings right; alumni swings back left; board/cta (the final
 * excursion, page ends before another gate closes it) swings right again.
 * The right-swinging stops are exact mirrors of their left-swinging
 * counterparts — mirror(x) = 100 - x — so the amplitude at each stop is
 * identical to before, just reflected.
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
    wide: { from: 50, bow: 70, to: 82 },
    narrow: { from: 50, bow: 78, to: 90 },
  },
  pillars: {
    wide: { from: 82, bow: 74, to: 86 },
    narrow: { from: 90, bow: 86, to: 93 },
  },
  benefits: {
    wide: { from: 86, bow: 78, to: 50 },
    narrow: { from: 93, bow: 84, to: 50 },
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
    wide: { from: 50, bow: 72, to: 84 },
    narrow: { from: 50, bow: 80, to: 92 },
  },
  cta: {
    wide: { from: 84, bow: 76, to: 78 },
    narrow: { from: 92, bow: 86, to: 88 },
  },

  // /prozess (ProcessTimeline.tsx). A short, separate run — this page opens
  // with its own intro, not with the homepage's thread, so it starts back at
  // a centered 50 rather than picking up wherever `cta` left off.
  "process-intro": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  // The one stop that changes axis by width: at "wide" the timeline itself
  // is horizontal, so the thread becomes its spine and runs flat (axis "x",
  // a centered 50 the entire way — the timeline's own station markers carry
  // the visual interest, the thread just has to arrive and leave level). At
  // "narrow" the timeline stacks vertically instead, so the thread reverts
  // to the default "y" axis and becomes the rail the stations line up
  // against, with a slight drift so it still reads as the same living line
  // rather than a ruler-straight guide.
  "process-timeline": {
    wide: { from: 50, bow: 50, to: 50, axis: "x" },
    narrow: { from: 50, bow: 20, to: 50 },
  },
  "process-guide": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  "process-cta": {
    wide: { from: 50, bow: 60, to: 66 },
    narrow: { from: 50, bow: 66, to: 72 },
  },

  // /projekte (Projects*.tsx). Its own separate run, same reasoning as the
  // /prozess stops above: this page opens with its own intro, not the
  // homepage's thread.
  "projects-intro": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  // Drifts left through the active-project card list, mirroring how `kpis`
  // drifts right on the homepage — alternating direction per section is
  // what keeps the thread reading as one line finding its way rather than
  // a rule that always leans the same side (see the ROUTES doc comment).
  "projects-active": {
    wide: { from: 50, bow: 38, to: 30 },
    narrow: { from: 50, bow: 34, to: 24 },
  },
  "projects-stars": {
    wide: { from: 30, bow: 55, to: 70 },
    narrow: { from: 24, bow: 52, to: 76 },
  },

  // /events (Events*.tsx). Its own separate run, same reasoning as
  // /projekte and /prozess above.
  "events-intro": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  "events-formats": {
    wide: { from: 50, bow: 62, to: 74 },
    narrow: { from: 50, bow: 58, to: 66 },
  },
  // Swings back across center through the Journeys history — this section
  // lays its own trip cards out horizontally, but that's a content-grid
  // choice, not a reason for the thread itself to change axis; "x" stays
  // the single named exception at process-timeline (see PROCESS_STOPS).
  "events-journeys": {
    wide: { from: 74, bow: 50, to: 26 },
    narrow: { from: 66, bow: 50, to: 34 },
  },
  "events-network": {
    wide: { from: 26, bow: 45, to: 50 },
    narrow: { from: 34, bow: 45, to: 50 },
  },

  // /partner (Partner*.tsx). Its own separate run, same reasoning as the
  // other route-specific stops above.
  "partner-intro": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
  "partner-tiers": {
    wide: { from: 50, bow: 64, to: 78 },
    narrow: { from: 50, bow: 60, to: 70 },
  },
  "partner-statements": {
    wide: { from: 78, bow: 50, to: 22 },
    narrow: { from: 70, bow: 50, to: 30 },
  },
  "partner-membership": {
    wide: { from: 22, bow: 40, to: 58 },
    narrow: { from: 30, bow: 42, to: 54 },
  },
  // The one dark (ink) section on this page, matching ProcessCta's "one
  // dark moment at the very end" — the thread settles rather than swinging
  // hard, so it arrives calmly at the closing CTA instead of overshooting it.
  "partner-contact": {
    wide: { from: 58, bow: 50, to: 42 },
    narrow: { from: 54, bow: 50, to: 46 },
  },

  // /kontakt (KontaktContent.tsx) — a single section, so a single centered
  // run rather than a multi-stop route like the other pages.
  "kontakt-content": {
    wide: { from: 50, bow: 50, to: 50 },
    narrow: { from: 50, bow: 50, to: 50 },
  },
};

// Iteration order matches the sections' actual order on the homepage
// (src/app/[locale]/(site)/page.tsx) — the order the continuity test walks
// pairwise to check every seam. THREAD_STOPS is kept as an alias: nothing
// outside this module still needs the un-prefixed name, but the homepage
// predates the /prozess stops and this keeps that history legible.
export const HOME_STOPS: ThreadStop[] = [
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
export const THREAD_STOPS = HOME_STOPS;

// Iteration order matches src/app/[locale]/(site)/prozess/page.tsx.
export const PROCESS_STOPS: ThreadStop[] = [
  "process-intro",
  "process-timeline",
  "process-guide",
  "process-cta",
];

// Iteration order matches src/app/[locale]/(site)/projekte/page.tsx.
export const PROJECTS_STOPS: ThreadStop[] = ["projects-intro", "projects-active", "projects-stars"];

// Iteration order matches src/app/[locale]/(site)/events/page.tsx.
export const EVENTS_STOPS: ThreadStop[] = [
  "events-intro",
  "events-formats",
  "events-journeys",
  "events-network",
];

// Iteration order matches src/app/[locale]/(site)/partner/page.tsx.
export const PARTNER_STOPS: ThreadStop[] = [
  "partner-intro",
  "partner-tiers",
  "partner-statements",
  "partner-membership",
  "partner-contact",
];

// Single-stop route — see src/app/[locale]/(site)/kontakt/page.tsx.
export const KONTAKT_STOPS: ThreadStop[] = ["kontakt-content"];

export function waypointsFor(stop: ThreadStop, width: ThreadWidth): Waypoints {
  return ROUTES[stop][width];
}

export function axisFor(stop: ThreadStop, width: ThreadWidth): ThreadAxis {
  return ROUTES[stop][width].axis ?? "y";
}

// Two cubic Béziers back to back, each with a vertical (axis "y") or
// horizontal (axis "x") tangent at its shared endpoint: a straight run into
// and out of the midpoint keeps both the seam with the neighboring segment
// and the bow at this segment's own midpoint free of any visible kink. The
// axis "x" branch is exactly the axis "y" one with x and y swapped in every
// coordinate pair — same curve, transposed.
export function pathFor(stop: ThreadStop, width: ThreadWidth): string {
  const { from, bow, to, axis = "y" } = waypointsFor(stop, width);
  if (axis === "x") {
    return `M 0,${from} C 20,${from} 30,${bow} 50,${bow} C 70,${bow} 80,${to} 100,${to}`;
  }
  return `M ${from},0 C ${from},20 ${bow},30 ${bow},50 C ${bow},70 ${to},80 ${to},100`;
}
