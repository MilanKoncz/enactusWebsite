import { z } from "zod";

/**
 * Validation for the /mitmachen application form, shared by the client
 * (react-hook-form + zodResolver, ApplicationForm.tsx) and the server
 * (apiSchemas.ts extends this for /api/bewerbung) — this is the one
 * definition both sides run, not a client-only draft. Field set matches
 * docs/engineering.md and the Datenschutzerklärung's "Bewerbungsformular"
 * section exactly. `priorInvolvement` and `languagesSkills` stay optional:
 * not every applicant has prior engagement or extra skills to report, and
 * requiring them would contradict the page's own "you don't need to bring
 * everything" framing. `website` is a honeypot (must stay empty); the
 * submission-timing check lives in lib/formToken.ts instead, since it's
 * about wall-clock time elapsed since a token was issued, not a static
 * field rule a schema can express.
 *
 * `applicationFormSchema` itself stays a plain z.object with no refine or
 * transform on it, so apiSchemas.ts can still `.extend()` it with
 * locale/formToken — Zod's ZodObject loses that method the moment a
 * refinement wraps it. The cross-field checks (area gaps/duplicates, CV
 * requiredness) live in the separately-exported `refineApplicationForm`,
 * applied by `validatedApplicationFormSchema` here for the client resolver,
 * and again by apiSchemas.ts after its own `.extend()` — one refinement
 * definition, run in two places, instead of two that could drift apart.
 */

// One switch, read in exactly one place (refineApplicationForm below), the
// UI's required-marker, and the field's error text. Flipping it back to
// `false` — if the upload path turns out to need a fallback on its first
// day live — is a one-line change, no schema or migration involved.
export const CV_REQUIRED = true;

const AREA_LABEL_MAX = 120;
const AREA_REASON_MAX = 300;

// Ressorts (cross-project positions like Team-Lead) are a separate,
// unranked, unreasoned category from the Wunschbereich choices above — see
// lib/db.ts's own comment on why they need a second table rather than a
// fourth priority. Capped here, read by both the client and the server, and
// enforced again in refineApplicationForm below (duplicates) — without a
// cap an applicant would just tick everything, and the signal would be
// worthless. One line to change if the board wants a different number.
export const MAX_DEPARTMENTS = 3;
const DEPARTMENT_LABEL_MAX = 120;

// Read by both the schema below and the field's own maxLength/hint text
// (ApplicationForm.tsx), so the number exists in exactly one place. 1500 and
// 400 were the original limits; raised 2026-08-31 at the board's request.
export const MOTIVATION_MAX = 2000;
export const WANT_TO_GAIN_MAX = 800;

// 4 MB, matching the upload route's own maximumSizeInBytes
// (app/api/bewerbung/cv-upload/route.ts) — Vercel Blob is the real
// enforcement point; this is a second, defensive ceiling on the number the
// client reports about its own file.
const CV_MAX_SIZE_BYTES = 4 * 1024 * 1024;

