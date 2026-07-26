import { vi } from "vitest";

/**
 * jsdom has no matchMedia. Stands in for it, with a `setMatches` escape
 * hatch to simulate the user toggling an OS-level media preference (e.g.
 * prefers-reduced-motion) mid-session. Install inside the tests that need
 * it and call vi.unstubAllGlobals() in an afterEach — same convention as
 * mockIntersectionObserver in observers.ts.
 */
export function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", () => mediaQueryList);

  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}
