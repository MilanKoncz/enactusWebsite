import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { RotatingText } from "@/components/motion/RotatingText";

const TIMING = { typingMs: 10, deletingMs: 5, holdMs: 20, pauseMs: 5 };

function visibleText(container: HTMLElement): string {
  const layer = container.querySelector('[aria-hidden="true"].whitespace-nowrap');
  return layer?.firstChild?.textContent ?? "";
}

describe("RotatingText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts empty and types the first term one character at a time", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);
    expect(visibleText(container)).toBe("");

    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs);
    });
    expect(visibleText(container)).toBe("A");

    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs);
    });
    expect(visibleText(container)).toBe("AB");
  });

  it("holds the fully typed term, then deletes it character by character", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);

    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs * 2); // fully typed: "AB"
    });
    expect(visibleText(container)).toBe("AB");

    act(() => {
      vi.advanceTimersByTime(TIMING.holdMs); // hold elapses, deleting starts
      vi.advanceTimersByTime(TIMING.deletingMs);
    });
    expect(visibleText(container)).toBe("A");

    act(() => {
      vi.advanceTimersByTime(TIMING.deletingMs);
    });
    expect(visibleText(container)).toBe("");
  });

  it("moves on to the next term after fully deleting the previous one", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);

    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs * 2); // type "AB"
      vi.advanceTimersByTime(TIMING.holdMs); // hold
      vi.advanceTimersByTime(TIMING.deletingMs * 2); // delete "AB"
      vi.advanceTimersByTime(TIMING.pauseMs); // pause before next term
      vi.advanceTimersByTime(TIMING.typingMs); // type first char of "CD"
    });
    expect(visibleText(container)).toBe("C");
  });

  it("never starts the typing loop when the user prefers reduced motion, showing the first term fully and statically", () => {
    mockMatchMedia(true);
    const { container } = render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);
    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs * 20);
    });
    expect(visibleText(container)).toBe("AB");
  });

  it("reserves one line's height from first paint, so typing never shifts layout vertically", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["A", "LONGEST"]} {...TIMING} />);
    expect(container.firstElementChild).toHaveClass("min-h-[1lh]");
  });

  it("never reserves a fixed width, so a short term sits centered instead of beside dead space", () => {
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["A", "LONGEST"]} {...TIMING} />);
    expect(container.querySelector(".invisible")).not.toBeInTheDocument();
  });

  it("hides the animated layers from assistive technology and exposes exactly one stable sentence instead", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);
    const srOnly = screen.getByText("AB", { selector: ".sr-only" });
    expect(srOnly).toBeInTheDocument();
  });

  it("keeps the screen-reader sentence on the first term even after rotating visually", () => {
    mockMatchMedia(false);
    render(<RotatingText terms={["AB", "CD"]} {...TIMING} />);
    act(() => {
      vi.advanceTimersByTime(TIMING.typingMs * 2 + TIMING.holdMs + TIMING.deletingMs * 2 + TIMING.pauseMs);
    });
    const srOnly = screen.getByText("AB", { selector: ".sr-only" });
    expect(srOnly).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    // axe relies on real timers internally; fake timers from the other
    // tests in this file would otherwise hang the await below forever.
    vi.useRealTimers();
    mockMatchMedia(false);
    const { container } = render(<RotatingText terms={["AB", "CD"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
