import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// /mitmachen bakes its recruiting-window data into the static page at
// build time — by design, that build must succeed without a database
// (lib/recruitingWindows.ts falls back to an empty, closed-looking list),
// so there's no way to make a real build say "a window is open" without a
// real, migrated database reachable in CI. MitmachenApplication.tsx
// re-fetches the same data client-side on mount specifically so tests like
// these have a seam to intercept, the same way every other DB-backed form
// on this site already does (see the /api/bewerbung and /api/bewerbung/token
// mocks below). Mocking this is what actually puts the page in the "open"
// state here, regardless of what the CI build's own database access baked
// into the static HTML.
//
// The window deliberately spans far past to far future so it contains the
// *real* current time, which is what lets these tests run without
// page.clock.install(). A faked clock is not usable here: installed before
// the navigation, it stalls delivery of a route-mocked fetch response in
// WebKit, so the component never receives this list and the form never
// appears — reproducible on Mobile Safari, invisible on Chromium.
const OPEN_WINDOW = {
  semester: "HWS26",
  start: "2000-01-01T00:00:00+01:00",
  end: "2099-12-31T23:59:00+01:00",
};

function mockOpenRecruitingWindow(page: Page) {
  return page.route("**/api/recruiting-windows", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ windows: [OPEN_WINDOW] }),
    }),
  );
}

// Same reasoning as mockOpenRecruitingWindow: CI's build has no database
// (docs/deployment.md), so /api/project-areas would otherwise return an
// empty list and the "SmileGreen" checkbox these tests check for would
// never exist.
function mockProjectAreas(page: Page) {
  return page.route("**/api/project-areas", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ areas: [{ id: "e2e-area-1", labelDe: "SmileGreen", labelEn: "SmileGreen" }] }),
    }),
  );
}

// Issued 10s in the past, so ApplicationForm's minimum-fill-time gate
// (lib/antiSpam.ts's MIN_FILL_MS, 3s) is already satisfied the moment the
// form is filled in — no fake clock and no real waiting needed. The
// signature is nonsense on purpose: /api/bewerbung is mocked too, so
// nothing ever verifies it, and hardcoding a real one would tie the test
// to FORM_TOKEN_SECRET being set in the e2e environment.
function mockFormToken(page: Page) {
  return page.route("**/api/bewerbung/token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: `${Date.now() - 10_000}.e2e-test-signature` }),
    }),
  );
}

test.describe("/mitmachen", () => {
  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/mitmachen");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no automatically detectable accessibility violations on the English route", async ({
    page,
  }) => {
    await page.goto("/en/mitmachen");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders the real page, not the coming-soon placeholder", async ({ page }) => {
    await page.goto("/mitmachen");
    await expect(page.getByRole("heading", { level: 1, name: "Bring dich ein." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Agency" })).toBeVisible();
  });

  test("shows the countdown and reminder sign-up before the application window opens", async ({
    page,
  }) => {
    await page.goto("/mitmachen");
    await expect(page.getByText("Das Bewerbungsfenster ist noch geschlossen")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Per E-Mail erinnern lassen" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bewerbung absenden" })).toHaveCount(0);
  });

  test("submits the reminder sign-up and shows a real confirmation notice", async ({ page }) => {
    // /api/reminder itself is exercised by the Vitest integration suite
    // against a mocked db/mail layer — this only proves the form calls the
    // route and reacts to its response, without needing a real database or
    // Resend key in the e2e environment.
    await page.route("**/api/reminder", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
    );
    await page.goto("/mitmachen");
    await page.getByLabel("E-Mail", { exact: true }).fill("jane@example.com");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Erinnerung aktivieren" }).click();
    await expect(page.getByRole("status")).toContainText("bestätige die E-Mail");
  });

  // Asserts where the scroll lands, not which heading happens to fit on
  // screen afterwards. The application section is ~1040px tall while an
  // iPhone 13 viewport is 664px, so the reminder heading inside it sits ~25px
  // below the fold once the section's top is at the top — this test used to
  // assert that heading was in view and was flaky on exactly that margin.
  // What the CTA actually promises is `block: "start"` on #bewerbung.
  test("the closing CTA scrolls the application section to the top of the viewport", async ({
    page,
  }) => {
    await page.goto("/mitmachen");
    const application = page.locator("#bewerbung");
    await page.getByRole("button", { name: "Zur Bewerbung" }).click();

    // Polled, because the scroll is smooth unless reduced motion is set.
    // globals.css gives everything scroll-margin-top: 6rem, so the section's
    // top edge settles just under the fixed header rather than at exactly 0.
    await expect
      .poll(async () => Math.round((await application.boundingBox())!.y))
      .toBeLessThan(120);
    await expect(application).toBeInViewport();
  });

  test("the reminder sign-up is part of that application section", async ({ page }) => {
    await page.goto("/mitmachen");
    const heading = page.getByRole("heading", { name: "Per E-Mail erinnern lassen" });
    await expect(heading).toBeAttached();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
  });

  test("shows the real application form during the open window, and a real success notice on submit", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockFormToken(page);
    // /api/bewerbung itself is exercised by the Vitest integration suite
    // against a mocked db/mail/PDF layer — this only proves the form calls
    // the route and reacts to its response, without needing a real
    // database or Resend key in the e2e environment.
    await page.route("**/api/bewerbung", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
    );
    await page.goto("/mitmachen");

    await expect(page.getByRole("button", { name: "Bewerbung absenden" })).toBeVisible();

    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Hochschule").fill("Universität Mannheim");
    await page
      .getByLabel("Motivation")
      .fill("Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.");
    await page.getByRole("checkbox", { name: "SmileGreen" }).check();
    await page.getByLabel("Verfügbarkeit in Stunden pro Woche").fill("10");
    await page.getByRole("checkbox", { name: /Datenschutzerklärung/ }).check();

    // No wait needed for the anti-spam minimum fill time: mockFormToken
    // hands the form a token already 10s old.
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
  });

  test("blocks the application form with visible errors when required fields are empty", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockFormToken(page);
    await page.goto("/mitmachen");
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();
    await expect(page.getByText("Bitte gib deinen Vornamen ein.")).toBeVisible();
    await expect(page.getByText("Bitte bestätige die Einwilligung.")).toBeVisible();
  });
});
