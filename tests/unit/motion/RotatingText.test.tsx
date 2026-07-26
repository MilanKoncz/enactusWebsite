import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { RotatingText } from "@/components/motion/RotatingText";

// jsdom doesn't implement matchMedia. This stands in for it, with a
// `setMatches` escape hatch to simulate the user toggling their OS-level
// reduced-motion preference mid-session.
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", () => mediaQueryList);

  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}

describe("RotatingText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the first term visibly on first render", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} />);
    const terms = screen.getAllByText("BEGRIFF_1");
    const visibleTerm = terms.find((el) => el.getAttribute("aria-hidden") === "true");
    expect(visibleTerm).toHaveClass("opacity-100");
  });

  it("rotates to the next term after the interval elapses", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} intervalMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("BEGRIFF_2")).toHaveClass("opacity-100");
  });

  it("wraps back to the first term after the last one", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} intervalMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const terms = screen.getAllByText("BEGRIFF_1");
    const visibleTerm = terms.find((el) => el.getAttribute("aria-hidden") === "true");
    expect(visibleTerm).toHaveClass("opacity-100");
  });

  it("never rotates when the user prefers reduced motion", () => {
    mockMatchMedia(true);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} intervalMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("BEGRIFF_2")).toHaveClass("opacity-0");
    const terms = screen.getAllByText("BEGRIFF_1");
    const visibleTerm = terms.find((el) => el.getAttribute("aria-hidden") === "true");
    expect(visibleTerm).toHaveClass("opacity-100");
  });

  it("hides the rotating terms from assistive technology and exposes exactly one stable sentence instead", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} />);
    const hiddenTerms = screen
      .getAllByText(/^BEGRIFF_/)
      .filter((el) => el.getAttribute("aria-hidden") === "true");
    expect(hiddenTerms).toHaveLength(2);

    const srOnly = screen.getAllByText("BEGRIFF_1").find((el) => el.className.includes("sr-only"));
    expect(srOnly).toBeInTheDocument();
  });

  it("keeps the screen-reader sentence on the first term even after rotating visually", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} intervalMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const srOnly = screen.getAllByText("BEGRIFF_1").find((el) => el.className.includes("sr-only"));
    expect(srOnly).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    // axe relies on real timers internally; fake timers from the other
    // tests in this file would otherwise hang the await below forever.
    vi.useRealTimers();
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["BEGRIFF_1", "BEGRIFF_2"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
