import { describe, expect, it } from "vitest";
import { recruitingPhaseAt } from "@/lib/recruitingStatus";
import { recruitingWindow } from "@/content/recruiting";

const opensMs = new Date(recruitingWindow.opensAt!).getTime();
const closesMs = new Date(recruitingWindow.closesAt!).getTime();

describe("recruitingPhaseAt", () => {
  it("is 'before' any moment ahead of the opening time", () => {
    expect(recruitingPhaseAt(opensMs - 1)).toBe("before");
    expect(recruitingPhaseAt(0)).toBe("before");
  });

  it("is 'open' at the exact opening moment and anywhere inside the window", () => {
    expect(recruitingPhaseAt(opensMs)).toBe("open");
    expect(recruitingPhaseAt((opensMs + closesMs) / 2)).toBe("open");
  });

  it("is 'open' at the exact closing moment", () => {
    expect(recruitingPhaseAt(closesMs)).toBe("open");
  });

  it("is 'after' once the closing moment has passed", () => {
    expect(recruitingPhaseAt(closesMs + 1)).toBe("after");
  });
});
