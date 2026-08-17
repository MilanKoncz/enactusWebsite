import { describe, expect, it } from "vitest";
import { recruitingWindowSchema } from "@/content/recruiting";

describe("content/recruiting", () => {
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

  it("accepts HWS or FSS followed by a two-digit year", () => {
    for (const semester of ["HWS26", "FSS27", "HWS99", "FSS00"]) {
      expect(() =>
        recruitingWindowSchema.parse({
          semester,
          start: "2026-09-01T00:00:00+02:00",
          end: "2026-09-13T23:59:00+02:00",
        }),
      ).not.toThrow();
    }
  });

  it("rejects a semester label that isn't HWS or FSS plus two digits", () => {
    for (const semester of ["", "HWS", "HWS2026", "WS26", "hws26", "HWS26 "]) {
      expect(() =>
        recruitingWindowSchema.parse({
          semester,
          start: "2026-09-01T00:00:00+02:00",
          end: "2026-09-13T23:59:00+02:00",
        }),
      ).toThrow();
    }
  });
});
