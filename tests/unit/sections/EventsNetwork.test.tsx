import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { EventsNetwork } from "@/components/sections/EventsNetwork";
import { teamLinks } from "@/content/network";

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

  // Two links per team now, not one: the text LinkCard and the map's
  // overlay link (GermanyMap.tsx) — both real, both pointing at the same
  // URL, since the map is a supplement to the text links, not a
  // replacement (docs/content-guide.md-style redundancy for pointer-free
  // navigation).
  it("links every sibling team to its confirmed URL in a new tab, from both the text list and the map", () => {
    mockMatchMedia(false);
    renderWithIntl(<EventsNetwork />);
    for (const team of teamLinks) {
      const links = screen.getAllByRole("link", { name: new RegExp(team.name) });
      expect(links).toHaveLength(2);
      for (const link of links) {
        expect(link).toHaveAttribute("href", team.url!);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      }
    }
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
