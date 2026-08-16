import { z } from "zod";
import { projectStageSchema } from "./process";

/**
 * Every project the initiative has run or is running. `status` mirrors the
 * Enactus Germany national database vocabulary (active/spinoff/cancelled/
 * paused, see CLAUDE.md) so a board handover maps 1:1 onto how the network
 * already tracks projects — never add a fifth value here without checking
 * that database first. `stage` reuses process.ts's gate enum; it is null for
 * every project whose current stage isn't tracked yet (see ASSETS-TODO.md),
 * not because the project has no stage. `oneLiner` and `description` are not
 * copy — they are the message keys under messages/{locale}.json's
 * "Projects.<slug>" namespace, derived from slug so key and copy can never
 * drift apart. Everything else that isn't confirmed (leads, external URL,
 * logo, images, SDG focus) stays empty rather than guessed.
 *
 * `leads` is a list, not a single lead: SmileGreen is run by two people, and
 * a schema that only fits one would have forced dropping a name. An empty
 * list means "not publicly named yet", never "the project has no lead".
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

const assetPathSchema = z.string().startsWith("/");

const projectLeadSchema = z.object({
  name: z.string().min(1),
  email: z.email().nullable(),
  linkedinUrl: z.url().nullable(),
  photo: assetPathSchema.nullable(),
});
export type ProjectLead = z.infer<typeof projectLeadSchema>;

const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  oneLiner: z.string(),
  description: z.string(),
  status: projectStatusSchema,
  stage: projectStageSchema,
  year: z.number().int().min(2003).nullable(),
  leads: z.array(projectLeadSchema),
  externalUrl: z.url().nullable(),
  linkedinUrl: z.url().nullable(),
  logo: assetPathSchema.nullable(),
  images: z.array(assetPathSchema),
  // Ascending and duplicate-free, so the rendered list never reads as an
  // unordered jumble or repeats a goal.
  sdgs: z.array(sdgSchema).refine(
    (goals) => goals.every((goal, index) => index === 0 || goal > goals[index - 1]),
    { message: "sdgs must be ascending and free of duplicates" },
  ),
});
export type Project = z.infer<typeof projectSchema>;

type ProjectInput = {
  slug: string;
  name: string;
  status: ProjectStatus;
  stage?: Project["stage"];
  leads?: Array<{
    name: string;
    email?: string | null;
    linkedinUrl?: string | null;
    photo?: string | null;
  }>;
  externalUrl?: string | null;
  linkedinUrl?: string | null;
  logo?: string | null;
  images?: string[];
  sdgs?: number[];
};

function project(input: ProjectInput): Project {
  return projectSchema.parse({
    slug: input.slug,
    name: input.name,
    status: input.status,
    oneLiner: `Projects.${input.slug}.oneLiner`,
    description: `Projects.${input.slug}.description`,
    stage: input.stage ?? null,
    year: null,
    leads: (input.leads ?? []).map((lead) => ({
      name: lead.name,
      email: lead.email ?? null,
      linkedinUrl: lead.linkedinUrl ?? null,
      photo: lead.photo ?? null,
    })),
    externalUrl: input.externalUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    logo: input.logo ?? null,
    images: input.images ?? [],
    sdgs: input.sdgs ?? [],
  });
}

export const projects: Project[] = [
  project({
    slug: "smilegreen",
    name: "SmileGreen",
    status: "active",
    stage: "mvp",
    linkedinUrl: "https://www.linkedin.com/company/smilegreen-oral-care/",
    logo: "/projects/smilegreen-logo.png",
    images: [
      "/projects/smilegreen-nationalcup-1.jpg",
      "/projects/smilegreen-nationalcup-2.jpg",
    ],
    sdgs: [3, 12, 13],
    leads: [
      {
        name: "Tim Köster",
        email: "tim.koester@unimannheim.enactus.team",
        linkedinUrl: "https://www.linkedin.com/in/tim-köster-9a8847397",
      },
      // Only the name was handed over for the second lead — no email and no
      // LinkedIn profile, see ASSETS-TODO.md.
      { name: "Franka Zanolli" },
    ],
  }),
  project({
    slug: "mealyo",
    name: "Mealyo",
    status: "active",
    externalUrl: "https://mealyo.de",
    logo: "/projects/mealyo-logo.png",
    sdgs: [12, 13],
    leads: [
      {
        name: "Justin Prodan",
        email: "justin.prodan@unimannheim.enactus.team",
        linkedinUrl: "https://www.linkedin.com/in/justin-prodan",
      },
    ],
  }),
  // Lead's first name (Heidi) is confirmed; surname and email are not — see
  // ASSETS-TODO.md. `leads` stays empty rather than storing a bare first
  // name a future consumer could render as a complete name.
  project({ slug: "resoap", name: "ReSoap", status: "active", sdgs: [6, 11, 12] }),
  project({
    slug: "impactwithus",
    name: "ImpactWithUs",
    status: "active",
    logo: "/projects/impactwithus-logo.png",
    sdgs: [17],
    leads: [
      {
        name: "Finn Brämig",
        email: "finn.braemig@unimannheim.enactus.team",
        linkedinUrl: "https://www.linkedin.com/in/finn-niclas-braemig",
        photo: "/projects/leads/finn-braemig.jpg",
      },
    ],
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

export { projectSchema, projectStatusSchema, projectLeadSchema };
