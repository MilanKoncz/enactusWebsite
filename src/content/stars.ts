import { z } from "zod";
import { projectStatusSchema } from "./projects";

/**
 * The STAR roster: former flagship projects shown in a section near the
 * bottom of /projekte, each with a name, a logo, a short description, a
 * status badge, and (where one exists) an embedded YouTube National Cup
 * pitch. Real names and facts confirmed with the board 2026-08-15 (see
 * ASSETS-TODO.md), replacing the previous STAR_1..STAR_8 placeholder
 * roster. "status" means exactly what it means on a project (the same
 * national-database vocabulary from projects.ts), not a separate membership
 * concept. `key` stays the stable STAR_1..STAR_8 identifier (order as given
 * by the board) so slugs never need to change if a name is corrected later.
 * `verified` flags entries whose facts are not yet fully confirmed —
 * rendered with the quiet `unverified` PlaceholderMark rather than the loud
 * "missing" treatment, since the fact itself exists, just unconfirmed. The
 * description is copy and lives in messages/{locale}.json under
 * "Stars.<key>.description".
 *
 * Board correction, 2026-08-21: Back on Track (STAR_5), Flat Mates (STAR_6),
 * and Stadthonig (STAR_7) are no longer Stars — Afya and Differgy replace
 * two of the freed slots, and STAR_7 is deliberately left unassigned so the
 * grid shows a real, visible empty state (ProjectsStars.tsx) rather than
 * inventing an eighth project. The three removed names aren't deleted: they
 * now live in content/projects.ts as ordinary archive entries, same as
 * every other former project. Differgy's and Afya's facts (source: their
 * project pages/differgy.de, the Enactus Germany project database, and the
 * Enactus Startup Accelerator 2023 finalist listing for Differgy) were
 * supplied directly by the board and transcribed verbatim, not drafted —
 * Afya's status contradiction is flagged in ASSETS-TODO.md, not resolved
 * here.
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
  logo?: string | null;
  youtubeId?: string | null;
}): Star {
  return starSchema.parse({
    key: input.key,
    name: input.name,
    logo: input.logo ?? null,
    description: `Stars.${input.key}.description`,
    status: input.status,
    verified: input.verified,
    youtubeId: input.youtubeId ?? null,
  });
}

export const stars: Star[] = [
  star({ key: "STAR_1", name: "Blauherz", status: "spinoff", verified: true, logo: "/stars/blauherz-logo.png" }),
  star({
    key: "STAR_2",
    name: "Moufense",
    status: "cancelled",
    verified: true,
    logo: "/stars/moufense-logo.png",
    youtubeId: "9Ord09u363s",
  }),
  star({ key: "STAR_3", name: "effishent", status: "cancelled", verified: true }),
  star({ key: "STAR_4", name: "Sanagua", status: "spinoff", verified: true }),
  // Status confirmed via the Enactus Germany project database, but the
  // achievement described (own local production, distribution partners)
  // reads in tension with "cancelled" — see ASSETS-TODO.md rather than
  // silently resolving the contradiction in either direction.
  star({ key: "STAR_5", name: "Afya", status: "cancelled", verified: true, logo: "/projects/afya-logo.png" }),
  star({ key: "STAR_6", name: "Differgy", status: "spinoff", verified: true }),
  // STAR_7 intentionally unassigned — see the file comment. The grid shows
  // a visible empty eighth slot instead (ProjectsStars.tsx), not an
  // invented project.
  // Facts not yet fully confirmed by the board — see the file comment.
  star({ key: "STAR_8", name: "Sunte", status: null, verified: false }),
];

export { starSchema, starKeySchema };
