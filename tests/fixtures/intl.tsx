import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

const catalogs = { de, en } as const;

/**
 * Any component that renders next-intl's Link (directly, or transitively via
 * Button's href branch) calls useLocale() unconditionally and throws without
 * a provider. Use this instead of a bare render() for those components —
 * imports the real message catalogs rather than a hand-maintained fixture
 * that would drift from them.
 */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "de", ...options }: { locale?: "de" | "en" } & Omit<RenderOptions, "wrapper"> = {},
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale={locale} messages={catalogs[locale]}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
