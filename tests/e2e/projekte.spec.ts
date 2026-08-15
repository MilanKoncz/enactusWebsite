import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/projekte", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/projekte");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({
    page,
  }) => {
    await page.goto("/projekte");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("expanding a project card reveals its detail without a page navigation", async ({ page }) => {
    await page.goto("/projekte");
    const button = page.getByRole("button", { name: /SmileGreen/ });
    await button.scrollIntoViewIfNeeded();

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Tim Köster").first()).toBeVisible();
    await expect(page).toHaveURL(/\/projekte$/);
  });

  test("opening a second card closes the first, and the page never scrolls sideways mid-animation", async ({
    page,
  }) => {
    await page.goto("/projekte");
    const first = page.getByRole("button", { name: /SmileGreen/ });
    const second = page.getByRole("button", { name: /Mealyo/ });

    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("loads the YouTube facade only after the play button is clicked", async ({ page }) => {
    await page.goto("/projekte");
    const playButton = page.getByRole("button", { name: "Pitch von Moufense ansehen" });
    await playButton.scrollIntoViewIfNeeded();
    await expect(page.locator("iframe[src*='youtube-nocookie.com']")).toHaveCount(0);

    await playButton.click();
    const iframe = page.locator("iframe[src*='youtube-nocookie.com']");
    await expect(iframe).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/9Ord09u363s/);
  });

  test("links subtly to the project archive", async ({ page }) => {
    await page.goto("/projekte");
    await page.getByRole("link", { name: "Alle bisherigen Projekte im Archiv ansehen" }).click();
    await expect(page).toHaveURL(/\/projekte\/archiv$/);
  });
});

test.describe("/projekte/archiv", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/projekte/archiv");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("shows Differgy as a spin-off success, not a discontinued project", async ({ page }) => {
    await page.goto("/projekte/archiv");
    const differgy = page.getByRole("link", { name: /Differgy/ });
    await expect(differgy).toContainText("Ausgegründet");
    await expect(differgy).not.toContainText("Eingestellt");
  });

  test("links through to a project's own detail page", async ({ page }) => {
    await page.goto("/projekte/archiv");
    await page.getByRole("link", { name: /Differgy/ }).click();
    await expect(page).toHaveURL(/\/projekte\/differgy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Differgy" })).toBeVisible();
  });
});

test.describe("/projekte/[slug]", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/projekte/smilegreen");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders a 404 for an unknown slug", async ({ page }) => {
    const response = await page.goto("/projekte/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
