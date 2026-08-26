"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { Link } from "@/lib/navigation";
import {
  ideathonSignupFormSchema,
  type IdeathonSignupFormInput,
  type IdeathonSignupFormValues,
} from "@/lib/ideathonSignupFormSchema";
import { MIN_FILL_MS } from "@/lib/antiSpam";
import { postJson } from "@/lib/submitForm";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { org } from "@/content/org";

type SubmitState = "idle" | "pending" | "success" | "error";

/**
 * The Ideathon's own signup form — same plumbing as ApplicationForm.tsx
 * (shared Zod schema validated client and server, honeypot, signed timing
 * token, confetti on success), a separate component and a separate route
 * (/api/ideathon) rather than a variant bolted onto /mitmachen's form.
 */
export function IdeathonSignupForm() {
  const t = useTranslations("IdeathonPage.form");
  const locale = useLocale();
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const successRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  const formToken = useRef<string | null>(null);
  useEffect(() => {
    fetch("/api/ideathon/token")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { token?: string } | null) => {
        if (body?.token) formToken.current = body.token;
      })
      .catch(() => {
        // Left as null — onSubmit below treats a missing token exactly like
        // a too-fast submission (silent no-op), same as ApplicationForm.tsx.
      });
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdeathonSignupFormInput, unknown, IdeathonSignupFormValues>({
    resolver: zodResolver(ideathonSignupFormSchema),
    // dietaryPreference is left out here on purpose: the placeholder
    // <option value=""> below is the field's only default, uncontrolled
    // through the native select — it forces a visitor to actively pick one
    // of the six choices (including "keine Angabe") rather than the form
    // silently assuming "omnivor" for someone who skipped the field.
    defaultValues: { hasIdea: false, registeringAsTeam: false },
  });
  // useWatch, not the form instance's own watch() — the latter returns a
  // closure the React Compiler can't safely memoize (confirmed by an
  // eslint react-hooks/incompatible-library warning), while useWatch is a
  // dedicated hook built for exactly this per-field subscription.
  const hasIdea = useWatch({ control, name: "hasIdea" });
  const registeringAsTeam = useWatch({ control, name: "registeringAsTeam" });

  useEffect(() => {
    if (state !== "success" || reducedMotion) return;
    const rect = successRef.current?.getBoundingClientRect();
    if (rect) setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, [state, reducedMotion]);

  const handleBurstDone = useCallback(() => setBurst(null), []);

  async function onSubmit(data: IdeathonSignupFormValues) {
    const token = formToken.current;
    const issuedAt = token ? Number(token.slice(0, token.indexOf("."))) : NaN;
    if (!token || !Number.isFinite(issuedAt) || Date.now() - issuedAt < MIN_FILL_MS) return;
    setState("pending");
    const result = await postJson("/api/ideathon", { ...data, locale, formToken: token });
    if (result.ok) {
      setState("success");
      reset();
    } else {
      setSubmitError(result.error);
      setState("error");
    }
  }

  // Deferred into a handler, not called directly in JSX — same
  // react-hooks/purity reasoning as ApplicationForm.tsx's own comment.
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
        as="textarea"
        label={t("motivationExperienceLabel")}
        hint={t("motivationExperienceHint")}
        maxLength={1000}
        error={errors.motivationExperience && t("motivationExperienceError")}
        {...register("motivationExperience")}
      />

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
            {...register("hasIdea")}
          />
          <span>{t("hasIdeaLabel")}</span>
        </label>
        {hasIdea && (
          <Field
            as="textarea"
            label={t("ideaDescriptionLabel")}
            hint={t("ideaDescriptionHint")}
            maxLength={1000}
            error={errors.ideaDescription && t("ideaDescriptionError")}
            {...register("ideaDescription")}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
            {...register("registeringAsTeam")}
          />
          <span>{t("registeringAsTeamLabel")}</span>
        </label>
        {registeringAsTeam && (
          <>
            <Field
              label={t("teamSizeLabel")}
              type="number"
              min={1}
              max={50}
              error={errors.teamSize && t("teamSizeError")}
              {...register("teamSize")}
            />
            <Field
              label={t("teamMembersLabel")}
              hint={t("teamMembersHint")}
              maxLength={300}
              error={errors.teamMembers && t("teamMembersError")}
              {...register("teamMembers")}
            />
          </>
        )}
      </div>

      <Field
        as="select"
        label={t("dietaryPreferenceLabel")}
        hint={t("dietaryPreferenceHint", { email: org.contactEmails.board })}
        error={errors.dietaryPreference && t("dietaryPreferenceError")}
        defaultValue=""
        {...register("dietaryPreference")}
      >
        <option value="" disabled>
          {t("dietaryPreferencePlaceholder")}
        </option>
        <option value="omnivore">{t("dietaryPreferenceOmnivore")}</option>
        <option value="vegetarian">{t("dietaryPreferenceVegetarian")}</option>
        <option value="vegan">{t("dietaryPreferenceVegan")}</option>
        <option value="halal">{t("dietaryPreferenceHalal")}</option>
        <option value="kosher">{t("dietaryPreferenceKosher")}</option>
        <option value="noAnswer">{t("dietaryPreferenceNoAnswer")}</option>
      </Field>

      <Field label={t("heardAboutLabel")} {...register("heardAboutUs")} />

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "ideathon-consent-error" : undefined}
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
          <p id="ideathon-consent-error" className="text-body-s text-oxblood">
            {t("consentError")}
          </p>
        )}
      </div>

      {state === "error" && (
        <FormStatusMessage variant="error">
          {submitError === "signup_closed"
            ? t("submitSignupClosed")
            : submitError === "form_expired"
              ? t("submitFormExpired")
              : t("submitError", { email: org.contactEmails.board })}
        </FormStatusMessage>
      )}

      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
