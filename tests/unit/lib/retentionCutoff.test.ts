import { describe, expect, it } from "vitest";
import type { RecruitingWindow } from "@/content/recruiting";
import {
  applicationRetainUntil,
  contactMessageRetentionCutoff,
  ideathonSignupRetentionCutoff,
  reminderSignupRetentionCutoff,
  rateLimitHitRetentionCutoff,
} from "@/lib/retentionCutoff";

function window(overrides: Partial<RecruitingWindow> = {}): RecruitingWindow {
  return {
    semester: "HWS26",
    start: "2026-09-01T00:00:00+02:00",
    end: "2026-09-13T23:59:00+02:00",
    ...overrides,
  };
}

describe("applicationRetainUntil", () => {
  it("anchors to the open window's end, plus 6 months, when a window is open", () => {
    const now = new Date("2026-09-05T10:00:00Z"); // inside window()
    expect(applicationRetainUntil(now, [window()])).toEqual(new Date("2027-03-13T21:59:00Z"));
  });

  it("falls back to now plus 6 months when no window is open", () => {
    const now = new Date("2026-01-01T00:00:00Z"); // before window() even starts
    expect(applicationRetainUntil(now, [window()])).toEqual(new Date("2026-07-01T00:00:00Z"));
  });

  it("falls back to now plus 6 months when there is no window at all", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(applicationRetainUntil(now, [])).toEqual(new Date("2026-07-01T00:00:00Z"));
  });

  it("two submissions in two different windows get two different deadlines", () => {
    const windows = [window({ semester: "HWS26" }), window({ semester: "FSS27", start: "2027-02-01T00:00:00+01:00", end: "2027-02-14T23:59:00+01:00" })];
    const first = applicationRetainUntil(new Date("2026-09-05T10:00:00Z"), windows);
    const second = applicationRetainUntil(new Date("2027-02-05T10:00:00Z"), windows);
    expect(first).not.toEqual(second);
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

describe("ideathonSignupRetentionCutoff", () => {
  it("returns now minus 6 months", () => {
    const now = new Date("2027-03-14T00:00:00Z");
    expect(ideathonSignupRetentionCutoff(now)).toEqual(new Date("2026-09-14T00:00:00Z"));
  });
});
