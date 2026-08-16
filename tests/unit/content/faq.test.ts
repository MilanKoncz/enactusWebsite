import { describe, expect, it } from "vitest";
import { faqEntries, faqEntrySchema, faqKeySchema } from "@/content/faq";

describe("content/faq", () => {
  it("numbers the fourteen entries consecutively from one", () => {
    expect(faqEntries).toHaveLength(14);
    expect(faqEntries.map((e) => e.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ]);
  });

  it("groups the entries into the three confirmed categories", () => {
    const byCategory = Object.groupBy(faqEntries, (e) => e.category ?? "none");
    expect(byCategory.Allgemein?.map((e) => e.key)).toEqual([
      "what-is-enactus",
      "what-are-social-startups",
      "what-work-looks-like",
      "time-commitment",
      "own-project",
      "language",
    ]);
    expect(byCategory.Projekte?.map((e) => e.key)).toEqual([
      "switch-project",
      "spin-off",
      "team-size",
      "project-tasks",
    ]);
    expect(byCategory.Bewerbung?.map((e) => e.key)).toEqual([
      "application-window",
      "who-can-join",
      "requirements",
      "choose-position",
    ]);
    expect(byCategory.none).toBeUndefined();
  });

  it("validates every exported entry against the schema", () => {
    for (const entry of faqEntries) {
      expect(() => faqEntrySchema.parse(entry)).not.toThrow();
    }
  });

  it("accepts a well-formed FAQ entry", () => {
    expect(() =>
      faqEntrySchema.parse({ key: "what-is-enactus", order: 1, category: "Allgemein" }),
    ).not.toThrow();
  });

  it("rejects an FAQ entry with an unknown key or non-positive order", () => {
    expect(() =>
      faqEntrySchema.parse({ key: "not-a-question", order: 1, category: null }),
    ).toThrow();
    expect(() => faqEntrySchema.parse({ key: "what-is-enactus", order: 0, category: null })).toThrow();
  });

  it("keeps the key enum in sync with the exported entry list", () => {
    expect(faqKeySchema.options).toEqual(faqEntries.map((e) => e.key));
  });
});
