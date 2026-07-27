"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { getPathname, RawLink, usePathname } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export type LocaleSwitchProps = {
  className?: string;
};

// Renders plain <a> (RawLink = next/link), not next-intl's Link: Link forces
// a prefix whenever it receives an explicit `locale` prop (verified in
// next-intl's source), which would prefix even German and turn every DE
// switch into a redirect. getPathname() without forcePrefix applies
// localePrefix: "as-needed" correctly instead.
export function LocaleSwitch({ className }: LocaleSwitchProps) {
  const t = useTranslations("LocaleSwitch");
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-2", className)}>
      {routing.locales.map((locale) => (
        <RawLink
          key={locale}
          href={getPathname({ href: pathname, locale })}
          hrefLang={locale}
          lang={locale}
          prefetch={false}
          aria-current={locale === activeLocale ? "true" : undefined}
          className={cn(
            "text-mono-s font-mono uppercase transition-opacity duration-[var(--duration-fast)] ease-signature hover:opacity-100 focus-visible:opacity-100",
            locale === activeLocale ? "opacity-100" : "opacity-60",
          )}
        >
          {locale.toUpperCase()}
        </RawLink>
      ))}
    </div>
  );
}
