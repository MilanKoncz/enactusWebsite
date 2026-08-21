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
 * back-on-track, stadthonig, and flat-mates were added 2026-08-21 when the
 * board moved them off the /projekte Stars roster (content/stars.ts) —
 * they remain real archive entries, not deleted. back-on-track keeps its
 * previously-confirmed "cancelled" status; stadthonig and flat-mates had no
 * status on file even as Stars, so they fall back to the same "cancelled"
 * placeholder default as the six above, not a confirmed fact either.
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
  // Whether that address was handed over or merely follows the house
  // pattern (vorname.nachname@unimannheim.enactus.team). ReSoap's two leads
  // were named without addresses, so theirs are derived and carry `false` —
  // rendered through PlaceholderMark's "unverified" variant rather than
  // presented as confirmed, the same convention org.ts uses for
  // foundingYear and legalRepresentatives. Defaults to true in the
  // `project()` helper because every other address here came from a
  // handover.
  emailVerified: z.boolean(),
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
    emailVerified?: boolean;
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
      emailVerified: lead.emailVerified ?? true,
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
  // Screenshots and Justin's portrait added 2026-08-21 from the board's
  // Webflow-assets handover — see ASSETS-TODO.md's row on both. The three
  // screenshots are marketing mockups (a tall 739x1600 graphic each, headline
  // text baked in as an image, German only), not photography like every
  // other project's images — top-cropped to the shared 4:3 frame rather than
  // center-cropped, so the headline stays legible instead of being cut off.
  project({
    slug: "mealyo",
    name: "Mealyo",
    status: "active",
    externalUrl: "https://mealyo.de",
    logo: "/projects/mealyo-logo.png",
    images: [
      "/projects/mealyo-expiry-reminder.jpg",
      "/projects/mealyo-inventar.jpg",
      "/projects/mealyo-scan.jpg",
    ],
    sdgs: [12, 13],
    leads: [
      {
        name: "Justin Prodan",
        email: "justin.prodan@unimannheim.enactus.team",
        linkedinUrl: "https://www.linkedin.com/in/justin-prodan",
        photo: "/projects/leads/justin-prodan.jpg",
      },
    ],
  }),
  // Handed over 2026-08-17 by the project team: full names of both leads,
  // the MVP stage, the logo, and photos of the process. Both addresses are
  // *derived* from the house pattern rather than given, hence
  // emailVerified: false — see ASSETS-TODO.md.
  //
  // SDGs stay 6/11/12 as previously confirmed. The handover document lists
  // 6/8/12 (Decent Work instead of Sustainable Cities); that discrepancy is
  // recorded in ASSETS-TODO.md for the project team to settle rather than
  // silently resolved in either direction.
  project({
    slug: "resoap",
    name: "ReSoap",
    status: "active",
    stage: "mvp",
    logo: "/projects/resoap-logo.png",
    images: [
      "/projects/resoap-herstellung.jpg",
      "/projects/resoap-reifeprozess.jpg",
      "/projects/resoap-fertige-seife.jpg",
    ],
    sdgs: [6, 11, 12],
    leads: [
      {
        name: "Heidi Hoffmann",
        email: "heidi.hoffmann@unimannheim.enactus.team",
        emailVerified: false,
        photo: "/projects/leads/heidi-hoffmann.jpg",
      },
      {
        name: "Nayab Sheikh",
        email: "nayab.sheikh@unimannheim.enactus.team",
        emailVerified: false,
        photo: "/projects/leads/nayab-sheikh.jpg",
      },
    ],
  }),
  // Second and third photos added 2026-08-21 from the board's Webflow-assets
  // handover (ASSETS-TODO.md) — a field-trip and a partner-community photo,
  // rounding the single workshop photo out to the shared three-photo grid.
  project({
    slug: "impactwithus",
    name: "ImpactWithUs",
    status: "active",
    logo: "/projects/impactwithus-logo.png",
    images: [
      "/projects/impactwithus-workshop.jpg",
      "/projects/impactwithus-projecttrip.jpg",
      "/projects/impactwithus-garango.jpg",
    ],
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
  // Archive. Four of these gained a real logo 2026-08-21 (differgy,
  // safesteps, vela, green-heat) from the same Webflow-assets handover —
  // safesteps and green-heat were delivered as flat-white JPEGs, keyed to
  // transparent PNG to match the transparent-logo convention every other
  // logo on the site follows (ASSETS-TODO.md).
  project({ slug: "differgy", name: "Differgy", status: "spinoff", logo: "/projects/differgy-logo.png" }),
  project({ slug: "safesteps", name: "Safesteps", status: "paused", logo: "/projects/safesteps-logo.png" }),
  project({ slug: "vela", name: "Vela", status: "paused", logo: "/projects/vela-logo.png" }),
  project({ slug: "sun-n-soil", name: "Sun n' Soil", status: "cancelled" }),
  project({
    slug: "green-heat",
    name: "Green Heat",
    status: "cancelled",
    logo: "/projects/green-heat-logo.png",
  }),
  project({ slug: "reverze", name: "ReverZe", status: "cancelled" }),
  // Two more photos added 2026-08-21 (production/harvest, finished
  // product) alongside the existing logo — see ASSETS-TODO.md for the
  // status/achievement contradiction the board flagged for this project.
  project({
    slug: "afya",
    name: "Afya",
    status: "cancelled",
    logo: "/projects/afya-logo.png",
    images: ["/projects/afya-ernte.jpg", "/projects/afya-produktfoto.jpg", "/projects/afya-team.jpg"],
  }),
  project({ slug: "mushroom", name: "mushROOM", status: "cancelled" }),
  project({ slug: "moufense", name: "Moufense", status: "cancelled", logo: "/stars/moufense-logo.png" }),
  project({ slug: "greenscape", name: "Greenscape", status: "cancelled" }),
  project({ slug: "back-on-track", name: "Back on Track", status: "cancelled" }),
  project({ slug: "stadthonig", name: "Stadthonig", status: "cancelled" }),
  project({ slug: "flat-mates", name: "Flat Mates", status: "cancelled" }),
];

export { projectSchema, projectStatusSchema, projectLeadSchema };
