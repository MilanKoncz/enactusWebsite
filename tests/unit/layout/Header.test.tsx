import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
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
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Zur Startseite" })).toBeInTheDocument();
    expect(within(banner).getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "Mitmachen" })).toBeInTheDocument();
    expect(within(banner).getByRole("group", { name: "Sprache wechseln" })).toBeInTheDocument();
  });

  it("is not compact initially", () => {
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
  });

  it("sets data-compact when the sentinel leaves the viewport", () => {
    const io = mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    act(() => io.intersect(false));
    expect(screen.getByRole("banner")).toHaveAttribute("data-compact", "true");
  });

  it("clears data-compact when the sentinel returns to the viewport", () => {
    const io = mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    act(() => io.intersect(false));
    act(() => io.intersect(true));
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
  });

  it("has no accessibility violations with the mobile menu closed", async () => {
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    const { container } = renderWithIntl(<Header />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stays solid by default, outside any HeaderSurfaceProvider", () => {
    mockIntersectionObserver();
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Header />);
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-surface");
  });

  it("switches to the ink surface (transparent, gold focus ring) when overlaid", () => {
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
