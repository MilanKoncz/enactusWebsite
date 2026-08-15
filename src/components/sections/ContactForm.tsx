"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { contactFormSchema, type ContactFormValues } from "@/lib/contactFormSchema";

const CONTACT_EMAIL = "teamvorstand@unimannheim.enactus.team";

// STUB: no API route exists yet — it lands together with the backend (see
// docs/engineering.md and this repo's AUFGABE brief for /kontakt). Every
// field above is validated for real via contactFormSchema; only the actual
// network call is missing. On a valid submit this resets the form and shows
// an honest notice instead of a fake success message, and falls back to a
// direct mailto link — this project's design copy rule against apologizing
// still holds, but pretending a message was sent when it wasn't would be
// worse than not sending one. No honeypot/timing check either: those guard
// a real submission endpoint (docs/engineering.md has one for /mitmachen)
// and belong with the API route, not a form that goes nowhere yet.
export function ContactForm() {
  const t = useTranslations("KontaktPage.form");
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  function onSubmit(data: ContactFormValues) {
    void data;
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-md border-l-2 border-dashed border-gold py-1 pl-4"
      >
        <p className="text-body-m">{t("submitStubNotice", { email: CONTACT_EMAIL })}</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline w-fit text-body-m font-medium">
          {CONTACT_EMAIL}
        </a>
      </div>
    );
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
        hint={t("subjectHint")}
        error={errors.subject && t("subjectError")}
        {...register("subject")}
      />
      <Field
        as="textarea"
        label={t("messageLabel")}
        error={errors.message && t("messageError")}
        {...register("message")}
      />
      <Button type="submit" className="self-start">
        {t("submitLabel")}
      </Button>
    </form>
  );
}
