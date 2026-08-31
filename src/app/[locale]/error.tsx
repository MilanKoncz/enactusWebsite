"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { routes } from "@/content/navigation";

// Catches any error thrown while rendering a (site) page (or any other
// [locale] route without its own more specific boundary — admin/error.tsx
// is the specific one for /admin). Runs inside the root layout, so
// NextIntlClientProvider is already in scope and useTranslations works
// here same as anywhere else — unlike app/global-error.tsx, which replaces
// that layout entirely and can't rely on it.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section surface="ink" className="min-h-[70vh]">
      <Container className="flex flex-col items-center justify-center gap-6 text-center">
        <AlertTriangle aria-hidden="true" className="size-12 text-gold" strokeWidth={1.75} />
        <h1 className="text-heading-2 font-sans">{t("title")}</h1>
        <p className="max-w-md text-body-l opacity-70">{t("note")}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={() => reset()}>{t("retry")}</Button>
          <Button href={routes.home} variant="glass">
            {t("backHome")}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
