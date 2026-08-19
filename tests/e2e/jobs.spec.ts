import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * /jobs bakes its posting data into the static page at build time (by
 * design — see lib/jobPostings.ts's fail-soft loader, same reasoning as
 * /termine). JobsSection.tsx re-fetches the same data client-side on mount
 * specifically so tests like these have a seam to intercept, the same
 * arrangement /termine already uses (see calendar.spec.ts's own comment).
 */
const WERKSTUDENT_JOB = {
  id: "11111111-1111-1111-1111-111111111111",
  company: "SZA",
  title: "Werkstudent:in Consulting",
  employmentType: "werkstudent",
  location: "Mannheim",
  remote: "hybrid",
  description: "Unterstütze unser Beratungsteam bei laufenden Mandaten.",
  applyUrl: "https://example.com/jobs/werkstudent",
  expiresAt: "2099-01-01",
  partnerSlug: null,
};

const PRAKTIKUM_JOB = {
  id: "22222222-2222-2222-2222-222222222222",
  company: "KPMG",
  title: "Praktikum Audit",
  employmentType: "praktikum",
  location: "Mannheim",
  remote: "vor_ort",
  description: "Praxiseinblick in die Wirtschaftsprüfung.",
  applyUrl: "https://example.com/jobs/praktikum",
  expiresAt: "2099-01-01",
  partnerSlug: null,
};

function mockJobPostings(page: Page, jobs: unknown[]) {
  return page.route("**/api/job-postings", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs }) }),
  );
}

async function gotoWithJobs(page: Page, jobs: unknown[]) {
  await mockJobPostings(page, jobs);
  const settled = page.waitForResponse((response) => response.url().includes("/api/job-postings"));
  await page.goto("/jobs");
  await settled;
}

test.describe("/jobs", () => {
  test("shows every posting with its type, location, and an external apply link", async ({ page }) => {
    await gotoWithJobs(page, [WERKSTUDENT_JOB, PRAKTIKUM_JOB]);

    await expect(page.getByText("Werkstudent:in Consulting")).toBeVisible();
    await expect(page.getByText("Praktikum Audit")).toBeVisible();

    const link = page.getByRole("link", { name: /Werkstudent:in Consulting bei SZA/ });
    await expect(link).toHaveAttribute("href", WERKSTUDENT_JOB.applyUrl);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("narrows the list to a selected employment type via the filter chips", async ({ page }) => {
    await gotoWithJobs(page, [WERKSTUDENT_JOB, PRAKTIKUM_JOB]);

    const chip = page.getByRole("group", { name: "Nach Art der Stelle filtern" }).getByRole("button", {
      name: "Praktikum",
    });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByText("Praktikum Audit")).toBeVisible();
    await expect(page.getByText("Werkstudent:in Consulting")).not.toBeVisible();
  });

  test("shows a friendly empty state, with a contact link, when there are no postings", async ({ page }) => {
    await gotoWithJobs(page, []);

    await expect(page.getByText("Aktuell sind keine Stellen ausgeschrieben.")).toBeVisible();
    const contact = page.getByRole("link", { name: "Kontakt aufnehmen" });
    await expect(contact).toHaveAttribute("href", /^mailto:/);
  });

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await gotoWithJobs(page, [WERKSTUDENT_JOB, PRAKTIKUM_JOB]);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoWithJobs(page, [WERKSTUDENT_JOB, PRAKTIKUM_JOB]);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

// The nav/footer "Jobs" link's visibility is a *server*-computed prop (the
// site layout's own getJobPostings() call, at request time — see its
// comment), unlike the list above: there is no client-side seam to mock it
// through the same way, so it isn't covered here. See
// tests/unit/layout/Nav.test.tsx and Footer.test.tsx for that logic
// instead, exercised directly against the showJobs/hasJobs prop.
