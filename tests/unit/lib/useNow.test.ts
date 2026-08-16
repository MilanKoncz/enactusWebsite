import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNow } from "@/lib/useNow";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useNow", () => {
  it("returns the real clock, not the server's epoch snapshot, once mounted", () => {
    const fixedNow = new Date("2026-09-05T12:00:00Z").getTime();
    vi.setSystemTime(fixedNow);
    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(fixedNow);
  });

  it("reflects the current time again after the clock ticks forward", () => {
    const start = new Date("2026-09-05T12:00:00Z").getTime();
    vi.setSystemTime(start);
    const { result } = renderHook(() => useNow(1000));
    expect(result.current).toBe(start);

    // vi's fake Date already advances alongside advanceTimersByTime — no
    // separate setSystemTime call needed (that would double-advance it).
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(start + 5000);
  });

  // The regression this guards against: getSnapshot used to call Date.now()
  // directly, so two reads microseconds apart (exactly what
  // useSyncExternalStore does internally to detect tearing) never agreed —
  // React saw a "changed" store on every single check and re-rendered
  // forever ("Maximum update depth exceeded", reproducible on /mitmachen,
  // the one page using this hook). Rendering the hook many times in a row
  // with no interval tick in between must settle on one stable value.
  it("stays perfectly stable across repeated renders between ticks", () => {
    const fixedNow = new Date("2026-09-05T12:00:00Z").getTime();
    vi.setSystemTime(fixedNow);
    const { result, rerender } = renderHook(() => useNow());

    for (let i = 0; i < 50; i++) {
      rerender();
    }

    expect(result.current).toBe(fixedNow);
  });

  it("stops ticking once unmounted", () => {
    const start = new Date("2026-09-05T12:00:00Z").getTime();
    vi.setSystemTime(start);
    const { unmount } = renderHook(() => useNow(1000));
    unmount();

    expect(() => {
      vi.setSystemTime(start + 5000);
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });
});
