import { describe, expect, it } from "vitest";
import { jobPostingCreateSchema, jobPostingFormSchema } from "@/lib/jobPostingFormSchema";
import { SITE_TIMEZONE } from "@/content/timezone";

// Relative to the real clock, formatted in the same timezone
// jobPostingFormSchema.ts's own todayInSiteTimezone() validates against —
// not UTC (the bug this replaced): Berlin runs two hours ahead of UTC in
// summer, so isoDate(0) computed via toISOString().slice(0, 10) named
// "today" as still-yesterday for the two hours a day (22:00-24:00 UTC)
// where Berlin's calendar date has already turned over. setUTCDate's
// day-arithmetic itself is fine (adding N whole days is timezone-agnostic);
// only the final formatting step needs to happen in SITE_TIMEZONE, exactly
// like the schema's own check.
function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(date);
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
