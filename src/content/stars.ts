import { z } from "zod";
import { projectStatusSchema } from "./projects";

/**
 * The 8 STAR entries: former flagship projects shown in a section near the
 * bottom of /projekte, each with a name, a logo, a short description, a
 * status badge, and (where one exists) an embedded YouTube National Cup
 * pitch. Real names and facts confirmed with the board 2026-08-15 (see
 * ASSETS-TODO.md), replacing the previous STAR_1..STAR_8 placeholder
 * roster. "status" means exactly what it means on a project (the same
 * national-database vocabulary from projects.ts), not a separate membership
 * concept. `key` stays the stable STAR_1..STAR_8 identifier (order as given
 * by the board) so slugs never need to change if a name is corrected later.
 * `verified` flags the two entries (Stadthonig, Sunte) whose facts are not
 * yet fully confirmed — rendered with the quiet `unverified` PlaceholderMark
 * rather than the loud "missing" treatment, since the fact itself exists,
 * just unconfirmed. The description is copy and lives in
 * messages/{locale}.json under "Stars.<key>.description".
 */

const starKeySchema = z.enum([
  "STAR_1",
  "STAR_2",
  "STAR_3",
  "STAR_4",
  "STAR_5",
  "STAR_6",
  "STAR_7",
  "STAR_8",
]);
export type StarKey = z.infer<typeof starKeySchema>;

const youtubeIdSchema = z
  .string()
  .regex(/^[\w-]{11}$/)
  .nullable();

const starSchema = z.object({
  key: starKeySchema,
  name: z.string(),
  logo: z.string().nullable(),
  description: z.string(),
  status: projectStatusSchema.nullable(),
  verified: z.boolean(),
  youtubeId: youtubeIdSchema,
});
export type Star = z.infer<typeof starSchema>;

function star(input: {
  key: StarKey;
  name: string;
  status: z.infer<typeof projectStatusSchema> | null;
  verified: boolean;
  youtubeId?: string | null;
}): Star {
  return starSchema.parse({
    key: input.key,
    name: input.name,
    logo: null,
    description: `Stars.${input.key}.description`,
    status: input.status,
    verified: input.verified,
    youtubeId: input.youtubeId ?? null,
  });
}

export const stars: Star[] = [
  star({ key: "STAR_1", name: "Blauherz", status: "spinoff", verified: true }),
  star({ key: "STAR_2", name: "Moufense", status: "cancelled", verified: true, youtubeId: "9Ord09u363s" }),
  star({ key: "STAR_3", name: "effishent", status: "cancelled", verified: true }),
  star({ key: "STAR_4", name: "Sanagua", status: "spinoff", verified: true }),
  star({ key: "STAR_5", name: "Back on Track", status: "cancelled", verified: true }),
  star({ key: "STAR_6", name: "Flat Mates", status: null, verified: true, youtubeId: "cY6dSD79fqo" }),
  // Facts not yet fully confirmed by the board — see the file comment.
  star({ key: "STAR_7", name: "Stadthonig", status: null, verified: false }),
  star({ key: "STAR_8", name: "Sunte", status: null, verified: false }),
];

export { starSchema, starKeySchema };
