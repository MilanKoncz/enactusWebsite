import { z } from "zod";
import { projectStageSchema } from "./process";

/**
 * Every project the initiative has run or is running. `status` mirrors the
 * Enactus Germany national database vocabulary (active/spinoff/cancelled/
 * paused, see CLAUDE.md) so a board handover maps 1:1 onto how the network
 * already tracks projects — never add a fifth value here without checking
 * that database first. `stage` reuses process.ts's placeholder gate enum;
 * it is null for every project below because the current stage isn't
 * tracked yet (see ASSETS-TODO.md), not because the project has no stage.
 * `oneLiner` and `description` are not copy — they are the message keys
 * under messages/{locale}.json's "Projects.<slug>" namespace, derived from
 * slug so key and copy can never drift apart. Everything else that isn't
 * confirmed (lead contact, external URL, logo, images, SDG focus) stays
 * null/empty rather than guessed.
 *
 * The six archive entries without an individually confirmed status
 * (sunNSoil, greenHeat, reverZe, afya, mushroom, greenscape) default to
 * "cancelled" — a deliberate placeholder default, not a confirmed fact, see
 * ASSETS-TODO.md. Differgy, Safesteps, and Vela's statuses are confirmed.
 *
 * `year` (shown on the /projekte/archiv grid) is null for every project —
 * no start/end year has been confirmed for any of them yet, active or
 * archived, see ASSETS-TODO.md. Never inferred from a project's position in
 * this list.
 */

const projectStatusSchema = z.enum(["active", "spinoff", "cancelled", "paused"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

const sdgSchema = z.number().int().min(1).max(17);

const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  oneLiner: z.string(),
  description: z.string(),
  status: projectStatusSchema,
  stage: projectStageSchema,
  year: z.number().int().min(2003).nullable(),
  leadName: z.string().nullable(),
  leadEmail: z.email().nullable(),
  leadLinkedinUrl: z.url().nullable(),
  externalUrl: z.url().nullable(),
  logo: z.string().nullable(),
  images: z.array(z.string()),
  sdgs: z.array(sdgSchema),
});
export type Project = z.infer<typeof projectSchema>;

function project(input: {
  slug: string;
  name: string;
  status: ProjectStatus;
  leadName?: string | null;
  leadEmail?: string | null;
  leadLinkedinUrl?: string | null;
}): Project {
  return projectSchema.parse({
    slug: input.slug,
    name: input.name,
    status: input.status,
    oneLiner: `Projects.${input.slug}.oneLiner`,
    description: `Projects.${input.slug}.description`,
    stage: null,
    year: null,
    leadName: input.leadName ?? null,
    leadEmail: input.leadEmail ?? null,
    leadLinkedinUrl: input.leadLinkedinUrl ?? null,
    externalUrl: null,
    logo: null,
    images: [],
    sdgs: [],
  });
}

export const projects: Project[] = [
  project({
    slug: "smilegreen",
    name: "SmileGreen",
    status: "active",
    leadName: "Tim Köster",
    leadEmail: "tim.koester@unimannheim.enactus.team",
    leadLinkedinUrl: "https://www.linkedin.com/in/tim-köster-9a8847397",
  }),
  project({
    slug: "mealyo",
    name: "Mealyo",
    status: "active",
    leadName: "Justin Prodan",
    leadEmail: "justin.prodan@unimannheim.enactus.team",
    leadLinkedinUrl: "https://www.linkedin.com/in/justin-prodan",
  }),
  // Lead's first name (Heidi) is confirmed; surname and email are not — see
  // ASSETS-TODO.md. leadName stays null rather than storing a bare first
  // name a future consumer could render as a complete name.
  project({ slug: "resoap", name: "ReSoap", status: "active" }),
  project({
    slug: "impactwithus",
    name: "ImpactWithUs",
    status: "active",
    leadName: "Finn Brämig",
    leadEmail: "finn.braemig@unimannheim.enactus.team",
    leadLinkedinUrl: "https://www.linkedin.com/in/finn-niclas-braemig",
  }),
  // Archive.
  project({ slug: "differgy", name: "Differgy", status: "spinoff" }),
  project({ slug: "safesteps", name: "Safesteps", status: "paused" }),
  project({ slug: "vela", name: "Vela", status: "paused" }),
  project({ slug: "sun-n-soil", name: "Sun n' Soil", status: "cancelled" }),
  project({ slug: "green-heat", name: "Green Heat", status: "cancelled" }),
  project({ slug: "reverze", name: "ReverZe", status: "cancelled" }),
  project({ slug: "afya", name: "Afya", status: "cancelled" }),
  project({ slug: "mushroom", name: "mushROOM", status: "cancelled" }),
  project({ slug: "moufense", name: "Moufense", status: "cancelled" }),
  project({ slug: "greenscape", name: "Greenscape", status: "cancelled" }),
];

export { projectSchema, projectStatusSchema };
