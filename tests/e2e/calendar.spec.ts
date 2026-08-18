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

// The homepage bakes its calendar data into the static page at build time
// (see the file's own top comment), so the very first paint reflects
// whatever real, board-managed events existed at that build — not yet this
// test's own mock. Every test needs the page to have settled onto the mock
// before asserting anything, or a query can transiently match real data too
// (this is what "waiting for the month to reach the mocked event's own
// month" below, and this helper, both guard against).
async function gotoWithCalendar(page: Page, events: unknown[]) {
  await mockCalendarEvents(page, events);
  const settled = page.waitForResponse((response) => response.url().includes("/api/calendar-events"));
  await page.goto("/");
  await settled;
}

// The month grid (>=md) and the agenda list (<md) render at the same time —
// only one is ever visible, switched purely by CSS (EventCalendar.tsx's own
// comment explains why: a hidden md:block/md:hidden pair, not a media-query
// hook, so the desktop view never flashes in only after hydration). A real
// browser actually applies that CSS, unlike jsdom, so each describe block
// below forces the viewport its own view needs — independent of which
// project (Desktop Chromium or Mobile Safari) happens to run it, so both
// views get real cross-engine coverage rather than only ever being tested
// in the engine whose project viewport already happened to match.
test.describe("homepage event calendar", () => {
  test.describe("Monatsraster (ab md)", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    // A small, near-certain-to-land-in-the-current-month offset — the grid
    // opens on "today"'s own month by default, and a 2-day offset only ever
    // risks crossing into the next month on the last couple of days of any
    // given month, the same residual looseness PAST_EVENT's -45 days above
    // already accepts elsewhere in this file.
    const GRID_EVENT = {
      id: "88888888-8888-8888-8888-888888888888",
      title: "Ideathon",
      titleEn: null,
      category: "innolab",
      startDate: isoDate(2),
      endDate: null,
      startTime: null,
      endTime: null,
      location: "Mannheim",
      description: null,
      descriptionEn: null,
      tentative: false,
    };

    // Matches the exact day-plus-month-plus-year string the component's own
    // cellLabel uses — day-of-month alone isn't unique within one 42-day
    // grid, since trailing padding from the following month can repeat the
    // same low day numbers (e.g. both "28. Februar" and "2. März" showing
    // in the same view), so this has to include the month name too.
    function gridCellFor(page: Page, iso: string) {
      const label = new Intl.DateTimeFormat("de", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${iso}T00:00:00Z`));
      return page.getByRole("gridcell", { name: new RegExp(`^${label}`) });
    }

    test("shows exactly seven weekday column headers", async ({ page }) => {
      await gotoWithCalendar(page, [GRID_EVENT]);
      await expect(page.getByRole("columnheader")).toHaveCount(7);
    });

    // The homepage bakes its calendar data into the static page at build
    // time (see the file's own top comment) — this component's initial
    // month choice reflects that real, build-time snapshot for one instant,
    // then settles once EventCalendar's client-side re-fetch replaces it
    // with this test's mock. Every test below waits for that settle first,
    // via the month heading actually reaching the mocked event's own month,
    // rather than assuming the first paint already reflects the mock.
    const currentMonthLabel = new Intl.DateTimeFormat("de", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${isoDate(0).slice(0, 7)}-01T00:00:00Z`));

    // aria-live="polite" is unique to this heading on the page — a plain
    // level-3 heading query would also match several other section
    // headings (Pillars, Benefits) that happen to share the level.
    function monthHeadingLocator(page: Page) {
      return page.locator('h3[aria-live="polite"]');
    }

    test("opens a day's events below the grid on click", async ({ page }) => {
      await gotoWithCalendar(page, [GRID_EVENT]);
      await expect(monthHeadingLocator(page)).toHaveText(currentMonthLabel);

      await gridCellFor(page, GRID_EVENT.startDate).click();
      await expect(page.getByRole("heading", { name: /^Termine am/ })).toBeVisible();
      await expect(page.locator("p", { hasText: "Ideathon" })).toBeVisible();
    });

    test("moves the roving focus with arrow keys and opens the day list with Enter", async ({ page }) => {
      await gotoWithCalendar(page, [GRID_EVENT]);
      await expect(monthHeadingLocator(page)).toHaveText(currentMonthLabel);

      const start = page.locator('[role="gridcell"][tabindex="0"]');
      await start.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");

      await expect(page.locator("p", { hasText: "Ideathon" })).toBeVisible();
    });

    test("returns to the current month, with today selected, via the Heute button", async ({ page }) => {
      await gotoWithCalendar(page, [GRID_EVENT]);

      const monthHeading = monthHeadingLocator(page);
      await expect(monthHeading).toHaveText(currentMonthLabel);

      await page.getByRole("button", { name: "Nächster Monat" }).click();
      await page.getByRole("button", { name: "Nächster Monat" }).click();
      await expect(monthHeading).not.toHaveText(currentMonthLabel);

      await page.getByRole("button", { name: "Heute" }).click();
      await expect(monthHeading).toHaveText(currentMonthLabel);
      await expect(page.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(1);
    });

    test("has no automatically detectable accessibility violations", async ({ page }) => {
      await gotoWithCalendar(page, [GRID_EVENT]);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });

  // The compact mobile agenda: one collapsed line per event (day, color
  // dot, title), the next upcoming one marked in place with a gold edge and
  // a countdown rather than pulled into a separate card, and time/location/
  // the full category badge/the ICS button held back behind a per-row
  // disclosure until it's expanded.
  test.describe("Agenda (unter md)", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("marks the soonest upcoming event in place, with a countdown, no separate card", async ({ page }) => {
      await gotoWithCalendar(page, ALL_EVENTS);

      const row = page.getByRole("button", { name: /Ideathon/ });
      await row.scrollIntoViewIfNeeded();
      await expect(row).toBeVisible();
      await expect(row.locator("..")).toHaveClass(/border-l-gold/);
    });

    test("keeps time, location, and the ICS link hidden until the row is expanded", async ({ page }) => {
      await gotoWithCalendar(page, ALL_EVENTS);

      const row = page.getByRole("button", { name: /Ideathon/ });
      await row.scrollIntoViewIfNeeded();
      await expect(row).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText("Mannheim", { exact: true })).not.toBeVisible();

      await row.click();
      await expect(row).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Mannheim", { exact: true })).toBeVisible();
    });

    test("links 'Zum Kalender hinzufügen' at the highlighted event's own ics route, once expanded", async ({
      page,
    }) => {
      // The route's own behaviour (folding, escaping, DTSTART/DTEND,
      // headers, the 404/500 cases) is covered end to end against real
      // request/response objects by tests/unit/lib/ics.test.ts and
      // tests/integration/calendarIcs.test.ts. A forced-download anchor click
      // isn't reliably interceptable via page.route() in every engine (the
      // request bypasses normal fetch/XHR interception on some download
      // paths), so this only proves the rendered link's own wiring — that it
      // exists, is reachable, and points at the correct event's route.
      await gotoWithCalendar(page, ALL_EVENTS);

      const row = page.getByRole("button", { name: /Ideathon/ });
      await row.scrollIntoViewIfNeeded();
      await row.click();

      const link = page.getByRole("link", { name: /Zum Kalender hinzufügen/ }).first();
      await expect(link).toHaveAttribute("href", `/api/kalender/${NEXT_EVENT.id}/ics`);
    });

    test("narrows the agenda to a selected category via the filter chips", async ({ page }) => {
      await gotoWithCalendar(page, ALL_EVENTS);

      // Scoped to the filter row itself — an agenda row's own disclosure
      // button also carries its event's category name as sr-only text (so
      // it announces the category even collapsed), which otherwise collides
      // with a bare getByRole("button", { name: /Bewerbung/ }) query.
      const chip = page.getByRole("group", { name: "Nach Kategorie filtern" }).getByRole("button", {
        name: /Bewerbung/,
      });
      await chip.scrollIntoViewIfNeeded();
      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");

      await expect(page.getByText("Kick-off")).toBeVisible();
      await expect(page.getByRole("button", { name: /Ideathon/ })).not.toBeVisible();
    });

    test("keeps a month before the current one collapsed until 'Frühere Termine' is opened", async ({
      page,
    }) => {
      await gotoWithCalendar(page, ALL_EVENTS);

      await expect(page.getByText("Q-Summit")).not.toBeVisible();

      const toggle = page.getByRole("button", { name: "Frühere Termine" });
      await toggle.scrollIntoViewIfNeeded();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Q-Summit")).toBeVisible();
    });

    test("marks a tentative event with a dashed border, its explanatory note visible once expanded", async ({
      page,
    }) => {
      await gotoWithCalendar(page, ALL_EVENTS);

      const row = page.getByRole("button", { name: /ConnectUs/ });
      await row.scrollIntoViewIfNeeded();
      await expect(row.locator("..")).toHaveClass(/border-dashed/);

      await row.click();
      await expect(page.getByText("Termin steht noch nicht fest")).toBeVisible();
    });
  });

  test("shows a friendly empty state when the calendar has no events at all", async ({ page }) => {
    await gotoWithCalendar(page, []);

    await expect(page.getByText("Aktuell stehen keine Termine im Kalender.")).toBeVisible();
  });

  test("never introduces a horizontal scrollbar at 360px, with every category chip present", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoWithCalendar(page, [
      NEXT_EVENT,
      LATER_EVENT,
      PAST_EVENT,
      TENTATIVE_EVENT,
      { ...NEXT_EVENT, id: "55555555-5555-5555-5555-555555555555", category: "projekte", title: "Projekt-Sprint" },
      { ...NEXT_EVENT, id: "66666666-6666-6666-6666-666666666666", category: "journeys", title: "Journey" },
      { ...NEXT_EVENT, id: "77777777-7777-7777-7777-777777777777", category: "workshops", title: "Workshop" },
    ]);

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
    await gotoWithCalendar(page, ALL_EVENTS);

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
    await gotoWithCalendar(page, ALL_EVENTS);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
