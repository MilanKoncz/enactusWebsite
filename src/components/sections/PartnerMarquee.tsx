import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { partners } from "@/content/partners";
import { cn } from "@/lib/cn";

// The track is `partners` rendered twice back to back, animated by exactly
// -50% played in reverse (globals.css's @keyframes marquee and its
// `reverse` direction — board feedback: run the band right to left instead
// of left to right) — one full set width — so the loop is seamless as long
// as both halves are identical, which they always are here. The second half
// is aria-hidden and hidden under reduced motion, so a screen reader or a
// static page never encounters the same partners twice. The viewport itself
// stays overflow-hidden by default — only reduced motion (where the
// animation is off entirely) switches it to scrollable, so there's never a
// horizontal scrollbar while the loop runs. `contain-content` is
// load-bearing, not decoration: without it, Chromium still folds this
// track's full unclipped width into the document's own scrollWidth even
// though overflow-hidden/auto correctly clips it visually — a real
// horizontal scrollbar on the page with nothing to show for it.
//
// The track itself sits outside Container so it runs full-bleed, edge to
// edge of the viewport (board feedback: no side margins) — same reasoning
// as AlumniVoices' track. Only the eyebrow above it stays inside a
// Container, so it lines up with the rest of the page's content width.
export function PartnerMarquee({ showThread = true }: { showThread?: boolean } = {}) {
  const t = useTranslations("PartnerMarquee");
  const tPlaceholder = useTranslations("Placeholder");

  const track = [...partners, ...partners];

  return (
    // pt-16 pb-10 needs the same md: variant as Section's own default
    // (py-16 md:py-24) to actually win at md and up — an unscoped utility
    // can't override a scoped one of the same property once the viewport
    // crosses that breakpoint, it just loses silently (docs/design-system.md,
    // "Watch out for": the same class of bug already found on Impressum and
    // Datenschutz). Without the repeated md: variants here, this section
    // quietly fell back to the full py-24 bottom padding on every screen
    // that matters, stacking on top of the bare gate divider's own padding
    // and HomeKpis's own top padding for the page's next most visible gap.
    <Section className="relative isolate pt-16 pb-10 md:pt-16 md:pb-10">
      {/* The golden thread is homepage-only (docs/architecture.md): its
          waypoints (threadRoute.ts) are calculated to connect this section
          to the specific neighbours it has on the homepage, so a subpage
          reusing this component (e.g. /ideathon) opts out rather than
          drawing a line to nowhere. */}
      {showThread && <ThreadSegment stop="partners" />}
      <Container className="relative">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
      </Container>
      <div className="relative mt-6 overflow-hidden contain-content motion-reduce:overflow-x-auto">
        {/* No hover pause: stopping the loop under every incidental mouse
            pass read as a bug, not a feature — a mouse user was never
            going to interact with a logo here anyway. focus-within stays:
            a keyboard user tabbing through the track needs it to hold
            still to actually read what's focused. Reduced motion stops it
            outright, unconditionally, further down. */}
        <div className="flex w-max animate-marquee gap-16 focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {track.map((partner, index) => {
            const isDuplicate = index >= partners.length;
            return (
              <div
                key={`${partner.slug}-${index}`}
                aria-hidden={isDuplicate ? "true" : undefined}
                className={cn("flex shrink-0 items-center", isDuplicate && "motion-reduce:hidden")}
              >
                {partner.logo ? (
                  // 1.5x the previous h-8/w-32 (board feedback: bigger logos).
                  <div className="relative h-12 w-48">
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
    </Section>
  );
}
