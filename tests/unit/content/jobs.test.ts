import { describe, expect, it } from "vitest";
import { EMPLOYMENT_TYPES, REMOTE_OPTIONS, employmentTypeSchema, jobPostingSchema, remoteOptionSchema } from "@/content/jobs";

const BASE_JOB = {
  id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
  company: "SZA",
  title: "Werkstudent Consulting",
  employmentType: "werkstudent" as const,
  location: null,
  remote: "hybrid" as const,
  description: null,
  applyUrl: "https://example.com/jobs/1",
  expiresAt: "2026-12-01",
  partnerSlug: null,
};

describe("content/jobs", () => {
  it("keeps the four employment types in the documented, fixed order", () => {
    expect(EMPLOYMENT_TYPES).toEqual(["praktikum", "werkstudent", "abschlussarbeit", "einstieg"]);
  });

  it("keeps the three remote options in the documented, fixed order", () => {
    expect(REMOTE_OPTIONS).toEqual(["vor_ort", "hybrid", "remote"]);
  });

  it("accepts every documented employment type", () => {
    for (const type of EMPLOYMENT_TYPES) {
      expect(() => employmentTypeSchema.parse(type)).not.toThrow();
    }
  });

  it("rejects an employment type outside the fixed set", () => {
    expect(() => employmentTypeSchema.parse("vollzeit")).toThrow();
  });

  it("accepts every documented remote option", () => {
    for (const option of REMOTE_OPTIONS) {
      expect(() => remoteOptionSchema.parse(option)).not.toThrow();
    }
  });

  it("rejects a remote option outside the fixed set", () => {
    expect(() => remoteOptionSchema.parse("irgendwo")).toThrow();
  });

  it("accepts a minimal posting", () => {
    expect(() => jobPostingSchema.parse(BASE_JOB)).not.toThrow();
  });

  it("rejects a blank company", () => {
    expect(() => jobPostingSchema.parse({ ...BASE_JOB, company: "" })).toThrow();
  });

  it("rejects a non-URL apply link", () => {
    expect(() => jobPostingSchema.parse({ ...BASE_JOB, applyUrl: "not a url" })).toThrow();
  });

  it("rejects a malformed expiry date", () => {
    expect(() => jobPostingSchema.parse({ ...BASE_JOB, expiresAt: "01.12.2026" })).toThrow();
  });
});
