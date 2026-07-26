import { describe, expect, it } from "vitest";
import { org, orgSchema, socialLinks } from "@/content/org";
import { socialLinks as navigationSocialLinks } from "@/content/navigation";

describe("content/org", () => {
  it("validates the exported org data", () => {
    expect(() => orgSchema.parse(org)).not.toThrow();
  });

  it("marks the founding year unverified until the board confirms it", () => {
    expect(org.foundingYear).toEqual({ year: 2003, verified: false });
  });

  it("leaves registered office, register entry, and contact emails null until confirmed", () => {
    expect(org.registeredOffice).toBeNull();
    expect(org.registerEntry).toBeNull();
    expect(org.contactEmails.general).toBeNull();
    expect(org.contactEmails.board).toBeNull();
  });

  it("re-exports navigation.ts's social links rather than duplicating them", () => {
    expect(socialLinks).toBe(navigationSocialLinks);
  });

  it("rejects an org with a founding year in the future", () => {
    expect(() =>
      orgSchema.parse({
        ...org,
        foundingYear: { year: new Date().getFullYear() + 1, verified: false },
      }),
    ).toThrow();
  });

  it("rejects an org with a malformed contact email", () => {
    expect(() =>
      orgSchema.parse({
        ...org,
        contactEmails: { general: "not-an-email", board: null },
      }),
    ).toThrow();
  });
});
