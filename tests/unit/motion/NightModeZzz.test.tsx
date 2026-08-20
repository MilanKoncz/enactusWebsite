import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { NightModeZzz } from "@/components/motion/NightModeZzz";

/**
 * Easter egg 6/7 (docs/eastereggs.md). Local-time Date constructor overload
 * (new Date(year, month, day, hour)), not an ISO string — it builds the
 * Date directly in whatever timezone the test runner's process is actually
 * in, so `.getHours()` always reads back the intended hour regardless of
 * CI/local TZ, rather than depending on a UTC offset guess.
 */
describe("NightModeZzz", () => {
  function setLocalHour(hour: number) {
    vi.setSystemTime(new Date(2026, 7, 20, hour, 0, 0));
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders a zzZ sequence once mounted between 22:00 and 06:00 local time", () => {
    setLocalHour(23);
    mockMatchMedia(false);
    const { container } = render(<NightModeZzz surface="ink" />);

    expect(container).toHaveTextContent("zZz");
  });

  it("renders nothing during the day", () => {
    setLocalHour(14);
    mockMatchMedia(false);
    const { container } = render(<NightModeZzz surface="ink" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing under prefers-reduced-motion, even at a night hour", () => {
    setLocalHour(2);
    mockMatchMedia(true);
    const { container } = render(<NightModeZzz surface="ink" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("is purely decorative — aria-hidden, no role, no tab stop", () => {
    setLocalHour(23);
    mockMatchMedia(false);
    const { container } = render(<NightModeZzz surface="ink" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
