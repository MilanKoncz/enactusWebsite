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

  test("desktop: the first and last stations sit close enough together to be found without a long scroll", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the compressed layout is a desktop-width claim, checked against the horizontal line");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prozess");

    const first = page.getByRole("button", { name: /Kick-off/ });
    const last = page.getByRole("button", { name: /Startup/ });
    await first.scrollIntoViewIfNeeded();
    const firstBox = await first.boundingBox();
    const lastBox = await last.boundingBox();
    expect(Math.abs(firstBox!.y - lastBox!.y)).toBeLessThan(400);
  });

  test("desktop: every station, including the two without a checklist, is a toggle button", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "ab lg every station gains a panel — the mobile-only static case is covered separately");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prozess");

    const kickOff = page.getByRole("button", { name: /Kick-off/ });
    await expect(kickOff).toHaveAttribute("aria-expanded", "false");
    await kickOff.focus();
    await expect(kickOff).toHaveAttribute("aria-expanded", "true");
  });

  test("mobile: a station without a checklist renders as plain text, not a toggle button", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "below lg is where kickOff/ideation drop the panel — covered separately ab lg");
    await page.goto("/prozess");

    // "Kick-off" appears several times in the DOM at once (Marker renders
    // both the ab-lg and below-lg presentation so the CSS switch between
    // them never needs a client-only breakpoint check) — .and() narrows to
    // the one instance the real CSS engine actually shows on this viewport.
    const visibleKickOff = page.getByText("Kick-off", { exact: true }).and(page.locator(":visible"));
    await expect(visibleKickOff).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Kick-off/ })).toHaveCount(0);
  });

  test("opening a station's checklist never moves a neighboring station", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/prozess");
    const first = page.getByRole("button", { name: /Inno-Gating/ });
    const second = page.getByRole("button", { name: /MVP-Phase/ });
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
    const button = page.getByRole("button", { name: /Inno-Gating/ });
    await button.scrollIntoViewIfNeeded();

    const panelId = await button.getAttribute("aria-controls");
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toContainText("Problem-Solution-Fit");
    await expect(panel).toHaveCSS("opacity", "0");

    await button.tap();
    await expect(panel).toHaveCSS("opacity", "1");
  });
});
