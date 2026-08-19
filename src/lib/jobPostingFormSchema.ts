import { z } from "zod";
import { employmentTypeSchema, remoteOptionSchema } from "@/content/jobs";
import { partners } from "@/content/partners";
import { SITE_TIMEZONE } from "@/content/timezone";

/**
 * What /admin/jobs's form submits, validated identically on the client and
 * in the route — same arrangement as calendarEventFormSchema.ts.
 */

const PARTNER_SLUGS = new Set(partners.map((partner) => partner.slug));

function optionalTrimmedString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );
}

// "" from a plain <select> (the "no partner" option) means "not provided",
// same treatment as the optional text fields above.
const optionalPartnerSlug = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .optional()
    .refine((slug) => slug === undefined || PARTNER_SLUGS.has(slug), {
      message: "must reference an existing partner",
    }),
);

export const jobPostingFormSchema = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  employmentType: employmentTypeSchema,
  location: optionalTrimmedString(200),
  remote: remoteOptionSchema,
  description: optionalTrimmedString(400),
  applyUrl: z.url().refine((value) => value.startsWith("https://"), {
    message: "must be an absolute https URL",
  }),
  expiresAt: z.iso.date(),
  partnerSlug: optionalPartnerSlug,
});

export type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;

// "Today" in the timezone every other date on this site is entered and read
// in (content/timezone.ts) — the same en-CA formatting trick
// lib/calendarAgenda.ts's todayInSiteTimezone uses, kept local here rather
// than imported: that function takes an epoch ms "now" for testability
// (calendarAgenda.ts's own comment), which this request-time check has no
// reason to thread through.
function todayInSiteTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(new Date());
}

// Only enforced at creation (the brief: "expires_at darf beim Anlegen nicht
// in der Vergangenheit liegen") — editing an already-expired posting to fix
// a typo must stay possible without also being forced to push its date out.
export const jobPostingCreateSchema = jobPostingFormSchema.refine(
  (job) => job.expiresAt >= todayInSiteTimezone(),
  { message: "expiresAt must not be in the past", path: ["expiresAt"] },
);
