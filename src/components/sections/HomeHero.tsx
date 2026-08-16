import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { HeaderOverlay } from "@/components/layout/HeaderOverlay";
import { Logo } from "@/components/layout/Logo";
import { HeroVideo } from "@/components/motion/HeroVideo";
import { RotatingText } from "@/components/motion/RotatingText";
import { heroMedia } from "@/content/media";

// -mt-24 pulls the hero up under the header's sentinel spacer (Header.tsx),
// so the video reaches the very top of the viewport instead of starting
// below a blank strip — the header sits transparent over it instead
// (HeaderOverlay). pt-36 then restores clear space for the headline below
// where the header's controls are. Both are static, not scroll-state-driven,
// so there's no layout shift.
export function HomeHero() {
  const t = useTranslations("Hero");
  const rotating = t.raw("rotating") as string[];

  return (
    <Section
      surface="ink"
      className="relative -mt-24 overflow-hidden pt-36 pb-24 md:pb-36"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <HeroVideo />
        {heroMedia.mobileImageSrc && (
          <Image
            src={heroMedia.mobileImageSrc}
            alt=""
            fill
            priority
            className="object-cover md:hidden"
          />
        )}
        <div className="absolute inset-0 bg-ink/80" />
      </div>

      <Container className="relative flex flex-col items-center gap-8 text-center">
        {/* The logo carries the hero (board feedback: "great Enactus logo
            as the central element"), so the headline underneath drops to
            roughly 40% of its previous size (text-display-1 at lg was
            6rem; text-display-3 is 2.5rem, ~42%) instead of scaling up
            across breakpoints the way it used to. */}
        <Logo variant="full" surface="ink" className="h-28 w-auto sm:h-32 md:h-40 lg:h-48" />
        {/* Gold as a text colour is only ever legible on ink, never on paper
            (docs/design-system.md). Here it measures 11.6:1 against the ink
            surface and 6.4:1 against the worst case the video can produce —
            a fully white frame behind the 80% ink scrim — so it clears AA at
            both ends. Only the rotating term takes it; the prefix stays
            white, which is what makes the term read as the emphasis. */}
        <h1 className="text-display-3 font-display">
          {t("prefix")} <RotatingText terms={rotating} className="text-gold" />
        </h1>
        <Button href="/mitmachen" variant="glass" size="lg">
          {t("cta")}
        </Button>
      </Container>

      <HeaderOverlay />
    </Section>
  );
}
