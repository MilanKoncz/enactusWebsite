import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { HeaderOverlay } from "@/components/layout/HeaderOverlay";
import { Logo } from "@/components/layout/Logo";
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
        {heroMedia.posterSrc ? (
          <>
            <video
              className="hidden h-full w-full object-cover md:block"
              muted
              playsInline
              loop
              preload="metadata"
              poster={heroMedia.posterSrc}
            >
              {heroMedia.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
            {heroMedia.mobileImageSrc && (
              <Image
                src={heroMedia.mobileImageSrc}
                alt=""
                fill
                priority
                className="object-cover md:hidden"
              />
            )}
          </>
        ) : (
          <>
            {/* PLACEHOLDER, temporary: a gradient wash stands in for the real
                hero video so the glass button variant has color/luminance
                variation to blur and saturate against — a flat placeholder
                box gave it nothing to show. Remove this div the moment
                heroMedia.posterSrc is real; see ASSETS-TODO.md. */}
            <div className="h-full w-full bg-[linear-gradient(135deg,var(--color-ink)_0%,var(--color-oxblood)_38%,var(--color-gold)_75%,var(--color-sand)_100%)]" />
            <Placeholder
              kind={t("videoPlaceholderKind")}
              label={t("videoPlaceholderLabel")}
              className="absolute inset-6 h-auto w-auto md:inset-10"
            />
          </>
        )}
        <div className={`absolute inset-0 ${heroMedia.posterSrc ? "bg-ink/80" : "bg-ink/55"}`} />
      </div>

      <Container className="relative flex flex-col items-center gap-8 text-center">
        {/* The logo carries the hero (board feedback: "great Enactus logo
            as the central element"), so the headline underneath drops to
            roughly 40% of its previous size (text-display-1 at lg was
            6rem; text-display-3 is 2.5rem, ~42%) instead of scaling up
            across breakpoints the way it used to. */}
        <Logo variant="full" surface="ink" className="h-28 w-auto sm:h-32 md:h-40 lg:h-48" />
        <h1 className="text-display-3 font-display">
          {t("prefix")} <RotatingText terms={rotating} />
        </h1>
        <Button href="/mitmachen" variant="glass" size="lg">
          {t("cta")}
        </Button>
      </Container>

      <HeaderOverlay />
    </Section>
  );
}
