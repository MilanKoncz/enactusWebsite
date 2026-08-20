import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { mockPathname, nextNavigationMock } from "../../fixtures/navigation";
import { EightBitEasterEgg } from "@/components/motion/EightBitEasterEgg";

vi.mock("next/navigation", () => nextNavigationMock);

const MIN_HIDDEN_MS = 5_000;
const MAX_HIDDEN_MS = 15_000;
const TRANSITION_MS = 1_000;
const ACTIVE_DURATION_MS = 60_000;

// Math.random is mocked to a constant 0.5 below, so every call to the
// component's randomBetween(min, max) resolves to the exact midpoint —
// the hidden-phase delay is always MIN_HIDDEN_MS + 0.5*(MAX_HIDDEN_MS -
// MIN_HIDDEN_MS) = 50_000ms. Advancing by MAX_HIDDEN_MS instead would
// overshoot: it also clears the subsequent (mocked) peek-phase delay in
// the same tick, completing a full hidden -> peek -> hidden cycle and
// landing back on "not peeking" — the bug that made every test below
// initially fail against the real component.
const MOCKED_HIDDEN_DELAY_MS = MIN_HIDDEN_MS + 0.5 * (MAX_HIDDEN_MS - MIN_HIDDEN_MS);

const PEEK_NAME = "8-Bit-Modus aktivieren";
const OFF_SWITCH_NAME = "8-Bit-Modus beenden";

function attr() {
  return document.documentElement.dataset.eightBit;
}

function renderEgg(locale: "de" | "en" = "de") {
  return renderWithIntl(<EightBitEasterEgg />, { locale });
}

function peekButton() {
  return screen.getByRole("button", { name: PEEK_NAME });
}

// Every setTimeout callback in the component drives a React state update,
// which vi.advanceTimersByTime alone won't flush into the DOM before the
// next assertion runs — act() is what forces that flush.
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  mockPathname.mockReturnValue("/");
  vi.useFakeTimers();
  // Deterministic mid-range timing for every random() call in the
  // component (both the peek cycle's delays and its horizontal position).
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  delete document.documentElement.dataset.eightBit;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Easter egg 3/7 (docs/eastereggs.md). Covers the timing state machine;
 * the CSS layer it drives (globals.css's html[data-eight-bit] rules) was
 * verified by hand in a real browser (Playwright), including the actual
 * computed font-family/border-radius/box-shadow/image-rendering and the
 * exact contrast-verified palette.
 */
describe("EightBitEasterEgg", () => {
  it("renders no peek button at all on an excluded route", () => {
    mockMatchMedia(false);
    mockPathname.mockReturnValue("/impressum");
    renderEgg();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders no peek button under the admin route", () => {
    mockMatchMedia(false);
    mockPathname.mockReturnValue("/admin/bewerbungen");
    renderEgg();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("never starts the peek cycle under prefers-reduced-motion — clicking does nothing even after a long wait", () => {
    mockMatchMedia(true);
    renderEgg();
    advance(MAX_HIDDEN_MS * 2);
    fireEvent.click(peekButton());
    expect(attr()).toBeUndefined();
  });

  it("ignores a click before the peek window has opened", () => {
    mockMatchMedia(false);
    renderEgg();
    advance(MIN_HIDDEN_MS - 100);
    fireEvent.click(peekButton());
    expect(attr()).toBeUndefined();
  });

  it("enters the mode on click once peeking, transitions, then goes active", () => {
    mockMatchMedia(false);
    renderEgg();
    advance(MOCKED_HIDDEN_DELAY_MS); // guarantees the peek window has opened
    fireEvent.click(peekButton());
    expect(attr()).toBe("entering");

    advance(TRANSITION_MS);
    expect(attr()).toBe("active");
  });

  it("auto-exits 60 seconds after becoming active, via the exiting transition", () => {
    mockMatchMedia(false);
    renderEgg();
    advance(MOCKED_HIDDEN_DELAY_MS);
    fireEvent.click(peekButton());
    advance(TRANSITION_MS);
    expect(attr()).toBe("active");

    advance(ACTIVE_DURATION_MS);
    expect(attr()).toBe("exiting");

    advance(TRANSITION_MS);
    expect(attr()).toBeUndefined();
  });

  it("exits early on Escape while active", () => {
    mockMatchMedia(false);
    renderEgg();
    advance(MOCKED_HIDDEN_DELAY_MS);
    fireEvent.click(peekButton());
    advance(TRANSITION_MS);
    expect(attr()).toBe("active");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(attr()).toBe("exiting");
    advance(TRANSITION_MS);
    expect(attr()).toBeUndefined();
  });

  it("exits early via the visible off-switch while active, which is a normal tab stop", () => {
    mockMatchMedia(false);
    renderEgg();
    advance(MOCKED_HIDDEN_DELAY_MS);
    fireEvent.click(peekButton());
    advance(TRANSITION_MS);

    const offSwitch = screen.getByRole("button", { name: OFF_SWITCH_NAME });
    expect(offSwitch).not.toHaveAttribute("tabindex");
    fireEvent.click(offSwitch);
    expect(attr()).toBe("exiting");
  });

  it("never lets the mode survive a pathname change — resets immediately, no transition", () => {
    mockMatchMedia(false);
    const { rerender } = renderEgg();
    advance(MOCKED_HIDDEN_DELAY_MS);
    fireEvent.click(peekButton());
    advance(TRANSITION_MS);
    expect(attr()).toBe("active");

    mockPathname.mockReturnValue("/projekte");
    rerender(<EightBitEasterEgg />);
    expect(attr()).toBeUndefined();
  });

  it("keeps the peek button out of the tab order (tabIndex -1) while giving it an accessible name", () => {
    mockMatchMedia(false);
    renderEgg();
    const button = peekButton();
    expect(button).toHaveAttribute("tabindex", "-1");
    expect(button).toHaveAccessibleName();
  });

  it("gives the peek button an English name on the English locale", () => {
    mockMatchMedia(false);
    renderEgg("en");
    expect(screen.getByRole("button", { name: "Activate 8-bit mode" })).toBeInTheDocument();
  });
});
