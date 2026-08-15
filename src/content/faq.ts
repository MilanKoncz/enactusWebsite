import { z } from "zod";

/**
 * FAQ entries shown on /kontakt (FAQ list on the left, contact form on the
 * right). There is no separate /faq route; the old site's /faq URL
 * redirects there instead. Questions and answers are copy and live in
 * messages/{locale}.json under "Faq.<key>.question" / "Faq.<key>.answer";
 * this file only orders the entries and groups them. The key is a Zod
 * enum, not a free string, so that `t(\`${entry.key}.question\`)` in
 * components stays statically checked against messages/{locale}.json (the
 * same reasoning as content/stars.ts). `category` groups the three sections
 * the brief asked for (Allgemein/Bewerbung/Projekte) as a free string
 * rather than an enum, since a board handover could add a fourth.
 *
 * The eight questions and answers below are drafts, not confirmed copy —
 * written to set an honest expectation (real time, real responsibility)
 * without reading as an off-putting warning, but never asserting a specific
 * number (hours per week, deadlines) that hasn't actually been confirmed.
 * Every one of them renders through `PlaceholderMark variant="unverified"`
 * on /kontakt until the board signs off — see ASSETS-TODO.md.
 */

const faqKeySchema = z.enum([
  "frage-1",
  "frage-2",
  "frage-3",
  "frage-4",
  "frage-5",
  "frage-6",
  "frage-7",
  "frage-8",
]);
export type FaqKey = z.infer<typeof faqKeySchema>;

const faqEntrySchema = z.object({
  key: faqKeySchema,
  order: z.number().int().min(1),
  category: z.string().nullable(),
});
export type FaqEntry = z.infer<typeof faqEntrySchema>;

function faqEntry(key: FaqKey, order: number, category: string): FaqEntry {
  return faqEntrySchema.parse({ key, order, category });
}

export const faqEntries: FaqEntry[] = [
  faqEntry("frage-1", 1, "Allgemein"),
  faqEntry("frage-2", 2, "Allgemein"),
  faqEntry("frage-3", 3, "Allgemein"),
  faqEntry("frage-4", 4, "Bewerbung"),
  faqEntry("frage-5", 5, "Bewerbung"),
  faqEntry("frage-6", 6, "Bewerbung"),
  faqEntry("frage-7", 7, "Projekte"),
  faqEntry("frage-8", 8, "Projekte"),
];

export { faqEntrySchema, faqKeySchema };
