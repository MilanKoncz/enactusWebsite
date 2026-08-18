import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { partners, type Partner } from "@/content/partners";

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
//
// Each tier heading is a GateMarker rather than a plain <h3> — the same
// heading-as-signature-element pattern PartnerIntro's four benefit cards
// already use. Its rule doubles as the separator the board asked for
// between tiers: no extra divider element needed when the heading itself
// carries one.
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
              <div className="flex flex-col gap-3">
                <GateMarker as="h3" label={tTiers(`${key}.title`)} />
                <p className="max-w-prose text-body-s opacity-70">{tTiers(`${key}.description`)}</p>
              </div>
              {tierPartners.length > 0 ? (
                // Equal-height fields (h-32) so a wide landscape logo and a
                // near-square mark render at the same visual weight instead
                // of whichever format happens to be tallest dictating the
                // row's height — board feedback: logos were too small and
                // the grid felt cramped.
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {tierPartners.map((partner) => (
                    <TierLogo key={partner.slug} partner={partner} websiteLabel={tTiers("websiteLabel", { name: partner.name })} placeholderHint={tPlaceholder("missingHint")} />
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

// A confirmed partner (has a url) is a clean, big logo tile — no caption,
// same restraint as the homepage marquee. An unconfirmed one (mcei — see
// content/partners.ts) keeps the visible PlaceholderMark name it always
// had: the point of that mark is to flag "not linked because unverified,"
// which a caption-less tile would quietly lose.
function TierLogo({
  partner,
  websiteLabel,
  placeholderHint,
}: {
  partner: Partner;
  websiteLabel: string;
  placeholderHint: string;
}) {
  const logo = partner.logo && (
    <span className="relative block h-full w-full">
      <Image
        src={partner.logo}
        alt=""
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 28vw, 40vw"
        className="object-contain"
      />
    </span>
  );

  if (partner.url) {
    return (
      <li className="flex h-32 items-center justify-center rounded-md border border-ink/10 bg-paper p-6">
        <a
          href={partner.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={websiteLabel}
          className="flex h-full w-full items-center justify-center transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px"
        >
          {logo || <span className="text-body-s font-medium">{partner.name}</span>}
        </a>
      </li>
    );
  }

  return (
    <li className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-ink/10 bg-paper p-4">
      {logo}
      <PlaceholderMark hint={placeholderHint} className="text-body-s font-medium">
        {partner.name}
      </PlaceholderMark>
    </li>
  );
}
