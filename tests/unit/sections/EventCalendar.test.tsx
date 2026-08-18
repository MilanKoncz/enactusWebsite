import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventCalendar } from "@/components/sections/EventCalendar";
import type { CalendarEvent } from "@/content/calendar";

const useNowMock = vi.fn();
vi.mock("@/lib/useNow", () => ({ useNow: (...args: unknown[]) => useNowMock(...args) }));

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

describe("EventCalendar", () => {
  beforeEach(() => {
    // The component re-fetches its own data on mount (GET
    // /api/calendar-events) — rejecting it here keeps every test on the
    // `events` prop it explicitly passes in, same arrangement as
    // MitmachenApplication.test.tsx.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network in tests")));
    useNowMock.mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a friendly empty state when there are no events at all", () => {
    renderWithIntl(<EventCalendar events={[]} initialNowMs={NOW} />);
    expect(screen.getByText("Aktuell stehen keine Termine im Kalender.")).toBeInTheDocument();
  });

  it("highlights the next upcoming event with its title, date, and category", () => {
    const events = [event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    expect(screen.getByRole("heading", { name: "Ideathon" })).toBeInTheDocument();
    expect(screen.getByText("17. September 2026")).toBeInTheDocument();
    expect(screen.getAllByText("InnoLab").length).toBeGreaterThan(0);
  });

  it("shows the countdown phrase once the real clock is available", () => {
    const events = [event({ startDate: "2026-09-17", title: "Ideathon" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);
    expect(screen.getByText("in 12 Tagen")).toBeInTheDocument();
  });

  it("shows only the date, never a countdown, before the clock has mounted", () => {
    useNowMock.mockReturnValue(0);
    const events = [event({ startDate: "2026-09-17", title: "Ideathon" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    expect(screen.getByText("17. September 2026")).toBeInTheDocument();
    expect(screen.queryByText("in 12 Tagen")).not.toBeInTheDocument();
  });

  it("reads today and tomorrow as words, not as a day count", () => {
    const events = [
      event({ startDate: "2026-09-05", title: "Today event" }),
      event({ startDate: "2026-09-06", title: "Tomorrow event" }),
    ];
    const { unmount } = renderWithIntl(<EventCalendar events={[events[0]]} initialNowMs={NOW} />);
    expect(screen.getByText("heute")).toBeInTheDocument();
    unmount();

    renderWithIntl(<EventCalendar events={[events[1]]} initialNowMs={NOW} />);
    expect(screen.getByText("morgen")).toBeInTheDocument();
  });

  it("marks a tentative event with a dashed border and its explanatory note", () => {
    const events = [
      event({ startDate: "2026-09-17", title: "ConnectUs", category: "socials", tentative: true }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);
    expect(screen.getAllByText("Termin steht noch nicht fest").length).toBeGreaterThan(0);
  });

  it("only shows a filter chip for categories that actually have an event", () => {
    const events = [event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    expect(screen.getByRole("button", { name: /InnoLab/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Wettkämpfe/ })).not.toBeInTheDocument();
  });

  it("narrows the agenda to the selected category and back once deselected", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung" }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    const chip = screen.getByRole("button", { name: /InnoLab/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Ideathon" })).toBeInTheDocument();
    expect(screen.queryByText("Kick-off")).not.toBeInTheDocument();

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Kick-off")).toBeInTheDocument();
  });

  it("selecting every visible category is equivalent to selecting none — a union, not an intersection", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung" }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    await user.click(screen.getByRole("button", { name: /InnoLab/ }));
    await user.click(screen.getByRole("button", { name: /Bewerbung/ }));

    expect(screen.getByText("Ideathon")).toBeInTheDocument();
    expect(screen.getByText("Kick-off")).toBeInTheDocument();
  });

  it("collapses a month entirely before the current one behind 'Frühere Termine'", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-08-01", title: "August event" }),
      event({ startDate: "2026-09-17", title: "September event" }),
    ];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);

    expect(screen.getByText("September event")).toBeInTheDocument();
    expect(screen.queryByText("August event")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Frühere Termine" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("August event")).toBeInTheDocument();
  });

  it("keeps an already-past event visible in the current month, only dimmed", () => {
    // today is 2026-09-05 — an event on the 1st is individually past but
    // still part of the current month's default view.
    const events = [event({ startDate: "2026-09-01", title: "Early this month" })];
    renderWithIntl(<EventCalendar events={events} initialNowMs={NOW} />);
    expect(screen.getByText("Early this month")).toBeInTheDocument();
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
