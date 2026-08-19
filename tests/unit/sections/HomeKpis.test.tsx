import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { HomeKpis } from "@/components/sections/HomeKpis";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HomeKpis", () => {
  it("renders a small eyebrow instead of a headline — board feedback dropped the big title", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("In Zahlen")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders all five KPI labels in the requested order", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    const labels = screen
      .getAllByText(/Projektiterationen|Eingeworbenes Funding|Nationale Meistertitel|Weltweit|Gegründet\/Übergeben/)
      .map((el) => el.textContent);
    expect(labels).toEqual([
      "Projektiterationen",
      "Eingeworbenes Funding",
      "Nationale Meistertitel",
      "Weltweit",
      "Gegründet/Übergeben",
    ]);
  });

  it("renders the spin-off count with its unit word, not a bare digit", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("5 Projekte")).toBeInTheDocument();
  });

  it("renders the world-ranking figure with a 'Top' prefix and its field-size detail", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Top 16")).toBeInTheDocument();
    expect(screen.getByText("von über 1.000 Teams")).toBeInTheDocument();
  });

  it("renders a dedicated short field-size detail for narrow screens, complete rather than truncated", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    // Both strings render at once — a min-[375px]: CSS variant picks which
    // one is visible, not JavaScript — so this only asserts the short
    // string is a real, complete translation (not an ellipsis truncation
    // of the long one).
    expect(screen.getByText("von 1.000+ Teams")).toBeInTheDocument();
    expect(screen.queryByText(/…/)).not.toBeInTheDocument();
  });

  it("renders funding and project iterations as lower bounds", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    const funding = screen.getByText(/>150\.000/);
    expect(funding.textContent).toContain("€");
    expect(screen.getByText(">65")).toBeInTheDocument();
  });

  it("has no unverified figures left — every KPI is board-confirmed", () => {
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeKpis />);
    expect(container.querySelectorAll(".border-dotted")).toHaveLength(0);
  });

  it("no longer renders an as-of line — board feedback removed it from the page", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    expect(screen.queryByText(/Stand:/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeKpis />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the final value immediately, before any scroll — no JS or reduced motion would ever see anything else", () => {
    mockMatchMedia(false);
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Top 16")).toBeInTheDocument();
    expect(screen.getByText("5 Projekte")).toBeInTheDocument();
  });

  it("counts up from zero once the row scrolls into view, then settles back on the final value", () => {
    mockMatchMedia(false);
    const io = mockIntersectionObserver();
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    renderWithIntl(<HomeKpis />);

    expect(screen.getByText("8")).toBeInTheDocument();

    // Two separate act() calls, not one — the effect that schedules the
    // first requestAnimationFrame only runs once React commits `seen`'s
    // state update, and that commit doesn't happen until this act() call
    // returns. Advancing the fake clock inside the same call would advance
    // it before anything had actually scheduled a frame to fire.
    act(() => {
      io.intersect(true);
    });
    act(() => {
      vi.advanceTimersByTime(16);
    });
    // One frame after the intersection fires, the count is already back
    // near zero — the whole point being animated away from, not skipped.
    expect(screen.queryByText("8")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByText("8")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("never counts under prefers-reduced-motion — the final value never moves", () => {
    mockMatchMedia(true);
    const io = mockIntersectionObserver();
    renderWithIntl(<HomeKpis />);

    act(() => {
      io.intersect(true);
    });
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});
