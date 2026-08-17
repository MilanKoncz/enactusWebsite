import { describe, expect, it } from "vitest";
import {
  applicationRetentionCutoff,
  contactMessageRetentionCutoff,
  reminderSignupRetentionCutoff,
  rateLimitHitRetentionCutoff,
} from "@/lib/retentionCutoff";

describe("applicationRetentionCutoff", () => {
  it("returns now minus 6 months", () => {
    const now = new Date("2027-03-14T00:00:00Z");
    expect(applicationRetentionCutoff(now)).toEqual(new Date("2026-09-14T00:00:00Z"));
  });

  it("recomputes on every call — no anchor to a recruiting window", () => {
    const before = new Date("2026-01-01T00:00:00Z");
    const after = new Date("2027-01-01T00:00:00Z");
    expect(applicationRetentionCutoff(before)).not.toEqual(applicationRetentionCutoff(after));
  });
});

describe("contactMessageRetentionCutoff", () => {
  it("returns now minus 12 months", () => {
    const now = new Date("2027-03-14T00:00:00Z");
    expect(contactMessageRetentionCutoff(now)).toEqual(new Date("2026-03-14T00:00:00Z"));
  });
});

describe("reminderSignupRetentionCutoff", () => {
  it("returns now minus 30 days", () => {
    const now = new Date("2027-03-14T00:00:00Z");
    expect(reminderSignupRetentionCutoff(now)).toEqual(new Date("2027-02-12T00:00:00Z"));
  });
});

describe("rateLimitHitRetentionCutoff", () => {
  it("returns now minus 1 day", () => {
    const now = new Date("2027-03-14T00:00:00Z");
    expect(rateLimitHitRetentionCutoff(now)).toEqual(new Date("2027-03-13T00:00:00Z"));
  });
});
