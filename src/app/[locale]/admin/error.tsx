"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

// Every admin page queries Neon on render (lib/db.ts), and the driver
// throws whatever the underlying fetch/network failure was rather than a
// distinguishable error type — so there's no reliable way to branch copy
// on "was this actually Neon." Instead this page's copy names the one
// realistic cause up front (that's the case AdminError.* is written for),
// while still being correct for any other admin-page error, since retrying
// or leaving covers both.
export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("AdminError");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <AlertTriangle aria-hidden="true" className="size-12 text-oxblood" strokeWidth={1.75} />
      <h1 className="text-heading-3 font-sans">{t("title")}</h1>
      <p className="max-w-md text-body-m opacity-70">{t("note")}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={() => reset()}>{t("retry")}</Button>
        <Button href="/admin" variant="secondary">
          {t("backToOverview")}
        </Button>
      </div>
    </Container>
  );
}
