import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { useMediaQuery } from "@/lib/useMediaQuery";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
  it("reflects the current match state on first render", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)"));
    expect(result.current).toBe(true);
  });

  it("updates live when the underlying media query changes, without a remount", () => {
    const { setMatches } = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)"));
    expect(result.current).toBe(false);
    act(() => setMatches(true));
    expect(result.current).toBe(true);
  });

  it("keeps working when the query string itself changes across a re-render", () => {
    mockMatchMedia(false);
    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: "(hover: hover)" },
    });
    expect(result.current).toBe(false);
    rerender({ query: "(pointer: fine)" });
    expect(result.current).toBe(false);
  });
});
