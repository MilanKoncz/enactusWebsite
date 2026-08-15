import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/partner", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/partner");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({
    page,
  }) => {
    await page.goto("/partner");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("renders the four partnership tiers and links a partner logo out to its real website", async ({
    page,
  }) => {
    await page.goto("/partner");
    await expect(page.getByRole("heading", { level: 3, name: "Knowledge Partner" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Advisor" })).toBeVisible();

    const link = page.getByRole("link", { name: "Website von SZA öffnet in neuem Tab" });
    await expect(link).toHaveAttribute("href", "https://www.sza.de/");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("renders four partner statements as short quotes", async ({ page }) => {
    await page.goto("/partner");
    await expect(page.getByText("Moritz Knabe")).toBeVisible();
    await expect(page.locator("blockquote")).toHaveCount(4);
  });

  test("states the 2 euro monthly supporting membership", async ({ page }) => {
    await page.goto("/partner");
    await expect(page.getByText(/2 Euro pro Monat/)).toBeVisible();
  });

  test("closes with a working mailto contact link", async ({ page }) => {
    await page.goto("/partner");
    const link = page.getByRole("link", { name: "E-Mail schreiben" });
    await expect(link).toHaveAttribute("href", "mailto:teamvorstand@unimannheim.enactus.team");
  });
});
