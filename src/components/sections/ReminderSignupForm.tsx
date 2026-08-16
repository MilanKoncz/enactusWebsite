"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Link } from "@/lib/navigation";
import { reminderSignupSchema, type ReminderSignupValues } from "@/lib/reminderSignupSchema";
import { postJson } from "@/lib/submitForm";

type SubmitState = "idle" | "pending" | "success" | "error";

// Every field is validated for real via reminderSignupSchema, client-side,
// and the exact same schema is re-run server-side in /api/reminder. A
// successful submit never means "you're subscribed" — it only means the
// confirmation email is on its way; the double opt-in itself only completes
// once that link is clicked (/api/reminder/bestaetigen).
export function ReminderSignupForm() {
  const t = useTranslations("MitmachenPage.application.reminder");
  const locale = useLocale();
  const [state, setState] = useState<SubmitState>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderSignupValues>({
    resolver: zodResolver(reminderSignupSchema),
  });

  async function onSubmit(data: ReminderSignupValues) {
    setState("pending");
    const result = await postJson("/api/reminder", { ...data, locale });
    if (result.ok) {
      setState("success");
      reset();
    } else {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-md border-l-2 border-dashed border-gold py-1 pl-4">
        <p className="text-body-m">{t("submitSuccess")}</p>
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
      {state === "error" && (
        <p role="alert" className="text-body-s text-oxblood">
          {t("submitError")}
        </p>
      )}
      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
