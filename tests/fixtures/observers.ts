import { vi } from "vitest";

/**
 * jsdom has no IntersectionObserver. Install this INSIDE the tests that need
 * it (mirroring the userEvent.setup()-per-test convention), and call
 * vi.unstubAllGlobals() in an afterEach — a globally-stubbed IO in
 * tests/setup.ts would silently disable real behavior for every other test
 * that happens to render something using it.
 */
export function mockIntersectionObserver() {
  const instances = new Set<{
    callback: IntersectionObserverCallback;
    element: Element;
  }>();

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(private callback: IntersectionObserverCallback) {}

    observe(element: Element) {
      instances.add({ callback: this.callback, element });
    }

    unobserve(element: Element) {
      for (const instance of instances) {
        if (instance.element === element) instances.delete(instance);
      }
    }

    disconnect() {
      instances.clear();
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    /** Fires every registered observer's callback with the given intersection state. */
    intersect(isIntersecting: boolean) {
      for (const { callback, element } of instances) {
        callback(
          [{ isIntersecting, target: element } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      }
    },
  };
}
