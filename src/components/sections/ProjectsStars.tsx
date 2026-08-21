import { Archive, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { YouTubeFacade } from "@/components/ui/YouTubeFacade";
import { Link } from "@/lib/navigation";
import { stars } from "@/content/stars";

// star.key is a validated string, not a literal union — same cast pattern as
// ProjectDetailContent.tsx's ProjectCopyKey.
type StarCopyKey = Parameters<ReturnType<typeof useTranslations<"Stars">>>[0];

// The roster currently holds 7 real Stars, not 8 — STAR_7 is deliberately
// unassigned (content/stars.ts's own comment) rather than filled with an
// invented project. Rendering a real 8th grid cell as a visible empty state
// keeps that a deliberate, legible choice instead of an unexplained gap in
// the last row.
const STAR_GRID_SIZE = 8;

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
              {star.logo ? (
                <span className="relative block w-full aspect-square">
                  <Image src={star.logo} alt="" fill sizes="25vw" className="object-contain p-2" />
                </span>
              ) : (
                <Placeholder kind="Logo" label={star.name} ratio="1 / 1" className="p-2" />
              )}
              <p className="text-body-m font-medium">{star.name}</p>
              <p className="text-body-s opacity-70">
                {star.verified ? (
                  tStars(`${star.key}.description` as StarCopyKey)
                ) : (
                  <PlaceholderMark variant="unverified" hint={t("unverifiedHint")}>
                    {tStars(`${star.key}.description` as StarCopyKey)}
                  </PlaceholderMark>
                )}
              </p>
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
          {stars.length < STAR_GRID_SIZE && (
            <li className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gold bg-gold/5 p-4 text-center">
              <Sparkles className="size-6 opacity-60" aria-hidden="true" />
              <p className="font-mono text-mono-xs uppercase opacity-60">{t("emptySlotLabel")}</p>
              <p className="text-body-s opacity-70">{t("emptySlotHint")}</p>
            </li>
          )}
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
