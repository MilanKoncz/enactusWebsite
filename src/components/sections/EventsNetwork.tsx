import { useFormatter, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkCard } from "@/components/ui/LinkCard";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { networkStats, teamLinks } from "@/content/network";

// Both network figures are approximations by the source's own wording (see
// content/network.ts) — "rund"/"über" are part of the fact, not decoration,
// so they're prefixed on every render rather than left for a reader to
// infer from a bare number. countriesGlobal has no such qualifier in the
// source, so it renders as a plain count.
export function EventsNetwork() {
  const t = useTranslations("EventsNetwork");
  const tPlaceholder = useTranslations("Placeholder");
  const format = useFormatter();

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <div className="flex flex-col gap-10">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">
                {t("approx", { value: format.number(networkStats.studentsGermany) })}
              </p>
              <Eyebrow>{t("studentsGermanyLabel")}</Eyebrow>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">
                {t("atLeast", { value: format.number(networkStats.universitiesGermany) })}
              </p>
              <Eyebrow>{t("universitiesGermanyLabel")}</Eyebrow>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">{format.number(networkStats.countriesGlobal)}</p>
              <Eyebrow>{t("countriesGlobalLabel")}</Eyebrow>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Eyebrow>{t("teamsHeading")}</Eyebrow>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {teamLinks.map((team) => (
              <li key={team.key}>
                {team.url ? (
                  <LinkCard
                    href={team.url}
                    title={team.name}
                    ariaLabel={t("teamLinkLabel", { name: team.name })}
                  />
                ) : (
                  <PlaceholderMark hint={tPlaceholder("missingHint")} className="w-fit text-body-m font-medium">
                    {team.name}
                  </PlaceholderMark>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
