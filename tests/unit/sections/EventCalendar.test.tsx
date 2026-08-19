import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventCalendar } from "@/components/sections/EventCalendar";
import type { CalendarEvent } from "@/content/calendar";

/**
 * The shell only: the section heading, the empty states, and the category
 * filter chips shared by both views (the month grid and the agenda list).
 * Each view's own rendering — the grid's cells and day list, the agenda's
 * rows and highlighted event — is covered in its own test file
 * (EventCalendarGrid.test.tsx, EventAgenda.test.tsx).
 */

// Midday Berlin time on 2026-09-05 — well clear of any midnight boundary.
const NOW = new Date("2026-09-05T10:00:00Z").getTime();

let nextId = 0;

function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate" | "title">): CalendarEvent {
  nextId += 1;
  return {
    id: `00000000-0000-0000-0000-${String(nextId).padStart(12, "0")}`,
    titleEn: null,
    category: "socials",
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    descriptionEn: null,
    tentative: false,
    ...overrides,
  };
}

// Scoped to the filter row itself — an agenda row's own disclosure button
// also carries its event's category name as sr-only text (so it announces
// the category even collapsed), which would otherwise collide with a bare
// getByRole("button", { name: /InnoLab/ }) query against the whole page.
function filterChips() {
  return within(screen.getByRole("group", { name: "Nach Kategorie filtern" }));
}

describe("EventCalendar", () => {
  beforeEach(() => {
    // The component re-fetches its own data on mount (GET
    // /api/calendar-events) — rejecting it here keeps every test on the
    // `events` prop it explicitly passes in, same arrangement as
    // MitmachenApplication.test.tsx.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network in tests")));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a friendly empty state when there are no events at all", () => {
    renderWithIntl(<EventCalendar events={[]} initialNowMs={NOW} />);
    expect(screen.getByText("Aktuell stehen keine Termine im Kalender.")).toBeInTheDocument();
  });

  it("only shows a filter chip for categories that actually have an event", () => {
    const events = [event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    expect(filterChips().getByRole("button", { name: /InnoLab/ })).toBeInTheDocument();
    expect(filterChips().queryByRole("button", { name: /Wettkämpfe/ })).not.toBeInTheDocument();
  });

  it("narrows the visible events to the selected category and back once deselected", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung" }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    const chip = filterChips().getByRole("button", { name: /InnoLab/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    // getAllByText, not getByText — the month grid's own title-bearing bars
    // (ab lg) render the same event titles the agenda list does, and both
    // views exist in the DOM at once regardless of which the test's
    // viewport-less jsdom environment would actually show.
    expect(screen.getAllByText("Ideathon").length).toBeGreaterThan(0);
    expect(screen.queryByText("Kick-off")).not.toBeInTheDocument();

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText("Kick-off").length).toBeGreaterThan(0);
  });

  it("selecting every visible category is equivalent to selecting none — a union, not an intersection", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung" }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    await user.click(filterChips().getByRole("button", { name: /InnoLab/ }));
    await user.click(filterChips().getByRole("button", { name: /Bewerbung/ }));

    expect(screen.getAllByText("Ideathon").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kick-off").length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung", tentative: true }),
    ];
    const { container } = renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
