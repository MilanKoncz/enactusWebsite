import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { SecretPartyConfetti } from "@/components/motion/SecretPartyConfetti";

const BURST_INTERVAL_MS = 4000;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Easter egg 7/7 (docs/eastereggs.md). jsdom has no real Canvas 2D context,
 * so these stop at "does a burst mount", same limit HeroLogoConfetti.test.tsx
 * documents for the same reason — the actual particle animation was
 * verified by hand in a real browser.
 */
describe("SecretPartyConfetti", () => {
  it("bursts once shortly after mount, then again every few seconds", () => {
    mockMatchMedia(false);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setInterval", "clearInterval"] });
    const { container } = render(<SecretPartyConfetti />);

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(16); // the deferred first-burst rAF fires
    });
    expect(container.querySelector("canvas")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(BURST_INTERVAL_MS);
    });
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("never bursts under prefers-reduced-motion, even after a long wait", () => {
    mockMatchMedia(true);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setInterval", "clearInterval"] });
    const { container } = render(<SecretPartyConfetti />);

    act(() => {
      vi.advanceTimersByTime(BURST_INTERVAL_MS * 3);
    });
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("stops scheduling further bursts once unmounted", () => {
    mockMatchMedia(false);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setInterval", "clearInterval"] });
    const { unmount } = render(<SecretPartyConfetti />);
    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(BURST_INTERVAL_MS * 3);
      });
    }).not.toThrow();
  });
});
