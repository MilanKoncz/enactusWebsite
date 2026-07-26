import { z } from "zod";
import { socialLinks } from "./navigation";

/**
 * Legal and contact facts about the association itself: founding year,
 * registered office, contact addresses. Copy (mission statements, about-page
 * prose) lives in messages/; this file holds only structure and facts, so a
 * typo in a legal detail fails the build instead of shipping quietly.
 * Social profile links are the exact ones navigation.ts renders in the
 * footer — re-exported here rather than duplicated, so there's exactly one
 * place that can go stale.
 */

const emailSchema = z.email().nullable();

const orgSchema = z.object({
  legalName: z.string(),
  shortName: z.string(),
  foundingYear: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    verified: z.boolean(),
  }),
  registeredOffice: z.string().nullable(),
  registerEntry: z.string().nullable(),
  contactEmails: z.object({
    general: emailSchema,
    board: emailSchema,
  }),
});
export type Org = z.infer<typeof orgSchema>;

export const org: Org = orgSchema.parse({
  legalName: "Enactus Mannheim e.V.",
  shortName: "Enactus Mannheim",
  // Matches the "seit 2003" figure in kpis.ts — unconfirmed, see ASSETS-TODO.md.
  foundingYear: { year: 2003, verified: false },
  registeredOffice: null,
  registerEntry: null,
  contactEmails: {
    general: null,
    board: null,
  },
});

export { orgSchema, socialLinks };
