"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { Link } from "@/lib/navigation";
import {
  applicationFormSchema,
  type ApplicationFormInput,
  type ApplicationFormValues,
} from "@/lib/applicationFormSchema";
import { MIN_FILL_MS } from "@/lib/antiSpam";
import { postJson } from "@/lib/submitForm";
import { board } from "@/content/board";
import { projects } from "@/content/projects";

const CONTACT_EMAIL = "teamvorstand@unimannheim.enactus.team";

export { MIN_FILL_MS };

const desiredAreaOptions = [
  ...projects.filter((project) => project.status === "active").map((project) => project.name),
  ...Array.from(new Set(board.map((member) => member.role))),
];

type SubmitState = "idle" | "pending" | "success" | "error";

// Every field is validated for real via applicationFormSchema, client-side,
// and the exact same schema is re-run server-side in /api/bewerbung — this
// component never trusts its own validation as the last word. Honeypot and
// timing check both fail silently (no state change at all): a bot gets no
// error to learn from, and a real applicant should never be able to trigger
// either one. `formRenderedAt` rides along outside react-hook-form's own
// state, added at submit time, so the API route can re-check the same
// minimum-fill-time signal — a client-only check is trivial to bypass by
// calling the route directly.
export function ApplicationForm() {
  const t = useTranslations("MitmachenPage.application.form");
  const locale = useLocale();
  const [state, setState] = useState<SubmitState>("idle");
  // Set in an effect, not the useRef initializer: reading the clock is an
  // impure call, and doing that directly during render (as a useRef
  // initializer runs) is flagged by react-hooks/purity even though the
  // value is only ever read later, from an event handler.
  const mountedAt = useRef<number | null>(null);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormInput, unknown, ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
  });

  // Honeypot enforcement lives entirely in applicationFormSchema (`website`
  // must be empty) — handleSubmit simply won't call this for a filled one.
  // The timing check reads `mountedAt.current` and only gates the actual
  // submit, not validation itself — a too-fast submit of a genuinely
  // invalid form still has to show the normal field errors, not silently do
  // nothing.
  async function onSubmit(data: ApplicationFormValues) {
    if (mountedAt.current === null || Date.now() - mountedAt.current < MIN_FILL_MS) return;
    setState("pending");
    const result = await postJson("/api/bewerbung", { ...data, locale, formRenderedAt: mountedAt.current });
    if (result.ok) {
      setState("success");
      reset();
    } else {
      setState("error");
    }
  }

  // A plain function reference assigned to the form's `onSubmit` prop, not
  // `handleSubmit(onSubmit)` called directly in JSX: that call happens
  // during render, and react-hooks/refs flags any function reachable from
  // there that reads a ref (`onSubmit` does, via `mountedAt`) as a possible
  // read-during-render. Deferring the `handleSubmit(onSubmit)` call itself
  // into a handler that only runs at actual submit time avoids that.
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    void handleSubmit(onSubmit)(event);
  }

  if (state === "success") {
    return <FormStatusMessage variant="success">{t("submitSuccess")}</FormStatusMessage>;
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-8">
      <h3 className="text-heading-2 font-display">{t("heading")}</h3>

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
      <Field label={t("universityLabel")} error={errors.university && t("universityError")} {...register("university")} />

      <Field
        as="textarea"
        label={t("priorInvolvementLabel")}
        hint={t("priorInvolvementHint")}
        error={errors.priorInvolvement && t("priorInvolvementError")}
        {...register("priorInvolvement")}
      />
      <Field
        as="textarea"
        label={t("languagesSkillsLabel")}
        hint={t("languagesSkillsHint")}
        error={errors.languagesSkills && t("languagesSkillsError")}
        {...register("languagesSkills")}
      />
      <Field
        as="textarea"
        label={t("motivationLabel")}
        hint={t("motivationHint")}
        error={errors.motivation && t("motivationError")}
        {...register("motivation")}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-body-s font-medium text-ink">{t("desiredAreasLabel")}</legend>
        <p className="text-body-s opacity-60">{t("desiredAreasHint")}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {desiredAreaOptions.map((area) => (
            <label key={area} className="flex items-center gap-2 text-body-s">
              <input
                type="checkbox"
                value={area}
                className="size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
                {...register("desiredAreas")}
              />
              {area}
            </label>
          ))}
        </div>
        {errors.desiredAreas && (
          <p className="flex items-center gap-2 text-body-s text-oxblood">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {t("desiredAreasError")}
          </p>
        )}
      </fieldset>

      <Field
        label={t("availabilityLabel")}
        type="number"
        min={1}
        max={80}
        error={errors.availabilityHours && t("availabilityError")}
        {...register("availabilityHours")}
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
        <FormStatusMessage variant="error">{t("submitError", { email: CONTACT_EMAIL })}</FormStatusMessage>
      )}

      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
