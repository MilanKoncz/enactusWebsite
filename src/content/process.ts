import { z } from "zod";

/**
 * The stage-gate process a project moves through, from Kick-off to becoming
 * a Startup — the process that gives the gate marker (docs/design-system.md)
 * its literal meaning, and the content for the /prozess timeline
 * (ProcessTimeline.tsx). The full order, every name, and every step's
 * checklist content below were given directly by the board (2026-08-18
 * /prozess content handover), which is what resolves both the "surrounding
 * stages and their order are a placeholder" and the "checklist content is
 * unconfirmed" uncertainty earlier versions of this file carried — every
 * step's key/kind/order is `confirmed: true`, and checklist copy lives as
 * real text in messages/{locale}.json, not a placeholder token.
 *
 * Steps do *not* strictly alternate milestone/phase: only three steps are
 * genuine gates — `innoGating`, `operationsGating`, `spinoff` — the moments
 * a project is actually evaluated and can be stopped. `kickOff` reads as a
 * phase (an orientation/handover, not a go/no-go decision) even though an
 * earlier version of this file modeled it as a milestone. Gates render
 * `GateMarker`'s gold rule; phases render a calmer, muted marker instead —
 * see Station in ProcessTimeline.tsx.
 *
 * This is the canonical source for the stage key enum: projects.ts imports
 * it rather than redefining it, so a project's current stage can never name
 * a step this file doesn't know about. `title` and `short` are copy and live
 * in messages/{locale}.json under "Process.steps.<key>"; this file holds
 * only the key, kind, order, icon, checklist presence, and confirmation
 * state.
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

// The two things a step can be: a Zeitpunkt (Inno-Gating, Operations-Gating,
// Legal-Gating/Ausgründung — the three steps a project is actually
// evaluated at, rendered as GateMarker variant="milestone") or a Phase the
// team runs through on its own. Not alternating — see the file comment.
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
  // Whether Process.steps.<key>.checklist exists in messages/{locale}.json.
  // Two of the eight steps (kickOff, ideation) genuinely have no gating
  // criteria or benefits in the board's confirmed text — not a placeholder
  // gap, an intentional absence — so the component reads this flag rather
  // than assuming every step carries a three-item list.
  hasChecklist: z.boolean(),
});
export type Step = z.infer<typeof stepSchema>;

function step(
  key: StageKey,
  kind: StepKind,
  order: number,
  icon: IconKey,
  hasChecklist: boolean,
): Step {
  return stepSchema.parse({
    key,
    kind,
    order,
    confirmed: true,
    icon,
    title: `Process.steps.${key}.title`,
    short: `Process.steps.${key}.short`,
    hasChecklist,
  });
}

export const steps: Step[] = [
  step("kickOff", "phase", 1, "flag", false),
  step("ideation", "phase", 2, "lightbulb", false),
  step("innoGating", "milestone", 3, "git-branch", true),
  step("mvp", "phase", 4, "hammer", true),
  step("operationsGating", "milestone", 5, "shield-check", true),
  step("implementation", "phase", 6, "cog", true),
  step("spinoff", "milestone", 7, "rocket", true),
  step("startup", "phase", 8, "trending-up", true),
];

/**
 * The Project Guide PDF, downloadable from /prozess. Real file since
 * 2026-08-18, recompressed from the board's original 16.7 MB handover down
 * to the size below (embedded photo XObjects re-encoded as JPEG at a
 * reasonable resolution and quality; every text/vector object untouched) —
 * see the commit that added `public/downloads/enactus-mannheim-project-guide.pdf`
 * for the exact before/after numbers and method. A second board handover on
 * 2026-08-19 replaced the file (still 16.7 MB uncompressed) and it was
 * recompressed the same way, landing smaller than the first pass. `fileSizeLabel`
 * is asserted against the real file on disk by tests/unit/content/process.test.ts,
 * so a future replacement that forgets to update this string fails the build
 * instead of silently drifting. `available`/`href` stay in the schema (rather
 * than being dropped now that the file is real) so a future gap between
 * handovers degrades to the same disabled-button state this component
 * already knows how to render, instead of a broken link.
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
  available: true,
  href: "/downloads/enactus-mannheim-project-guide.pdf",
  fileSizeLabel: "1,9 MB",
  updatedAt: "2026-08-19",
});

export { stepSchema, stageKeySchema, stepKindSchema, iconKeySchema, projectGuideSchema };
