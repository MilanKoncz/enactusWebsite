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
 * (Allgemein/Projekte/Bewerbung) as a free string rather than an enum,
 * since a board handover could add a fourth.
 *
 * All fourteen questions and answers are the board's own wording, signed
 * off 2026-08-16 — no draft marking, no PlaceholderMark. Keys are named
 * after the question rather than numbered so that reordering the list, or
 * dropping a question, doesn't silently reassign someone else's answer.
 */

const faqKeySchema = z.enum([
  "what-is-enactus",
  "what-are-social-startups",
  "what-work-looks-like",
  "time-commitment",
  "own-project",
  "language",
  "switch-project",
  "spin-off",
  "team-size",
  "project-tasks",
  "application-window",
  "who-can-join",
  "requirements",
  "choose-position",
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
  faqEntry("what-is-enactus", 1, "Allgemein"),
  faqEntry("what-are-social-startups", 2, "Allgemein"),
  faqEntry("what-work-looks-like", 3, "Allgemein"),
  faqEntry("time-commitment", 4, "Allgemein"),
  faqEntry("own-project", 5, "Allgemein"),
  faqEntry("language", 6, "Allgemein"),
  faqEntry("switch-project", 7, "Projekte"),
  faqEntry("spin-off", 8, "Projekte"),
  faqEntry("team-size", 9, "Projekte"),
  faqEntry("project-tasks", 10, "Projekte"),
  faqEntry("application-window", 11, "Bewerbung"),
  faqEntry("who-can-join", 12, "Bewerbung"),
  faqEntry("requirements", 13, "Bewerbung"),
  faqEntry("choose-position", 14, "Bewerbung"),
];

export { faqEntrySchema, faqKeySchema };
