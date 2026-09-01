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

  test("shows the WhatsApp and Instagram icon links, reachable and open in a new tab", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menü öffnen" }).click();
    const dialog = page.getByRole("dialog");
    const whatsapp = dialog.getByRole("link", { name: "WhatsApp-Community (öffnet in einem neuen Tab)" });
    const instagram = dialog.getByRole("link", { name: "Instagram (öffnet in einem neuen Tab)" });
    await expect(whatsapp).toBeVisible();
    await expect(instagram).toBeVisible();
    await expect(whatsapp).toHaveAttribute("target", "_blank");

    const [newPage] = await Promise.all([context.waitForEvent("page"), whatsapp.click()]);
    await newPage.waitForLoadState("domcontentloaded");
    expect(newPage.url()).toContain("chat.whatsapp.com");
    await newPage.close();
  });
});
