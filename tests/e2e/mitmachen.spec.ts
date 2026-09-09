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
// never exist. `extraAreas` lets a test add a flagged InnoLab-style area
// alongside the default one without duplicating the whole fixture.
function mockProjectAreas(page: Page, extraAreas: Array<Record<string, unknown>> = []) {
  return page.route("**/api/project-areas", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        areas: [
          { id: "e2e-area-1", labelDe: "SmileGreen", labelEn: "SmileGreen", ideathonHint: false },
          ...extraAreas,
        ],
      }),
    }),
  );
}

// Same reasoning as mockProjectAreas: CI's build has no database, so
// /api/departments would otherwise return an empty list and the Ressort
// checkboxes these tests check for would never exist.
function mockDepartments(page: Page) {
  return page.route("**/api/departments", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        departments: [
          { id: "e2e-dept-1", labelDe: "Team-Lead", labelEn: "Team-Lead" },
          { id: "e2e-dept-2", labelDe: "Finance-Lead", labelEn: "Finance-Lead" },
        ],
      }),
    }),
  );
}

// Same reasoning as mockProjectAreas/mockDepartments: CI's build has no
// database, so /api/gespraechsslots would otherwise return an empty list
// and the interview-availability field these tests check for would never
// render. Returns the raw windows-with-grid shape the real route returns —
// MitmachenApplication.tsx does its own windowContaining/generateInterviewSlots
// derivation from this, same as it does for recruitingWindows — so this has
// to be a real window bracketing "now", same as OPEN_WINDOW above.
// `days: []` (the default the "no interview days configured" test overrides
// to) is the "nothing configured yet" state; the two-day default here
// yields four slots (two per day, 10:00-11:00 and 11:00-12:00), small
// enough to assert on individually.
function mockInterviewSlots(page: Page, days: string[] = ["2026-09-15", "2026-09-16"]) {
  return page.route("**/api/gespraechsslots", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        windows: [
          {
            ...OPEN_WINDOW,
            interviewGrid: { days, startTime: "10:00", endTime: "12:00", slotMinutes: 60 },
          },
        ],
      }),
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

// The CV upload runs client → Vercel Blob directly, bypassing this site's
// own server entirely (see lib/cvBlob.ts's own comment on why the store
// stays private end to end) — there is no page.route() seam on *this*
// site's API for the actual file transfer, only for the two calls
// @vercel/blob/client's upload() itself makes: a POST to the
// handleUploadUrl (/api/bewerbung/cv-upload) for a client token, then a
// PUT to Vercel's own control-plane endpoint, https://vercel.com/api/blob
// (the package's default `getApiUrl` — not a `*.blob.vercel-storage.com`
// subdomain, despite what the store's own download URLs look like; see
// lib/securityHeaders.ts's own comment on why that specific host is also
// the one addition this project's CSP needed). Both calls are mocked
// here; no test run ever reaches the real Vercel Blob store.
//
// The fake client token has to actually look like one: upload() throws
// client-side (BlobError) unless the string starts with
// "vercel_blob_client_", and derives the store id by splitting on "_" and
// taking the 4th segment — hence the exact shape below, not an arbitrary
// string.
function mockCvUpload(page: Page) {
  return Promise.all([
    page.route("**/api/bewerbung/cv-upload", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          type: "blob.generate-client-token",
          clientToken: "vercel_blob_client_e2eteststore_signature",
        }),
      }),
    ),
    page.route("https://vercel.com/api/blob**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://e2eteststore.private.blob.vercel-storage.com/bewerbungen/lebenslauf.pdf",
          downloadUrl:
            "https://e2eteststore.private.blob.vercel-storage.com/bewerbungen/lebenslauf.pdf?download=1",
          pathname: "bewerbungen/lebenslauf.pdf",
          contentType: "application/pdf",
          contentDisposition: 'attachment; filename="lebenslauf.pdf"',
        }),
      }),
    ),
  ]);
}

