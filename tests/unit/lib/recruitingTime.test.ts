import { describe, expect, it } from "vitest";
import { instantToWallClock, wallClockToInstant } from "@/lib/recruitingTime";

describe("wallClockToInstant", () => {
  it("reads a summer wall clock as CEST (+02:00), not as UTC", () => {
    // 2026-09-01 00:00 in Berlin is 2026-08-31 22:00 UTC.
    expect(wallClockToInstant("2026-09-01T00:00").toISOString()).toBe("2026-08-31T22:00:00.000Z");
  });

  it("reads a winter wall clock as CET (+01:00)", () => {
    expect(wallClockToInstant("2027-01-15T12:00").toISOString()).toBe("2027-01-15T11:00:00.000Z");
  });

  it("uses the offset in force at that date, not a fixed one", () => {
    const summer = wallClockToInstant("2026-07-01T12:00");
    const winter = wallClockToInstant("2026-12-01T12:00");
    expect(summer.toISOString()).toBe("2026-07-01T10:00:00.000Z");
    expect(winter.toISOString()).toBe("2026-12-01T11:00:00.000Z");
  });

  it("handles the instant right after the spring-forward transition", () => {
    // Germany springs forward 2027-03-28 02:00 -> 03:00 local.
    expect(wallClockToInstant("2027-03-28T03:00").toISOString()).toBe("2027-03-28T01:00:00.000Z");
  });

  it("handles the autumn fall-back date without drifting a day", () => {
    expect(wallClockToInstant("2026-10-25T12:00").toISOString()).toBe("2026-10-25T11:00:00.000Z");
  });

  it("ignores the host machine's own timezone", () => {
    // Asserted by passing an explicit zone that is not the host's: the
    // result must follow the argument, never process.env.TZ.
    expect(wallClockToInstant("2026-09-01T00:00", "UTC").toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(wallClockToInstant("2026-09-01T00:00", "America/New_York").toISOString()).toBe(
      "2026-09-01T04:00:00.000Z",
    );
  });
});

describe("instantToWallClock", () => {
  it("is the inverse of wallClockToInstant in summer", () => {
    const wall = "2026-09-13T23:59";
    expect(instantToWallClock(wallClockToInstant(wall))).toBe(wall);
  });

  it("is the inverse of wallClockToInstant in winter", () => {
    const wall = "2027-02-01T08:30";
    expect(instantToWallClock(wallClockToInstant(wall))).toBe(wall);
  });

  it("formats an instant as the Berlin wall clock a board member would recognise", () => {
    expect(instantToWallClock(new Date("2026-08-31T22:00:00.000Z"))).toBe("2026-09-01T00:00");
  });
});
