import { describe, expect, it } from "vitest";
import { board, boardMemberSchema } from "@/content/board";

describe("content/board", () => {
  it("has five placeholder seats until the next board handover populates it", () => {
    expect(board.map((m) => m.slug)).toEqual([
      "vorstand-1",
      "vorstand-2",
      "vorstand-3",
      "vorstand-4",
      "vorstand-5",
    ]);
  });

  it("uses language-neutral placeholder tokens, not invented real names", () => {
    for (const [index, member] of board.entries()) {
      expect(member.name).toBe(`VORSTAND_${index + 1}`);
      expect(member.role).toBe(`POSITION_${index + 1}`);
    }
  });

  it("leaves photo, email, and linkedinUrl null until confirmed", () => {
    for (const member of board) {
      expect(member.photo).toBeNull();
      expect(member.email).toBeNull();
      expect(member.linkedinUrl).toBeNull();
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
