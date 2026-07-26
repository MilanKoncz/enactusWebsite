import { describe, expect, it } from "vitest";
import { faqEntries, faqEntrySchema, faqKeySchema } from "@/content/faq";

describe("content/faq", () => {
  it("has eight ordered placeholder entries until real questions are drafted", () => {
    expect(faqEntries.map((e) => e.key)).toEqual([
      "frage-1",
      "frage-2",
      "frage-3",
      "frage-4",
      "frage-5",
      "frage-6",
      "frage-7",
      "frage-8",
    ]);
    expect(faqEntries.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("leaves category null until a real grouping is confirmed", () => {
    for (const entry of faqEntries) {
      expect(entry.category).toBeNull();
    }
  });

  it("validates every exported entry against the schema", () => {
    for (const entry of faqEntries) {
      expect(() => faqEntrySchema.parse(entry)).not.toThrow();
    }
  });

  it("accepts a well-formed FAQ entry", () => {
    expect(() =>
      faqEntrySchema.parse({ key: "frage-1", order: 1, category: null }),
    ).not.toThrow();
  });

  it("rejects an FAQ entry with an unknown key or non-positive order", () => {
    expect(() =>
      faqEntrySchema.parse({ key: "not-a-question", order: 1, category: null }),
    ).toThrow();
    expect(() => faqEntrySchema.parse({ key: "frage-1", order: 0, category: null })).toThrow();
  });

  it("keeps the key enum in sync with the exported entry list", () => {
    expect(faqKeySchema.options).toEqual(faqEntries.map((e) => e.key));
  });
});
