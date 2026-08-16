import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import { faqEntries } from "@/content/faq";

/**
 * content/faq.ts only orders keys; the copy lives in the message catalogs.
 * A key present in one catalogue and missing from the other renders as the
 * raw key on /kontakt without failing the build, so it is asserted here.
 */
const catalogs = { de: de.Faq, en: en.Faq } as Record<
  "de" | "en",
  Record<string, { question: string; answer: string } | undefined>
>;

describe("Faq messages", () => {
  for (const locale of ["de", "en"] as const) {
    it(`has a question and an answer for every entry in ${locale}.json`, () => {
      for (const { key } of faqEntries) {
        const entry = catalogs[locale][key];
        expect(entry, `${locale}.json is missing Faq.${key}`).toBeDefined();
        expect(entry!.question.length).toBeGreaterThan(0);
        expect(entry!.answer.length).toBeGreaterThan(0);
      }
    });

    it(`carries no keys beyond the entries in ${locale}.json`, () => {
      expect(Object.keys(catalogs[locale])).toEqual(faqEntries.map((e) => e.key));
    });
  }

  it("states the German working language in both catalogues", () => {
    expect(catalogs.de.language!.answer).toMatch(/Deutsch/);
    expect(catalogs.en.language!.answer).toMatch(/German/);
  });
});