export const applicationFormSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email(),
  studyProgram: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(20),
  availabilityHours: z.coerce.number().int().min(1).max(80),

  // Three prioritized Wunschbereich choices, not a checkbox array: the UI
  // is three fixed dropdowns (1. Wahl through 3. Wahl), not a variable-length
  // list, so flat fields bind directly to controls without field-array
  // machinery. Only the first choice and its reason are unconditionally
  // required here — "2nd needs a reason", "no 3rd without a 2nd", and "no
  // duplicates" are cross-field rules, checked in refineApplicationForm.
  area1: z.string().trim().min(1).max(AREA_LABEL_MAX),
  area1Reason: z.string().trim().min(1).max(AREA_REASON_MAX),
  area2: z.string().trim().max(AREA_LABEL_MAX).optional(),
  area2Reason: z.string().trim().max(AREA_REASON_MAX).optional(),
  area3: z.string().trim().max(AREA_LABEL_MAX).optional(),
  area3Reason: z.string().trim().max(AREA_REASON_MAX).optional(),

  // Ressorts: an unranked, optional checkbox group, deliberately not three
  // more flat fields like area1..area3 above — there is no priority to bind
  // to individual controls, just a set. Duplicates can't occur through the
  // checkbox UI itself, but refineApplicationForm still checks them, the
  // same defense-in-depth as the area duplicate check below.
  departments: z.array(z.string().trim().min(1).max(DEPARTMENT_LABEL_MAX)).max(MAX_DEPARTMENTS).optional(),

  // Populated together, as a unit, once the client's direct-to-Blob upload
  // (upload() from @vercel/blob/client against /api/bewerbung/cv-upload)
  // resolves — never assembled field by field. All four optional here so
  // the same schema still parses while CV_REQUIRED is false; whether they
  // must be present *together* is a refineApplicationForm rule.
  cvBlobUrl: z.url().max(2000).optional(),
  cvPathname: z.string().trim().min(1).max(300).optional(),
  cvOriginalFilename: z.string().trim().min(1).max(200).optional(),
  cvSizeBytes: z.coerce.number().int().min(1).max(CV_MAX_SIZE_BYTES).optional(),

  motivation: z.string().trim().min(20).max(MOTIVATION_MAX),
  priorInvolvement: z.string().trim().max(600).optional(),
  // Relabeled "Relevante Skills" — deliberately shorter than every other
  // free-text field here (200, not the 300 a full sentence would fit):
  // with a CV attached, this is a keyword list for the chosen area, not a
  // second place to restate a career. See ApplicationForm.tsx's hint text.
  languagesSkills: z.string().trim().max(200).optional(),
  // New: forward-looking, deliberately distinct from motivation ("why us")
  // and the area reasons ("why this area") — see ApplicationForm.tsx's
  // hint text for how the four free-text fields stay non-redundant.
  wantToGain: z.string().trim().max(WANT_TO_GAIN_MAX).optional(),

  heardAboutUs: z.string().trim().max(150).optional(),
  consent: z.boolean().refine((value) => value === true),
  website: z.string().trim().max(0).optional(),
});

type RawApplicationForm = z.infer<typeof applicationFormSchema>;

