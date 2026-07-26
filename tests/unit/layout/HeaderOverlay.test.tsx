import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { HeaderSurfaceProvider, useHeaderSurface } from "@/components/layout/HeaderSurface";
import { HeaderOverlay } from "@/components/layout/HeaderOverlay";
import { mockIntersectionObserver } from "../../fixtures/observers";

function OverlaidProbe() {
  const { overlaid } = useHeaderSurface();
  return <p>{overlaid ? "overlaid" : "solid"}</p>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HeaderOverlay", () => {
  it("sets overlaid once the sentinel is observed as intersecting", () => {
    const io = mockIntersectionObserver();
    render(
      <HeaderSurfaceProvider>
        <HeaderOverlay />
        <OverlaidProbe />
      </HeaderSurfaceProvider>,
    );
    act(() => io.intersect(true));
    expect(screen.getByText("overlaid")).toBeInTheDocument();
  });

  it("clears overlaid once the sentinel scrolls past the header", () => {
    const io = mockIntersectionObserver();
    render(
      <HeaderSurfaceProvider>
        <HeaderOverlay />
        <OverlaidProbe />
      </HeaderSurfaceProvider>,
    );
    act(() => io.intersect(true));
    act(() => io.intersect(false));
    expect(screen.getByText("solid")).toBeInTheDocument();
  });

  it("resets to solid on unmount", () => {
    const io = mockIntersectionObserver();
    const { unmount } = render(
      <HeaderSurfaceProvider>
        <HeaderOverlay />
        <OverlaidProbe />
      </HeaderSurfaceProvider>,
    );
    act(() => io.intersect(true));
    expect(screen.getByText("overlaid")).toBeInTheDocument();
    unmount();
    render(
      <HeaderSurfaceProvider>
        <OverlaidProbe />
      </HeaderSurfaceProvider>,
    );
    expect(screen.getByText("solid")).toBeInTheDocument();
  });

  it("hides the sentinel from assistive technology", () => {
    mockIntersectionObserver();
    const { container } = render(
      <HeaderSurfaceProvider>
        <HeaderOverlay />
      </HeaderSurfaceProvider>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
