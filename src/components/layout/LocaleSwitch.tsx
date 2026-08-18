"use client";

import { useParams } from "next/navigation";
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
  // Once routing.ts declares a parameterized route (/projekte/[slug]),
  // usePathname() returns that route's internal template, not the resolved
  // slug — getPathname needs the actual params alongside it to rebuild a
  // real, navigable URL for the other locale.
  const params = useParams();
  const activeLocale = useLocale();

  // Only the project detail route is parameterized; every other pathname
  // takes the plain string overload. Narrowing on the literal keeps this
  // free of a blanket cast — TS confirms the "else" branch can't be
  // "/projekte/[slug]" instead of just trusting params has the right shape.
  const targetHref =
    pathname === "/projekte/[slug]"
      ? { pathname, params: params as { slug: string } }
      : pathname;

  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-2", className)}>
      {routing.locales.map((locale) => (
        <RawLink
          key={locale}
          href={getPathname({ href: targetHref, locale })}
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
