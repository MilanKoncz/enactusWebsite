import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { org } from "@/content/org";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-ink/10 py-1 pl-4">
      <dt className="text-mono-s font-mono uppercase opacity-60">{label}</dt>
      <dd className="text-body-m">{children}</dd>
    </div>
  );
}

// German Impressum law (§ 5 DDG) and § 18 Abs. 2 MStV govern the content
// below — the labels and facts stay in German even on the English route.
// That's deliberate, not a translation gap: a German association's legal
// notice is conventionally left in German internationally, since the terms
// (e.g. "Vertreten durch", "Registereintrag") carry a specific legal meaning
// that an English rendering could blur. `Impressum.enNotice` is the only
// piece of English UI on this page, shown once as context above the block.
export function Impressum() {
  const t = useTranslations("Impressum");
  const tPlaceholder = useTranslations("Placeholder");
  const locale = useLocale();

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />
        {locale === "en" && <p className="max-w-prose text-body-m opacity-80">{t("enNotice")}</p>}
        <dl className="flex max-w-prose flex-col gap-6">
          <Row label={t("operatorLabel")}>
            <span className="block">{org.legalName}</span>
            <span className="block">
              {org.registeredOffice ?? (
                <PlaceholderMark hint={tPlaceholder("missingHint")}>
                  {tPlaceholder("missingLabel")}
                </PlaceholderMark>
              )}
            </span>
          </Row>
          <Row label={t("representativesLabel")}>
            {org.legalRepresentatives.names.map((name, index) => (
              <span key={name}>
                {org.legalRepresentatives.verified ? (
                  name
                ) : (
                  <PlaceholderMark variant="unverified" hint={t("representativesHint")}>
                    {name}
                  </PlaceholderMark>
                )}
                {index < org.legalRepresentatives.names.length - 1 && ", "}
              </span>
            ))}
          </Row>
          <Row label={t("registerLabel")}>
            {org.registerEntry ?? (
              <PlaceholderMark hint={tPlaceholder("missingHint")}>
                {tPlaceholder("missingLabel")}
              </PlaceholderMark>
            )}
          </Row>
          <Row label={t("contactLabel")}>
            {org.contactEmails.board ?? org.contactEmails.general ? (
              <a href={`mailto:${org.contactEmails.board ?? org.contactEmails.general}`} className="link-underline">
                {org.contactEmails.board ?? org.contactEmails.general}
              </a>
            ) : (
              <PlaceholderMark hint={tPlaceholder("missingHint")}>
                {tPlaceholder("missingLabel")}
              </PlaceholderMark>
            )}
          </Row>
          <Row label={t("responsibleLabel")}>{t("responsibleSame")}</Row>
        </dl>
        <p className="text-body-s opacity-60">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
        {/* Deliberately its own labeled block, outside the dl above and with
            its own heading — a credit for the site's design and development,
            not a claim of editorial or legal responsibility. That stays with
            the board under responsibleLabel/responsibleSame. */}
        <div className="flex flex-col gap-1 border-l-2 border-ink/10 py-1 pl-4">
          <h2 className="text-mono-s font-mono uppercase opacity-60">{t("creditsHeading")}</h2>
          <p className="text-body-m">{t("creditsName")}</p>
        </div>
      </Container>
    </Section>
  );
}
