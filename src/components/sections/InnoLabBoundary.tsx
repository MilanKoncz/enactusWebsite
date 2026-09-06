import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { Link } from "@/lib/navigation";
import { boundaryBlocks } from "@/content/innolab";
import type { BoundaryKey } from "@/content/innolab";

type BoundaryCopyKey = Parameters<ReturnType<typeof useTranslations<"InnoLabPage.boundary">>>[0];

const BLOCK_CTA_VARIANT: Record<BoundaryKey, "primary" | "secondary"> = {
  innolab: "primary",
  ideathon: "secondary",
};

/**
 * The one section this page exists to get right: InnoLab and the Ideathon
 * have separate sign-ups, and a visitor conflating the two is the exact
 * confusion this was written to resolve. Same two-column, GateMarker-titled
 * block layout as MitmachenFit.tsx's expectations/offers split — the
 * closing note below reuses that component's own "prominent, not a
 * footnote" highlighted-block treatment for the same reason: a page that
 * just drew a hard line between two sign-ups needs an equally weighted
 * warm close, not a trailing caption, or the invitation reads as an
 * afterthought.
 */
export function InnoLabBoundary() {
  const t = useTranslations("InnoLabPage.boundary");

  return (
    <Section>
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {boundaryBlocks.map((block) => (
            <div key={block.key} className="flex flex-col gap-3">
              <GateMarker as="h3" label={t(`${block.key}.title` as BoundaryCopyKey)} />
              <p className="text-body-m opacity-80">{t(`${block.key}.description` as BoundaryCopyKey)}</p>
              <Button
                href={block.href as ComponentProps<typeof Link>["href"]}
                variant={BLOCK_CTA_VARIANT[block.key]}
                className="mt-2 self-start"
              >
                {t(`${block.key}.cta` as BoundaryCopyKey)}
              </Button>
            </div>
          ))}
        </div>
        <div className="rounded-md border-l-2 border-gold bg-gold/5 px-6 py-6 md:px-10 md:py-8">
          <p className="text-body-l opacity-80">{t("closingNote")}</p>
        </div>
      </Container>
    </Section>
  );
}
