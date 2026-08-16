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

  test("submits the reminder sign-up and shows the honest stub notice", async ({ page }) => {
    await page.goto("/mitmachen");
    await page.getByLabel("E-Mail", { exact: true }).fill("jane@example.com");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Erinnerung aktivieren" }).click();
    await expect(page.getByRole("status")).toContainText("Diese Anmeldung ist noch nicht angebunden");
  });

  test("scrolling to the application from the closing CTA reaches the reminder sign-up", async ({
    page,
  }) => {
    await page.goto("/mitmachen");
    await page.getByRole("button", { name: "Zur Bewerbung" }).click();
    await expect(page.getByRole("heading", { name: "Per E-Mail erinnern lassen" })).toBeInViewport();
  });

  test("shows the real application form during the open window, and a stub notice on submit", async ({
    page,
  }) => {
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

    await expect(page.getByRole("status")).toContainText("teamvorstand@unimannheim.enactus.team");
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
