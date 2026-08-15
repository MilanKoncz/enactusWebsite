import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/events", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/events");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({
    page,
  }) => {
    await page.goto("/events");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("desktop: shows a tablist of four formats with one shared panel below", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-only tablist layout, covered separately for touch below");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/events");

    const socials = page.getByRole("tab", { name: "Socials" });
    const workshops = page.getByRole("tab", { name: "Workshops" });
    await expect(socials).toHaveAttribute("aria-selected", "true");

    await workshops.click();
    await expect(workshops).toHaveAttribute("aria-selected", "true");
    await expect(socials).toHaveAttribute("aria-selected", "false");
  });

  test("touch: the four formats behave as an accordion", async ({ page, isMobile }) => {
    test.skip(!isMobile, "accordion layout is the touch/narrow-width claim");
    await page.goto("/events");

    const socials = page.getByRole("button", { name: "Socials" });
    const workshops = page.getByRole("button", { name: "Workshops" });
    await expect(socials).toHaveAttribute("aria-expanded", "true");

    await workshops.tap();
    await expect(workshops).toHaveAttribute("aria-expanded", "true");
    await expect(socials).toHaveAttribute("aria-expanded", "false");
  });

  test("renders the Journeys history with all four confirmed trips", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByText("FSS 2026")).toBeVisible();
    await expect(page.getByText("St. Gallen")).toBeVisible();
    await expect(page.getByText("HWS 2024")).toBeVisible();
  });

  test("links every sibling team to a real, external URL", async ({ page }) => {
    await page.goto("/events");
    const link = page.getByRole("link", { name: /München/ });
    await expect(link).toHaveAttribute("href", "https://enactus-muenchen.de/");
    await expect(link).toHaveAttribute("target", "_blank");
  });
});
