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
//
// Below `md`, the hero is capped at 78vh (h-[78vh] md:h-auto) rather than
// left to size itself from content + padding: on a phone the next section
// should already be visible as a hint to keep scrolling, not hidden below a
// full-screen hero. Section becomes a flex column so the Container can fill
// that fixed box and center its content vertically (flex-1 + justify-center)
// — a no-op at `md` and up, where the Section's height goes back to auto and
// "flex-1 with nothing to grow into" behaves exactly like the plain block
// layout this replaces. Padding, gap, and the logo size all shrink to match
// the smaller box; `md:` values are unchanged from before this pass.
export function HomeHero() {
  const t = useTranslations("Hero");
  const rotating = t.raw("rotating") as string[];
  // Below `md` the video never mounts at all (HeroVideo.tsx) — a still
  // image takes its place so the hero shows a real frame instead of a flat
  // ink fill. The video's own poster is the one still frame guaranteed to
  // exist and to already match the video's exact aspect ratio; a dedicated
  // mobileImageSrc remains unset (ASSETS-TODO.md) and is preferred over the
  // poster automatically once it is.
  const mobileHeroImage = heroMedia.mobileImageSrc ?? heroMedia.posterSrc;

  return (
    <Section
      surface="ink"
      className="relative -mt-24 flex h-[78vh] flex-col overflow-hidden pt-16 pb-10 md:h-auto md:pt-36 md:pb-36"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <HeroVideo />
        {mobileHeroImage && (
          <Image src={mobileHeroImage} alt="" fill priority className="object-cover md:hidden" />
        )}
        <div className="absolute inset-0 bg-ink/80" />
      </div>

      <Container className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center md:gap-8">
        {/* The logo carries the hero (board feedback: "great Enactus logo
            as the central element"), so the headline underneath drops to
            roughly 40% of its previous size (text-display-1 at lg was
            6rem; text-display-3 is 2.5rem, ~42%) instead of scaling up
            across breakpoints the way it used to. */}
        <Logo variant="full" surface="ink" className="h-20 w-auto sm:h-32 md:h-40 lg:h-48" />
        {/* Gold as a text colour is only ever legible on ink, never on paper
            (docs/design-system.md). Here it measures 11.6:1 against the ink
            surface and 6.4:1 against the worst case the video can produce —
            a fully white frame behind the 80% ink scrim — so it clears AA at
            both ends. Only the rotating term takes it; the prefix stays
            white, which is what makes the term read as the emphasis.

            The prefix and the rotating term each get their own centered
            line: four terms of very different widths (Entrepreneurship,
            Community, Sustainability, Impact) made a single centered line
            visibly lurch sideways every rotation, since the visible glyphs
            were never actually centered under a box sized to the longest
            term. Two independently centered lines fix that — each line's
            own content decides its width, so the term grows and shrinks
            around a fixed centre instead of sliding past it. */}
        <h1 className="flex flex-col items-center text-display-3 font-display">
          <span>{t("prefix")}</span>{" "}
          <RotatingText terms={rotating} className="text-gold" />
        </h1>
        <Button href="/mitmachen" variant="glass" size="lg">
          {t("cta")}
        </Button>
      </Container>

      <HeaderOverlay />
    </Section>
  );
}
