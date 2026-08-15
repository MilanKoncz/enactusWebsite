import { z } from "zod";

/**
 * The stage-gate process a project moves through, from Kick-Off to becoming
 * a Startup — the process that gives the gate marker (docs/design-system.md)
 * its literal meaning, and the content for the /prozess timeline
 * (ProcessTimeline.tsx). The full order and every name below were given
 * directly by the board (see the /prozess build brief), which is what
 * resolves the "surrounding stages and their order are a placeholder"
 * uncertainty a previous version of this file carried — every step's
 * key/kind/order is `confirmed: true` now. What is *not* confirmed is each
 * step's checklist content: a milestone's gating criteria and a phase's
 * benefits were never specified, so those stay out of this file entirely and
 * are never invented (see ASSETS-TODO.md) — component/copy layer only,
 * rendered through PlaceholderMark.
 *
 * This is the canonical source for the stage key enum: projects.ts imports
 * it rather than redefining it, so a project's current stage can never name
 * a step this file doesn't know about. `title` and `short` are copy and live
 * in messages/{locale}.json under "Process.steps.<key>"; this file holds
 * only the key, kind, order, icon, and confirmation state.
 */

const stageKeySchema = z.enum([
  "kickOff",
  "ideation",
  "innoGating",
  "mvp",
  "operationsGating",
  "implementation",
  "spinoff",
  "startup",
]);
export type StageKey = z.infer<typeof stageKeySchema>;

// Nullable because a project's current stage is not yet tracked per project
// — see projects.ts.
export const projectStageSchema = stageKeySchema.nullable();

// The two things a step can be: a Zeitpunkt (Kick-Off, Inno Gating,
// Operations Gating, Ausgründung — rendered as GateMarker variant="milestone")
// or the Phase that follows it. Alternating, always starting and ending on a
// milestone.
const stepKindSchema = z.enum(["milestone", "phase"]);
export type StepKind = z.infer<typeof stepKindSchema>;

// lucide-react icon names, kebab-cased to match the package's own export
// convention — kept as a closed enum (not z.string()) so a typo in the array
// below fails the build instead of silently rendering no icon. The mapping
// from key to the actual icon component lives in ProcessTimeline.tsx, not
// here — content stays free of React/JSX.
const iconKeySchema = z.enum([
  "flag",
  "lightbulb",
  "git-branch",
  "hammer",
  "shield-check",
  "cog",
  "rocket",
  "trending-up",
]);
export type IconKey = z.infer<typeof iconKeySchema>;

const stepSchema = z.object({
  key: stageKeySchema,
  kind: stepKindSchema,
  order: z.number().int().min(1).max(8),
  // The step's own name/position — see the file comment. Always true today;
  // kept as a field (rather than dropped) because it's exactly the kind of
  // fact a later board handover could unsettle again.
  confirmed: z.boolean(),
  icon: iconKeySchema,
  title: z.string(),
  short: z.string(),
});
export type Step = z.infer<typeof stepSchema>;

function step(key: StageKey, kind: StepKind, order: number, icon: IconKey): Step {
  return stepSchema.parse({
    key,
    kind,
    order,
    confirmed: true,
    icon,
    title: `Process.steps.${key}.title`,
    short: `Process.steps.${key}.short`,
  });
}

export const steps: Step[] = [
  step("kickOff", "milestone", 1, "flag"),
  step("ideation", "phase", 2, "lightbulb"),
  step("innoGating", "milestone", 3, "git-branch"),
  step("mvp", "phase", 4, "hammer"),
  step("operationsGating", "milestone", 5, "shield-check"),
  step("implementation", "phase", 6, "cog"),
  step("spinoff", "milestone", 7, "rocket"),
  step("startup", "phase", 8, "trending-up"),
];

// Every step's checklist (a milestone's gating criteria, a phase's benefits)
// is exactly three items, rendered by index — Process.steps.<key>.checklist
// in messages/{locale}.json, the same array-of-strings shape as Hero.rotating.
// Not tracked as content because the text itself is what's unconfirmed, not
// the count; the component reads this constant, not a per-step field, so the
// two can never drift apart.
export const CHECKLIST_LENGTH = 3;

/**
 * The Project Guide PDF, downloadable from /prozess. Doesn't exist yet — see
 * ASSETS-TODO.md — so `available` gates the download button (disabled when
 * false) and `href` is required the moment it flips to true, enforced below
 * rather than left for a component to notice at render time.
 */
const projectGuideSchema = z
  .object({
    available: z.boolean(),
    href: z.string().startsWith("/").nullable(),
    fileSizeLabel: z.string().nullable(),
    updatedAt: z.string().date().nullable(),
  })
  .superRefine((guide, ctx) => {
    if (guide.available && !guide.href) {
      ctx.addIssue({
        code: "custom",
        path: ["href"],
        message: "href is required once the project guide is available",
      });
    }
  });
export type ProjectGuide = z.infer<typeof projectGuideSchema>;

export const projectGuide: ProjectGuide = projectGuideSchema.parse({
  available: false,
  href: null,
  fileSizeLabel: null,
  updatedAt: null,
});

export { stepSchema, stageKeySchema, stepKindSchema, iconKeySchema, projectGuideSchema };
