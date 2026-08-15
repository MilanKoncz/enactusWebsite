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

  it("has the registered office, register entry, and board contact email confirmed by the board", () => {
    expect(org.registeredOffice).toBe("P4 9, 68161 Mannheim");
    expect(org.registerEntry).toBe("Amtsgericht Mannheim – Vereinsregister – VR 700965");
    expect(org.contactEmails.board).toBe("teamvorstand@unimannheim.enactus.team");
  });

  it("leaves the general contact email null until confirmed", () => {
    expect(org.contactEmails.general).toBeNull();
  });

  it("names the two confirmed legal representatives — the third seat is vacant", () => {
    expect(org.legalRepresentatives.names).toEqual(["Thorben Ossig", "Anton Osuhovskiy"]);
    expect(org.legalRepresentatives.verified).toBe(true);
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
