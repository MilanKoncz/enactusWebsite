import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { HeaderOverlay } from "@/components/layout/HeaderOverlay";
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
          <Placeholder
            kind={t("videoPlaceholderKind")}
            label={t("videoPlaceholderLabel")}
            className="h-full w-full rounded-none border-0"
          />
        )}
        <div className="absolute inset-0 bg-ink/80" />
      </div>

      <Container className="relative flex flex-col gap-8">
        <h1 className="text-display-3 font-display md:text-display-2 lg:text-display-1">
          {t("prefix")} <RotatingText terms={rotating} />
        </h1>
        <Button href="/mitmachen" variant="glass" size="lg" className="self-start">
          {t("cta")}
        </Button>
      </Container>

      <HeaderOverlay />
    </Section>
  );
}
