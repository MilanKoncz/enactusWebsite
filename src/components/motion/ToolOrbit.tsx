import Image from "next/image";
import { tools } from "@/content/tools";

// All in pixels. RADIUS is the drawn semicircle; the logos rest on its
// outside, each one's inner edge just clear of the line, so the arc stays
// unbroken underneath them instead of being chopped into segments by four
// opaque discs.
//
// The logo box is a landscape rectangle rather than a square because two of
// the four marks are wordmarks: a square box fits a wordmark by its width
// and leaves it a sliver tall, while a near-square mark fills the box
// entirely, so the same box makes the four read at wildly different sizes.
// A wide box gives the wordmarks their width and still lets the marks use
// the full height. The source files were trimmed of their transparent
// margins for the same reason — Notion's mark occupied a third of its own
// canvas, so `object-contain` was scaling mostly empty space.
const LOGO_WIDTH = 96;
const LOGO_HEIGHT = 56;
const RADIUS = 106;
const CLEARANCE = 4;
const LOGO_RADIUS = RADIUS + LOGO_HEIGHT / 2 + CLEARANCE;
const WIDTH = LOGO_RADIUS * 2 + LOGO_WIDTH;
const HEIGHT = LOGO_RADIUS + LOGO_HEIGHT / 2;
const CENTRE_X = WIDTH / 2;
const CENTRE_Y = HEIGHT;

// The outermost logos stop short of the arc's flat ends, so the arc reads as
// a shape in its own right rather than as four logos with a line between
// them: 0deg points straight right, 180deg straight left.
const ARC_START_DEG = 160;
const ARC_END_DEG = 20;

function angleFor(index: number, count: number): number {
  if (count <= 1) return (ARC_START_DEG + ARC_END_DEG) / 2;
  return ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) * index) / (count - 1);
}

// Negative sin because the semicircle is drawn over the top of the centre
// point and screen y grows downward.
function positionFor(index: number, count: number): { x: number; y: number } {
  const radians = (angleFor(index, count) * Math.PI) / 180;
  return {
    x: CENTRE_X + LOGO_RADIUS * Math.cos(radians),
    y: CENTRE_Y - LOGO_RADIUS * Math.sin(radians),
  };
}

const ARC_PATH = `M ${CENTRE_X - RADIUS},${CENTRE_Y} A ${RADIUS},${RADIUS} 0 0 1 ${CENTRE_X + RADIUS},${CENTRE_Y}`;

// Purely decorative (aria-hidden — content/tools.ts) — a CSS-only sway, no
// JavaScript, transform only (docs/design-system.md motion rule 5). A gold
// 2px arc, the same weight as the gate marker's rule and the golden thread,
// with the four logos resting on its outside like objects on a curved shelf.
// The whole stage then gently rocks a few degrees around the arc's own
// centre (globals.css's orbit-sway).
//
// Every logo is positioned by translation alone, never by rotating an arm it
// hangs off: an arm rotated to the far end of the arc took its logo with it,
// which is why Claude used to sit upside down and Canva at a slant. The only
// rotation left on a logo is orbit-counter-sway, which cancels the stage's
// sway exactly, so it stays upright the whole way through.
//
// Under prefers-reduced-motion, globals.css's blanket override collapses
// both animations to a single near-instant iteration ending at their final
// keyframe (+8deg stage sway, -8deg counter-sway) — the two cancel out, so
// every logo still lands upright, just uniformly offset by a harmless fixed
// 8°, evenly spaced exactly as before rather than bunched up or reset to a
// stray mid-animation frame.
export function ToolOrbit() {
  return (
    <div aria-hidden="true" className="relative" style={{ width: WIDTH, height: HEIGHT }}>
      <div
        className="absolute inset-0 animate-orbit-sway"
        style={{ transformOrigin: `${CENTRE_X}px ${CENTRE_Y}px` }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          fill="none"
          className="absolute inset-0"
        >
          <path d={ARC_PATH} stroke="var(--color-gold)" strokeWidth={2} strokeLinecap="round" />
        </svg>

        {tools.map((toolItem, index) => {
          const { x, y } = positionFor(index, tools.length);
          return (
            <div
              key={toolItem.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <div
                className="relative animate-orbit-counter-sway"
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
