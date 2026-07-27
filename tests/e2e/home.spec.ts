import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar", async ({ page }) => {
    await page.goto("/");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("is fully keyboard-traversable, and no element traps focus", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard-only traversal is a desktop interaction pattern");
    await page.goto("/");

    const count = await page.evaluate(() => {
      // offsetParent is null for display:none elements (and fixed-position
      // ones, which this page has none of among these candidates) — this is
      // what excludes the mobile-menu trigger, correctly display:none at
      // desktop width (lg:hidden) and covered instead by mobile-nav.spec.ts.
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]'),
      ).filter((el) => el.offsetParent !== null);
      candidates.forEach((el, index) => el.setAttribute("data-tab-order", String(index)));
      return candidates.length;
    });
    expect(count).toBeGreaterThan(0);

    const visited = new Set<number>();
    for (let i = 0; i < count + 10; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const order = el.getAttribute("data-tab-order");
        return {
          order: order === null ? null : Number(order),
          hasAccessibleName: Boolean(
            el.getAttribute("aria-label") || el.textContent?.trim() || el.getAttribute("title"),
          ),
        };
      });
      if (focused?.order !== null && focused?.order !== undefined) {
        visited.add(focused.order);
        expect(focused.hasAccessibleName).toBe(true);
      }
      if (visited.size === count) break;
    }

    expect(visited.size).toBe(count);
  });

  test("shows the pillar detail text on touch without any hover or focus interaction", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the always-visible-on-touch behavior only differs from desktop here");
    await page.goto("/");
    // 0.6, not 1 — HoverDetail's own always-visible base state is muted
    // (opacity-60, the same "legible but secondary" treatment used
    // throughout the site); desktop-hover:opacity-0 is what a touch device
    // at this width must never apply.
    const detail = page
      .getByText("Wir wählen Projekte danach aus, welches SDG sie voranbringen")
      .first();
    await detail.scrollIntoViewIfNeeded();
    await expect(detail).toHaveCSS("opacity", "0.6");
  });

  test("the golden thread is purely decorative: aria-hidden, and never a tab stop", async ({ page }) => {
    await page.goto("/");
    const segments = page.locator("svg[data-thread]");
    const count = await segments.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(segments.nth(i)).toHaveAttribute("aria-hidden", "true");
      await expect(segments.nth(i)).not.toHaveAttribute("tabindex");
    }
    // The full-page keyboard-traversal test above already proves nothing
    // new entered the tab order; this only needs to prove the thread itself
    // carries no tabindex.
  });

  test("keeps the board portraits in their normal state on a touch device, unaffected by pointer proximity", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "pointer-proximity is a hover-capable-desktop-only effect");
    await page.goto("/");
    const card = page.locator('[tabindex="0"]').filter({ hasText: "VORSTAND_1" }).first();
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    await expect(card).toHaveCSS("transform", "none");
  });
});

test.describe("homepage under reduced motion", () => {
  // Scoped to its own describe block, kept separate from the default-state
  // checks above (axe/keyboard/overflow), which are specifically about the
  // no-preference state — running those under reduced motion too would stop
  // testing what actually ships to most visitors.
  //
  // page.emulateMedia(), not test.use({ reducedMotion: "reduce" }): the
  // latter is the documented API, but in this project's Playwright install
  // it silently fails to reach the fixture-provided page/context —
  // window.matchMedia("(prefers-reduced-motion: reduce)") still reports
  // false with it set. Confirmed with a minimal isolated repro (a single
  // top-level test.use() outside any describe, nothing else in the file);
  // calling browser.newContext({ reducedMotion }) directly, or
  // page.emulateMedia() as below, both work correctly. If a future
  // Playwright upgrade fixes the underlying issue, test.use() can replace
  // this again.
  test("draws the golden thread fully instead of animating it in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const path = page.locator(".thread-path").first();
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  });
});
