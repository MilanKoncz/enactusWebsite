import { z } from "zod";

/**
 * Current board (Vorstand) roster. Real names, roles, and photos are not
 * known yet — a board handover is never invented, so this holds five
 * placeholder seats (VORSTAND_1..VORSTAND_5) rather than an empty array, so
 * the board grid layout can be judged before the real roster exists (see
 * ASSETS-TODO.md). `role` is a free string rather than an enum: the actual
 * set of board roles isn't confirmed, and guessing one (e.g. assuming an
 * "HR" seat exists) would assert a structure the association may not have.
 * Bios live in messages/ under "Board.<slug>.bio"; this file only holds the
 * roster structure. `name` and `role` are language-neutral placeholder
 * tokens, not German copy, so they stay here rather than in messages/ — once
 * the board confirms a real roster, decide with them whether role names
 * belong in messages/ instead.
 */

const boardMemberSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: z.string(),
  photo: z.string().nullable(),
  email: z.email().nullable(),
  linkedinUrl: z.url().nullable(),
});
export type BoardMember = z.infer<typeof boardMemberSchema>;

function placeholderMember(index: number): BoardMember {
  return boardMemberSchema.parse({
    slug: `vorstand-${index}`,
    name: `VORSTAND_${index}`,
    role: `POSITION_${index}`,
    photo: null,
    email: null,
    linkedinUrl: null,
  });
}

export const board: BoardMember[] = [1, 2, 3, 4, 5].map(placeholderMember);

export { boardMemberSchema };
