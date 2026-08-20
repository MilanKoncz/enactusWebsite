import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { HeroLogoConfetti } from "@/components/motion/HeroLogoConfetti";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Easter egg 2/7 (docs/eastereggs.md). jsdom has no real Canvas 2D context,
 * so these stop at "does a burst mount" — the canvas element appears
 * synchronously from the click handler's own setState, before its child
 * effect ever runs, so that much is reliable here regardless. The actual
 * particle animation and its cleanup were verified by hand in a real
 * browser.
 */
describe("HeroLogoConfetti", () => {
  it("triggers a confetti burst on the third click within the window", () => {
    mockMatchMedia(false);
    const { container } = render(<HeroLogoConfetti />);
    const logo = container.querySelector("img")!;

    fireEvent.click(logo.closest("span")!);
    fireEvent.click(logo.closest("span")!);
    expect(container.querySelector("canvas")).not.toBeInTheDocument();

    fireEvent.click(logo.closest("span")!);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("resets the count if the third click comes more than two seconds after the first", () => {
    mockMatchMedia(false);
    const dateSpy = vi.spyOn(Date, "now");
    const { container } = render(<HeroLogoConfetti />);
    const wrapper = container.querySelector("img")!.closest("span")!;

    dateSpy.mockReturnValue(0);
    fireEvent.click(wrapper);
    dateSpy.mockReturnValue(500);
    fireEvent.click(wrapper);
    dateSpy.mockReturnValue(3000); // > 2000ms after the first click
    fireEvent.click(wrapper);

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    dateSpy.mockRestore();
  });

  it("never triggers a burst under prefers-reduced-motion, even after three clicks", () => {
    mockMatchMedia(true);
    const { container } = render(<HeroLogoConfetti />);
    const wrapper = container.querySelector("img")!.closest("span")!;

    fireEvent.click(wrapper);
    fireEvent.click(wrapper);
    fireEvent.click(wrapper);

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("keeps the logo a plain image — no button role, no added tab stop", () => {
    mockMatchMedia(false);
    const { container } = render(<HeroLogoConfetti />);
    const logo = container.querySelector("img")!;
    expect(logo.closest("span")).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

/**
 * Easter egg 6/7 (docs/eastereggs.md). Local-time Date constructor overload
 * (new Date(year, month, day, hour)), not an ISO string — it builds the
 * Date directly in whatever timezone the test runner's process is actually
 * in, so `.getHours()` always reads back the intended hour regardless of
 * CI/local TZ, rather than depending on a UTC offset guess.
 */
describe("HeroLogoConfetti night mode", () => {
  function setLocalHour(hour: number) {
    vi.setSystemTime(new Date(2026, 7, 20, hour, 0, 0));
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a zzZ sequence once mounted between 22:00 and 06:00 local time", () => {
    setLocalHour(23);
    mockMatchMedia(false);
    const { container } = render(<HeroLogoConfetti surface="ink" />);

    expect(container.querySelector("img")!.closest("span")).toHaveTextContent("zZz");
  });

  it("shows nothing during the day", () => {
    setLocalHour(14);
    mockMatchMedia(false);
    const { container } = render(<HeroLogoConfetti surface="ink" />);

    expect(container.querySelector("img")!.closest("span")).not.toHaveTextContent("zZz");
  });

  it("never shows the zzZ under prefers-reduced-motion, even at a night hour", () => {
    setLocalHour(2);
    mockMatchMedia(true);
    const { container } = render(<HeroLogoConfetti surface="ink" />);

    expect(container.querySelector("img")!.closest("span")).not.toHaveTextContent("zZz");
  });

  it("never affects the logo image itself — no button role, no added tab stop, even at night", () => {
    setLocalHour(23);
    mockMatchMedia(false);
    const { container } = render(<HeroLogoConfetti surface="ink" />);
    const logo = container.querySelector("img")!;

    expect(logo.closest("span")).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
