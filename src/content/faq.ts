import { z } from "zod";

/**
 * FAQ entries for the /faq page. Questions and answers are copy and live in
 * messages/{locale}.json under "Faq.<key>.question" / "Faq.<key>.answer";
 * this file only orders the entries and groups them. The key is a Zod enum,
 * not a free string, so that `t(\`${entry.key}.question\`)` in components
 * stays statically checked against messages/{locale}.json (the same
 * reasoning as content/stars.ts). `category` is a free string rather than an
 * enum since the real grouping isn't confirmed yet. Real questions aren't
 * drafted yet, so this holds eight generic placeholder entries rather than
 * asserting specific questions (see ASSETS-TODO.md).
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

function faqEntry(key: FaqKey, order: number): FaqEntry {
  return faqEntrySchema.parse({ key, order, category: null });
}

export const faqEntries: FaqEntry[] = faqKeySchema.options.map((key, index) =>
  faqEntry(key, index + 1),
);

export { faqEntrySchema, faqKeySchema };
