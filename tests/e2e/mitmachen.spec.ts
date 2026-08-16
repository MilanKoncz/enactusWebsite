import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

  test("scrolling to the application from the closing CTA reaches the reminder sign-up", async ({
    page,
  }) => {
    await page.goto("/mitmachen");
    await page.getByRole("button", { name: "Zur Bewerbung" }).click();
    await expect(page.getByRole("heading", { name: "Per E-Mail erinnern lassen" })).toBeInViewport();
  });

  test("shows the real application form during the open window, and a real success notice on submit", async ({
    page,
  }) => {
    // /api/bewerbung itself is exercised by the Vitest integration suite
    // against a mocked db/mail/PDF layer — this only proves the form calls
    // the route and reacts to its response, without needing a real
    // database or Resend key in the e2e environment.
    await page.route("**/api/bewerbung", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
    );
    await page.clock.install({ time: new Date("2026-09-05T12:00:00+02:00") });
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

    // Past the anti-spam minimum fill time (ApplicationForm.tsx's MIN_FILL_MS).
    await page.clock.fastForward(4000);
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
  });

  test("blocks the application form with visible errors when required fields are empty", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-05T12:00:00+02:00") });
    await page.goto("/mitmachen");
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();
    await expect(page.getByText("Bitte gib deinen Vornamen ein.")).toBeVisible();
    await expect(page.getByText("Bitte bestätige die Einwilligung.")).toBeVisible();
  });
});
