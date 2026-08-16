import { z } from "zod";

/**
 * The compact 3-station application-process timeline on /mitmachen —
 * distinct from process.ts's 8-station project stage-gate timeline (that one
 * describes what happens to a *project*; this one describes what happens to
 * a *candidate*). "application" is confirmed by the board-approved
 * Faq.application-window answer (a two-week window each semester, details on
 * /mitmachen) and "interview" by Faq.choose-position ("laden wir dich zu
 * einem persönlichen Gespräch ein");
 * "response" states the self-evident close of any application process
 * (you hear back) rather than an invented specific claim — no date or
 * duration is asserted anywhere in this file or its copy. Titles/short
 * descriptions live in messages/{locale}.json under
 * "MitmachenPage.timeline.steps.<key>"; this file only holds the key, order,
 * and icon.
 */

const stepKeySchema = z.enum(["application", "interview", "response"]);
export type MitmachenStepKey = z.infer<typeof stepKeySchema>;

const iconKeySchema = z.enum(["file-text", "users", "mail"]);
export type MitmachenIconKey = z.infer<typeof iconKeySchema>;

const stepSchema = z.object({
  key: stepKeySchema,
  order: z.number().int().min(1).max(3),
  icon: iconKeySchema,
});
export type MitmachenStep = z.infer<typeof stepSchema>;

function step(key: MitmachenStepKey, order: number, icon: MitmachenIconKey): MitmachenStep {
  return stepSchema.parse({ key, order, icon });
}

export const mitmachenSteps: MitmachenStep[] = [
  step("application", 1, "file-text"),
  step("interview", 2, "users"),
  step("response", 3, "mail"),
];

export { stepSchema, stepKeySchema, iconKeySchema };
