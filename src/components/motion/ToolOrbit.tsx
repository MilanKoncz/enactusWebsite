import Image from "next/image";
import { tools } from "@/content/tools";

// All in pixels. RADIUS is the orbit path the logos travel — invisible, never
// drawn (board feedback, 2026-08-19: "just the logos, no visible ring").
// LOGO_RADIUS sits the logos directly on that path rather than clear of a
// drawn line, since there's no line to clear anymore.
//
// The logo box is a landscape rectangle rather than a square because most of
// the five marks are wordmarks: a square box fits a wordmark by its width and
// leaves it a sliver tall, while a near-square mark (openai, claude) fills the
// box entirely, so the same box makes the five read at wildly different
// sizes. A wide box gives the wordmarks their width and still lets the marks
// use the full height. The source files were trimmed of their transparent
// margins for the same reason — Notion's mark occupied a third of its own
// canvas, so `object-contain` was scaling mostly empty space.
const BASE_LOGO_WIDTH = 96;
const BASE_LOGO_HEIGHT = 56;
const BASE_RADIUS = 106;

export type ToolOrbitProps = {
  /** Scales LOGO_WIDTH/LOGO_HEIGHT/RADIUS together, never one alone: the
      radius has to shrink at least as fast as the logo width or adjacent
      logos start overlapping mid-orbit (five logos, 72° apart — the chord
      between two neighbouring centres is 2*R*sin(36°), and that has to stay
      wider than a logo). Keeping one scale factor for all three preserves
      the exact ratio that was tuned not to overlap at the default size,
      rather than letting a future caller pick a radius/logo-size pair that
      does. Defaults to 1 (the original desktop size); Benefits.tsx's mobile
      instance passes a smaller value. */
  scale?: number;
  /** The static caption in the centre of the circle ("Unsere Lizenzen" /
      "Our Licenses") — real text, not decorative, so it's the one part of
      this component that isn't aria-hidden. Translated by the caller
      (Benefits.tsx), same as every other section's copy; ToolOrbit stays
      content-agnostic about everything else. */
  label: string;
};

function angleFor(index: number, count: number): number {
  return (360 * index) / count;
}

// Negative sin because screen y grows downward.
function positionFor(
  index: number,
  count: number,
  radius: number,
  centreX: number,
  centreY: number,
): { x: number; y: number } {
  const radians = (angleFor(index, count) * Math.PI) / 180;
  return {
    x: centreX + radius * Math.cos(radians),
    y: centreY - radius * Math.sin(radians),
  };
}

// Purely decorative (aria-hidden — content/tools.ts). Continuous, very slow
// orbit — animate-orbit-spin's duration lives as --orbit-duration in
// globals.css, a named constant rather than a bare number in the shorthand,
// same reasoning as --marquee-duration next to it. Rendered at `md` and up
// full size, and below `md` at a smaller `scale` (Benefits.tsx) rather than
// as a static grid — the orbit duration is time-based (deg/s via CSS
// animation, not px/s), so a smaller radius orbits at the exact same
// rotational speed, no separate tuning needed.
//
// Every logo is positioned by translation alone (positionFor above), never by
// rotating an arm it hangs off: an arm rotated to the far end of the old
// semicircle took its logo with it, which is why Claude used to sit upside
// down and Canva at a slant. The whole stage instead rotates as one rigid
// body around the circle's own centre (animate-orbit-spin), carrying every
// logo's translated position around with it, while each logo individually
// counter-rotates by the exact same keyframes played in reverse
// (animate-orbit-counter-spin) — the established mechanism this component
// already used for its old sway, generalised from a small back-and-forth
// rock to a full one-directional loop. Two simple 0deg/360deg keyframes, same
// duration, same linear timing, always sum to zero at every instant, so a
// logo's own artwork stays upright through the whole orbit instead of
// sweeping around with the stage.
//
// Under prefers-reduced-motion, globals.css's blanket override collapses
// both animations to a single near-instant iteration ending at their final
// keyframe — rotate(360deg) and rotate(-360deg), both visually identical to
// rotate(0deg) — so the assembly lands exactly on its unrotated resting
// state: the circle motionless, every logo exactly where positionFor placed
// it, evenly spaced and upright.
export function ToolOrbit({ scale = 1, label }: ToolOrbitProps) {
  const LOGO_WIDTH = BASE_LOGO_WIDTH * scale;
  const LOGO_HEIGHT = BASE_LOGO_HEIGHT * scale;
  const RADIUS = BASE_RADIUS * scale;

  // A logo stays landscape-oriented at every point on the circle (see the
  // upright-logo comment below), so the bounding box needs the full logo width
  // clear on the left/right extremes and the full logo height clear on the
  // top/bottom extremes — not just at one side, since every logo visits every
  // point on the circle as it orbits.
  const WIDTH = RADIUS * 2 + LOGO_WIDTH;
  const HEIGHT = RADIUS * 2 + LOGO_HEIGHT;
  const CENTRE_X = WIDTH / 2;
  const CENTRE_Y = HEIGHT / 2;

  // The widest a label can be before a passing logo could touch it: the
  // clearance from centre to the nearest edge of any logo, at any point on
  // the orbit, is RADIUS - LOGO_WIDTH / 2 (a logo stays landscape-oriented
  // throughout, so its own half-width is what matters, not its half-height).
  // The 0.85 factor leaves a visible gap rather than letting the label's
  // own box touch that boundary exactly.
  const LABEL_MAX_WIDTH = Math.max(0, (RADIUS - LOGO_WIDTH / 2) * 2 * 0.85);

  return (
    <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
      {/* Only the logos are decorative — positionFor's translation math and
          the two counter-rotating animations exist purely to keep five
          brand marks upright while they orbit, nothing here is content a
          screen reader should announce. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-orbit-spin"
        style={{ transformOrigin: `${CENTRE_X}px ${CENTRE_Y}px` }}
      >
        {tools.map((toolItem, index) => {
          const { x, y } = positionFor(index, tools.length, RADIUS, CENTRE_X, CENTRE_Y);
          return (
            <div
              key={toolItem.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <div
                className="relative animate-orbit-counter-spin"
                style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
              >
                <Image
                  src={toolItem.logo}
                  alt=""
                  fill
                  sizes={`${LOGO_WIDTH}px`}
                  className="object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* A sibling of the rotating stage, not a child of it — animate-orbit-spin
          never touches this element, so it stays upright and stationary at
          every point in the loop, reduced motion or not. */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-center font-mono text-mono-xs leading-tight uppercase text-ink"
        style={{ left: CENTRE_X, top: CENTRE_Y, width: LABEL_MAX_WIDTH }}
      >
        {label}
      </span>
    </div>
  );
}
