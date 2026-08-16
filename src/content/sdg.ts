import { z } from "zod";

/**
 * The 17 official UN Sustainable Development Goal icons
 * (public/sdg/sdg-01.jpg .. sdg-17.jpg), downloaded verbatim from
 * sdgs.un.org and never recolored, distorted, or cropped — the one
 * condition the UN's own usage guidelines attach to reusing them. Number
 * and name (messages/{locale}.json's "Sdg.goals.<n>") are shown alongside
 * each icon, linked to SDG_GOALS_URL, not baked into the image.
 */
const SDG_GOAL_COUNT = 17;

const sdgGoalSchema = z.number().int().min(1).max(SDG_GOAL_COUNT);
export type SdgGoal = z.infer<typeof sdgGoalSchema>;

export function sdgIconSrc(goal: number): string {
  const parsed = sdgGoalSchema.parse(goal);
  return `/sdg/sdg-${String(parsed).padStart(2, "0")}.jpg`;
}

export const SDG_GOALS_URL = "https://sdgs.un.org/goals";

export { sdgGoalSchema, SDG_GOAL_COUNT };
