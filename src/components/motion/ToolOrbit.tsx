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
const LOGO_WIDTH = 96;
const LOGO_HEIGHT = 56;
const RADIUS = 106;
const LOGO_RADIUS = RADIUS;

// A logo stays landscape-oriented at every point on the circle (see the
// upright-logo comment below), so the bounding box needs the full logo width
// clear on the left/right extremes and the full logo height clear on the
// top/bottom extremes — not just at one side, since every logo visits every
// point on the circle as it orbits.
const WIDTH = LOGO_RADIUS * 2 + LOGO_WIDTH;
const HEIGHT = LOGO_RADIUS * 2 + LOGO_HEIGHT;
const CENTRE_X = WIDTH / 2;
const CENTRE_Y = HEIGHT / 2;

function angleFor(index: number, count: number): number {
  return (360 * index) / count;
}

// Negative sin because screen y grows downward.
function positionFor(index: number, count: number): { x: number; y: number } {
  const radians = (angleFor(index, count) * Math.PI) / 180;
  return {
    x: CENTRE_X + LOGO_RADIUS * Math.cos(radians),
    y: CENTRE_Y - LOGO_RADIUS * Math.sin(radians),
  };
}

// Purely decorative (aria-hidden — content/tools.ts). Continuous, very slow
// orbit — animate-orbit-spin's duration lives as --orbit-duration in
// globals.css, a named constant rather than a bare number in the shorthand,
// same reasoning as --marquee-duration next to it.
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
export function ToolOrbit() {
  return (
    <div aria-hidden="true" className="relative" style={{ width: WIDTH, height: HEIGHT }}>
      <div
        className="absolute inset-0 animate-orbit-spin"
        style={{ transformOrigin: `${CENTRE_X}px ${CENTRE_Y}px` }}
      >
        {tools.map((toolItem, index) => {
          const { x, y } = positionFor(index, tools.length);
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
    </div>
  );
}
