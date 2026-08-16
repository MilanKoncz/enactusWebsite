"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { alumni } from "@/content/alumni";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

// Same lift/scale as Button (docs/design-system.md's Interaction section),
// dropped onto a bare icon button: a hover/focus tint plus the identical
// transform, so these read as siblings of Button rather than a plainer
// control that happens to sit next to it. Exported so the styleguide's
// Interaction section can demo the exact class string used here, not a
// hand-copied approximation of it.
export const NAV_BUTTON_CLASSES = cn(
  "inline-flex items-center justify-center rounded-md p-2 transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature",
  "hover:-translate-y-px hover:scale-[1.02] hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:scale-[1.02] active:translate-y-0 active:scale-[0.99] active:bg-ink/10",
  "disabled:pointer-events-none disabled:opacity-30",
);

// "Durchklickbar" as a native scroll-snap track with buttons, not an
// index-driven set of hidden/shown slides: every statement stays in the DOM
// and in the accessibility tree at all times, and the track is scrollable
// by touch or keyboard with zero JavaScript. The buttons and the "n von m"
// readout are the enhancement on top, driven by an IntersectionObserver
// that reports whichever slide is most visible. None of that changed for
// this editorial layout — only the visual treatment of each slide did.
//
// The track itself moved outside Container to run full-bleed (edge to edge
// of the viewport); the heading above it and the prev/next controls below
// it stay inside a Container so they line up with the rest of the page.
// Each slide is a 12-column grid: the quote occupies columns 1-6 with the
// Container's own left inset (`md:bleed-end`, from md upward — see its
// definition in globals.css), the portrait occupies columns 8-12 with no
// padding of its own, so it runs to the viewport's right edge, and column 7
// is left empty on purpose — the whitespace between them, not a gap
// property. Below md, both stack full-width instead; the portrait keeps
// bleeding edge to edge there too, the quote falls back to ordinary
// Container-equivalent side padding since a quote with no right margin at
// 360px would be a real readability regression, not an editorial choice.
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
    <Section className="relative isolate">
      <ThreadSegment stop="alumni" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      </Container>
      <div role="region" aria-label={t("regionLabel")} className="relative mt-16 flex flex-col gap-10">
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
              className="grid w-full shrink-0 snap-center grid-cols-1 items-center gap-10 md:grid-cols-12"
            >
              <div className="flex flex-col gap-6 px-4 sm:px-6 md:col-span-6 md:bleed-end">
                <p className="text-display-3 font-display md:text-display-2">„{alumnus.quote}“</p>
                <div className="flex flex-col gap-1">
                  <p className="text-body-m font-medium">
                    <PlaceholderMark hint={tPlaceholder("missingHint")}>{alumnus.name}</PlaceholderMark>
                  </p>
                  <p className="text-body-s opacity-60">
                    <PlaceholderMark hint={tPlaceholder("missingHint")}>
                      {alumnus.currentRole}
                    </PlaceholderMark>
                  </p>
                </div>
              </div>
              <div className="md:col-span-5 md:col-start-8">
                {alumnus.photo ? (
                  <div className="relative aspect-3/4 w-full overflow-hidden">
                    <ImageLightbox src={alumnus.photo} alt={alumnus.name} triggerClassName="absolute inset-0">
                      <Image
                        src={alumnus.photo}
                        alt={alumnus.name}
                        fill
                        sizes="(min-width: 768px) 40vw, 100vw"
                        className="object-cover"
                      />
                    </ImageLightbox>
                  </div>
                ) : (
                  <Placeholder kind="Foto" label={alumnus.name} ratio="3 / 4" className="w-full" />
                )}
              </div>
            </div>
          ))}
        </div>
        <Container className="relative flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(current - 1, 0))}
            disabled={current === 0}
            aria-label={t("prev")}
            className={NAV_BUTTON_CLASSES}
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
            className={NAV_BUTTON_CLASSES}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </Container>
      </div>
    </Section>
  );
}
