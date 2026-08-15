// Measures CLS and scroll/pointer frame timing on the homepage's production
// build, for the three motion additions in this phase: the golden thread
// (per-section scroll-driven SVG), the AlumniVoices editorial layout, and
// the board-portrait proximity effect. Per docs/design-system.md's motion
// rule 6, a result that pushes LCP past 2.0s or introduces layout shift
// means the animation gets removed, not optimised — this script is what
// that judgment is based on, not a pass/fail gate on its own.
//
// Usage: `npm run build && npm run start` in one terminal, then
// `npm run perf:home` in another (the production server must already be
// running at http://localhost:3000).

import { chromium } from "@playwright/test";

const URL = "http://localhost:3000/";
const FRAME_BUDGET_MS = 16.7;

function stats(deltas) {
  if (deltas.length === 0) return { p50: 0, p95: 0, max: 0, overBudget: 0, frames: 0 };
  const sorted = [...deltas].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return {
    p50: at(0.5),
    p95: at(0.95),
    max: sorted[sorted.length - 1],
    overBudget: deltas.filter((d) => d > FRAME_BUDGET_MS).length,
    frames: deltas.length,
  };
}

async function installObservers(page) {
  // addInitScript, not evaluate: evaluate would run against the current
  // (about:blank) document, and those bindings vanish the moment the real
  // navigation replaces it. addInitScript re-runs on every navigation this
  // page instance makes, so the observers are already listening before the
  // homepage's own first paint.
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__longtaskTotal = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__longtaskTotal += entry.duration;
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // longtask isn't observable in every engine; CLS is the number that matters most.
    }
  });
}

async function measureScroll(page) {
  const scrollHeight = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const frameDeltas = await page.evaluate(async (targetHeight) => {
    const deltas = [];
    let last = performance.now();
    let running = true;
    function frame(now) {
      deltas.push(now - last);
      last = now;
      if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const steps = 80;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, (targetHeight * i) / steps);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    running = false;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return deltas;
  }, scrollHeight);
  return frameDeltas;
}

async function measureProximitySweep(page) {
  const card = page.locator('[tabindex="0"]').filter({ hasText: "Thorben Ossig" }).first();
  if ((await card.count()) === 0) return null;
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  if (!box) return null;

  await page.evaluate(() => {
    window.__proximityDeltas = [];
    window.__proximityRunning = true;
    let last = performance.now();
    function frame(now) {
      window.__proximityDeltas.push(now - last);
      last = now;
      if (window.__proximityRunning) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  const y = box.y + box.height / 2;
  const startX = Math.max(0, box.x - 150);
  const endX = box.x + box.width * 5;
  const steps = 40;
  await page.mouse.move(startX, y);
  for (let i = 0; i <= steps; i++) {
    await page.mouse.move(startX + ((endX - startX) * i) / steps, y);
    await page.waitForTimeout(16);
  }

  await page.evaluate(() => {
    window.__proximityRunning = false;
  });
  await page.waitForTimeout(50);
  return page.evaluate(() => window.__proximityDeltas);
}

async function measureViewport(browser, viewport, { withProximity }) {
  const page = await browser.newPage({ viewport });
  await installObservers(page);
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(200);

  const scrollDeltas = await measureScroll(page);
  const proximityDeltas = withProximity ? await measureProximitySweep(page) : null;

  const result = await page.evaluate(() => ({ cls: window.__cls, longtaskTotal: window.__longtaskTotal }));
  await page.close();

  return {
    cls: result.cls,
    longtaskTotalMs: result.longtaskTotal,
    scroll: stats(scrollDeltas),
    proximity: proximityDeltas ? stats(proximityDeltas) : null,
  };
}

function formatStats(label, s) {
  if (!s) return `${label}: n/a`;
  return `${label}: p50 ${s.p50.toFixed(1)}ms · p95 ${s.p95.toFixed(1)}ms · max ${s.max.toFixed(1)}ms · ${s.overBudget}/${s.frames} frames over ${FRAME_BUDGET_MS}ms`;
}

const browser = await chromium.launch();

const desktop = await measureViewport(
  browser,
  { width: 1280, height: 800 },
  { withProximity: true },
);
const mobile = await measureViewport(browser, { width: 390, height: 844 }, { withProximity: false });

await browser.close();

console.log("\n1280x800 (desktop)");
console.log(`  CLS: ${desktop.cls.toFixed(4)}`);
console.log(`  Long tasks total: ${desktop.longtaskTotalMs.toFixed(1)}ms`);
console.log(`  ${formatStats("Scroll", desktop.scroll)}`);
console.log(`  ${formatStats("Proximity sweep", desktop.proximity)}`);

console.log("\n390x844 (mobile)");
console.log(`  CLS: ${mobile.cls.toFixed(4)}`);
console.log(`  Long tasks total: ${mobile.longtaskTotalMs.toFixed(1)}ms`);
console.log(`  ${formatStats("Scroll", mobile.scroll)}`);
