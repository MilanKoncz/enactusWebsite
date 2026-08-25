import { z } from "zod";

/**
 * Validation for the /ideathon signup form, shared by the client
 * (react-hook-form + zodResolver, IdeathonSignupForm.tsx) and the server
 * (apiSchemas.ts extends this for /api/ideathon) — same split as
 * applicationFormSchema.ts. Field set is exactly the list given for the
 * Ideathon signup (Vorname, Nachname, E-Mail, Hochschule, Studiengang,
 * Fachsemester, hat bereits eine Idee, Ideenbeschreibung, meldet sich als
 * Team an, Teamgröße, wie aufmerksam geworden, Einwilligungs-Checkbox) —
 * nothing added, nothing dropped.
 *
 * `ideaDescription` is capped at 1000 characters: this field can hold an
 * unpublished business idea sent over a public form and mail pipeline, so
 * it carries an explicit length discipline (matched by a `check` constraint
 * on the DB column, migrations/0014) rather than being an unbounded
 * textarea. `teamSize` is only meaningful once `registeringAsTeam` is true,
 * but isn't hard-required by a refine — a "yes" without a number yet is
 * still a valid, useful signup. `website` is the honeypot, `consent` is
 * acknowledgment of the privacy notice (Art. 6(1)(b) — see the
 * Datenschutzerklärung — this is a participation registration, not
 * marketing consent), not the legal basis itself.
 */
export const ideathonSignupFormSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email(),
  university: z.string().trim().min(2).max(120),
  studyProgram: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(20),
  hasIdea: z.boolean(),
  ideaDescription: z.string().trim().max(1000).optional(),
  registeringAsTeam: z.boolean(),
  teamSize: z.coerce.number().int().min(1).max(50).optional(),
  heardAboutUs: z.string().trim().max(150).optional(),
  consent: z.boolean().refine((value) => value === true),
  website: z.string().trim().max(0).optional(),
});

// Two distinct shapes for the same z.coerce.number() reason
// applicationFormSchema.ts documents: react-hook-form's useForm needs the
// *input* shape (semester/teamSize as the raw string a number input
// produces), onSubmit receives the *output* shape after zodResolver coerces
// them.
export type IdeathonSignupFormInput = z.input<typeof ideathonSignupFormSchema>;
export type IdeathonSignupFormValues = z.output<typeof ideathonSignupFormSchema>;
