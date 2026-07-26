import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { partners } from "@/content/partners";
import { cn } from "@/lib/cn";

// The track is `partners` rendered twice back to back, animated by exactly
// -50% (globals.css's @keyframes marquee) — one full set width — so the
// loop is seamless as long as both halves are identical, which they always
// are here. The second half is aria-hidden and hidden under reduced motion,
// so a screen reader or a static page never encounters the same eight
// partners twice. The viewport itself stays overflow-hidden by default —
// only reduced motion (where the animation is off entirely) switches it to
// scrollable, so there's never a horizontal scrollbar while the loop runs.
export function PartnerMarquee() {
  const t = useTranslations("PartnerMarquee");
  const tPlaceholder = useTranslations("Placeholder");

  const track = [...partners, ...partners];

  return (
    <Section className="py-16">
      <Container className="flex flex-col gap-6">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <div className="overflow-hidden motion-reduce:overflow-x-auto">
          <div className="flex w-max animate-marquee gap-16 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
            {track.map((partner, index) => {
              const isDuplicate = index >= partners.length;
              return (
                <div
                  key={`${partner.slug}-${index}`}
                  aria-hidden={isDuplicate ? "true" : undefined}
                  className={cn("flex shrink-0 items-center", isDuplicate && "motion-reduce:hidden")}
                >
                  {partner.logo ? (
                    <div className="relative h-8 w-32">
                      <Image src={partner.logo} alt={partner.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <PlaceholderMark hint={tPlaceholder("missingHint")} className="text-body-m">
                      {partner.name}
                    </PlaceholderMark>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
