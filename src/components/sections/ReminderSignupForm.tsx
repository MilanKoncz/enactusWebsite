"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Link } from "@/lib/navigation";
import { reminderSignupSchema, type ReminderSignupValues } from "@/lib/reminderSignupSchema";

// STUB: no API route exists yet — the double opt-in flow lands with the
// backend in Phase 4 (docs/engineering.md). Every field above is validated
// for real via reminderSignupSchema; only the actual network call is
// missing. Same honest-stub contract as ContactForm.tsx: on a valid submit
// this resets the form and shows a plain notice instead of a fake
// confirmation, since no confirmation email can actually go out yet.
export function ReminderSignupForm() {
  const t = useTranslations("MitmachenPage.application.reminder");
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderSignupValues>({
    resolver: zodResolver(reminderSignupSchema),
  });

  function onSubmit(data: ReminderSignupValues) {
    void data;
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-md border-l-2 border-dashed border-gold py-1 pl-4">
        <p className="text-body-m">{t("submitStubNotice")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <h4 className="text-heading-3 font-display">{t("heading")}</h4>
      <p className="text-body-m opacity-80">{t("lead")}</p>
      <Field
        label={t("emailLabel")}
        type="email"
        autoComplete="email"
        error={errors.email && t("emailError")}
        {...register("email")}
      />
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "reminder-consent-error" : undefined}
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
            {...register("consent")}
          />
          <span>
            {t("consentPrefix")}{" "}
            <Link href="/datenschutz" className="link-underline">
              {t("consentLinkLabel")}
            </Link>
            {t("consentSuffix")}
          </span>
        </label>
        {errors.consent && (
          <p id="reminder-consent-error" className="text-body-s text-oxblood">
            {t("consentError")}
          </p>
        )}
      </div>
      <Button type="submit" className="self-start">
        {t("submitLabel")}
      </Button>
    </form>
  );
}
