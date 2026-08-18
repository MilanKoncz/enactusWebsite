import { cn } from "@/lib/cn";
import { pathFor, type ThreadStop } from "./threadRoute";

export type ThreadSegmentProps = {
  stop: ThreadStop;
  className?: string;
};

// One <path> per section rather than one long path spanning the page: an
// absolutely positioned overlay big enough to cover every section would
// paint either behind every section's opaque background (negative z-index
// relative to the page) or over every headline (positive z-index) — there's
// no single z-index that threads between the two. Splitting into per-section
// segments confined to their own `isolate` Section instead lets every
// segment sit in the same paint slot — above its own section's background,
// below its own section's content — without competing with the next
// section's stacking context.
//
// preserveAspectRatio="none" stretches x to 0-100% of the section's width
// and y to 0-100% of its height, independently — that's what makes x a
// percentage comparable across sections of different heights, which is what
// lets threadRoute.ts's waypoints line up exactly at each seam.
// vector-effect="non-scaling-stroke" keeps the stroke width uniform despite
// that non-uniform scaling, instead of rendering as a squashed ellipse. The
// scroll reveal is a clip on this svg rather than a stroke-dasharray on the
// path — see .thread-reveal in globals.css for why the two can't be
// combined.
//
// Below md the thread doesn't render at all (board feedback) — not a
// narrower version of itself, gone outright: `hidden md:block` on the svg
// root, the same CSS-only switch EventCalendar's two views use, never a
// useMediaQuery hook whose SSR snapshot would flash it in for one frame.
// threadRoute.ts's "narrow" waypoints stay defined and tested — they're the
// data this used to render with mobile's own 1px hairline (MOBILE_AXIS etc.),
// kept in case that decision is revisited — but nothing here reads them
// anymore.
//
// Purely decorative: aria-hidden, no tabindex, no interactive content, and
// `pointer-events: none` so it can never intercept a click meant for the
// section's real content.
export function ThreadSegment({ stop, className }: ThreadSegmentProps) {
  return (
    <svg
      aria-hidden="true"
      data-thread={stop}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn(
        "thread-reveal pointer-events-none absolute inset-0 -z-10 hidden h-full w-full md:block",
        className,
      )}
    >
      <path
        d={pathFor(stop, "wide")}
        vectorEffect="non-scaling-stroke"
        strokeWidth={2}
        fill="none"
        style={{ stroke: "var(--thread-stroke)" }}
      />
    </svg>
  );
}
