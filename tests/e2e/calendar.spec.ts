import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * The homepage bakes its calendar data into the static page at build time
 * (by design — `next build` must succeed without a database, see
 * lib/calendarEvents.ts's fail-soft loader). EventCalendar.tsx re-fetches
 * the same data client-side on mount specifically so tests like these have
 * a seam to intercept, the same arrangement /mitmachen already uses for its
 * recruiting windows.
 *
 * Dates are computed relative to the real, unmocked clock (not
 * page.clock — mitmachen.spec.ts's own comment explains why a faked clock
 * stalls a route-mocked fetch response in WebKit) so these events land
 * safely in the past/future no matter when the suite actually runs. The
 * component's own "now" (EventCalendar's initialNowMs prop) comes from the
 * real server clock at build/serve time, which in a Playwright run is
 * seconds away from this file's own `Date.now()` — comfortably within the
 * multi-day margins used below.
 */
function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const NEXT_EVENT = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Ideathon",
  titleEn: null,
  category: "innolab",
  startDate: isoDate(10),
  endDate: isoDate(13),
  startTime: null,
  endTime: null,
  location: "Mannheim",
  description: null,
  descriptionEn: null,
  tentative: false,
};

const LATER_EVENT = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Kick-off",
  titleEn: null,
  category: "bewerbung",
  startDate: isoDate(20),
  endDate: null,
  startTime: "18:00",
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: false,
};

const PAST_EVENT = {
  id: "33333333-3333-3333-3333-333333333333",
  title: "Q-Summit",
  titleEn: null,
  category: "wettkaempfe",
  // Comfortably in a different, earlier calendar month than "today" so it
  // reliably lands in the collapsed "earlier months" group rather than
  // depending on exactly which day of the current month the suite runs.
  startDate: isoDate(-45),
  endDate: null,
  startTime: null,
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: false,
};

const TENTATIVE_EVENT = {
  id: "44444444-4444-4444-4444-444444444444",
  title: "ConnectUs",
  titleEn: null,
  category: "socials",
  startDate: isoDate(15),
  endDate: null,
  startTime: null,
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: true,
};

const ALL_EVENTS = [NEXT_EVENT, LATER_EVENT, PAST_EVENT, TENTATIVE_EVENT];

function mockCalendarEvents(page: Page, events: unknown[]) {
  return page.route("**/api/calendar-events", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events }) }),
  );
}

test.describe("homepage event calendar", () => {
  test("highlights the soonest upcoming event with its date, category, and location", async ({ page }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");

    const highlight = page.getByRole("heading", { name: "Ideathon" });
    await highlight.scrollIntoViewIfNeeded();
    await expect(highlight).toBeVisible();
    await expect(page.getByText("Mannheim", { exact: true })).toBeVisible();
  });

  test("links 'Zum Kalender hinzufügen' at the highlighted event's own ics route", async ({ page }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    // The route's own behaviour (folding, escaping, DTSTART/DTEND,
    // headers, the 404/500 cases) is covered end to end against real
    // request/response objects by tests/unit/lib/ics.test.ts and
    // tests/integration/calendarIcs.test.ts. A forced-download anchor click
    // isn't reliably interceptable via page.route() in every engine (the
    // request bypasses normal fetch/XHR interception on some download
    // paths), so this only proves the rendered link's own wiring — that it
    // exists, is reachable, and points at the correct event's route.
    await page.goto("/");

    const link = page.getByRole("link", { name: /Zum Kalender hinzufügen/ }).first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toHaveAttribute("href", `/api/kalender/${NEXT_EVENT.id}/ics`);
  });

  test("narrows the agenda to a selected category via the filter chips", async ({ page }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");

    const chip = page.getByRole("button", { name: /Bewerbung/ });
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByText("Kick-off")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ideathon" })).not.toBeVisible();
  });

  test("keeps a month before the current one collapsed until 'Frühere Termine' is opened", async ({
    page,
  }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");

    await expect(page.getByText("Q-Summit")).not.toBeVisible();

    const toggle = page.getByRole("button", { name: "Frühere Termine" });
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Q-Summit")).toBeVisible();
  });

  test("marks a tentative event with its explanatory note", async ({ page }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");

    await expect(page.getByText("Termin steht noch nicht fest").first()).toBeVisible();
  });

  test("shows a friendly empty state when the calendar has no events at all", async ({ page }) => {
    await mockCalendarEvents(page, []);
    await page.goto("/");

    await expect(page.getByText("Aktuell stehen keine Termine im Kalender.")).toBeVisible();
  });

  test("never introduces a horizontal scrollbar at 360px, with every category chip present", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await mockCalendarEvents(page, [
      NEXT_EVENT,
      LATER_EVENT,
      PAST_EVENT,
      TENTATIVE_EVENT,
      { ...NEXT_EVENT, id: "55555555-5555-5555-5555-555555555555", category: "projekte", title: "Projekt-Sprint" },
      { ...NEXT_EVENT, id: "66666666-6666-6666-6666-666666666666", category: "journeys", title: "Journey" },
      { ...NEXT_EVENT, id: "77777777-7777-7777-7777-777777777777", category: "workshops", title: "Workshop" },
    ]);
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("keeps a focused filter chip's focus ring fully inside the chip row, not clipped", async ({ page }) => {
    // Regression for the row's own vertical clipping: overflow-x-auto forces
    // overflow-y to "auto" too (see the component's comment), so a focus
    // ring rendered just outside a chip's border box used to be cut off at
    // the row's own top/bottom edge whenever there wasn't enough padding to
    // hold it.
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");

    const row = page.getByRole("group", { name: "Nach Kategorie filtern" });
    const chip = row.getByRole("button").first();
    await chip.focus();

    const [rowBox, chipBox] = await Promise.all([row.boundingBox(), chip.boundingBox()]);
    expect(rowBox).not.toBeNull();
    expect(chipBox).not.toBeNull();
    // The chip's own box (not the focus ring, which boundingBox() doesn't
    // capture) must sit inside the row with room to spare above and below —
    // that spare room is exactly where the ring paints.
    expect(chipBox!.y).toBeGreaterThan(rowBox!.y);
    expect(chipBox!.y + chipBox!.height).toBeLessThan(rowBox!.y + rowBox!.height);
    expect(await row.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
  });

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await mockCalendarEvents(page, ALL_EVENTS);
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
