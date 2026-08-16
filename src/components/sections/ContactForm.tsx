"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { contactFormSchema, type ContactFormValues } from "@/lib/contactFormSchema";
import { postJson } from "@/lib/submitForm";

const CONTACT_EMAIL = "teamvorstand@unimannheim.enactus.team";

type SubmitState = "idle" | "pending" | "success" | "error";

// Every field is validated for real via contactFormSchema, client-side, and
// the exact same schema is re-run server-side in /api/kontakt. On success
// the form resets and shows a plain confirmation; on failure it stays
// filled in and shows an error with a direct mailto fallback, so nothing
// typed is lost.
export function ContactForm() {
  const t = useTranslations("KontaktPage.form");
  const locale = useLocale();
  const [state, setState] = useState<SubmitState>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(data: ContactFormValues) {
    setState("pending");
    const result = await postJson("/api/kontakt", { ...data, locale });
    if (result.ok) {
      setState("success");
      reset();
    } else {
      setState("error");
    }
  }

  if (state === "success") {
    return <FormStatusMessage variant="success">{t("submitSuccess")}</FormStatusMessage>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Field
        label={t("nameLabel")}
        autoComplete="name"
        error={errors.name && t("nameError")}
        {...register("name")}
      />
      <Field
        label={t("emailLabel")}
        type="email"
        autoComplete="email"
        error={errors.email && t("emailError")}
        {...register("email")}
      />
      <Field
        label={t("subjectLabel")}
        error={errors.subject && t("subjectError")}
        {...register("subject")}
      />
      <Field
        as="textarea"
        label={t("messageLabel")}
        error={errors.message && t("messageError")}
        {...register("message")}
      />
      {state === "error" && (
        <FormStatusMessage variant="error">{t("submitError", { email: CONTACT_EMAIL })}</FormStatusMessage>
      )}
      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
