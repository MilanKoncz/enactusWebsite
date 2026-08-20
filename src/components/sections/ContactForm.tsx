"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { contactFormSchema, type ContactFormValues } from "@/lib/contactFormSchema";
import { postJson } from "@/lib/submitForm";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { org } from "@/content/org";

type SubmitState = "idle" | "pending" | "success" | "error";

// Every field is validated for real via contactFormSchema, client-side, and
// the exact same schema is re-run server-side in /api/kontakt. On success
// the form resets and shows a plain confirmation; on failure it stays
// filled in and shows an error with a direct mailto fallback, so nothing
// typed is lost.
export function ContactForm() {
  const t = useTranslations("KontaktPage.form");
  const locale = useLocale();
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<SubmitState>("idle");
  const successRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
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

  // Easter egg 4/7 (docs/eastereggs.md): the same confetti burst the hero
  // logo's triple-click uses (ConfettiBurst), reused rather than a second
  // effect — origin is the success message's own rendered position, read
  // right after it mounts. Only on a genuine successful submit — never on
  // error, never while pending, and never under reduced motion — and the
  // announced confirmation text (FormStatusMessage below) is unaffected
  // either way; the burst is purely decorative and aria-hidden.
  useEffect(() => {
    if (state !== "success" || reducedMotion) return;
    const rect = successRef.current?.getBoundingClientRect();
    if (rect) setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, [state, reducedMotion]);

  const handleBurstDone = useCallback(() => setBurst(null), []);

  if (state === "success") {
    return (
      <div ref={successRef}>
        <FormStatusMessage variant="success">{t("submitSuccess")}</FormStatusMessage>
        {burst && <ConfettiBurst originX={burst.x} originY={burst.y} onDone={handleBurstDone} />}
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
        <FormStatusMessage variant="error">
          {t("submitError", { email: org.contactEmails.board })}
        </FormStatusMessage>
      )}
      <Button type="submit" className="self-start" loading={state === "pending"}>
        {state === "pending" ? t("submitPending") : t("submitLabel")}
      </Button>
    </form>
  );
}
