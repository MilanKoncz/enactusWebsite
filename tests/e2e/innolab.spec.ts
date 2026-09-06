import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/innolab", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/innolab");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({ page }) => {
    await page.goto("/innolab");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("renders exactly one h1", async ({ page }) => {
    await page.goto("/innolab");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("is reachable from the header navigation, right after Events and right before Ideathon", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop header nav only — mobile-nav.spec.ts covers the fullscreen menu");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    const labels = await nav.getByRole("link").allTextContents();
    const eventsIndex = labels.indexOf("Events");
    expect(labels[eventsIndex + 1]).toBe("InnoLab");
    expect(labels[eventsIndex + 2]).toBe("Ideathon");
    await nav.getByRole("link", { name: "InnoLab", exact: true }).click();
    await expect(page).toHaveURL(/\/innolab$/);
  });

  test("links the Ideathon path card to /ideathon, reachable by keyboard", async ({ page }) => {
    await page.goto("/innolab");
    const link = page.getByRole("link", { name: "Mehr zum Ideathon" });
    await expect(link).toHaveAttribute("href", "/ideathon");
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("explains the InnoLab/Ideathon split and links each sign-up to its real route", async ({ page }) => {
    await page.goto("/innolab");
    await expect(page.getByRole("heading", { name: "Fürs InnoLab" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Für den Ideathon" })).toBeVisible();
    const membershipLink = page.getByRole("link", { name: "Zur Bewerbung" });
    await expect(membershipLink).toHaveAttribute("href", "/mitmachen");
    const ideathonLink = page.getByRole("link", { name: "Zum Ideathon", exact: true });
    await expect(ideathonLink).toHaveAttribute("href", "/ideathon");
    await membershipLink.focus();
    await expect(membershipLink).toBeFocused();
    await ideathonLink.focus();
    await expect(ideathonLink).toBeFocused();
  });

  test("links to the process page", async ({ page }) => {
    await page.goto("/innolab");
    const link = page.getByRole("link", { name: "Prozess-Seite" });
    await expect(link).toHaveAttribute("href", "/prozess");
  });

  test("links both the hero and closing CTAs to the membership application", async ({ page }) => {
    await page.goto("/innolab");
    const ctas = page.getByRole("link", { name: "Jetzt bewerben" });
    await expect(ctas.first()).toHaveAttribute("href", "/mitmachen");
    await expect(ctas.last()).toHaveAttribute("href", "/mitmachen");
  });

  test("expands an FAQ entry on click, operable by keyboard", async ({ page }) => {
    await page.goto("/innolab");
    const trigger = page.getByRole("button", { name: "Kostet das etwas?" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/Die Teilnahme am InnoLab/)).toBeVisible();
  });

  test("switches locale between /innolab and /en/innolab, landing on the same route", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop locale switcher only — see mobile-nav.spec.ts / locale-switch.spec.ts");
    await page.goto("/innolab");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL("/en/innolab");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("idea");
  });

  test("has no automatically detectable accessibility violations on the English route", async ({ page }) => {
    await page.goto("/en/innolab");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