async function uploadCv(page: Page) {
  await page.getByLabel("Lebenslauf").setInputFiles({
    name: "lebenslauf.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 e2e test content"),
  });
  await expect(page.getByText("lebenslauf.pdf hochgeladen")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Benachrichtigung zum Bewerbungsstart" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bewerbung absenden" })).toHaveCount(0);
  });

  test("shows the WhatsApp community line under the application section", async ({ page }) => {
    await page.goto("/mitmachen");
    // Scoped to #bewerbung, not just an accessible-name match: the header's
    // own small WhatsApp icon link (HeaderSocialLinks.tsx) is also on this
    // page at desktop widths and shares "WhatsApp-Community" as a substring
    // of its aria-label.
    const link = page.locator("#bewerbung").getByRole("link", { name: "WhatsApp-Community", exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/FplqECI7eYL2CmoxR2OR2Q");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("also shows the WhatsApp community line once the application window is open", async ({ page }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await page.goto("/mitmachen");
    await expect(page.getByRole("button", { name: "Bewerbung absenden" })).toBeVisible();
    const link = page.locator("#bewerbung").getByRole("link", { name: "WhatsApp-Community", exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/FplqECI7eYL2CmoxR2OR2Q");
  });

  test("links the areas notice's Ideathon mention to the Ideathon page, reachable by keyboard", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await page.goto("/mitmachen");
    const link = page.locator("#bewerbung").getByRole("link", { name: "hier", exact: true });
    await expect(link).toHaveAttribute("href", "/ideathon");
    await link.focus();
    await expect(link).toBeFocused();
  });

  // The German anchor text was renamed to "hier" (commit 7b95128) without
  // its English counterpart following along — messages/en.json still said
  // "Ideathon" until this was caught. Locked in here so the two can't drift
  // apart silently again.
  test("links the areas notice's Ideathon mention on the English route too", async ({ page }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await page.goto("/en/mitmachen");
    const link = page.locator("#bewerbung").getByRole("link", { name: "here", exact: true });
    await expect(link).toHaveAttribute("href", "/en/ideathon");
  });

  test("shows the Ideathon hint once the flagged area is chosen, in any of the three slots, and hides it on change", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page, [
      { id: "e2e-area-innolab", labelDe: "InnoLab", labelEn: "InnoLab", ideathonHint: true },
    ]);
    await mockDepartments(page);
    await page.goto("/mitmachen");

    const hintText = "Du hast InnoLab als Wunschbereich gewählt";
    await expect(page.getByText(hintText)).not.toBeVisible();

    await page.getByLabel("2. Wahl").selectOption("InnoLab");
    const hint = page.getByText(hintText);
    await expect(hint).toBeVisible();
    const link = hint.getByRole("link");
    await expect(link).toHaveAttribute("href", "/ideathon");
    await link.focus();
    await expect(link).toBeFocused();

    await page.getByLabel("2. Wahl").selectOption("SmileGreen");
    await expect(page.getByText(hintText)).not.toBeVisible();
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
    await page.getByRole("button", { name: "Benachrichtigung aktivieren" }).click();
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
    const heading = page.getByRole("heading", { name: "Benachrichtigung zum Bewerbungsstart" });
    await expect(heading).toBeAttached();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
  });

  test("shows the real application form during the open window, and a real success notice on submit", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockFormToken(page);
    await mockCvUpload(page);
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
    await page.getByLabel("Verfügbarkeit in Stunden pro Woche").fill("10");
    await page.getByLabel("1. Wahl").selectOption("SmileGreen");
    await page
      .getByLabel("Warum dieser Bereich?")
      .fill("Weil ich dort am meisten bewirken kann.");
    await uploadCv(page);
    await page
      .getByLabel("Motivation")
      .fill("Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.");
    await page.getByRole("checkbox", { name: /Datenschutzerklärung/ }).check();

    // No wait needed for the anti-spam minimum fill time: mockFormToken
    // hands the form a token already 10s old.
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
  });

  test("lets a visitor check optional Ressorts and still submit successfully", async ({ page }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockFormToken(page);
    await mockCvUpload(page);
    let submittedBody: unknown;
    await page.route("**/api/bewerbung", (route) => {
      submittedBody = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto("/mitmachen");

    await expect(page.getByRole("checkbox", { name: "Team-Lead" })).toBeVisible();
    await page.getByRole("checkbox", { name: "Team-Lead" }).check();
    await page.getByRole("checkbox", { name: "Finance-Lead" }).check();

    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Verfügbarkeit in Stunden pro Woche").fill("10");
    await page.getByLabel("1. Wahl").selectOption("SmileGreen");
    await page.getByLabel("Warum dieser Bereich?").fill("Weil ich dort am meisten bewirken kann.");
    await uploadCv(page);
    await page
      .getByLabel("Motivation")
      .fill("Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.");
    await page.getByRole("checkbox", { name: /Datenschutzerklärung/ }).check();
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
    expect(submittedBody).toMatchObject({ departments: ["Team-Lead", "Finance-Lead"] });
  });

  test("submits successfully with no interview slot checked, since availability is optional", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await mockFormToken(page);
    await mockCvUpload(page);
    let submittedBody: unknown;
    await page.route("**/api/bewerbung", (route) => {
      submittedBody = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto("/mitmachen");

    await expect(page.getByText("(Optional) Verfügbarkeit für ein Bewerbungsgespräch")).toBeVisible();

    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Verfügbarkeit in Stunden pro Woche").fill("10");
    await page.getByLabel("1. Wahl").selectOption("SmileGreen");
    await page.getByLabel("Warum dieser Bereich?").fill("Weil ich dort am meisten bewirken kann.");
    await uploadCv(page);
    await page
      .getByLabel("Motivation")
      .fill("Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.");
    await page.getByRole("checkbox", { name: /Datenschutzerklärung/ }).check();
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
    expect(submittedBody).toMatchObject({ interviewSlots: [] });
  });

  test("lets a visitor check interview slots across both configured days and submits them all", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await mockFormToken(page);
    await mockCvUpload(page);
    let submittedBody: unknown;
    await page.route("**/api/bewerbung", (route) => {
      submittedBody = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto("/mitmachen");

    // Each day is its own group ("Dienstag · 15. September 2026"), scoped
    // so the identical "10:00–11:00" label on both days resolves to the
    // right checkbox.
    const day15 = page.getByRole("group", { name: /15\. September 2026/ });
    const day16 = page.getByRole("group", { name: /16\. September 2026/ });
    await day15.getByRole("checkbox", { name: "10:00–11:00" }).check();
    await day16.getByRole("checkbox", { name: "11:00–12:00" }).check();

    await page.getByLabel("Vorname").fill("Jane");
    await page.getByLabel("Nachname").fill("Doe");
    await page.getByLabel("E-Mail").fill("jane@example.com");
    await page.getByLabel("Studiengang").fill("BWL");
    await page.getByLabel("Fachsemester").fill("3");
    await page.getByLabel("Verfügbarkeit in Stunden pro Woche").fill("10");
    await page.getByLabel("1. Wahl").selectOption("SmileGreen");
    await page.getByLabel("Warum dieser Bereich?").fill("Weil ich dort am meisten bewirken kann.");
    await uploadCv(page);
    await page
      .getByLabel("Motivation")
      .fill("Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.");
    await page.getByRole("checkbox", { name: /Datenschutzerklärung/ }).check();
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();

    await expect(page.getByRole("status")).toContainText("Danke für deine Bewerbung");
    expect(submittedBody).toMatchObject({
      interviewSlots: ["2026-09-15T08:00:00.000Z", "2026-09-16T09:00:00.000Z"],
    });
  });

  test("shows no interview-availability field when no interview days are configured", async ({ page }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page, []);
    await page.goto("/mitmachen");

    await expect(page.getByRole("button", { name: "Bewerbung absenden" })).toBeVisible();
    await expect(page.getByText("Verfügbarkeit für ein Bewerbungsgespräch")).not.toBeVisible();
  });

  test("lets a keyboard user tab to an interview slot checkbox and toggle it with Space", async ({ page }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await page.goto("/mitmachen");

    const checkbox = page
      .getByRole("group", { name: /15\. September 2026/ })
      .getByRole("checkbox", { name: "10:00–11:00" });
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
  });

  test("has no automatically detectable accessibility violations with the interview-availability field rendered", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await page.goto("/mitmachen");
    await expect(page.getByText("(Optional) Verfügbarkeit für ein Bewerbungsgespräch")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no automatically detectable accessibility violations with the interview-availability field rendered, on the English route", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await page.goto("/en/mitmachen");
    await expect(page.getByText("(Optional) Availability for an interview")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("never introduces a horizontal scrollbar at 360px with the interview-availability field rendered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await mockOpenRecruitingWindow(page);
    await mockProjectAreas(page);
    await mockDepartments(page);
    await mockInterviewSlots(page);
    await page.goto("/mitmachen");
    await expect(page.getByText("(Optional) Verfügbarkeit für ein Bewerbungsgespräch")).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("blocks the application form with visible errors when required fields are empty", async ({
    page,
  }) => {
    await mockOpenRecruitingWindow(page);
    await mockFormToken(page);
    await page.goto("/mitmachen");
    await page.getByRole("button", { name: "Bewerbung absenden" }).click();
    await expect(page.getByText("Bitte gib deinen Vornamen ein.")).toBeVisible();
    await expect(page.getByText("Bitte wähle deinen Wunschbereich.")).toBeVisible();
    await expect(page.getByText("Bitte lade deinen Lebenslauf als PDF-Datei hoch.")).toBeVisible();
    await expect(page.getByText("Bitte bestätige die Einwilligung.")).toBeVisible();
  });
});

// Regression coverage for the timezone bug: the "Bewerbungen sind vom … bis
// …" sentence used to render in the *browser's* own zone while claiming
// Berlin time underneath it. This is the honest end-to-end version of the
// same check in tests/unit/sections/MitmachenApplication.test.tsx — unlike
// the unit test, this one exercises the real hydration path (SSR on
// /mitmachen's static page, then the client re-fetch and re-render), so it
// would also catch a server/client text mismatch the unit test can't see.
const FUTURE_WINDOW = {
  semester: "FSS30",
  start: "2030-06-15T10:00:00+02:00",
  end: "2030-06-20T18:30:00+02:00",
};

function mockFutureRecruitingWindow(page: Page) {
  return page.route("**/api/recruiting-windows", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ windows: [FUTURE_WINDOW] }),
    }),
  );
}

test.describe("/mitmachen — Berlin time regardless of the visitor's own timezone", () => {
  for (const timezoneId of ["Asia/Seoul", "America/New_York"]) {
    test.describe(`viewed from ${timezoneId}`, () => {
      test.use({ timezoneId });

      test("shows the opening and closing dates in Berlin time, not the visitor's own", async ({
        page,
      }) => {
        await mockFutureRecruitingWindow(page);
        await page.goto("/mitmachen");
        await expect(
          page.getByText(
            "Bewerbungen sind vom 15. Juni 2030 um 10:00 bis 20. Juni 2030 um 18:30 möglich.",
            { exact: false },
          ),
        ).toBeVisible();
        await expect(
          page.getByText("Alle Zeiten in Berliner Zeit (Europe/Berlin), unabhängig davon, wo du gerade bist."),
        ).toBeVisible();
      });
    });
  }
});
