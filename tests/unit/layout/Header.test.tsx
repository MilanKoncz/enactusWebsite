import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { mockPathname } from "../../fixtures/navigation";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { Header } from "@/components/layout/Header";
import { HeaderSurfaceContext } from "@/components/layout/HeaderSurface";

vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Header", () => {
  it("exposes a banner landmark containing the home link, nav, CTA and locale switch", () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Zur Startseite" })).toBeInTheDocument();
    expect(within(banner).getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "Mitmachen" })).toBeInTheDocument();
    expect(within(banner).getByRole("group", { name: "Sprache wechseln" })).toBeInTheDocument();
  });

  it("shows the WhatsApp and Instagram icon links without outranking the Mitmachen CTA", () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    const banner = screen.getByRole("banner");
    const socialGroup = within(banner).getByRole("group", { name: "Social Media" });
    expect(within(socialGroup).getByRole("link", { name: /WhatsApp-Community/ })).toBeInTheDocument();
    expect(within(socialGroup).getByRole("link", { name: /Instagram/ })).toBeInTheDocument();
    // The CTA stays a real <Button>-styled link, the social icons carry no
    // visible text at all — that visual weight difference is the point.
    expect(within(banner).getByRole("link", { name: "Mitmachen" })).toBeInTheDocument();
  });

  it("is not compact initially", () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
  });

  it("sets data-compact when the sentinel leaves the viewport", () => {
    mockMatchMedia(false);
    const io = mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    act(() => io.intersect(false));
    expect(screen.getByRole("banner")).toHaveAttribute("data-compact", "true");
  });

  it("clears data-compact when the sentinel returns to the viewport", () => {
    mockMatchMedia(false);
    const io = mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    act(() => io.intersect(false));
    act(() => io.intersect(true));
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
  });

  it("has no accessibility violations with the mobile menu closed", async () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    const { container } = renderWithIntl(<Header />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stays solid by default, outside any HeaderSurfaceProvider", () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-surface");
  });

  it("switches to the ink surface (transparent, gold focus ring) when overlaid", () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(
      <HeaderSurfaceContext.Provider value={{ overlaid: true, setOverlaid: vi.fn() }}>
        <Header />
      </HeaderSurfaceContext.Provider>,
    );
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-surface", "ink");
    expect(banner).toHaveClass("bg-transparent");
  });

  it("has no accessibility violations while overlaid", async () => {
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    const { container } = renderWithIntl(
      <HeaderSurfaceContext.Provider value={{ overlaid: true, setOverlaid: vi.fn() }}>
        <Header />
      </HeaderSurfaceContext.Provider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

/**
 * Easter egg 6/7 (docs/eastereggs.md) — moved here from the homepage hero
 * so it's visible on every page, not just /. Local-time Date constructor
 * overload (new Date(year, month, day, hour)), not an ISO string — it
 * builds the Date directly in whatever timezone the test runner's process
 * is actually in, so `.getHours()` always reads back the intended hour
 * regardless of CI/local TZ.
 */
describe("Header night mode", () => {
  function setLocalHour(hour: number) {
    vi.setSystemTime(new Date(2026, 7, 20, hour, 0, 0));
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a zzZ sequence beside the header logo between 22:00 and 06:00 local time", () => {
    setLocalHour(23);
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);

    expect(screen.getByRole("banner")).toHaveTextContent("zZz");
  });

  it("shows nothing during the day", () => {
    setLocalHour(14);
    mockMatchMedia(false);
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);

    expect(screen.getByRole("banner")).not.toHaveTextContent("zZz");
  });
});
