import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { HoverDetail } from "@/components/ui/HoverDetail";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { pillars } from "@/content/pillars";

// Title and lead are always visible — only the supporting detail sentence
// is hover/focus-revealed (HoverDetail), and only on hover-capable desktop
// widths (globals.css's desktop-hover). The scroll entrance (Reveal) wraps
// the whole three-column row, so it reads as one arrival, not three
// staggered ones. Each column doubles GateMarker as its own h3 — the gold
// rule and mono label carry the heading instead of a separate, larger one
// repeating the same two or three words right below it.
export function Pillars() {
  const t = useTranslations("Pillars");

  return (
    <Section surface="ink">
      <Container className="flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <Reveal className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.key} tabIndex={0} className="group flex flex-col gap-4">
              <GateMarker as="h3" label={t(`${pillar.key}.title`)} />
              <p className="text-body-l">{t(`${pillar.key}.lead`)}</p>
              <HoverDetail>{t(`${pillar.key}.detail`)}</HoverDetail>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
