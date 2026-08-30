import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The reminder double-opt-in confirm/unsubscribe landing page
// (erinnerung-status/page.tsx). Every real visit arrives via a redirect
// from bestaetigen/route.ts or abmelden/route.ts with ?status=<state> —
// tested against the DB-backed redirect itself in
// tests/integration/reminder.test.ts (mocked DB) — so here it's enough to
// drive the page directly by query param, the same mockable seam the
// route already resolves to before the page ever renders.
test.describe("/erinnerung-status", () => {
  test("shows a real confirmed message, not a silent redirect", async ({ page }) => {
    await page.goto("/erinnerung-status?status=confirmed");
    await expect(page.getByRole("heading", { level: 1, name: "Benachrichtigung bestätigt" })).toBeVisible();
    await expect(page.getByText(/benachrichtigen dich jetzt per E-Mail/)).toBeVisible();
    await expect(page.getByText("Du kannst dich jederzeit wieder abmelden.")).toBeVisible();
  });

  test("shows already-confirmed distinctly from a fresh confirmation", async ({ page }) => {
    await page.goto("/erinnerung-status?status=already-confirmed");
    await expect(page.getByRole("heading", { level: 1, name: "Bereits bestätigt" })).toBeVisible();
    await expect(page.getByText("Du kannst dich jederzeit wieder abmelden.")).toBeVisible();
  });

  test("shows an unsubscribed confirmation without the unsubscribe hint", async ({ page }) => {
    await page.goto("/erinnerung-status?status=unsubscribed");
    await expect(page.getByRole("heading", { level: 1, name: "Abmeldung bestätigt" })).toBeVisible();
    await expect(page.getByText("Du kannst dich jederzeit wieder abmelden.")).not.toBeVisible();
  });

  test("shows an invalid-link message for an invalid status, a missing one, or garbage", async ({ page }) => {
    for (const query of ["?status=invalid", "?status=not-a-real-state", ""]) {
      await page.goto(`/erinnerung-status${query}`);
      await expect(page.getByRole("heading", { level: 1, name: "Link ungültig" })).toBeVisible();
    }
  });

  // Added 2026-08-30: a rate-limited request used to redirect here as
  // "invalid", telling a visitor with a perfectly working link that it was
  // broken — a real scenario when many applicants share one Uni-WLAN
  // egress IP. This status must read as "try again shortly", not "your
  // link doesn't work", and must not be confused with an actually invalid
  // link (a distinct heading, not folded into the invalid case above).
  test("shows a rate-limited message distinct from an invalid link", async ({ page }) => {
    await page.goto("/erinnerung-status?status=rate-limited");
    await expect(page.getByRole("heading", { level: 1, name: "Kurz zu viele Anfragen" })).toBeVisible();
    await expect(page.getByText(/versuch es in ein paar Minuten noch einmal/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Link ungültig" })).not.toBeVisible();
  });

  test("always links back to the homepage", async ({ page }) => {
    await page.goto("/erinnerung-status?status=confirmed");
    await expect(page.getByRole("link", { name: "Zurück zur Startseite" })).toHaveAttribute("href", "/");
  });

  test("is noindex, nofollow", async ({ page }) => {
    await page.goto("/erinnerung-status?status=confirmed");
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute("content", /noindex/);
    await expect(robotsMeta).toHaveAttribute("content", /nofollow/);
  });

  test("renders correctly on the English locale too", async ({ page }) => {
    await page.goto("/en/erinnerung-status?status=unsubscribed");
    await expect(page.getByRole("heading", { level: 1, name: "Unsubscribe confirmed" })).toBeVisible();
  });

  test("has no automatically detectable accessibility violations, for each state", async ({ page }) => {
    for (const status of ["confirmed", "already-confirmed", "unsubscribed", "invalid", "rate-limited"]) {
      await page.goto(`/erinnerung-status?status=${status}`);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, status).toEqual([]);
    }
  });
});
