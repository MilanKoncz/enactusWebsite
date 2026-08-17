import { Archive } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { YouTubeFacade } from "@/components/ui/YouTubeFacade";
import { Link } from "@/lib/navigation";
import { stars } from "@/content/stars";

// star.key is a validated string, not a literal union — same cast pattern as
// ProjectDetailContent.tsx's ProjectCopyKey.
type StarCopyKey = Parameters<ReturnType<typeof useTranslations<"Stars">>>[0];

export function ProjectsStars() {
  const t = useTranslations("ProjectsPage.stars");
  const tStars = useTranslations("Stars");
  const tStatus = useTranslations("ProjectStatus");
  const tArchive = useTranslations("ProjectsPage.archiveLink");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stars.map((star) => (
            <li key={star.key} className="flex flex-col gap-3 rounded-md border border-ink/10 bg-paper p-4">
              <Placeholder kind="Logo" label={star.name} ratio="1 / 1" className="p-2" />
              <p className="text-body-m font-medium">{star.name}</p>
              <p className="text-body-s opacity-70">{tStars(`${star.key}.description` as StarCopyKey)}</p>
              {star.status && <Badge status={star.status}>{tStatus(star.status)}</Badge>}
              {star.youtubeId ? (
                <YouTubeFacade
                  youtubeId={star.youtubeId}
                  title={star.name}
                  playLabel={t("playLabel", { name: star.name })}
                />
              ) : (
                <p className="text-body-s italic opacity-70">{t("noVideoHint")}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-3 border-t border-ink/10 pt-10 text-center">
          <Link
            href="/projekte/archiv"
            className="link-underline inline-flex items-center gap-2 text-body-l font-medium"
          >
            <Archive className="size-5 shrink-0" aria-hidden="true" />
            {tArchive("label")}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
