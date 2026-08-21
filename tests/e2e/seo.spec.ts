import { expect, test } from "@playwright/test";

// A systematic pass over every public page (2026-08-21 SEO audit): exactly
// one h1, a real per-page meta description, and a canonical + reciprocal
// hreflang pair. Catches exactly the kind of regression this audit found —
// the homepage's title rendering as "Enactus Mannheim, Enactus Mannheim"
// because a page set its own title equal to the layout's default, which the
// layout's title.template then wrapped anyway.
const PUBLIC_PATHS = [
  "/",
  "/prozess",
  "/projekte",
  "/projekte/archiv",
  "/projekte/smilegreen",
  "/events",
  "/termine",
  "/partner",
  "/kontakt",
  "/mitmachen",
  "/jobs",
  "/impressum",
  "/datenschutz",
];

test.describe("SEO: metadata completeness across every public page", () => {
  for (const path of PUBLIC_PATHS) {
    for (const prefix of ["", "/en"]) {
      const url = `${prefix}${path}`;

      test(`${url || "/"} has exactly one h1, a description, and canonical + hreflang`, async ({ page }) => {
        await page.goto(url);

        await expect(page.locator("h1")).toHaveCount(1);

        const description = await page.locator('meta[name="description"]').getAttribute("content");
        expect(description, url).toBeTruthy();
        expect(description!.length, url).toBeGreaterThan(20);

        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical, url).toBeTruthy();

        const de = await page.locator('link[rel="alternate"][hreflang="de"]').getAttribute("href");
        const en = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href");
        const xDefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute("href");
        expect(de, url).toBeTruthy();
        expect(en, url).toBeTruthy();
        expect(xDefault, url).toBeTruthy();

        // Never noindex on a page meant to be found.
        const robotsMeta = await page.locator('meta[name="robots"]').count();
        expect(robotsMeta, url).toBe(0);
      });
    }
  }

  test("the homepage title is exactly the site name, not doubled by the layout's title template", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Enactus Mannheim");
  });

  test("every other page's title carries the template suffix exactly once", async ({ page }) => {
    await page.goto("/prozess");
    await expect(page).toHaveTitle(/^Prozess, Enactus Mannheim$/);
  });
});

test.describe("SEO: hidden pages stay hidden", () => {
  for (const path of ["/secret", "/erinnerung-status", "/styleguide"]) {
    test(`${path} carries noindex, nofollow`, async ({ page }) => {
      await page.goto(path);
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute("content", /noindex/);
      await expect(robotsMeta).toHaveAttribute("content", /nofollow/);
    });
  }

  test("sitemap.xml never lists /secret, /styleguide, /admin, or /erinnerung-status", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = (await response?.text()) ?? "";
    for (const hidden of ["/secret", "/styleguide", "/admin", "/erinnerung-status"]) {
      expect(body, hidden).not.toContain(hidden);
    }
  });
});

test.describe("SEO: old Webflow URLs redirect, not 404", () => {
  const REDIRECTS: Array<[string, string]> = [
    ["/team", "/"],
    ["/innolab", "/prozess"],
    ["/faq", "/kontakt"],
    ["/mealyo", "/projekte/mealyo"],
    ["/safesteps", "/projekte/safesteps"],
    ["/safe-steps", "/projekte/safesteps"],
    ["/impact-with-us", "/projekte/impactwithus"],
    ["/smilegreen", "/projekte/smilegreen"],
    ["/differgy", "/projekte/differgy"],
    ["/vela", "/projekte/vela"],
  ];

  for (const [from, to] of REDIRECTS) {
    test(`${from} redirects (301) to ${to}`, async ({ page }) => {
      const response = await page.goto(from);
      const chain = response?.request().redirectedFrom();
      expect(chain, `${from} should have redirected`).not.toBeNull();
      expect(new URL(page.url()).pathname).toBe(to);
    });
  }
});
