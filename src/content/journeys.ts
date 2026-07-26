import { z } from "zod";

/**
 * Ordered steps of the member journey (what involvement looks like over
 * time — e.g. application through to alumni), shown on the recruiting or
 * about page. The exact steps aren't confirmed with the board yet, so the
 * key enum holds four generic placeholder phases rather than asserting a
 * specific journey structure — confirm the real steps with the board before
 * renaming them (see ASSETS-TODO.md). The key is a Zod enum, not a free
 * string, so that `t(\`${step.key}.title\`)` in components stays statically
 * checked against messages/{locale}.json (the same reasoning as
 * content/stars.ts). `title`/`description` are message keys under
 * messages/{locale}.json's "Journeys.<key>" namespace, not copy themselves.
 */

const journeyKeySchema = z.enum(["phase-1", "phase-2", "phase-3", "phase-4"]);
export type JourneyKey = z.infer<typeof journeyKeySchema>;

const journeyStepSchema = z.object({
  key: journeyKeySchema,
  order: z.number().int().min(1),
  title: z.string(),
  description: z.string(),
});
export type JourneyStep = z.infer<typeof journeyStepSchema>;

function journeyStep(key: JourneyKey, order: number): JourneyStep {
  return journeyStepSchema.parse({
    key,
    order,
    title: `Journeys.${key}.title`,
    description: `Journeys.${key}.description`,
  });
}

export const journeySteps: JourneyStep[] = journeyKeySchema.options.map((key, index) =>
  journeyStep(key, index + 1),
);

export { journeyStepSchema, journeyKeySchema };
