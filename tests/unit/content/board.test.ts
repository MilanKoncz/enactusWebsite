import { describe, expect, it } from "vitest";
import { board, boardMemberSchema } from "@/content/board";

describe("content/board", () => {
  it("has the five confirmed board seats in order", () => {
    expect(board.map((m) => m.slug)).toEqual([
      "thorben-ossig",
      "anton-osuhovskiy",
      "tom-iizuka",
      "philip-strobl",
      "risto-terhart",
    ]);
  });

  it("has a real name and role for every member", () => {
    expect(board.map((m) => m.name)).toEqual([
      "Thorben Ossig",
      "Anton Osuhovskiy",
      "Tom Iizuka",
      "Philip Strobl",
      "Risto Terhart",
    ]);
    expect(board.map((m) => m.role)).toEqual([
      "Team-Lead",
      "Finance-Lead",
      "Operations-Lead",
      "Inno-Lead",
      "C&C Lead",
    ]);
  });

  it("has a confirmed email for every member", () => {
    for (const member of board) {
      expect(member.email).toMatch(/@unimannheim\.enactus\.team$/);
    }
  });

  it("leaves anton-osuhovskiy's LinkedIn null — confirmed absent, not missing", () => {
    const anton = board.find((m) => m.slug === "anton-osuhovskiy")!;
    expect(anton.linkedinUrl).toBeNull();
  });

  it("has a confirmed LinkedIn URL for every other member", () => {
    for (const member of board) {
      if (member.slug === "anton-osuhovskiy") continue;
      expect(member.linkedinUrl).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
    }
  });

  it("leaves every photo null until portraits are confirmed", () => {
    for (const member of board) {
      expect(member.photo).toBeNull();
    }
  });

  it("validates every exported board member against the schema", () => {
    for (const member of board) {
      expect(() => boardMemberSchema.parse(member)).not.toThrow();
    }
  });

  it("accepts a well-formed board member", () => {
    expect(() =>
      boardMemberSchema.parse({
        slug: "jane-doe",
        name: "Jane Doe",
        role: "Vorstandsvorsitz",
        photo: null,
        email: "jane@unimannheim.enactus.team",
        linkedinUrl: "https://www.linkedin.com/in/jane-doe",
      }),
    ).not.toThrow();
  });

  it("rejects a board member with a malformed slug, email, or LinkedIn URL", () => {
    const base = { name: "Jane Doe", role: "Vorstandsvorsitz", photo: null, linkedinUrl: null };
    expect(() =>
      boardMemberSchema.parse({ ...base, slug: "Jane Doe", email: null }),
    ).toThrow();
    expect(() =>
      boardMemberSchema.parse({ ...base, slug: "jane-doe", email: "not-an-email" }),
    ).toThrow();
    expect(() =>
      boardMemberSchema.parse({
        ...base,
        slug: "jane-doe",
        email: null,
        linkedinUrl: "not-a-url",
      }),
    ).toThrow();
  });
});
