import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { RawLink } from "@/lib/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ADMIN_SECTIONS } from "@/components/admin/adminSections";
import { isAdminAuthenticated } from "@/lib/adminSession";

type PageProps = { params: Promise<{ locale: string }> };

// Board-internal tooling, never crawlable: noindex here, and excluded from
// robots.ts's allow list and from sitemap.ts entirely.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.overview" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// /admin had no page at all before this — a bare visit fell through to
// (site)/[...rest] and rendered the public, chrome-wrapped 404, which is a
// confusing thing to hand a board member who typed the URL they were told.
export default async function AdminOverviewPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("overview.title")} lead={t("overview.lead")} />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.href}>
            <RawLink
              href={section.href}
              className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Card className="h-full">
                <h2 className="text-body-l font-medium">{t(`nav.${section.messageKey}`)}</h2>
                <p className="mt-1 text-body-s opacity-60">
                  {t(`overview.sections.${section.messageKey}`)}
                </p>
              </Card>
            </RawLink>
          </li>
        ))}
      </ul>
    </Container>
  );
}
