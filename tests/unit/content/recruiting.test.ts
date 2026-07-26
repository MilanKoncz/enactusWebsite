import { describe, expect, it } from "vitest";
import { recruitingWindow, recruitingWindowSchema } from "@/content/recruiting";

describe("content/recruiting", () => {
  it("leaves the application window unset until the board schedules it", () => {
    expect(recruitingWindow).toEqual({ opensAt: null, closesAt: null });
  });

  it("validates the exported window", () => {
    expect(() => recruitingWindowSchema.parse(recruitingWindow)).not.toThrow();
  });

  it("accepts a window where closesAt is after opensAt", () => {
    expect(() =>
      recruitingWindowSchema.parse({ opensAt: "2026-09-01", closesAt: "2026-09-30" }),
    ).not.toThrow();
  });

  it("rejects a window where closesAt is before or equal to opensAt", () => {
    expect(() =>
      recruitingWindowSchema.parse({ opensAt: "2026-09-30", closesAt: "2026-09-01" }),
    ).toThrow();
    expect(() =>
      recruitingWindowSchema.parse({ opensAt: "2026-09-01", closesAt: "2026-09-01" }),
    ).toThrow();
  });

  it("rejects a malformed date string", () => {
    expect(() =>
      recruitingWindowSchema.parse({ opensAt: "01.09.2026", closesAt: null }),
    ).toThrow();
  });
});
