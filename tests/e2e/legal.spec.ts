import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/impressum", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/impressum");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no automatically detectable accessibility violations on the English route", async ({
    page,
  }) => {
    await page.goto("/en/impressum");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders the real operator facts, not a placeholder page", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.getByRole("heading", { level: 1, name: "Impressum" })).toBeVisible();
    await expect(page.getByText("P4 9, 68161 Mannheim")).toBeVisible();
    await expect(page.getByText("Amtsgericht Mannheim – Vereinsregister – VR 700965")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "teamvorstand@unimannheim.enactus.team" }),
    ).toHaveAttribute("href", "mailto:teamvorstand@unimannheim.enactus.team");
  });

  test("keeps the legal text in German on the English route, with an English notice above it", async ({
    page,
  }) => {
    await page.goto("/en/impressum");
    await expect(page.getByText(/This legal notice \(Impressum\) is required under German law/)).toBeVisible();
    await expect(page.getByText("Vertreten durch", { exact: true })).toBeVisible();
  });
});

test.describe("/datenschutz", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/datenschutz");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
