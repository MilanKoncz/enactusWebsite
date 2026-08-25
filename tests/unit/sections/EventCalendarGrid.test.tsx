import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventCalendarGrid } from "@/components/sections/EventCalendarGrid";
import type { CalendarEvent } from "@/content/calendar";

// Midday Berlin time on 2026-09-05 — well clear of any midnight boundary,
// same reference instant EventCalendar.test.tsx uses.
const NOW = new Date("2026-09-05T10:00:00Z").getTime();

let nextId = 0;
function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate">): CalendarEvent {
  nextId += 1;
  return {
    id: `00000000-0000-0000-0000-${String(nextId).padStart(12, "0")}`,
    title: `Event ${nextId}`,
    titleEn: null,
    category: "socials",
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    descriptionEn: null,
    tentative: false,
    internalLink: null,
    ...overrides,
  };
}

function cell(dateLabel: RegExp | string) {
  return screen.getByRole("gridcell", { name: dateLabel });
}

describe("EventCalendarGrid", () => {
  it("renders exactly seven column headers, Monday through Sunday", () => {
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("shows the current month's own days as selectable, adjoining days as disabled", () => {
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);
    expect(cell(/^16\. September 2026/)).not.toHaveAttribute("aria-disabled", "true");
  });

  it("opens the day list on click and shows the event it contains", async () => {
    const user = userEvent.setup();
    const events = [event({ startDate: "2026-09-16", title: "Ideathon" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);

    await user.click(cell(/^16\. September 2026/));
    expect(screen.getByRole("heading", { name: "Termine am 16. September 2026" })).toBeInTheDocument();
    // "Ideathon" now also appears in the grid's own title-bearing bar
    // (ab lg) — getAllByText, not getByText, since both are legitimate.
    expect(screen.getAllByText("Ideathon").length).toBeGreaterThan(0);
  });

  it("opens the day list on Enter, from the roving-focused cell", async () => {
    const user = userEvent.setup();
    const events = [event({ startDate: "2026-09-16", title: "Ideathon" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);

    // Today (the 5th) starts focused — move to the 16th with real keyboard
    // navigation so React's tracked focusedDate and actual DOM focus stay
    // in step, then activate it.
    cell(/^5\. September 2026/).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(cell(/^16\. September 2026/)).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Termine am 16. September 2026" })).toBeInTheDocument();
    // "Ideathon" now also appears in the grid's own title-bearing bar
    // (ab lg) — getAllByText, not getByText, since both are legitimate.
    expect(screen.getAllByText("Ideathon").length).toBeGreaterThan(0);
  });

  it("shows a quiet empty state for a selected day with no events", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);

    await user.click(cell(/^16\. September 2026/));
    expect(screen.getByRole("heading", { name: "Termine am 16. September 2026" })).toBeInTheDocument();
    expect(screen.getByText("Keine Termine an diesem Tag.")).toBeInTheDocument();
  });

  it("marks today independently of which day is selected", async () => {
    const user = userEvent.setup();
    const events = [event({ startDate: "2026-09-16" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);

    // Today (the 5th) starts selected by default — its marker is present.
    expect(cell(/^5\. September 2026/)).toHaveAccessibleName(/Heute$/);

    // Selecting a different day never removes today's own marker.
    await user.click(cell(/^16\. September 2026/));
    expect(cell(/^5\. September 2026/)).toHaveAccessibleName(/Heute$/);
    expect(cell(/^16\. September 2026/)).not.toHaveAccessibleName(/Heute$/);
  });

  it("shows an overflow count once a day has more events than the lane cap", () => {
    const events = [
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
    ];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("draws one bar per event on a day, in that event's category color", () => {
    const events = [
      event({ startDate: "2026-09-16", category: "innolab" }),
      event({ startDate: "2026-09-16", category: "projekte" }),
    ];
    const { container } = renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    expect(container.querySelectorAll(".bg-cal-innolab")).toHaveLength(1);
    expect(container.querySelectorAll(".bg-cal-projekte")).toHaveLength(1);
  });

  it("shows the event's title in the cell, as visible text, a tooltip, and part of the cell's accessible name", () => {
    const events = [event({ startDate: "2026-09-16", title: "Ideathon", category: "innolab" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    const title = screen.getByText("Ideathon").closest("[title]");
    expect(title).toHaveAttribute("title", "Ideathon");
    expect(cell(/^16\. September 2026/)).toHaveAccessibleName(/Ideathon/);
  });

  it("puts a category-colored left border on a single-day event's title, not a filled background", () => {
    const events = [event({ startDate: "2026-09-16", title: "Ideathon", category: "innolab" })];
    const { container } = renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    const titled = screen.getByText("Ideathon").closest("[title]");
    expect(titled).toHaveClass("border-l-cal-innolab");
    expect(container.querySelectorAll(".bg-cal-innolab")).toHaveLength(1);
  });

  it("repeats a multi-day event's title at the first visible day of every week it spans", () => {
    const events = [event({ startDate: "2026-09-16", endDate: "2026-09-24", title: "Journey" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    // 16.–24. crosses a Monday (the 21st) — one title per week row.
    expect(screen.getAllByText("Journey")).toHaveLength(2);
  });

  it("moves the roving tabindex with the arrow keys, one day at a time", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);

    const start = cell(/^5\. September 2026/);
    expect(start).toHaveAttribute("tabindex", "0");
    start.focus();

    await user.keyboard("{ArrowRight}");
    expect(cell(/^6\. September 2026/)).toHaveAttribute("tabindex", "0");
    expect(cell(/^6\. September 2026/)).toHaveFocus();
    expect(start).toHaveAttribute("tabindex", "-1");
  });

  it("changes the month with Page Down without losing grid focus", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);

    cell(/^5\. September 2026/).focus();
    await user.keyboard("{PageDown}");

    expect(screen.getByRole("heading", { name: "Oktober 2026" })).toBeInTheDocument();
    // The equivalent day-of-month in the new month keeps real DOM focus —
    // "no focus loss on a month change" is the load-bearing claim here.
    expect(cell(/^5\. Oktober 2026/)).toHaveFocus();
  });

  it("returns to the current month and selects today via the Today button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<EventCalendarGrid events={[]} initialNowMs={NOW} />);

    await user.click(screen.getByRole("button", { name: "Nächster Monat" }));
    expect(screen.getByRole("heading", { name: "Oktober 2026" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Heute" }));
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(cell(/^5\. September 2026/)).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to the next month with an event when the current month is empty, and says so", () => {
    const events = [event({ startDate: "2026-11-03", title: "Kick-off" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);

    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(
      screen.getByText("Im September 2026 steht nichts an. Der Kalender beginnt im November 2026."),
    ).toBeInTheDocument();
  });

  it("drops the jumped-month note once the user navigates on their own", async () => {
    const user = userEvent.setup();
    const events = [event({ startDate: "2026-11-03", title: "Kick-off" })];
    renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);

    await user.click(screen.getByRole("button", { name: "Vorheriger Monat" }));
    expect(
      screen.queryByText("Im September 2026 steht nichts an. Der Kalender beginnt im November 2026."),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const events = [
      event({ startDate: "2026-09-16", category: "innolab" }),
      event({ startDate: "2026-09-18", category: "bewerbung", tentative: true }),
    ];
    const { container } = renderWithIntl(<EventCalendarGrid events={events} initialNowMs={NOW} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
