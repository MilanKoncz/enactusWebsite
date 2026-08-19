import { z } from "zod";

/**
 * The type and validation rules for one job posting (Jobwall) — the data
 * itself lives in the `job_postings` table
 * (migrations/0008_job_postings.sql, lib/db.ts), managed by the board at
 * /admin/jobs, not as a hardcoded array here. Same arrangement as
 * content/calendar.ts for the event calendar, for the same reason: partner
 * companies have no self-service or login, the board enters every posting
 * itself.
 *
 * Four employment types, fixed order — mirrors the database's own check
 * constraint (job_postings_employment_type_check). Keep the two in sync; a
 * type added here without a matching migration fails at insert time, not
 * silently.
 */
export const EMPLOYMENT_TYPES = ["praktikum", "werkstudent", "abschlussarbeit", "einstieg"] as const;
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

export const REMOTE_OPTIONS = ["vor_ort", "hybrid", "remote"] as const;
export const remoteOptionSchema = z.enum(REMOTE_OPTIONS);
export type RemoteOption = z.infer<typeof remoteOptionSchema>;

/**
 * The public/stored shape. `partnerSlug`, when set, is validated against
 * content/partners.ts in lib/jobPostingFormSchema.ts, not here — this schema
 * only describes what a row looks like once it's already in the database,
 * the same split content/calendar.ts's calendarEventSchema uses.
 */
export const jobPostingSchema = z.object({
  id: z.guid(),
  company: z.string().min(1),
  title: z.string().min(1),
  employmentType: employmentTypeSchema,
  location: z.string().min(1).nullable(),
  remote: remoteOptionSchema,
  description: z.string().min(1).nullable(),
  applyUrl: z.url(),
  expiresAt: z.iso.date(),
  partnerSlug: z.string().nullable(),
});
export type JobPosting = z.infer<typeof jobPostingSchema>;
