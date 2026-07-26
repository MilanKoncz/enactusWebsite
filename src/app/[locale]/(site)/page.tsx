import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { routes } from "@/content/navigation";
import { Link } from "@/lib/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Site" });
  return { title: t("name") };
}

// Real homepage content — title, claim, a coming-soon note, a link to Team
// (per the brief, Team is linked from the footer and the homepage, never the
// header nav) — and nothing else. No invented mission copy; that's a
// separate, later task. See ASSETS-TODO.md.
export default async function HomePage({ params }: PageProps) {
  const locale = await requireLocale(params);
  const tSite = await getTranslations({ locale, namespace: "Site" });
  const tHome = await getTranslations({ locale, namespace: "Home" });

  return (
    <Section>
      <Container className="flex flex-col gap-4 py-12 text-center">
        <Eyebrow>{tSite("claim")}</Eyebrow>
        <h1 className="text-display-2 font-display">{tSite("name")}</h1>
        <p className="text-body-l opacity-60">{tHome("note")}</p>
        <Link href={routes.team} className="underline">
          {tHome("teamLink")}
        </Link>
      </Container>
    </Section>
  );
}
