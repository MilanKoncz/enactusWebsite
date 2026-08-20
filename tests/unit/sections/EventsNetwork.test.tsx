import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { EventsNetwork } from "@/components/sections/EventsNetwork";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EventsNetwork", () => {
  it("renders the approximate Germany-wide figures with their qualifiers", () => {
    mockMatchMedia(false);
    renderWithIntl(<EventsNetwork />);
    expect(screen.getByText("rund 1.700")).toBeInTheDocument();
    expect(screen.getByText("über 24")).toBeInTheDocument();
  });

  it("renders the global country count as a plain figure, no qualifier", () => {
    mockMatchMedia(false);
    renderWithIntl(<EventsNetwork />);
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  // No separate "featured five" text-card grid above the map any more
  // (board feedback, 2026-08-20: singling five out read as if the other
  // eighteen-plus sibling teams weren't "strong" too) — the map alone
  // carries every sibling team now. Full link-by-link coverage lives in
  // GermanyMap.test.tsx; this just confirms the map actually renders here.
  it("renders the Germany map with every sibling team", () => {
    mockMatchMedia(false);
    renderWithIntl(<EventsNetwork />);
    expect(screen.getByRole("img", { name: /Karte der Enactus-Standorte in Deutschland/ })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockMatchMedia(false);
    const { container } = renderWithIntl(<EventsNetwork />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // Same shared mechanism as HomeKpis' five KPI tiles
  // (components/motion/AnimatedFigure.tsx), not a second implementation —
  // see that component's own test file for the pattern this mirrors.
  it("counts up from zero once the row scrolls into view, then settles back on the final value", () => {
    mockMatchMedia(false);
    const io = mockIntersectionObserver();
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    renderWithIntl(<EventsNetwork />);

    expect(screen.getByText("34")).toBeInTheDocument();

    act(() => {
      io.intersect(true);
    });
    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(screen.queryByText("34")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByText("34")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("never counts under prefers-reduced-motion — the final value never moves", () => {
    mockMatchMedia(true);
    const io = mockIntersectionObserver();
    renderWithIntl(<EventsNetwork />);

    act(() => {
      io.intersect(true);
    });
    expect(screen.getByText("rund 1.700")).toBeInTheDocument();
    expect(screen.getByText("über 24")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
  });
});
