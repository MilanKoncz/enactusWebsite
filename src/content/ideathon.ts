import { z } from "zod";

/**
 * Structure and ordering for the /ideathon page — copy lives in
 * messages/{locale}.json under "IdeathonPage.<section>.<key>.*", this file
 * only holds keys, order, and the few non-copy facts (a benefit card's
 * headline figure). Content ported from the board's own draft (idea.html,
 * decoded from its Claude Design canvas export) — see that commit for what
 * was taken verbatim versus rewritten.
 *
 * Deliberately does NOT store the timeline stops' calendar dates: those come
 * from the matched `calendar_events` row (internal_link = "/ideathon") at
 * render time, one day per stop in order — a static "Donnerstag · 24."
 * string here would silently go stale the next year the Ideathon runs on
 * different dates. See lib/ideathonEvent.ts.
 */

const timelineStepKeySchema = z.enum(["kickoff", "ideation", "pitch", "finale"]);
export type TimelineStepKey = z.infer<typeof timelineStepKeySchema>;

const timelineStepSchema = z.object({
  key: timelineStepKeySchema,
  order: z.number().int().min(1).max(4),
});
export type TimelineStep = z.infer<typeof timelineStepSchema>;

export const timelineSteps: TimelineStep[] = [
  { key: "kickoff", order: 1 },
  { key: "ideation", order: 2 },
  { key: "pitch", order: 3 },
  { key: "finale", order: 4 },
];

const benefitKeySchema = z.enum([
  "prizeMoney",
  "ideaLivesOn",
  "workshops",
  "network",
  "fromIdeaToExecution",
  "takenCareOf",
]);
export type BenefitKey = z.infer<typeof benefitKeySchema>;

const benefitSchema = z.object({
  key: benefitKeySchema,
  order: z.number().int().min(1).max(6),
  // The first card headlines a figure ("1.000 €") instead of a number
  // chip — every other card gets a plain "0N" order marker instead.
  figure: z.string().nullable(),
});
export type Benefit = z.infer<typeof benefitSchema>;

export const benefits: Benefit[] = [
  { key: "prizeMoney", order: 1, figure: "1.000 €" },
  { key: "ideaLivesOn", order: 2, figure: null },
  { key: "workshops", order: 3, figure: null },
  { key: "network", order: 4, figure: null },
  { key: "fromIdeaToExecution", order: 5, figure: null },
  { key: "takenCareOf", order: 6, figure: null },
];

const signupStepKeySchema = z.enum(["form", "confirmation", "meetTeam", "kickoff"]);
export type SignupStepKey = z.infer<typeof signupStepKeySchema>;

const signupStepSchema = z.object({
  key: signupStepKeySchema,
  order: z.number().int().min(1).max(4),
});
export type SignupStep = z.infer<typeof signupStepSchema>;

export const signupSteps: SignupStep[] = [
  { key: "form", order: 1 },
  { key: "confirmation", order: 2 },
  { key: "meetTeam", order: 3 },
  { key: "kickoff", order: 4 },
];

// Five real FAQ entries from the board's draft (a sixth slot the draft's own
// loop reserved was already dropped by the board before this page existed —
// see the commit that ported idea.html for the full accounting).
const faqKeySchema = z.enum([
  "bringOwnIdea",
  "allFourDays",
  "cost",
  "overnight",
  "afterIdeathon",
]);
export type IdeathonFaqKey = z.infer<typeof faqKeySchema>;

const faqEntrySchema = z.object({
  key: faqKeySchema,
  order: z.number().int().min(1).max(5),
});
export type IdeathonFaqEntry = z.infer<typeof faqEntrySchema>;

export const faqEntries: IdeathonFaqEntry[] = [
  { key: "bringOwnIdea", order: 1 },
  { key: "allFourDays", order: 2 },
  { key: "cost", order: 3 },
  { key: "overnight", order: 4 },
  { key: "afterIdeathon", order: 5 },
];

export { timelineStepSchema, benefitSchema, signupStepSchema, faqEntrySchema };
