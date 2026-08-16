import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeaderSurfaceProviderClient } from "@/components/HeaderSurfaceProviderClient";
import { useHeaderSurface } from "@/components/layout/HeaderSurface";

const usePathname = vi.hoisted(() => vi.fn<() => string>());

// next-intl's usePathname, not next/navigation's — that distinction is the
// whole point of the component, so the mock has to sit on the same module it
// actually imports from.
vi.mock("@/lib/navigation", () => ({ usePathname }));

function Probe() {
  const { overlaid } = useHeaderSurface();
  return <span>{overlaid ? "overlaid" : "solid"}</span>;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("HeaderSurfaceProviderClient", () => {
  // next-intl's usePathname strips the locale prefix, so both the German and
  // the English homepage arrive here as "/". Anything else and the German
  // route paints a solid header first and corrects itself after hydration.
  it("starts overlaid on the homepage, in either locale", () => {
    usePathname.mockReturnValue("/");
    render(
      <HeaderSurfaceProviderClient>
        <Probe />
      </HeaderSurfaceProviderClient>,
    );
    expect(screen.getByText("overlaid")).toBeInTheDocument();
  });

  it("starts solid on every other route", () => {
    for (const path of ["/projekte", "/kontakt", "/prozess", "/mitmachen"]) {
      usePathname.mockReturnValue(path);
      const { unmount } = render(
        <HeaderSurfaceProviderClient>
          <Probe />
        </HeaderSurfaceProviderClient>,
      );
      expect(screen.getByText("solid"), path).toBeInTheDocument();
      unmount();
    }
  });

  // A locale-prefixed path reaching this component at all would mean the
  // wrong usePathname was imported again.
  it("does not treat a locale-prefixed homepage path as the homepage", () => {
    usePathname.mockReturnValue("/de");
    render(
      <HeaderSurfaceProviderClient>
        <Probe />
      </HeaderSurfaceProviderClient>,
    );
    expect(screen.getByText("solid")).toBeInTheDocument();
  });
});
