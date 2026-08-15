import { test, expect } from "@playwright/test";

test.describe("locale switch", () => {
  test.skip(({ isMobile }) => isMobile, "desktop locale switcher only — see mobile-nav.spec.ts");

  test("switching to English from a deep route lands on the English version of that same route, not the homepage", async ({
    page,
  }) => {
    await page.goto("/prozess");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL("/en/prozess");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("From idea to company");
  });

  test("switching back to German from an English deep route drops the /en prefix, not a redirect to /de", async ({
    page,
  }) => {
    await page.goto("/en/prozess");
    await page.getByRole("link", { name: "DE", exact: true }).click();
    await expect(page).toHaveURL("/prozess");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Von der Idee zum Unternehmen");
  });
});
