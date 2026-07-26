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
  leadName: z.string().nullable(),
  leadEmail: z.email().nullable(),
  externalUrl: z.url().nullable(),
  logo: z.string().nullable(),
  images: z.array(z.string()),
  sdgs: z.array(sdgSchema),
});
export type Project = z.infer<typeof projectSchema>;

function project(input: { slug: string; name: string; status: ProjectStatus }): Project {
  return projectSchema.parse({
    ...input,
    oneLiner: `Projects.${input.slug}.oneLiner`,
    description: `Projects.${input.slug}.description`,
    stage: null,
    leadName: null,
    leadEmail: null,
    externalUrl: null,
    logo: null,
    images: [],
    sdgs: [],
  });
}

export const projects: Project[] = [
  project({ slug: "smilegreen", name: "SmileGreen", status: "active" }),
  project({ slug: "mealyo", name: "Mealyo", status: "active" }),
  project({ slug: "resoap", name: "ReSoap", status: "active" }),
  project({ slug: "impactwithus", name: "ImpactWithUs", status: "active" }),
  // Archive. Only Differgy's outcome (spin-off) is confirmed; Safesteps and
  // Vela are paused, not cancelled — they could still be reactivated.
  project({ slug: "differgy", name: "Differgy", status: "spinoff" }),
  project({ slug: "safesteps", name: "Safesteps", status: "paused" }),
  project({ slug: "vela", name: "Vela", status: "paused" }),
];

export { projectSchema, projectStatusSchema };
