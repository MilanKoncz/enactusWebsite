import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * /ideathon bakes its calendar_events data into the static page at build
 * time only as a fallback (IdeathonEventGate.tsx re-fetches GET
 * /api/calendar-events client-side and prefers that result) — same
 * "mockable seam" reasoning and same route as tests/e2e/calendar.spec.ts,
 * which this file borrows its isoDate helper and clock reasoning from
 * (real, unmocked clock — a faked one stalls a route-mocked fetch response
 * in WebKit, see mitmachen.spec.ts's own comment).
 */
function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const UPCOMING_IDEATHON = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Ideathon",
  titleEn: null,
  category: "innolab",
  startDate: isoDate(30),
  endDate: isoDate(33),
  startTime: null,
  endTime: null,
  location: "MAFINEX, Mannheim",
  description: null,
  descriptionEn: null,
  tentative: false,
  internalLink: "/ideathon",
};

const ONGOING_IDEATHON = {
  ...UPCOMING_IDEATHON,
  id: "22222222-2222-2222-2222-222222222222",
  startDate: isoDate(-1),
  endDate: isoDate(2),
};

function mockCalendarEvents(page: Page, events: unknown[]) {
  return page.route("**/api/calendar-events", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events }) }),
  );
}

// Issued 10s in the past, so IdeathonSignupForm's minimum-fill-time gate is
// already satisfied — same reasoning as mitmachen.spec.ts's mockFormToken.
function mockFormToken(page: Page) {
  return page.route("**/api/ideathon/token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: `${Date.now() - 10_000}.e2e-test-signature` }),
    }),
  );
}

test.describe("/ideathon", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("is reachable from the header navigation, right after Events", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop header nav only — mobile-nav.spec.ts covers the fullscreen menu");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    const labels = await nav.getByRole("link").allTextContents();
    const eventsIndex = labels.indexOf("Events");
    expect(labels[eventsIndex + 1]).toBe("Ideathon");
    await nav.getByRole("link", { name: "Ideathon", exact: true }).click();
    await expect(page).toHaveURL(/\/ideathon$/);
  });

  test("shows a quiet state, no countdown, when no Ideathon is upcoming", async ({ page }) => {
    await mockCalendarEvents(page, []);
    await page.goto("/ideathon");
    await expect(page.getByText("Der nächste Termin steht noch nicht fest")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows the countdown and the real signup form once an Ideathon is on the calendar", async ({
    page,
  }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    await expect(page.getByText("Ideathon 2026 startet in")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmeldung absenden" })).toBeVisible();
  });

  test("shows a live state instead of the countdown while the Ideathon is running", async ({ page }) => {
    await mockCalendarEvents(page, [ONGOING_IDEATHON]);
    await page.goto("/ideathon");
    await expect(page.getByText("Der Ideathon läuft gerade", { exact: true })).toBeVisible();
    await expect(page.getByText("Ideathon 2026 startet in")).not.toBeVisible();
    // The signup form stays closed for the date that's already running, but
    // the closed-note wording reflects "running now", not "not scheduled".
    await expect(page.getByText(/Der Ideathon läuft gerade, die Anmeldung/)).toBeVisible();
  });

  test("mentions the UN Sustainable Development Goals and their three pillars", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    await expect(page.getByText(/People\s*·\s*Planet\s*·\s*Prosperity/)).toBeVisible();
    await expect(page.getByRole("link", { name: "UN-Nachhaltigkeitszielen" })).toHaveAttribute(
      "href",
      "https://sdgs.un.org/goals",
    );
  });

  test("links the form's membership notice to /mitmachen, reachable by keyboard", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    const link = page.getByRole("link", { name: "Mitgliedschaftsbewerbung" });
    await expect(link).toHaveAttribute("href", "/mitmachen");
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("submits the signup form and shows a real success notice", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await mockFormToken(page);
    // /api/ideathon itself is exercised by the Vitest integration suite
    // against a mocked db/mail layer — this only proves the form calls the
    // route and reacts to its response.
    await page.route("**/api/ideathon", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
    );
    await page.goto("/ideathon");

    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail-Adresse").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Essenspräferenz").selectOption("omnivore");
    await page.getByRole("checkbox", { name: "Ich habe die Datenschutzhinweise" }).check();

    await page.getByRole("button", { name: "Anmeldung absenden" }).click();
    await expect(page.getByRole("status")).toContainText("Deine Anmeldung ist da");
  });

  test("blocks the signup form with a visible error when consent is missing", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await mockFormToken(page);
    await page.goto("/ideathon");
    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail-Adresse").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Essenspräferenz").selectOption("omnivore");
    await page.getByRole("button", { name: "Anmeldung absenden" }).click();
    await expect(page.getByText("Bitte bestätige, dass du die Datenschutzhinweise")).toBeVisible();
  });

  test("expands an FAQ entry on click, operable by keyboard", async ({ page }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    const trigger = page.getByRole("button", { name: "Muss ich schon eine Idee mitbringen?" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/Die Idee entwickelst du im Team/)).toBeVisible();
  });

  test("switches locale between /ideathon and /en/ideathon, landing on the same route", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop locale switcher only — see mobile-nav.spec.ts / locale-switch.spec.ts");
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/ideathon");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL("/en/ideathon");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("pitch");
  });

  test("has no automatically detectable accessibility violations on the English route", async ({
    page,
  }) => {
    await mockCalendarEvents(page, [UPCOMING_IDEATHON]);
    await page.goto("/en/ideathon");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
