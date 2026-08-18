import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/events", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/events");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at any of the standard breakpoints", async ({
    page,
  }) => {
    await page.goto("/events");
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `width=${width}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("shows all four event formats with their title and detail text, no interaction needed", async ({
    page,
  }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Socials" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Workshops" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Teamwochenende" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Semesterabschluss" })).toBeVisible();
    await expect(
      page.getByText("Wir veranstalten wie viele Initiativen Socials wie Running Dinners und gemeinsame Barabende."),
    ).toBeVisible();
  });

  test("shows the four Enactus Germany events with their abbreviation, title, and description", async ({
    page,
  }) => {
    await page.goto("/events");
    for (const [abbreviation, title] of [
      ["NC", "National Cup"],
      ["ESA", "Enactus Startup Accelerator"],
      ["OEW", "One Enactus Weekend"],
      ["TWE", "Trainingswochenende"],
    ]) {
      await expect(page.getByText(abbreviation, { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("keeps the four Enactus Germany event cards the same height despite unequal text length", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/events");

    const heights = await page.evaluate(() => {
      const headings = ["National Cup", "Enactus Startup Accelerator", "One Enactus Weekend", "Trainingswochenende"];
      return headings.map((title) => {
        const heading = Array.from(document.querySelectorAll("h3")).find((el) => el.textContent === title)!;
        const card = heading.closest("li")!;
        return card.getBoundingClientRect().height;
      });
    });

    for (const height of heights) {
      expect(Math.round(height)).toBe(Math.round(heights[0]));
    }
  });

  test("renders the Journeys history with all four confirmed trips", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByText("FSS 2026")).toBeVisible();
    await expect(page.getByText("St. Gallen")).toBeVisible();
    await expect(page.getByText("HWS 2024")).toBeVisible();
  });

  test("links every sibling team to a real, external URL", async ({ page }) => {
    await page.goto("/events");
    const link = page.getByRole("link", { name: /München/ });
    await expect(link).toHaveAttribute("href", "https://enactus-muenchen.de/");
    await expect(link).toHaveAttribute("target", "_blank");
  });
});
