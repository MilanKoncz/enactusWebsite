import { describe, expect, it } from "vitest";
import { privacyReviewStatus, privacyReviewStatusSchema } from "@/content/privacy";

describe("content/privacy", () => {
  // Flipped back to draft on 2026-08-25 pending Datenschutzberater sign-off
  // on the new Ideathon signup section (content/privacy.ts's own comment).
  it("is currently a draft, awaiting sign-off on the Ideathon section", () => {
    expect(privacyReviewStatus).toEqual({ reviewed: false, reviewedAt: null });
  });

  it("validates the exported status", () => {
    expect(() => privacyReviewStatusSchema.parse(privacyReviewStatus)).not.toThrow();
  });

  it("accepts a reviewed status with a date", () => {
    expect(() =>
      privacyReviewStatusSchema.parse({ reviewed: true, reviewedAt: "2026-09-01" }),
    ).not.toThrow();
  });

  it("rejects a reviewed status without a review date", () => {
    expect(() => privacyReviewStatusSchema.parse({ reviewed: true, reviewedAt: null })).toThrow();
  });

  it("accepts an unreviewed status with no date", () => {
    expect(() =>
      privacyReviewStatusSchema.parse({ reviewed: false, reviewedAt: null }),
    ).not.toThrow();
  });
});
