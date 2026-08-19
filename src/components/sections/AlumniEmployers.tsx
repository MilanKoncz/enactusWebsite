import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { alumniEmployers } from "@/content/alumniEmployers";

// A plain factual grid, not a partnership claim: no logo links to the
// company's own site, and none is tied to a named alumnus — see the file
// comment in content/alumniEmployers.ts. Static and quiet on purpose (no
// marquee, no scroll-driven motion) — this is a list to be read, not a
// moment to be watched, unlike PartnerMarquee's looping band. `.alumni-logo`
// (globals.css) is the same three-guard pattern `.hover-grow` uses: full
// opacity is the safe default a touch device, a keyboard user, and
// prefers-reduced-motion all keep permanently; only a pointer with real
// hover support dims logos at rest and restores them on hover/focus.
export function AlumniEmployers() {
  const t = useTranslations("AlumniEmployers");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="alumniEmployers" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ul className="grid grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
          {alumniEmployers.map((employer) => (
            <li key={employer.slug} className="flex items-center justify-center">
              <div className="alumni-logo relative h-8 w-full sm:h-10">
                <Image
                  src={employer.logo}
                  alt={employer.name}
                  fill
                  sizes="(min-width: 1280px) 10vw, (min-width: 640px) 20vw, 30vw"
                  className="object-contain"
                />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
