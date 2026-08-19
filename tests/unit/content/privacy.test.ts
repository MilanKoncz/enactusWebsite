import { describe, expect, it } from "vitest";
import { privacyReviewStatus, privacyReviewStatusSchema } from "@/content/privacy";

describe("content/privacy", () => {
  it("is reviewed, with a review date", () => {
    expect(privacyReviewStatus).toEqual({ reviewed: true, reviewedAt: "2026-08-19" });
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
