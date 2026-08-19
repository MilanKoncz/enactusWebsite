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
import { ProximityGroup } from "@/components/motion/ProximityGroup";
import { alumni } from "@/content/alumni";
import { alumniEmployers } from "@/content/alumniEmployers";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

// Where our alumni work today, run full-bleed as this section's own
// wallpaper instead of a labelled grid of its own (board brief, 2026-08-19)
// — see content/alumniEmployers.ts. 54 real logos rarely divide evenly into
// a grid at every viewport width, and a ragged last row would read as
// broken, so the source list repeats until the grid comfortably overflows
// the section at any realistic width/height, then the container clips
// whatever doesn't fit — cheaper and more robust than measuring the
// section's real height in JS to compute an exact count.
const LOGO_FIELD_REPEATS = 3;
const logoFieldItems = Array.from({ length: LOGO_FIELD_REPEATS }, (_, repeat) =>
  alumniEmployers.map((employer) => ({ ...employer, key: `${employer.slug}-${repeat}` })),
).flat();

// ProximityGroup (already driving the board portraits' lift) writes
// --proximity (0-1) onto each of its direct children from a single
// rAF-throttled pointermove listener, gated off entirely on touch and
// prefers-reduced-motion — reused as-is rather than a second hook, since it
// already is "one event on the container, throttled, cleaned up on
// unmount" (docs/design-system.md's motion rules). `.alumni-logo-cell` in
// globals.css maps that value to a transform/opacity-only scale — the cell
// itself never resizes, so neighbors never reflow, only the logo's own
// paint grows past its cell's edges into the gap around it.
function AlumniLogoField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
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
    </div>
  );
}

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
      <AlumniLogoField />
      <ThreadSegment stop="alumni" />
      <Container className="relative flex flex-col gap-10">
        <div className="inline-flex flex-col gap-10 self-start bg-paper p-6 md:p-8">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        </div>
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
              <div className="flex flex-col gap-6 bg-paper px-4 py-8 sm:px-6 md:col-span-6 md:bleed-end">
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
                  // bg-paper: Placeholder's own bg-gold/5 is translucent by
                  // design (fine on the plain paper background it sits on
                  // everywhere else on the site) — here it would let the
                  // logo field bleed through behind it, so this one spot
                  // gets an opaque backing underneath it too.
                  <Placeholder
                    kind="Foto"
                    label={alumnus.name}
                    ratio="3 / 4"
                    className="w-full bg-paper"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <Container className="relative flex items-center justify-center">
          <div className="flex items-center gap-6 bg-paper px-6 py-3">
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
          </div>
        </Container>
      </div>
    </Section>
  );
}
