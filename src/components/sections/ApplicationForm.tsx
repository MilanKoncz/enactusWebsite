"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { Link } from "@/lib/navigation";
import {
  CV_REQUIRED,
  MAX_DEPARTMENTS,
  MOTIVATION_MAX,
  WANT_TO_GAIN_MAX,
  validatedApplicationFormSchema,
  type ApplicationFormInput,
  type ApplicationFormValues,
} from "@/lib/applicationFormSchema";
import { MIN_FILL_MS } from "@/lib/antiSpam";
import { postJson } from "@/lib/submitForm";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { org } from "@/content/org";
import type { PublicProjectArea } from "@/lib/projectAreas";
import type { PublicDepartment } from "@/lib/departments";

export { MIN_FILL_MS };

type SubmitState = "idle" | "pending" | "success" | "error";
type CvUploadState = "idle" | "uploading" | "uploaded";
type CvUploadErrorCode = "tooLarge" | "wrongType" | "uploadFailed" | "rateLimited";

// 4 MB, matching applicationFormSchema.ts's own CV_MAX_SIZE_BYTES and
// /api/bewerbung/cv-upload's maximumSizeInBytes — checked here too so a
// visitor learns the file is too large immediately, not after a round
// trip to the upload route only to have it reject the same thing.
const CV_MAX_SIZE_BYTES = 4 * 1024 * 1024;

