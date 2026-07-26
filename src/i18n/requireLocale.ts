import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "./routing";

/**
 * Every [locale]-scoped layout/page needs this: validate the URL segment
 * against the configured locales (a stale/forged value 404s instead of
 * rendering with a bad locale) and opt into static rendering. Each page needs
 * its own call, not just the layout's — a soft client-side navigation between
 * sibling routes only re-renders the page segment, so the layout's call alone
 * doesn't run and the page would silently fall back to dynamic rendering.
 */
export async function requireLocale(
  params: Promise<{ locale: string }>,
): Promise<(typeof routing.locales)[number]> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return locale;
}

/**
 * For generateMetadata, which shouldn't call notFound() itself — Next.js
 * calls it independently of the page render, so that's the page's job.
 * A stale/forged locale just falls back to the default here; the page
 * component 404s the whole route via requireLocale regardless.
 */
export function resolveLocale(locale: string): (typeof routing.locales)[number] {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}
