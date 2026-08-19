import { describe, expect, it } from "vitest";
import { jobPostingCreateSchema, jobPostingFormSchema } from "@/lib/jobPostingFormSchema";

// Relative to the real clock, comfortably clear of any timezone rounding at
// the day boundary — same reasoning as tests/e2e/calendar.spec.ts's isoDate.
function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const BASE = {
  company: "SZA",
  title: "Werkstudent Consulting",
  employmentType: "werkstudent" as const,
  remote: "hybrid" as const,
  applyUrl: "https://example.com/jobs/1",
  expiresAt: isoDate(30),
};

describe("jobPostingFormSchema", () => {
  it("accepts a minimal draft", () => {
    expect(jobPostingFormSchema.safeParse(BASE).success).toBe(true);
  });

  it("treats empty optional fields as absent, not as validation failures", () => {
    const result = jobPostingFormSchema.safeParse({
      ...BASE,
      location: "",
      description: "",
      partnerSlug: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBeUndefined();
      expect(result.data.partnerSlug).toBeUndefined();
    }
  });

  it("rejects a blank company", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, company: "   " }).success).toBe(false);
  });

  it("rejects a blank title", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, title: "   " }).success).toBe(false);
  });

  it("rejects an unknown employment type", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, employmentType: "vollzeit" }).success).toBe(false);
  });

  it("rejects an unknown remote option", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, remote: "irgendwo" }).success).toBe(false);
  });

  it("rejects a non-https apply URL", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, applyUrl: "http://example.com/jobs/1" }).success).toBe(false);
  });

  it("rejects a malformed apply URL", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, applyUrl: "not a url" }).success).toBe(false);
  });

  it("rejects a partner slug that doesn't exist in content/partners.ts", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, partnerSlug: "not-a-real-partner" }).success).toBe(false);
  });

  it("accepts a partner slug that exists in content/partners.ts", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, partnerSlug: "sza" }).success).toBe(true);
  });

  it("allows an expiry date in the past on the base (edit) schema", () => {
    expect(jobPostingFormSchema.safeParse({ ...BASE, expiresAt: isoDate(-10) }).success).toBe(true);
  });
});

describe("jobPostingCreateSchema", () => {
  it("accepts a future expiry date", () => {
    expect(jobPostingCreateSchema.safeParse(BASE).success).toBe(true);
  });

  it("accepts today as the expiry date", () => {
    expect(jobPostingCreateSchema.safeParse({ ...BASE, expiresAt: isoDate(0) }).success).toBe(true);
  });

  it("rejects an expiry date in the past", () => {
    expect(jobPostingCreateSchema.safeParse({ ...BASE, expiresAt: isoDate(-1) }).success).toBe(false);
  });
});
