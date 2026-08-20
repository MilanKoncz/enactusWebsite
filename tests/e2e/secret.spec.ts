import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Easter egg 7/7 (docs/eastereggs.md) — a hidden page, reachable only by
// typing the URL. Never linked from Header/Footer nav, noindex/nofollow on
// itself, and disallowed in robots.ts (tests/unit/app/robots.test.ts).
test.describe("/secret", () => {
  test("is reachable directly and shows the chill area heading with a way back home", async ({ page }) => {
    await page.goto("/secret");
    await expect(page.getByRole("heading", { name: "Du hast die geheime Chill Area gefunden!" })).toBeVisible();
    await page.getByRole("link", { name: "Zurück zur Startseite" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("renders a real English translation", async ({ page }) => {
    await page.goto("/en/secret");
    await expect(page.getByRole("heading", { name: "You found the secret chill area!" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible();
  });

  test("carries noindex, nofollow metadata", async ({ page }) => {
    await page.goto("/secret");
    const content = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(content).toMatch(/noindex/);
    expect(content).toMatch(/nofollow/);
  });

  test("is never linked from the header or footer navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /secret|geheim/i })).toHaveCount(0);
  });

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/secret");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
