import { describe, expect, it } from "vitest";
import { isExpiredJobPosting } from "@/lib/jobPostingStatus";

// A fixed instant, not the real clock — SITE_TIMEZONE (Europe/Berlin) is
// ahead of UTC, so this also exercises the timezone conversion, not just
// plain string comparison.
const NOON_UTC_ON_2026_09_15 = new Date("2026-09-15T12:00:00Z").getTime();

describe("isExpiredJobPosting", () => {
  it("is not expired when expires_at is today", () => {
    expect(isExpiredJobPosting("2026-09-15", NOON_UTC_ON_2026_09_15)).toBe(false);
  });

  it("is not expired when expires_at is in the future", () => {
    expect(isExpiredJobPosting("2026-09-16", NOON_UTC_ON_2026_09_15)).toBe(false);
  });

  it("is expired when expires_at is in the past", () => {
    expect(isExpiredJobPosting("2026-09-14", NOON_UTC_ON_2026_09_15)).toBe(true);
  });
});
