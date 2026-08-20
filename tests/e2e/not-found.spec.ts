import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Easter egg 5/7 (docs/eastereggs.md) — the 404 page reads as a small
// InnoLab building site, but stays a real 404 with real, reachable links.
//
// An unmatched route resolves through Next's client-side error-boundary
// shell (id="__next_error__") before swapping in this route's real
// not-found.tsx content — unlike a normal SSR'd page, so every test here
// waits for the real heading first rather than asserting immediately after
// goto(), the same race a bare AxeBuilder.analyze() right after navigation
// would otherwise lose.
test.describe("404 page", () => {
  test("still answers with a real 404 status code", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/this-page-does-not-exist`);
    expect(response.status()).toBe(404);
  });

  test("shows the InnoLab construction heading and a working way back home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(
      page.getByRole("heading", { name: "404. Diese Seite wird gerade noch im InnoLab entwickelt." }),
    ).toBeVisible();
    // Scoped to <main>: "Zur Startseite" is also the header logo's
    // accessible name, present on every page.
    await page.getByRole("main").getByRole("link", { name: "Zur Startseite" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("also links every main section, not just the homepage", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    // Scoped to <main>: "Projekte"/"Kontakt" are also header nav items.
    await expect(main.getByRole("link", { name: "Projekte" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Kontakt" })).toBeVisible();
  });

  test("renders a real English translation", async ({ page }) => {
    await page.goto("/en/this-page-does-not-exist");
    await expect(
      page.getByRole("heading", { name: "404. This page is still under construction in the InnoLab." }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Go to homepage" })).toBeVisible();
  });

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });
});
