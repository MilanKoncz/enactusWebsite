import { z } from "zod";

/**
 * Alumni roster shown to prospective members and partners as proof of where
 * membership leads. Real names, current roles, and quotes are not known yet
 * — real people are never invented, so this holds three placeholder entries
 * (ALUMNUS_1..ALUMNUS_3) rather than an empty array, so the statement layout
 * can be judged before real alumni are confirmed (see ASSETS-TODO.md).
 * `currentRole` and `quote` are facts/words from a real person, not house
 * copy, so they live here rather than in messages/ once confirmed. Until
 * then they hold language-neutral placeholder tokens, not German text.
 */

const alumnusSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  currentRole: z.string().nullable(),
  quote: z.string(),
  linkedinUrl: z.url().nullable(),
  photo: z.string().nullable(),
});
export type Alumnus = z.infer<typeof alumnusSchema>;

function placeholderAlumnus(index: number): Alumnus {
  return alumnusSchema.parse({
    slug: `alumnus-${index}`,
    name: `ALUMNUS_${index}`,
    currentRole: `POSITION_${index}`,
    quote: `STATEMENT_${index}`,
    linkedinUrl: null,
    photo: null,
  });
}

export const alumni: Alumnus[] = [1, 2, 3].map(placeholderAlumnus);

/**
 * Whether AlumniVoices.tsx (the quote/portrait track) renders at all — a
 * single switch, not a per-entry one, since all three current entries are
 * the same ALUMNUS_N/POSITION_N/STATEMENT_N placeholder shape (see
 * placeholderAlumnus above) and none of them is real enough to publish
 * alone. `false` until real quotes replace the placeholders (ASSETS-TODO.md
 * tracks this); flip to `true` once `alumni` above holds real entries — the
 * component and its section are otherwise untouched, so nothing else needs
 * to change to bring it back.
 */
export const ALUMNI_STATEMENTS_ENABLED = false;

export { alumnusSchema };
