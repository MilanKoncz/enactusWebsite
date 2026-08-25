import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventAgenda } from "@/components/sections/EventAgenda";
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
    internalLink: null,
    ...overrides,
  };
}

describe("EventAgenda", () => {
  beforeEach(() => {
    useNowMock.mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("collapses a row to its day, color dot, and title until it's expanded", () => {
    const events = [
      event({
        startDate: "2026-09-17",
        title: "Ideathon",
        category: "innolab",
        startTime: "18:00",
        location: "Mannheim",
      }),
    ];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

    expect(screen.getByText("Ideathon")).toBeInTheDocument();
    expect(screen.queryByText("18:00")).not.toBeInTheDocument();
    expect(screen.queryByText("Mannheim")).not.toBeInTheDocument();
  });

  it("reveals time, location, the full category badge, and the ICS button once expanded", async () => {
    const user = userEvent.setup();
    const events = [
      event({
        startDate: "2026-09-17",
        title: "Ideathon",
        category: "innolab",
        startTime: "18:00",
        location: "Mannheim",
      }),
    ];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

    const toggle = screen.getByRole("button", { name: /Ideathon/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("Mannheim")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zum Kalender hinzufügen/ })).toBeInTheDocument();
  });

  it("names the category on the collapsed row's own accessible name, not only by color", () => {
    const events = [event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" })];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

    expect(screen.getByRole("button", { name: /InnoLab/ })).toBeInTheDocument();
  });

  it("highlights the next upcoming event in place, with a countdown, instead of a separate card", () => {
    const events = [
      event({ startDate: "2026-09-06", title: "Tomorrow event" }),
      event({ startDate: "2026-09-17", title: "Later event" }),
    ];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

    const highlightedRow = screen.getByRole("button", { name: /Tomorrow event/ }).closest("li")!;
    expect(highlightedRow).toHaveClass("border-l-gold");
    expect(screen.getByText("morgen")).toBeInTheDocument();

    const laterRow = screen.getByRole("button", { name: /Later event/ }).closest("li")!;
    expect(laterRow).not.toHaveClass("border-l-gold");
  });

  it("shows only the date, never a countdown, before the clock has mounted", () => {
    useNowMock.mockReturnValue(0);
    const events = [event({ startDate: "2026-09-06", title: "Tomorrow event" })];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);
    expect(screen.queryByText("morgen")).not.toBeInTheDocument();
  });

  it("marks a tentative event with a dashed border and, once expanded, its explanatory note", async () => {
    const user = userEvent.setup();
    const events = [event({ startDate: "2026-09-17", title: "ConnectUs", tentative: true })];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

    const row = screen.getByRole("button", { name: /ConnectUs/ }).closest("li")!;
    expect(row).toHaveClass("border-dashed", "border-gold");

    await user.click(screen.getByRole("button", { name: /ConnectUs/ }));
    expect(screen.getByText("Termin steht noch nicht fest")).toBeInTheDocument();
  });

  it("collapses a month entirely before the current one behind 'Frühere Termine'", async () => {
    const user = userEvent.setup();
    const events = [
      event({ startDate: "2026-08-01", title: "August event" }),
      event({ startDate: "2026-09-17", title: "September event" }),
    ];
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);

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
    renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);
    expect(screen.getByText("Early this month")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const events = [
      event({ startDate: "2026-09-17", title: "Ideathon", category: "innolab" }),
      event({ startDate: "2026-09-20", title: "Kick-off", category: "bewerbung", tentative: true }),
    ];
    const { container } = renderWithIntl(<EventAgenda events={events} initialNowMs={NOW} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
