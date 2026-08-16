import { describe, expect, it } from "vitest";
import { recruitingWindows, recruitingWindowSchema } from "@/content/recruiting";

describe("content/recruiting", () => {
  it("has the confirmed HWS26 application window in Europe/Berlin", () => {
    expect(recruitingWindows).toEqual([
      { semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" },
    ]);
  });

  it("validates every exported window", () => {
    for (const window of recruitingWindows) {
      expect(() => recruitingWindowSchema.parse(window)).not.toThrow();
    }
  });

  it("accepts a window where end is after start", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "HWS26",
        start: "2026-09-01T00:00:00+02:00",
        end: "2026-09-30T23:59:00+02:00",
      }),
    ).not.toThrow();
  });

  it("rejects a window where end is before or equal to start", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "HWS26",
        start: "2026-09-30T00:00:00+02:00",
        end: "2026-09-01T00:00:00+02:00",
      }),
    ).toThrow();
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "HWS26",
        start: "2026-09-01T00:00:00+02:00",
        end: "2026-09-01T00:00:00+02:00",
      }),
    ).toThrow();
  });

  it("rejects a malformed or offset-less datetime string", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "HWS26",
        start: "01.09.2026",
        end: "2026-09-13T23:59:00+02:00",
      }),
    ).toThrow();
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "HWS26",
        start: "2026-09-01T00:00:00",
        end: "2026-09-13T23:59:00+02:00",
      }),
    ).toThrow();
  });

  it("rejects a window with an empty semester label", () => {
    expect(() =>
      recruitingWindowSchema.parse({
        semester: "",
        start: "2026-09-01T00:00:00+02:00",
        end: "2026-09-13T23:59:00+02:00",
      }),
    ).toThrow();
  });
});
