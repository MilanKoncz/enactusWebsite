import { z } from "zod";

/**
 * Validation for the /mitmachen application form, shared by the client
 * (react-hook-form + zodResolver, ApplicationForm.tsx) and the server
 * (apiSchemas.ts extends this for /api/bewerbung) — this is the one
 * definition both sides run, not a client-only draft. Field set matches
 * docs/engineering.md and the Datenschutzerklärung's "Bewerbungsformular"
 * section exactly — no file upload, CV information is structured fields
 * only. `priorInvolvement` and `languagesSkills` stay optional: not every
 * applicant has prior engagement or extra language skills to report, and
 * requiring them would contradict the page's own "you don't need to bring
 * everything" framing. `website` is a honeypot (must stay empty); the
 * submission-timing check lives in lib/formToken.ts instead, since it's
 * about wall-clock time elapsed since a token was issued, not a static
 * field rule a schema can express.
 *
 * `desiredAreas` carries the same length/size discipline as every other
 * field here — the UI only ever offers a fixed checkbox list
 * (ApplicationForm.tsx, derived from content/projects.ts and
 * content/board.ts), but the server has no way to enforce that a request
 * came from that UI. Bounded to the list's own realistic size rather than
 * an enum against the derived options: an enum would make an old
 * application's stored answer fail validation retroactively the moment a
 * project gets renamed, which a request size limit doesn't risk.
 */
export const applicationFormSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email(),
  studyProgram: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(20),
  university: z.string().trim().min(2).max(120),
  priorInvolvement: z.string().trim().max(600).optional(),
  languagesSkills: z.string().trim().max(300).optional(),
  motivation: z.string().trim().min(20).max(1500),
  desiredAreas: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  availabilityHours: z.coerce.number().int().min(1).max(80),
  heardAboutUs: z.string().trim().max(150).optional(),
  consent: z.boolean().refine((value) => value === true),
  website: z.string().trim().max(0).optional(),
});

// Two distinct shapes because of `z.coerce.number()`: react-hook-form's
// `useForm` needs the *input* shape (semester/availabilityHours as the raw
// string a number input produces) for its field-values generic, while
// `onSubmit` receives the *output* shape (coerced to number) after
// zodResolver runs. Passing one type for both would make TypeScript reject
// the resolver — see react-hook-form's own generic form
// `useForm<Input, Context, Output>`.
export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;
