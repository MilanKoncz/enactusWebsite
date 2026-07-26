"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { alumni } from "@/content/alumni";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

// "Durchklickbar" as a native scroll-snap track with buttons, not an
// index-driven set of hidden/shown slides: every statement stays in the DOM
// and in the accessibility tree at all times, and the track is scrollable
// by touch or keyboard with zero JavaScript. The buttons and the "n von m"
// readout are the enhancement on top, driven by an IntersectionObserver
// that reports whichever slide is most visible.
export function AlumniVoices() {
  const t = useTranslations("AlumniVoices");
  const tPlaceholder = useTranslations("Placeholder");
  const reducedMotion = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = slideRefs.current.findIndex((el) => el === mostVisible.target);
        if (index !== -1) setCurrent(index);
      },
      { root: track, threshold: 0.6 },
    );
    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }
    return () => observer.disconnect();
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div role="region" aria-label={t("regionLabel")} className="flex flex-col gap-6">
          <div
            ref={trackRef}
            // tabIndex: the slides carry no focusable content of their own
            // (no links or buttons), so without this the scrollable region
            // itself has no keyboard entry point at all — a real WCAG 2.1.1
            // failure caught by axe's scrollable-region-focusable rule, not
            // just a nicety. contain-content: without it, this track's full
            // unclipped width (three full-viewport-wide slides) still
            // inflates the document's own scrollWidth even though
            // overflow-x-auto correctly clips and scrolls it visually — see
            // the identical note in PartnerMarquee.tsx.
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-10 overflow-x-auto contain-content"
          >
            {alumni.map((alumnus, index) => (
              <div
                key={alumnus.slug}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                className="flex w-full shrink-0 snap-center flex-col items-center gap-6 text-center"
              >
                <p className="text-display-3 font-display">„{alumnus.quote}“</p>
                <Placeholder kind="Foto" label={alumnus.name} ratio="1 / 1" className="w-32" />
                <p className="text-body-m font-medium">
                  <PlaceholderMark hint={tPlaceholder("missingHint")}>{alumnus.name}</PlaceholderMark>
                </p>
                <p className="text-body-s opacity-60">
                  <PlaceholderMark hint={tPlaceholder("missingHint")}>
                    {alumnus.currentRole}
                  </PlaceholderMark>
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(current - 1, 0))}
              disabled={current === 0}
              aria-label={t("prev")}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2",
                "disabled:pointer-events-none disabled:opacity-30",
              )}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <p className="text-mono-s font-mono uppercase opacity-60">
              {t("position", { current: current + 1, total: alumni.length })}
            </p>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(current + 1, alumni.length - 1))}
              disabled={current === alumni.length - 1}
              aria-label={t("next")}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2",
                "disabled:pointer-events-none disabled:opacity-30",
              )}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
