import Image from "next/image";
import { tools } from "@/content/tools";

// Angles sweep across the top half of the circle only (a "halfcircle" of
// logos, per the brief) — 0deg would point the arm straight right, -90deg
// straight up, -180deg straight left, so a range from -15deg to -165deg
// traces an arc from just past the right edge, over the top, to just past
// the left edge, without ever dipping into the bottom half.
const ARC_START_DEG = -15;
const ARC_END_DEG = -165;

function angleFor(index: number, count: number): number {
  if (count <= 1) return (ARC_START_DEG + ARC_END_DEG) / 2;
  return ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) * index) / (count - 1);
}

// Purely decorative (aria-hidden — content/tools.ts) — a CSS-only sway, no
// JavaScript, transform only (docs/design-system.md motion rule 5). Each
// logo sits at a fixed angle on a semicircular arc (the "arm", a static
// rotate placing it at that angle and a fixed radius); the whole arc then
// gently rocks a few degrees back and forth (globals.css's orbit-sway),
// while each logo counter-rotates by the exact same amount (orbit-counter-sway)
// so it stays visually upright through the sway instead of spinning with
// the arm. Never a full 360° spin — "kreisen" here means a slow, ambient
// rock, not a wheel.
//
// Under prefers-reduced-motion, globals.css's blanket override collapses
// both animations to a single near-instant iteration ending at their final
// keyframe (+8deg stage sway, -8deg counter-sway) — the two cancel out, so
// every logo still lands upright, just uniformly offset by a harmless fixed
// 8°, evenly spaced exactly as before rather than bunched up or reset to a
// stray mid-animation frame.
export function ToolOrbit() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-36 w-72">
      <div className="absolute bottom-0 left-1/2 size-0 animate-orbit-sway">
        {tools.map((toolItem, index) => (
          <div
            key={toolItem.key}
            className="absolute left-0 top-0 h-0 w-36 origin-left"
            style={{ transform: `rotate(${angleFor(index, tools.length)}deg)` }}
          >
            <div className="absolute -top-6 right-0 size-12 animate-orbit-counter-sway">
              <Image src={toolItem.logo} alt="" fill className="object-contain" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
