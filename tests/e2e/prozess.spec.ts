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

  test("every station with a checklist is a toggle button, at both a narrow and a wide viewport", async ({
    page,
  }) => {
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/prozess");
      await expect(page.getByRole("button", { name: /inno-gating/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /mvp-phase/i })).toBeVisible();
    }
  });

  test("kickOff and ideation have no toggle button and no expand affordance, at any width", async ({
    page,
  }) => {
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/prozess");
      await expect(page.getByText("Kick-off", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /kick-off/i })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /ideation-phase/i })).toHaveCount(0);
    }
  });

  test("a station's checklist never opens on its own from scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto("/prozess");

    const button = page.getByRole("button", { name: /inno-gating/i });
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await button.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("a station also opens on click or keyboard activation, independent of scroll position", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/prozess");
    const button = page.getByRole("button", { name: /startup/i });
    await expect(button).toHaveAttribute("aria-expanded", "false");

    if (isMobile) {
      await button.tap();
    } else {
      await button.focus();
      await page.keyboard.press("Enter");
    }
    await expect(button).toHaveAttribute("aria-expanded", "true");
  });

  test("opening a station's checklist pushes a later station down, since panels now take real layout space", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto("/prozess");
    const first = page.getByRole("button", { name: /inno-gating/i });
    const second = page.getByRole("button", { name: /mvp-phase/i });

    // Document-absolute Y, not the viewport-relative value boundingBox()
    // returns on its own — clicking `first` scrolls the page (Playwright
    // scrolls a target into view before clicking it), and that scroll alone
    // would swamp any Y change from the panel actually pushing content
    // down.
    async function documentY(locator: typeof second) {
      const box = await locator.boundingBox();
      const scrollY = await page.evaluate(() => window.scrollY);
      return box!.y + scrollY;
    }

    await expect(first).toHaveAttribute("aria-expanded", "false");
    const before = await documentY(second);
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    // aria-expanded flips immediately, but the panel's height itself
    // reaches its open state over --duration-calm (globals.css's
    // grid-template-rows transition) — measuring before that settles
    // caught this test mid-transition often enough to read as flaky.
    await page.waitForTimeout(500);
    const after = await documentY(second);
    expect(after).toBeGreaterThan(before);
  });
});
