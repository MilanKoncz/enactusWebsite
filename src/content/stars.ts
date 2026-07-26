import { z } from "zod";
import { projectStatusSchema } from "./projects";

/**
 * The 8 STAR entries. Real names are not confirmed, so keys stay as the
 * placeholder identifiers STAR_1..STAR_8 until the board provides the
 * actual list (see ASSETS-TODO.md) — do not guess real names into this
 * enum. It's also unclear whether "status" here means the same thing as a
 * project's national-database status or something else (membership status,
 * for instance); it reuses projects.ts's vocabulary for now as the closest
 * confirmed fit, but stays nullable so nothing is asserted before that's
 * confirmed. The two-sentence description is copy and lives in
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
  logo: z.string().nullable(),
  description: z.string(),
  status: projectStatusSchema.nullable(),
  youtubeId: youtubeIdSchema,
});
export type Star = z.infer<typeof starSchema>;

function star(key: StarKey): Star {
  return starSchema.parse({
    key,
    logo: null,
    description: `Stars.${key}.description`,
    status: null,
    youtubeId: null,
  });
}

export const stars: Star[] = starKeySchema.options.map(star);

export { starSchema, starKeySchema };
