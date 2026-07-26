import { z } from "zod";

/**
 * The stage-gate process that decides whether a project continues
 * (docs/design-system.md: "the gate marker ... drawn from the organisation's
 * own stage-gate process"). Only "Inno Gating" and "Operations Gating" are
 * confirmed gate names from that doc; the surrounding stages and their order
 * are a placeholder pending board confirmation — see ASSETS-TODO.md. This is
 * the canonical source for the stage key enum: projects.ts imports it rather
 * than redefining it, so project stages can never name a gate this file
 * doesn't know about. Stage titles and descriptions are copy and live in
 * messages/{locale}.json under "Process.<key>"; this file holds only the
 * key, order, and whether the name itself is confirmed.
 */

const stageKeySchema = z.enum(["ideation", "innoGating", "operationsGating", "spinoff"]);
export type StageKey = z.infer<typeof stageKeySchema>;

// Nullable because a project's current stage is not yet tracked per project
// — see projects.ts.
export const projectStageSchema = stageKeySchema.nullable();

const stageSchema = z.object({
  key: stageKeySchema,
  order: z.number().int().min(1),
  // false = placeholder name, not yet confirmed by the board.
  confirmed: z.boolean(),
  title: z.string(),
  description: z.string(),
});
export type Stage = z.infer<typeof stageSchema>;

function stage(key: StageKey, order: number, confirmed: boolean): Stage {
  return stageSchema.parse({
    key,
    order,
    confirmed,
    title: `Process.${key}.title`,
    description: `Process.${key}.description`,
  });
}

export const stages: Stage[] = [
  stage("ideation", 1, false),
  stage("innoGating", 2, true),
  stage("operationsGating", 3, true),
  stage("spinoff", 4, false),
];

export { stageSchema, stageKeySchema };
