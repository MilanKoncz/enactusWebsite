import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { partners } from "@/content/partners";

// Canonical order, not the order tiers happen to appear in content/partners.ts
// — "Advisor" is a real fourth model (see the old site's own "Modelle einer
// Partnerschaft" section, matching messages/{locale}.json's four tier
// entries), it just has no partner assigned to it yet. Rendered with a
// visible empty-state note rather than silently dropped, so the category
// isn't lost — see ASSETS-TODO.md.
const TIER_ORDER = ["Knowledge", "Flagship", "Sponsoring", "Advisor"] as const;
type TierKey = (typeof TIER_ORDER)[number];

const TIER_MESSAGE_KEY: Record<TierKey, "knowledge" | "flagship" | "sponsoring" | "advisor"> = {
  Knowledge: "knowledge",
  Flagship: "flagship",
  Sponsoring: "sponsoring",
  Advisor: "advisor",
};

// This is the sales instrument for sponsorship, not a logo graveyard
// (CLAUDE.md's brief for this page) — every tier gets its own real
// description of what that partnership model actually involves, pulled
// from the old site, before the logos ever appear.
export function PartnerTiers() {
  const t = useTranslations("PartnerPage");
  const tTiers = useTranslations("PartnerPage.tiers");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <SectionHeading eyebrow={t("eyebrow")} title={tTiers("heading")} lead={tTiers("lead")} />
        {TIER_ORDER.map((tier) => {
          const key = TIER_MESSAGE_KEY[tier];
          const tierPartners = partners.filter((partner) => partner.tier === tier);
          return (
            <div key={tier} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-heading-2 font-display">{tTiers(`${key}.title`)}</h3>
                <p className="max-w-prose text-body-s opacity-70">{tTiers(`${key}.description`)}</p>
              </div>
              {tierPartners.length > 0 ? (
                <ul className="flex flex-wrap gap-x-10 gap-y-6">
                  {tierPartners.map((partner) => (
                    <li key={partner.slug}>
                      {partner.url ? (
                        <a
                          href={partner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={tTiers("websiteLabel", { name: partner.name })}
                          className="flex flex-col items-center gap-2 transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px"
                        >
                          {partner.logo && (
                            <span className="relative block h-12 w-40">
                              <Image src={partner.logo} alt="" fill className="object-contain" />
                            </span>
                          )}
                          <span className="text-body-s font-medium">{partner.name}</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          {partner.logo && (
                            <span className="relative block h-12 w-40">
                              <Image src={partner.logo} alt="" fill className="object-contain" />
                            </span>
                          )}
                          <PlaceholderMark hint={tPlaceholder("missingHint")} className="text-body-s font-medium">
                            {partner.name}
                          </PlaceholderMark>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-l-2 border-dashed border-gold py-1 pl-3 text-body-s opacity-60">
                  {tTiers("advisorEmptyHint")}
                </p>
              )}
            </div>
          );
        })}
      </Container>
    </Section>
  );
}
