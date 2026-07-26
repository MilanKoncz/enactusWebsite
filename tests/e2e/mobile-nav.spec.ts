import { test, expect } from "@playwright/test";

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile fullscreen menu only");

  test("opens, navigates to a route, and closes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeHidden();

    await page.getByRole("button", { name: "Menü öffnen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link", { name: "Prozess" }).click();

    await expect(page).toHaveURL("/prozess");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("closes on Escape without navigating", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menü öffnen" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL("/");
  });
});
