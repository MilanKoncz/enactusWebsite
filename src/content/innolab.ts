import { z } from "zod";

/**
 * Structure and ordering for the /innolab page — copy lives in
 * messages/{locale}.json under "InnoLabPage.<section>.<key>.*", this file
 * only holds keys, order, and the two non-copy facts a board handover could
 * actually unsettle (a path's target route, a step's gate-vs-phase kind).
 * Content ported from the board's own draft (innolab.html, decoded from its
 * Claude Design canvas export, the same tooling idea.html used for
 * /ideathon) — see the commit that added this page for what was taken
 * verbatim versus rewritten or dropped as unconfirmed.
 *
 * Two figures in the draft are deliberately absent here: a step-by-step
 * effort estimate ("vier bis sechs Stunden, verteilt auf zwei bis drei
 * Wochen") and a concrete weekly session day/time. Neither was confirmed by
 * the board — both are logged in ASSETS-TODO.md rather than guessed.
 */

const pathKeySchema = z.enum(["ideathon", "ownIdea"]);
export type PathKey = z.infer<typeof pathKeySchema>;

const pathSchema = z.object({
  key: pathKeySchema,
  order: z.number().int().min(1).max(2),
  // The one real fact each path card needs beyond copy: where its CTA goes.
  // "ideathon" links out to the /ideathon page itself; "ownIdea" points at
  // the in-page steps section, not a route, so it stays a plain "#anchor"
  // rather than a typed route.
  href: z.string().startsWith("/").or(z.string().startsWith("#")),
});
export type InnoLabPath = z.infer<typeof pathSchema>;

export const paths: InnoLabPath[] = [
  { key: "ideathon", order: 1, href: "/ideathon" },
  { key: "ownIdea", order: 2, href: "#schritte" },
];

// The five-step solo path (Auftakt through Übergang in the board's draft).
// Only the last step is a real gate — a project either gets the Inno Gating
// or it doesn't, mirroring process.ts's own milestone/phase split — so it
// renders GateMarker's gold rule while the first four render the plain
// numbered-circle treatment the draft itself uses.
const stepKeySchema = z.enum([
  "inspiration",
  "problemUnderstanding",
  "ideationMarketAnalysis",
  "businessModelOutline",
  "pitchInnoGate",
]);
export type StepKey = z.infer<typeof stepKeySchema>;

const stepKindSchema = z.enum(["phase", "gate"]);
export type StepKind = z.infer<typeof stepKindSchema>;

const stepSchema = z.object({
  key: stepKeySchema,
  kind: stepKindSchema,
  order: z.number().int().min(1).max(5),
});
export type InnoLabStep = z.infer<typeof stepSchema>;

export const steps: InnoLabStep[] = [
  { key: "inspiration", kind: "phase", order: 1 },
  { key: "problemUnderstanding", kind: "phase", order: 2 },
  { key: "ideationMarketAnalysis", kind: "phase", order: 3 },
  { key: "businessModelOutline", kind: "phase", order: 4 },
  { key: "pitchInnoGate", kind: "gate", order: 5 },
];

const insideKeySchema = z.enum(["weeklySessions", "advisorAccess", "innoGating"]);
export type InsideKey = z.infer<typeof insideKeySchema>;

const insideSchema = z.object({ key: insideKeySchema, order: z.number().int().min(1).max(3) });
export type InsideItem = z.infer<typeof insideSchema>;

export const insideItems: InsideItem[] = [
  { key: "weeklySessions", order: 1 },
  { key: "advisorAccess", order: 2 },
  { key: "innoGating", order: 3 },
];

// The InnoLab/Ideathon boundary section: two named blocks, each with its own
// real CTA target — see InnoLabBoundary.tsx. Kept here rather than
// hardcoded in the component for the same reason every other route/href
// value in content/ lives outside a component: a future page move only
// touches one file.
const boundaryKeySchema = z.enum(["innolab", "ideathon"]);
export type BoundaryKey = z.infer<typeof boundaryKeySchema>;

const boundarySchema = z.object({ key: boundaryKeySchema, order: z.number().int().min(1).max(2), href: z.string().startsWith("/") });
export type BoundaryBlock = z.infer<typeof boundarySchema>;

export const boundaryBlocks: BoundaryBlock[] = [
  { key: "innolab", order: 1, href: "/mitmachen" },
  { key: "ideathon", order: 2, href: "/ideathon" },
];

// Five real FAQ entries from the board's draft (a sixth slot the draft's own
// loop reserved was already empty in the export — see the commit that
// ported innolab.html for the full accounting, the same situation
// content/ideathon.ts's own comment records for its draft).
const faqKeySchema = z.enum([
  "bringOwnIdea",
  "differenceFromIdeathon",
  "pitchNotConvincing",
  "whatToStudy",
  "cost",
]);
export type FaqKey = z.infer<typeof faqKeySchema>;

const faqEntrySchema = z.object({ key: faqKeySchema, order: z.number().int().min(1).max(5) });
export type FaqEntry = z.infer<typeof faqEntrySchema>;

export const faqEntries: FaqEntry[] = [
  { key: "bringOwnIdea", order: 1 },
  { key: "differenceFromIdeathon", order: 2 },
  { key: "pitchNotConvincing", order: 3 },
  { key: "whatToStudy", order: 4 },
  { key: "cost", order: 5 },
];

export { pathKeySchema, pathSchema, stepKeySchema, stepKindSchema, stepSchema, insideKeySchema, insideSchema, boundaryKeySchema, boundarySchema, faqKeySchema, faqEntrySchema };
