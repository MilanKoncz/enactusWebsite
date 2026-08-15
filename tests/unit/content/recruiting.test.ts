import { describe, expect, it } from "vitest";
import { recruitingWindow, recruitingWindowSchema } from "@/content/recruiting";

describe("content/recruiting", () => {
  it("has the confirmed application window in Europe/Berlin", () => {
    expect(recruitingWindow).toEqual({
      opensAt: "2026-09-01T00:00:00+02:00",
      closesAt: "2026-09-13T23:59:00+02:00",
      timezone: "Europe/Berlin",
    });
  });

  it("validates the exported window", () => {
    expect(() => recruitingWindowSchema.parse(recruitingWindow)).not.toThrow();
  });

  it("accepts a window where closesAt is after opensAt", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        opensAt: "2026-09-01T00:00:00+02:00",
        closesAt: "2026-09-30T23:59:00+02:00",
        timezone: "Europe/Berlin",
      }),
    ).not.toThrow();
  });

  it("rejects a window where closesAt is before or equal to opensAt", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        opensAt: "2026-09-30T00:00:00+02:00",
        closesAt: "2026-09-01T00:00:00+02:00",
        timezone: "Europe/Berlin",
      }),
    ).toThrow();
    expect(() =>
      recruitingWindowSchema.parse({
        opensAt: "2026-09-01T00:00:00+02:00",
        closesAt: "2026-09-01T00:00:00+02:00",
        timezone: "Europe/Berlin",
      }),
    ).toThrow();
  });

  it("rejects a malformed or offset-less datetime string", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        opensAt: "01.09.2026",
        closesAt: null,
        timezone: "Europe/Berlin",
      }),
    ).toThrow();
    expect(() =>
      recruitingWindowSchema.parse({
        opensAt: "2026-09-01T00:00:00",
        closesAt: null,
        timezone: "Europe/Berlin",
      }),
    ).toThrow();
  });
});