// Exported so apiSchemas.ts can run the exact same cross-field checks after
// its own `.extend()`, rather than a second copy of this logic. Every issue
// here uses code: "custom" — the message text is never shown to a visitor
// (ApplicationForm.tsx checks only whether `errors.<field>` is truthy and
// supplies its own i18n text), so the strings below are for whoever reads
// a failed parse while debugging, not a user-facing string.
export function refineApplicationForm(data: RawApplicationForm, ctx: z.RefinementCtx) {
  const area2Chosen = Boolean(data.area2 && data.area2.length > 0);
  const area3Chosen = Boolean(data.area3 && data.area3.length > 0);
  const area2ReasonGiven = Boolean(data.area2Reason && data.area2Reason.length > 0);
  const area3ReasonGiven = Boolean(data.area3Reason && data.area3Reason.length > 0);

  if (area2Chosen && !area2ReasonGiven) {
    ctx.addIssue({ code: "custom", path: ["area2Reason"], message: "reason required once an area is chosen" });
  }
  if (!area2Chosen && area2ReasonGiven) {
    ctx.addIssue({ code: "custom", path: ["area2"], message: "reason given without an area chosen" });
  }
  if (area3Chosen && !area3ReasonGiven) {
    ctx.addIssue({ code: "custom", path: ["area3Reason"], message: "reason required once an area is chosen" });
  }
  if (!area3Chosen && area3ReasonGiven) {
    ctx.addIssue({ code: "custom", path: ["area3"], message: "reason given without an area chosen" });
  }
  // Gaplessness: a 3rd choice makes no sense without a 2nd. Checked after
  // (not instead of) the pairwise reason checks above, so a request with
  // both problems at once is told about both.
  if (area3Chosen && !area2Chosen) {
    ctx.addIssue({ code: "custom", path: ["area3"], message: "no third choice without a second" });
  }

  // Duplicate check walks the choices in priority order and flags the
  // *later* occurrence — pairing each value with its own field path first,
  // rather than filtering unchosen slots out of an array, which would
  // otherwise shift area3 into area2's position the moment area2 is empty.
  const chosen: Array<{ path: "area1" | "area2" | "area3"; value: string }> = [
    { path: "area1", value: data.area1 },
  ];
  if (area2Chosen) chosen.push({ path: "area2", value: data.area2 as string });
  if (area3Chosen) chosen.push({ path: "area3", value: data.area3 as string });

  const seen = new Set<string>();
  for (const entry of chosen) {
    if (seen.has(entry.value)) {
      ctx.addIssue({ code: "custom", path: [entry.path], message: "duplicate area" });
    }
    seen.add(entry.value);
  }

  // Belt and braces: the checkbox UI can't itself produce a duplicate, but
  // a direct request to the API route could still supply one.
  if (data.departments) {
    const seenDepartments = new Set<string>();
    for (const department of data.departments) {
      if (seenDepartments.has(department)) {
        ctx.addIssue({ code: "custom", path: ["departments"], message: "duplicate department" });
        break;
      }
      seenDepartments.add(department);
    }
  }

  // The four CV fields are only ever populated together, by the same
  // successful upload() call (ApplicationForm.tsx) — a request with some
  // but not all of them has either been tampered with or hit a client bug,
  // and either way shouldn't be treated as "no CV attached".
  const cvFieldValues = [data.cvBlobUrl, data.cvPathname, data.cvOriginalFilename, data.cvSizeBytes];
  const cvFieldsPresent = cvFieldValues.filter((value) => value !== undefined).length;
  if (cvFieldsPresent > 0 && cvFieldsPresent < cvFieldValues.length) {
    ctx.addIssue({ code: "custom", path: ["cvPathname"], message: "incomplete cv upload data" });
  }
  if (CV_REQUIRED && cvFieldsPresent === 0) {
    ctx.addIssue({ code: "custom", path: ["cvPathname"], message: "cv required" });
  }
}

// The schema react-hook-form's zodResolver actually validates against.
// applicationFormSchema stays unrefined (see its own comment) so
// apiSchemas.ts can still extend it before applying this same refinement.
export const validatedApplicationFormSchema = applicationFormSchema.superRefine(refineApplicationForm);

// Two distinct shapes because of `z.coerce.number()`: react-hook-form's
// `useForm` needs the *input* shape (semester/availabilityHours as the raw
// string a number input produces) for its field-values generic, while
// `onSubmit` receives the *output* shape (coerced to number) after
// zodResolver runs. Passing one type for both would make TypeScript reject
// the resolver — see react-hook-form's own generic form
// `useForm<Input, Context, Output>`. superRefine doesn't change the parsed
// shape, so these stay accurate whether read off applicationFormSchema or
// validatedApplicationFormSchema.
export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;

export type ApplicationAreaChoice = { priority: 1 | 2 | 3; areaLabel: string; reason: string };

// Assembles the three flat, form-shaped fields into the ordered list
// lib/db.ts's insertApplication writes to application_area_choices — the
// one place this reshaping happens, so the route, the CSV export, and the
// PDF all read the same priority-ordered shape instead of three each
// re-deriving it from area1/area2/area3 themselves. Only meaningful to
// call on data that already passed refineApplicationForm (gapless, no
// duplicates) — it does not re-check either rule.
export function toAreaChoices(data: {
  area1: string;
  area1Reason: string;
  area2?: string;
  area2Reason?: string;
  area3?: string;
  area3Reason?: string;
}): ApplicationAreaChoice[] {
  const choices: ApplicationAreaChoice[] = [{ priority: 1, areaLabel: data.area1, reason: data.area1Reason }];
  if (data.area2 && data.area2Reason) {
    choices.push({ priority: 2, areaLabel: data.area2, reason: data.area2Reason });
  }
  if (data.area3 && data.area3Reason) {
    choices.push({ priority: 3, areaLabel: data.area3, reason: data.area3Reason });
  }
  return choices;
}
