"use client";

import { useEffect, useRef } from "react";

// The one confetti engine on the site — shared by the hero logo's triple-
// click easter egg (HeroLogoConfetti.tsx), the contact form's success state
// (ContactForm.tsx), and /secret's entry moment. A caller decides when and
// where to trigger a burst and is responsible for its own
// prefers-reduced-motion gate (usePrefersReducedMotion) before ever mounting
// this — it has no opinion of its own on that, so it can't be triggered
// twice by two callers independently deciding differently.
const PARTICLE_COUNT = 220;
const DURATION_MS = 1400;
const GRAVITY = 1400; // px/s^2
export const CONFETTI_COLORS = ["#FFC321", "#061031", "#d2bd80"]; // gold, ink, sand

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
    // erupting from the origin point rather than confetti falling from
    // nowhere.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
    const speed = 260 + Math.random() * 420;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
    });
  }
  return particles;
}

export type ConfettiBurstProps = {
  originX: number;
  originY: number;
  onDone: () => void;
};

// Canvas, not a few hundred DOM nodes: a burst this size as individual
// elements would mean a few hundred live nodes fighting the rest of the
// page's layout/paint for one throwaway animation. The canvas is `fixed`
// and `pointer-events-none`, mounted only for the animation's own duration
// and removed by the caller the moment onDone fires, so nothing lingers in
// the DOM once the burst is over.
export function ConfettiBurst({ originX, originY, onDone }: ConfettiBurstProps) {
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
    // onDone is expected to be a stable setState callback across every
    // caller — re-running this effect for a new identity would restart the
    // burst from frame zero.
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
