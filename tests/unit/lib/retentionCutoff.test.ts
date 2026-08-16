import { describe, expect, it } from "vitest";
import { applicationRetentionCutoff } from "@/lib/retentionCutoff";

describe("applicationRetentionCutoff", () => {
  it("returns null while the retention period hasn't elapsed since the window closed", () => {
    const closesAt = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2026-09-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, closesAt)).toBeNull();
  });

  it("returns the window's close date once 6 months have passed since it closed", () => {
    const closesAt = new Date("2026-09-13T21:59:00Z");
    const now = new Date("2027-03-14T00:00:00Z");
    expect(applicationRetentionCutoff(now, closesAt)).toEqual(closesAt);
  });

  it("returns null at exactly the moment the window closed, before any retention time passes", () => {
    const closesAt = new Date("2026-09-13T21:59:00Z");
    expect(applicationRetentionCutoff(closesAt, closesAt)).toBeNull();
  });

  it("returns the close date the instant 6 months have fully elapsed", () => {
    const closesAt = new Date("2026-09-13T21:59:00Z");
    const expiry = new Date("2027-03-13T21:59:00Z");
    expect(applicationRetentionCutoff(expiry, closesAt)).toEqual(closesAt);
  });

  it("falls back to a rolling now-minus-6-months cutoff when no window is scheduled", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    const cutoff = applicationRetentionCutoff(now, null);
    expect(cutoff).toEqual(new Date("2026-07-01T00:00:00Z"));
  });
});