// Every field is validated for real via applicationFormSchema, client-side,
// and the exact same schema is re-run server-side in /api/bewerbung — this
// component never trusts its own validation as the last word. Honeypot and
// timing check both fail silently (no state change at all): a bot gets no
// error to learn from, and a real applicant should never be able to trigger
// either one. `formToken` rides along outside react-hook-form's own state —
// fetched once from GET /api/bewerbung/token when this component mounts and
// attached at submit time, so /api/bewerbung can verify the real elapsed
// fill time itself (lib/formToken.ts) instead of trusting a client-supplied
// number, which is trivial to fake by calling the route directly.
export function ApplicationForm({
  projectAreas: initialProjectAreas,
  departments: initialDepartments,
}: {
  projectAreas: PublicProjectArea[];
  departments: PublicDepartment[];
}) {
  const t = useTranslations("MitmachenPage.application.form");
  const locale = useLocale();
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const successRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  // Fetched in an effect, not read during render: it's a network call, and
  // the token only needs to exist by the time a real applicant (who still
  // has to fill in several required fields first) reaches the submit
  // button — there's no need to block rendering the form on it. Also the
  // one credential the CV-upload route requires (onBeforeGenerateToken),
  // so a 429 here is tracked separately from the silent anti-spam paths —
  // this route being rate-limited is a real, visible problem for a
  // genuine applicant, not a spam signal to hide.
  const formToken = useRef<string | null>(null);
  const [tokenRateLimited, setTokenRateLimited] = useState(false);
  useEffect(() => {
    fetch("/api/bewerbung/token")
      .then((response) => {
        if (response.status === 429) {
          setTokenRateLimited(true);
          return null;
        }
        return response.ok ? response.json() : null;
      })
      .then((body: { token?: string } | null) => {
        if (body?.token) formToken.current = body.token;
      })
      .catch(() => {
        // Left as null — onSubmit below treats a missing token exactly
        // like a too-fast submission (silent no-op) unless it's the
        // 429 case above. A same-origin GET with no external dependency
        // failing at all would mean the site itself is unreachable, at
        // which point the real submit would fail the same way regardless.
      });
  }, []);
  // Same "prefer the fresh fetch, fall back to the build-time prop" shape
  // as MitmachenApplication's own recruitingWindows handling — GET
  // /api/project-areas is the seam e2e tests can intercept with
  // page.route(), which a value baked into the static page at build time
  // can't be.
  const [projectAreas, setProjectAreas] = useState(initialProjectAreas);
  useEffect(() => {
    fetch("/api/project-areas")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { areas?: PublicProjectArea[] } | null) => {
        if (body?.areas) setProjectAreas(body.areas);
      })
      .catch(() => {
        // Left as the build-time prop — same reasoning as the recruiting-
        // windows fetch above.
      });
  }, []);
  const areaOptions = projectAreas.map((area) => (locale === "de" ? area.labelDe : area.labelEn));

  // Same "prefer the fresh fetch, fall back to the build-time prop" shape
  // as the project-areas fetch above, and the same reasoning: the seam
  // e2e tests intercept with page.route(), which a value baked into the
  // static page at build time can't be.
  const [departments, setDepartments] = useState(initialDepartments);
  useEffect(() => {
    fetch("/api/departments")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { departments?: PublicDepartment[] } | null) => {
        if (body?.departments) setDepartments(body.departments);
      })
      .catch(() => {
        // Left as the build-time prop — same reasoning as the recruiting-
        // windows fetch above.
      });
  }, []);
  const departmentOptions = departments.map((department) => {
    const label = locale === "de" ? department.labelDe : department.labelEn;
    return { value: label, label };
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormInput, unknown, ApplicationFormValues>({
    resolver: zodResolver(validatedApplicationFormSchema),
    defaultValues: { departments: [] },
  });

  // Watched, not read via getValues(): the three dropdowns hide whatever
  // the *other two* have already chosen (so no combination of clicks can
  // ever produce a duplicate), and each choice's reason field only
  // appears once that choice itself is non-empty — both need to
  // re-render as the visitor picks, not just at submit time.
  const area1 = useWatch({ control, name: "area1" });
  const area2 = useWatch({ control, name: "area2" });
  const area3 = useWatch({ control, name: "area3" });

  function areaOptionsExcluding(...chosenElsewhere: Array<string | undefined>) {
    return areaOptions.filter((area) => !chosenElsewhere.includes(area));
  }

  // Confetti burst, same as ContactForm.tsx (ConfettiBurst) — origin is the
  // success message's own rendered position, read right after it mounts.
  // Only on a genuine successful submit — never on error, never while
  // pending, and never under reduced motion — and the announced
  // confirmation text (FormStatusMessage below) is unaffected either way;
  // the burst is purely decorative and aria-hidden.
  useEffect(() => {
    if (state !== "success" || reducedMotion) return;
    const rect = successRef.current?.getBoundingClientRect();
    if (rect) setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, [state, reducedMotion]);

  const handleBurstDone = useCallback(() => setBurst(null), []);

  const [cvUploadState, setCvUploadState] = useState<CvUploadState>("idle");
  const [cvUploadError, setCvUploadError] = useState<CvUploadErrorCode | undefined>(undefined);
  const [cvFileName, setCvFileName] = useState<string | undefined>(undefined);
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // The CV fields (cvBlobUrl/cvPathname/cvOriginalFilename/cvSizeBytes)
  // are never rendered as visible inputs — they're set here, all four
  // together, once upload() actually resolves. react-hook-form still
  // includes them in the submitted data because setValue writes straight
  // into its internal store; nothing about that requires a registered DOM
  // element. { shouldValidate: true } clears a standing "CV required"
  // error the moment a real upload lands.
  async function handleCvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be re-selected after an error
    if (!file) return;

    setCvUploadError(undefined);

    if (file.type !== "application/pdf") {
      setCvUploadError("wrongType");
      return;
    }
    if (file.size > CV_MAX_SIZE_BYTES) {
      setCvUploadError("tooLarge");
      return;
    }

    const token = formToken.current;
    if (!token) {
      // A missing token because /api/bewerbung/token itself was
      // rate-limited blocks the upload immediately, not just the eventual
      // submit — CV_REQUIRED means there's no valid submission to reach
      // otherwise, so this is the point that actually needs to tell the
      // applicant what's wrong, not a generic upload failure.
      setCvUploadError(tokenRateLimited ? "rateLimited" : "uploadFailed");
      return;
    }

    setCvUploadState("uploading");
    try {
      // A fixed, neutral pathname — never the applicant's own filename —
      // so no name ever appears in the blob's URL, even before the
      // upload route's own addRandomSuffix makes it unique. The real
      // filename travels separately, as cvOriginalFilename.
      const blob = await upload("bewerbungen/lebenslauf.pdf", file, {
        access: "private",
        handleUploadUrl: "/api/bewerbung/cv-upload",
        clientPayload: JSON.stringify({ formToken: token }),
      });
      setValue("cvBlobUrl", blob.url, { shouldValidate: true });
      setValue("cvPathname", blob.pathname, { shouldValidate: true });
      setValue("cvOriginalFilename", file.name, { shouldValidate: true });
      setValue("cvSizeBytes", file.size, { shouldValidate: true });
      setCvFileName(file.name);
      setCvUploadState("uploaded");
    } catch (error) {
      console.error("CV upload failed", error);
      setCvUploadError("uploadFailed");
      setCvUploadState("idle");
    }
  }

  function handleCvRemove() {
    setValue("cvBlobUrl", undefined, { shouldValidate: true });
    setValue("cvPathname", undefined, { shouldValidate: true });
    setValue("cvOriginalFilename", undefined, { shouldValidate: true });
    setValue("cvSizeBytes", undefined, { shouldValidate: true });
    setCvFileName(undefined);
    setCvUploadState("idle");
    setCvUploadError(undefined);
  }

  // Honeypot enforcement lives entirely in applicationFormSchema (`website`
  // must be empty) — handleSubmit simply won't call this for a filled one.
  // The timing check reads the token's own plaintext issue time (the part
  // before the first ".") and only gates the actual submit, not validation
  // itself — a too-fast submit of a genuinely invalid form still has to
  // show the normal field errors, not silently do nothing. This is only a
  // pre-flight courtesy to avoid an unnecessary request: /api/bewerbung
  // re-checks the same threshold against the token's signature, which this
  // component has no way to verify itself.
  async function onSubmit(data: ApplicationFormValues) {
    const token = formToken.current;
    if (!token) {
      // A missing token because the issuing route itself was rate-limited
      // is a real, visible problem — everything else that can leave the
      // token unset (still loading, a same-origin network hiccup) stays a
      // silent no-op, same anti-spam parity as an invalid or too-fast
      // token from /api/bewerbung's own response.
      if (tokenRateLimited) {
        setSubmitError("rate_limited");
        setState("error");
      }
      return;
    }
    const issuedAt = Number(token.slice(0, token.indexOf(".")));
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt < MIN_FILL_MS) return;
    setState("pending");
    const result = await postJson("/api/bewerbung", { ...data, locale, formToken: token });
    if (result.ok) {
      setState("success");
      reset();
      handleCvRemove();
    } else {
      setSubmitError(result.error);
      setState("error");
    }
  }

  // A plain function reference assigned to the form's `onSubmit` prop, not
  // `handleSubmit(onSubmit)` called directly in JSX: that call happens
  // during render, and react-hooks/refs flags any function reachable from
  // there that reads a ref (`onSubmit` does, via `formToken`) as a possible
  // read-during-render. Deferring the `handleSubmit(onSubmit)` call itself
  // into a handler that only runs at actual submit time avoids that.
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    void handleSubmit(onSubmit)(event);
  }

  if (state === "success") {
    return (
      <div ref={successRef}>
        <FormStatusMessage variant="success">{t("submitSuccess")}</FormStatusMessage>
        {burst && <ConfettiBurst originX={burst.x} originY={burst.y} onDone={handleBurstDone} />}
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-8">
      <h3 className="text-heading-2 font-display font-normal!">{t("heading")}</h3>

      <input
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label={t("firstNameLabel")} autoComplete="given-name" error={errors.firstName && t("firstNameError")} {...register("firstName")} />
        <Field label={t("lastNameLabel")} autoComplete="family-name" error={errors.lastName && t("lastNameError")} {...register("lastName")} />
      </div>
      <Field label={t("emailLabel")} type="email" autoComplete="email" error={errors.email && t("emailError")} {...register("email")} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Field
          label={t("studyProgramLabel")}
          containerClassName="sm:col-span-2"
          error={errors.studyProgram && t("studyProgramError")}
          {...register("studyProgram")}
        />
        <Field
          label={t("semesterLabel")}
          type="number"
          min={1}
          max={20}
          error={errors.semester && t("semesterError")}
          {...register("semester")}
        />
      </div>

      <Field
        label={t("availabilityLabel")}
        type="number"
        min={1}
        max={80}
        error={errors.availabilityHours && t("availabilityError")}
        {...register("availabilityHours")}
      />

      {/* Three fixed dropdowns, not a checkbox list or a drag-and-drop
          reorder — the priority itself is the input, so there's nothing
          to reorder, and a fixed cardinality of three doesn't need
          react-hook-form's field-array machinery. Each dropdown hides
          whatever the *other two* currently hold, so no click sequence
          can ever produce a duplicate; the reason field for a slot only
          appears once that slot itself has a value. */}
      <fieldset className="flex flex-col gap-6">
        <legend className="text-body-s font-medium text-ink">{t("areasLabel")}</legend>
        <p className="text-body-s opacity-60">{t("areasHint")}</p>

        <div className="flex flex-col gap-3">
          <Field as="select" label={t("area1Label")} error={errors.area1 && t("area1Error")} {...register("area1")}>
            <option value="">{t("areaPlaceholder")}</option>
            {areaOptionsExcluding(area2, area3).map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Field>
          {area1 && (
            <Field
              as="textarea"
              label={t("areaReasonLabel")}
              hint={t("areaReasonHint")}
              showCount
              maxLength={300}
              error={errors.area1Reason && t("area1ReasonError")}
              {...register("area1Reason")}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Field as="select" label={t("area2Label")} error={errors.area2 && t("area2Error")} {...register("area2")}>
            <option value="">{t("areaPlaceholder")}</option>
            {areaOptionsExcluding(area1, area3).map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Field>
          {area2 && (
            <Field
              as="textarea"
              label={t("areaReasonLabel")}
              hint={t("areaReasonHint")}
              showCount
              maxLength={300}
              error={errors.area2Reason && t("area2ReasonError")}
              {...register("area2Reason")}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Field as="select" label={t("area3Label")} error={errors.area3 && t("area3Error")} {...register("area3")}>
            <option value="">{t("areaPlaceholder")}</option>
            {areaOptionsExcluding(area1, area2).map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Field>
          {area3 && (
            <Field
              as="textarea"
              label={t("areaReasonLabel")}
              hint={t("areaReasonHint")}
              showCount
              maxLength={300}
              error={errors.area3Reason && t("area3ReasonError")}
              {...register("area3Reason")}
            />
          )}
        </div>
      </fieldset>

      {/* A separate, unranked, optional category from the Wunschbereich
          fieldset above — see applicationFormSchema.ts's own comment on
          why a Ressort can't just be a fourth priority. Controller, not
          register(), because react-hook-form's own multi-checkbox
          convention (several boxes sharing one registered name) collapses
          to a single boolean rather than an array once there's only one
          option — exactly the shape a short Ressort list can hit. */}
      <Controller
        control={control}
        name="departments"
        render={({ field }) => {
          const selected = field.value ?? [];
          return (
            <CheckboxGroup
              legend={t("departmentsLabel")}
              hint={t("departmentsHint", { max: MAX_DEPARTMENTS })}
              error={errors.departments && t("departmentsError", { max: MAX_DEPARTMENTS })}
              options={departmentOptions}
              value={selected}
              onChange={field.onChange}
              max={MAX_DEPARTMENTS}
              countLabel={t("departmentsCountLabel", { count: selected.length, max: MAX_DEPARTMENTS })}
            />
          );
        }}
      />

      {/* File input stays in the DOM (not conditionally unmounted) so a
          screen reader's reference to it via the button's own click
          delegation never goes stale — only visually hidden. */}
      <div className="flex flex-col gap-2">
        <span className="text-body-s font-medium text-ink">
          {t("cvLabel")}
          {CV_REQUIRED && " *"}
        </span>
        <p className="text-body-s opacity-60">{t("cvHint")}</p>
        <input
          ref={cvFileInputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label={t("cvLabel")}
          onChange={handleCvFileChange}
        />
        {/* Registered (not just set via setValue) so react-hook-form's
            resolver-error filtering — which only surfaces an error for a
            field it knows about — actually reports the schema's "CV
            required" issue (attached to cvPathname's path) as
            errors.cvPathname below. setValue still does all the real
            writing, in handleCvFileChange/handleCvRemove; these hidden
            inputs exist purely so the field is "known". */}
        <input type="hidden" {...register("cvBlobUrl")} />
        <input type="hidden" {...register("cvPathname")} />
        <input type="hidden" {...register("cvOriginalFilename")} />
        <input type="hidden" {...register("cvSizeBytes")} />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={cvUploadState === "uploading"}
            onClick={() => cvFileInputRef.current?.click()}
          >
            {cvUploadState === "uploading"
              ? t("cvUploadingLabel")
              : cvUploadState === "uploaded"
                ? t("cvReplaceLabel")
                : t("cvSelectLabel")}
          </Button>
          {cvUploadState === "uploaded" && cvFileName && (
            <>
              <span className="text-body-s text-ink">{t("cvUploadedLabel", { filename: cvFileName })}</span>
              <button type="button" onClick={handleCvRemove} className="link-underline text-body-s">
                {t("cvRemoveLabel")}
              </button>
            </>
          )}
        </div>
        {cvUploadError === "tooLarge" && <p className="text-body-s text-oxblood">{t("cvErrorTooLarge")}</p>}
        {cvUploadError === "wrongType" && <p className="text-body-s text-oxblood">{t("cvErrorWrongType")}</p>}
        {cvUploadError === "uploadFailed" && <p className="text-body-s text-oxblood">{t("cvErrorUploadFailed")}</p>}
        {cvUploadError === "rateLimited" && <p className="text-body-s text-oxblood">{t("submitRateLimited")}</p>}
        {!cvUploadError && errors.cvPathname && <p className="text-body-s text-oxblood">{t("cvErrorRequired")}</p>}
      </div>

      <Field
        as="textarea"
        label={t("motivationLabel")}
        hint={t("motivationHint", { max: MOTIVATION_MAX })}
        showCount
        maxLength={MOTIVATION_MAX}
        truncatedMessage={t("textTruncatedNotice", { max: MOTIVATION_MAX })}
        error={errors.motivation && t("motivationError")}
        {...register("motivation")}
      />
      <Field
        as="textarea"
        label={t("priorInvolvementLabel")}
        hint={t("priorInvolvementHint")}
        showCount
        maxLength={600}
        error={errors.priorInvolvement && t("priorInvolvementError")}
        {...register("priorInvolvement")}
      />
      <Field
        as="textarea"
        label={t("languagesSkillsLabel")}
        hint={t("languagesSkillsHint")}
        placeholder={t("languagesSkillsPlaceholder")}
        showCount
        maxLength={200}
        error={errors.languagesSkills && t("languagesSkillsError")}
        {...register("languagesSkills")}
      />
      <Field
        as="textarea"
        label={t("wantToGainLabel")}
        hint={t("wantToGainHint", { max: WANT_TO_GAIN_MAX })}
        showCount
        maxLength={WANT_TO_GAIN_MAX}
        error={errors.wantToGain && t("wantToGainError", { max: WANT_TO_GAIN_MAX })}
        {...register("wantToGain")}
      />

      <Field label={t("heardAboutLabel")} {...register("heardAboutUs")} />

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "application-consent-error" : undefined}
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
            {...register("consent")}
          />
          <span>
            {t("consentPrefix")}{" "}
            <Link href="/datenschutz" className="link-underline">
              {t("consentLinkLabel")}
            </Link>{" "}
            {t("consentSuffix")}
          </span>
        </label>
        {errors.consent && (
          <p id="application-consent-error" className="text-body-s text-oxblood">
            {t("consentError")}
          </p>
        )}
      </div>

      {state === "error" && (
        <FormStatusMessage variant="error">
          {submitError === "window_closed"
            ? t("submitWindowClosed")
            : submitError === "form_expired"
              ? t("submitFormExpired")
              : submitError === "rate_limited"
                ? t("submitRateLimited")
                : t("submitError", { email: org.contactEmails.board })}
        </FormStatusMessage>
      )}

      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
