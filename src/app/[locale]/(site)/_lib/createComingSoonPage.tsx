import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { ComingSoon } from "@/components/sections/ComingSoon";
import type { RouteKey } from "@/content/navigation";

// _lib is a private folder (Next.js convention: leading underscore is
// excluded from routing), so this is safe to import from any page.tsx below
// without becoming a route itself.
type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Nine of the ten routes are, for now, identical: a title from the shared
 * Routes.* namespace and the shared ComingSoon body. One factory instead of
 * nine near-duplicate page files.
 */
export function createComingSoonPage(routeKey: RouteKey) {
  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = resolveLocale(rawLocale);
    const t = await getTranslations({ locale, namespace: "Routes" });
    return { title: t(routeKey) };
  }

  async function Page({ params }: PageProps) {
    const locale = await requireLocale(params);
    const t = await getTranslations({ locale, namespace: "Routes" });
    return <ComingSoon title={t(routeKey)} />;
  }

  return { generateMetadata, Page };
}
