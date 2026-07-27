import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockResizeObserver } from "../../fixtures/observers";
import { ProximityGroup } from "@/components/motion/ProximityGroup";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";

// ProximityGroup asks two independent questions (reduced motion, hover
// capability) that must be able to disagree in a single test — the shared
// mockMatchMedia fixture answers every query with the same one value, which
// can't express that. This stub differentiates by query string instead.
function stubMatchMedia(answers: Record<string, boolean>) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: answers[query] ?? false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderGroup() {
  return render(
    <ProximityGroup className="grid">
      <div data-testid="card-a">A</div>
      <div data-testid="card-b">B</div>
    </ProximityGroup>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProximityGroup", () => {
  it("never touches --proximity on a coarse/imprecise pointer, even without reduced motion", async () => {
    stubMatchMedia({ [REDUCED_MOTION_QUERY]: false, [HOVER_CAPABLE_QUERY]: false });
    const { getByTestId } = renderGroup();
    getByTestId("card-a").dispatchEvent(
      new window.PointerEvent("pointermove", { clientX: 10, clientY: 10, bubbles: true }),
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(getByTestId("card-a").style.getPropertyValue("--proximity")).toBe("");
    expect(getByTestId("card-b").style.getPropertyValue("--proximity")).toBe("");
  });

  it("never touches --proximity under reduced motion, even on a fine pointer", async () => {
    stubMatchMedia({ [REDUCED_MOTION_QUERY]: true, [HOVER_CAPABLE_QUERY]: true });
    mockResizeObserver();
    const { getByTestId } = renderGroup();
    getByTestId("card-a").dispatchEvent(
      new window.PointerEvent("pointermove", { clientX: 10, clientY: 10, bubbles: true }),
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(getByTestId("card-a").style.getPropertyValue("--proximity")).toBe("");
    expect(getByTestId("card-b").style.getPropertyValue("--proximity")).toBe("");
  });

  it("writes --proximity via a style property, not a re-render, when a fine pointer moves", async () => {
    stubMatchMedia({ [REDUCED_MOTION_QUERY]: false, [HOVER_CAPABLE_QUERY]: true });
    mockResizeObserver();
    const { getByTestId } = renderGroup();
    const group = getByTestId("card-a").parentElement!;
    group.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
    for (const el of [getByTestId("card-a"), getByTestId("card-b")]) {
      el.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }) as DOMRect;
    }

    group.dispatchEvent(new window.PointerEvent("pointermove", { clientX: 10, clientY: 10, bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(getByTestId("card-a").style.getPropertyValue("--proximity")).not.toBe("");
  });

  it("removes its listener and clears --proximity on unmount", async () => {
    stubMatchMedia({ [REDUCED_MOTION_QUERY]: false, [HOVER_CAPABLE_QUERY]: true });
    mockResizeObserver();
    const { getByTestId, unmount } = renderGroup();
    const group = getByTestId("card-a").parentElement!;
    group.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
    for (const el of [getByTestId("card-a"), getByTestId("card-b")]) {
      el.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }) as DOMRect;
    }
    group.dispatchEvent(new window.PointerEvent("pointermove", { clientX: 10, clientY: 10, bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const cardA = getByTestId("card-a");
    expect(cardA.style.getPropertyValue("--proximity")).not.toBe("");

    // Captured before unmount: React detaches the node from the document,
    // but the object itself (and whatever the effect's cleanup wrote to it)
    // is still inspectable directly.
    unmount();
    expect(cardA.style.getPropertyValue("--proximity")).toBe("");
  });
});
