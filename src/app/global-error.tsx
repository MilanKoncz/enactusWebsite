"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { RawLink } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import "./globals.css";

// Next only ever mounts this file in place of the entire tree, [locale]
// layout included, when the root layout itself (src/app/[locale]/layout.tsx)
// throws — so it has to bring its own <html>/<body> (Next's requirement for
// this specific file) and can't assume next-intl's context: no
// NextIntlClientProvider is mounted above it to read a locale from, and the
// locale segment that would normally tell it German vs. English may be
// exactly what failed to resolve. Copy is hardcoded bilingual instead of a
// translation lookup, RawLink (plain next/link, no locale awareness) instead
// of the app's usual Link, and Button is only ever used here without an
// href, so it never reaches the branch that goes through that same Link.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-4 py-16 text-center text-paper antialiased">
        <AlertTriangle aria-hidden="true" className="size-12 text-gold" strokeWidth={1.75} />
        <div className="space-y-1">
          <p className="text-heading-3 font-sans">Etwas ist schiefgelaufen.</p>
          <p className="text-heading-3 font-sans">Something went wrong.</p>
        </div>
        <div className="max-w-md space-y-1 text-body-m opacity-70">
          <p>Bitte lade die Seite neu. Besteht das Problem weiter, versuch es später erneut.</p>
          <p>Please reload the page. If the problem persists, try again later.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={() => reset()}>Neu laden / Reload</Button>
          <RawLink href="/" className="link-underline text-body-m">
            Startseite / Homepage
          </RawLink>
        </div>
      </body>
    </html>
  );
}
