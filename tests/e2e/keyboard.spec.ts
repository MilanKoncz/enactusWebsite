import { test, expect } from "@playwright/test";

test.describe("keyboard traversal", () => {
  test.skip(({ isMobile }) => isMobile, "desktop header layout only");

  test("the skip link is the first tab stop and moves focus to the main landmark on activation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Zum Inhalt springen" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#inhalt")).toBeFocused();
  });

  test("tabbing onward from the skip link reaches the header's real controls, in order", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // logo / home link
    await expect(page.getByRole("link", { name: "Zur Startseite" })).toBeFocused();

    await page.keyboard.press("Tab"); // first nav item
    const headerNav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(headerNav.getByRole("link", { name: "Prozess" })).toBeFocused();
  });
});
