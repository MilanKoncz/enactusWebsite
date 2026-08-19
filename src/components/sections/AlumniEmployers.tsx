import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { ProximityGroup } from "@/components/motion/ProximityGroup";
import { alumniEmployers } from "@/content/alumniEmployers";

// Where our alumni work today, run full-bleed as this section's own
// wallpaper (board brief, 2026-08-19) — see content/alumniEmployers.ts. Its
// own section since 2026-08-19: it used to be the background of the whole
// combined Alumni area (heading plus the quote/portrait track below), which
// is also why it used to visibly run on past that area's own bottom edge —
// its `inset-0` sized itself against that much taller combined box. Now
// scoped to this section alone, it can't extend past its own boundary; the
// bottom fade below is a deliberate, designed edge, not a fix for an actual
// overflow.
const LOGO_FIELD_REPEATS = 3;
const logoFieldItems = Array.from({ length: LOGO_FIELD_REPEATS }, (_, repeat) =>
  alumniEmployers.map((employer) => ({ ...employer, key: `${employer.slug}-${repeat}` })),
).flat();

// ProximityGroup (also driving the board portraits' lift) writes
// --proximity (0-1) onto each of its direct children from a single
// rAF-throttled pointermove listener, gated off entirely on touch and
// prefers-reduced-motion — reused as-is rather than a second hook, since it
// already is "one event on the container, throttled, cleaned up on
// unmount" (docs/design-system.md's motion rules). `.alumni-logo-cell` in
// globals.css maps that value to a transform/opacity-only scale — the cell
// itself never resizes, so neighbors never reflow, only the logo's own
// paint grows past its cell's edges into the gap around it.
//
// No pointer-events-none here, unlike most decorative aria-hidden layers on
// this site: ProximityGroup's own listener is attached to this exact
// element, and pointer-events: none makes an element (and its
// non-overriding descendants) invisible to hit-testing entirely — that was
// the actual cause of the dock effect never firing (2026-08-19 fix), not a
// missing transform or a stale hover-capability check (both were already
// correct). aria-hidden alone is enough to keep it out of the accessibility
// tree; nothing inside is a link or a button, so there is nothing this
// leaves clickable that shouldn't be.
function AlumniLogoField() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <ProximityGroup className="grid h-full w-full auto-rows-[7rem] grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] content-start gap-4 p-4">
        {logoFieldItems.map((employer) => (
          <div key={employer.key} className="alumni-logo-cell flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative,
                repeated background texture: next/image's optimization
                pipeline (blur placeholder, srcset) is pure overhead here,
                the source files are already small, and the browser caches
                every repeat of the same URL as one fetch. */}
            <img src={employer.logo} alt="" className="h-8 w-full object-contain sm:h-10" />
          </div>
        ))}
      </ProximityGroup>
      {/* A soft fade to the page background at the bottom edge, not a hard
          cutoff mid-row — board brief, 2026-08-19. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper"
      />
    </div>
  );
}

// A deliberate minimum height, not just "as tall as the heading": below
// this the logo wallpaper read as a cramped sliver rather than the section
// this content deserves — the same reasoning the old combined section got
// its height from the quote track that used to sit here too.
export function AlumniEmployers() {
  const t = useTranslations("AlumniEmployers");

  return (
    <Section className="relative isolate min-h-[26rem] overflow-hidden md:min-h-[32rem]">
      <AlumniLogoField />
      <ThreadSegment stop="alumni-employers" />
      <Container className="relative flex flex-col gap-10">
        <div className="inline-flex flex-col gap-4 self-start bg-paper p-6 md:p-8">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        </div>
      </Container>
    </Section>
  );
}
