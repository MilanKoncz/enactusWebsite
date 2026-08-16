import { describe, expect, it } from "vitest";
import { applicationRetentionCutoff } from "@/lib/retentionCutoff";

describe("applicationRetentionCutoff", () => {
  it("returns null while the retention period hasn't elapsed since the window closed", () => {
    const end = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2026-09-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, [end])).toBeNull();
  });

  it("returns the window's close date once 6 months have passed since it closed", () => {
    const end = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2027-03-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, [end])).toEqual(end);
  });

  it("returns null at exactly the moment the window closed, before any retention time passes", () => {
    const end = new Date("2026-09-13T21:59:00Z");
    expect(applicationRetentionCutoff(end, [end])).toBeNull();
  });

  it("returns the close date the instant 6 months have fully elapsed", () => {
    const end = new Date("2026-09-13T21:59:00Z");
    const expiry = new Date("2027-03-13T21:59:00Z");
    expect(applicationRetentionCutoff(expiry, [end])).toEqual(end);
  });

  it("falls back to a rolling now-minus-6-months cutoff when no window is scheduled", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    const cutoff = applicationRetentionCutoff(now, []);
    expect(cutoff).toEqual(new Date("2026-07-01T00:00:00Z"));
  });

  it("picks the latest expired window's end when several cycles have closed", () => {
    const older = new Date("2026-03-01T00:00:00Z");
    const newer = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2027-03-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, [older, newer])).toEqual(newer);
  });

  it("ignores a more recent window whose own retention hasn't elapsed yet", () => {
    const longExpired = new Date("2025-01-01T00:00:00Z");
    const notYetExpired = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2026-09-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, [longExpired, notYetExpired])).toEqual(longExpired);
  });

  it("ignores a window that hasn't closed yet, or lies in the future", () => {
    const future = new Date("2099-01-01T00:00:00Z");
    const now = new Date("2027-01-01T00:00:00Z");
    expect(applicationRetentionCutoff(now, [future])).toBeNull();
  });
});
