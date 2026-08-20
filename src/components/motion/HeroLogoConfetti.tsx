"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Logo, type LogoProps } from "@/components/layout/Logo";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 2/3 (docs/eastereggs.md). Three clicks on the hero logo within
// TRIPLE_CLICK_WINDOW_MS trigger a short confetti burst in the brand colors.
// Purely visual, no state change survives it — nothing here is saved,
// announced, or reflected anywhere else on the page.
const TRIPLE_CLICK_WINDOW_MS = 2000;
const PARTICLE_COUNT = 220;
const DURATION_MS = 1400;
const GRAVITY = 1400; // px/s^2
const COLORS = ["#FFC321", "#061031", "#d2bd80"]; // gold, ink, sand

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
};

function createParticles(originX: number, originY: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // A wide upward-biased spray, not a uniform circle: reads as a burst
    // erupting from the logo rather than confetti falling from nowhere.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
    const speed = 260 + Math.random() * 420;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: COLORS[i % COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
    });
  }
  return particles;
}

// Canvas, not a few hundred DOM nodes: a burst this size as individual
// elements would mean a few hundred live nodes fighting the rest of the
// page's layout/paint for one throwaway animation. The canvas is `fixed`
// and `pointer-events-none`, mounted only for the animation's own duration
// and removed the moment it ends (the `active` state below), so nothing
// lingers in the DOM once the burst is over.
function ConfettiCanvas({ originX, originY, onDone }: { originX: number; originY: number; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = createParticles(originX, originY);
    const start = performance.now();
    let lastFrameTime = start;
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const dt = Math.min((now - lastFrameTime) / 1000, 1 / 30);
      lastFrameTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lifeRatio = Math.min(elapsed / DURATION_MS, 1);
      const fade = 1 - lifeRatio;

      for (const p of particles) {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;

        ctx.save();
        ctx.globalAlpha = Math.max(fade, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        frameId = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // onDone is a stable setState callback (see below); re-running this
    // effect for a new identity would restart the burst from frame zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originX, originY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}

export type HeroLogoConfettiProps = LogoProps;

// The logo itself stays a plain <Image> — no button role, no tabIndex, no
// change to the page's tab order (CLAUDE.md brief). onClick on a
// non-interactive element only matters to a mouse/touch user here, which is
// exactly the intended audience for a hidden bonus like this one; nothing
// about keyboard operation changes because nothing keyboard-operable was
// added. The wrapping <span> carries the click handler and the size/shape
// query for the burst's origin point — className (the hero's responsive
// h-20/sm:h-32/md:h-40/lg:h-48 sizing) passes straight through to Logo
// itself, not the span, since a span's own height doesn't propagate down to
// an <img> child; the span stays `inline-block` so it hugs the logo's own
// box exactly, which is what makes getBoundingClientRect() below return the
// logo's real rendered position instead of some unrelated inline box.
export function HeroLogoConfetti({ className, ...logoProps }: HeroLogoConfettiProps) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const clickCountRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  const handleDone = useCallback(() => setBurst(null), []);

  const handleClick = useCallback(() => {
    // Under reduced motion this is inert entirely — not a reduced-motion
    // variant of the effect, no effect at all (CLAUDE.md brief).
    if (reducedMotion) return;

    const now = Date.now();
    clickCountRef.current = now - lastClickAtRef.current > TRIPLE_CLICK_WINDOW_MS ? 1 : clickCountRef.current + 1;
    lastClickAtRef.current = now;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) {
        setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    }
  }, [reducedMotion]);

  return (
    <span ref={wrapperRef} onClick={handleClick} className="inline-block">
      <Logo {...logoProps} className={className} />
      {burst && <ConfettiCanvas originX={burst.x} originY={burst.y} onDone={handleDone} />}
    </span>
  );
}
