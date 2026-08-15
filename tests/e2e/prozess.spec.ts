import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/prozess", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/prozess");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({
    page,
  }) => {
    await page.goto("/prozess");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("the timeline thread runs horizontally at desktop width and vertically on a narrow one", async ({
    page,
  }) => {
    await page.goto("/prozess");
    // ThreadSegment always renders both paths (hidden md:block, then
    // md:hidden); boundingBox() returns null for the one CSS currently hides
    // rather than a zero-size box, which is a more reliable signal here than
    // a :visible locator on an SVG path.
    const paths = page.locator('svg[data-thread="process-timeline"] path');

    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await paths.nth(0).boundingBox();
    expect(await paths.nth(1).boundingBox()).toBeNull();
    expect(wide).not.toBeNull();
    expect(wide!.width).toBeGreaterThan(wide!.height);

    await page.setViewportSize({ width: 360, height: 800 });
    const narrow = await paths.nth(1).boundingBox();
    expect(await paths.nth(0).boundingBox()).toBeNull();
    expect(narrow).not.toBeNull();
    expect(narrow!.height).toBeGreaterThan(narrow!.width);
  });

  test("desktop: the first and last stations sit close enough together to be found without a long scroll", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the compressed layout is a desktop-width claim, checked against the horizontal grid");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prozess");

    const first = page.getByRole("button", { name: /Kick-Off/ });
    const last = page.getByRole("button", { name: /Startup/ });
    await first.scrollIntoViewIfNeeded();
    const firstBox = await first.boundingBox();
    const lastBox = await last.boundingBox();
    expect(Math.abs(firstBox!.y - lastBox!.y)).toBeLessThan(400);
  });

  test("opening a station's checklist never moves a neighboring station", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/prozess");
    const first = page.getByRole("button", { name: /Kick-Off/ });
    const second = page.getByRole("button", { name: /Ideation-Phase/ });
    await first.scrollIntoViewIfNeeded();

    const before = await second.boundingBox();
    if (isMobile) {
      await first.tap();
    } else {
      await first.focus();
    }
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const after = await second.boundingBox();
    expect(after).toEqual(before);
  });

  test("touch: tapping a station reveals a checklist that was already in the DOM beforehand", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "hover/focus reveal on desktop is covered separately");
    await page.goto("/prozess");
    const button = page.getByRole("button", { name: /Kick-Off/ });
    await button.scrollIntoViewIfNeeded();

    const panelId = await button.getAttribute("aria-controls");
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toContainText("PRÜFPUNKT_1");
    await expect(panel).toHaveCSS("opacity", "0");

    await button.tap();
    await expect(panel).toHaveCSS("opacity", "1");
  });
});

test.describe("/prozess under reduced motion", () => {
  // page.emulateMedia(), not test.use({ reducedMotion: "reduce" }) — see the
  // matching note in home.spec.ts; the latter doesn't reach the fixture page
  // in this project's Playwright install.
  test("draws the timeline thread fully instead of animating it in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prozess");
    const path = page.locator('svg[data-thread="process-timeline"] path').first();
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  });
});
