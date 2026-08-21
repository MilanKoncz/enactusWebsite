import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { mainNav, routes } from "@/content/navigation";
import { sdgIconSrc, type SdgGoal } from "@/content/sdg";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/cn";

// Next.js's not-found.tsx convention doesn't receive route params, so this
// relies on the request-scoped locale the [locale] layout already set via
// setRequestLocale rather than an explicit locale override. Status code and
// route behavior are entirely Next's own not-found convention — nothing
// here changes either.
//
// Easter egg 5/7 (docs/eastereggs.md): the 404 reads as a small InnoLab
// building site — scattered, real SDG icons, a lattice tower crane hoisting
// one of them by a dashed cable, an AlertTriangle (lucide-react, the same
// icon FormStatusMessage.tsx's own error state already uses — a real
// hazard cue, not a new pictogram), hazard-stripe tape along the bottom
// edge, and a couple of GateMarkers standing in as barriers — built
// entirely from existing tokens, icons, and shapes, no new imagery. The
// decorative layer is a single aria-hidden, pointer-events-none div
// positioned at the section's edges, well clear of the centered text
// column, so it can never sit between a visitor and the links back into
// the site. The tiles' gentle float (animate-construction-float,
// globals.css) is transform-only and, like every other looping animation
// on this site, collapses to a single near-instant frame under
// prefers-reduced-motion via the blanket override in globals.css — nothing
// here needs its own reduced-motion guard on top of that.
//
// "404" is the motif, not a warning: large display font, the same register
// as a homepage headline, not an alarm color or a filled button telling the
// visitor what to do next. The heading itself stays the meaningful text
// (t("title")) for anyone using a screen reader.
//
// Gold as a text color is only allowed on ink (docs/design-system.md — gold
// on paper measures 1.47:1). The page runs on an ink surface for that
// reason, not on paper with a gold override.
const CONSTRUCTION_TILES: { goal: SdgGoal; position: string; rotate: string; delay: string; hideBelow?: string }[] = [
  { goal: 9, position: "top-10 left-6 sm:left-10", rotate: "-rotate-6", delay: "0s" },
  { goal: 4, position: "bottom-12 left-8", rotate: "rotate-3", delay: "1.6s", hideBelow: "hidden sm:block" },
  { goal: 13, position: "bottom-16 right-10", rotate: "-rotate-3", delay: "0.5s", hideBelow: "hidden sm:block" },
];

// A gold-line lattice tower crane — the same 2px rule weight as
// GateMarker's own signature motif — hoisting one SDG tile by a dashed
// cable. The first pass here was a single mast/jib/cable "L" shape and
// read as too abstract to register as a crane at all (board feedback);
// this one adds the details that actually make a silhouette legible as a
// tower crane at a glance: a lattice mast (two rails plus zigzag bracing,
// not one flagpole line), a counter-jib with a counterweight block, and
// the A-frame apex bracing both arms. Built as inline SVG (`viewBox`, real
// vector geometry) rather than a stack of absolutely-positioned divs —
// GermanyMap.tsx already establishes hand-built SVG as this site's way of
// drawing a precise shape no CSS utility approximates well, and a crane's
// diagonal struts are exactly that case. `fill="none" stroke="var(--color-
// gold)"` on the root cascades to every child that doesn't set its own,
// the normal SVG inheritance rule, so only the two solid accents
// (counterweight, trolley) need their own `fill`. The cable stays a plain
// CSS div, not SVG — it reuses the site's existing "tentative"
// dashed-gold-border vocabulary (docs/design-system.md's calendar
// section) rather than inventing a second dashed-line style: a tile still
// "in progress" reads the same way here as it does on an unconfirmed
// calendar event.
function ConstructionCrane({
  className,
  tileGoal,
  tileDelay,
}: {
  className?: string;
  tileGoal: SdgGoal;
  tileDelay: string;
}) {
  return (
    <div aria-hidden="true" className={cn("absolute", className)} style={{ width: 160, height: 210 }}>
      <svg viewBox="0 0 160 210" width={160} height={210} fill="none" stroke="var(--color-gold)" strokeWidth={2}>
        {/* Lattice mast: two rails plus zigzag cross-bracing. */}
        <line x1={54} y1={45} x2={54} y2={200} />
        <line x1={66} y1={45} x2={66} y2={200} />
        <polyline points="54,55 66,75 54,95 66,115 54,135 66,155 54,175 66,195" strokeWidth={1.5} />
        {/* Jib (long arm) and counter-jib (short arm) with its counterweight. */}
        <line x1={60} y1={45} x2={150} y2={45} />
        <line x1={60} y1={45} x2={20} y2={45} />
        <rect x={8} y={39} width={14} height={12} fill="var(--color-gold)" stroke="none" />
        {/* A-frame apex bracing both arms — the detail that actually reads
            as "tower crane" rather than a bent pole. */}
        <line x1={60} y1={45} x2={60} y2={20} />
        <line x1={60} y1={20} x2={150} y2={45} />
        <line x1={60} y1={20} x2={20} y2={45} />
        {/* Trolley: the block the cable actually runs through. */}
        <rect x={116} y={42} width={8} height={6} fill="var(--color-gold)" stroke="none" />
      </svg>
      <div className="absolute border-l-2 border-dashed border-gold" style={{ top: 48, left: 120, height: 95 }} />
      <span
        className="absolute block size-10 animate-construction-float opacity-70 sm:size-12"
        style={{ top: 138, left: 98, animationDelay: tileDelay }}
      >
        <Image src={sdgIconSrc(tileGoal)} alt="" fill sizes="48px" className="object-contain" />
      </span>
    </div>
  );
}

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  const tRoutes = await getTranslations("Routes");

  return (
    <Section surface="ink" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        {CONSTRUCTION_TILES.map(({ goal, position, rotate, delay, hideBelow }) => (
          <span key={goal} className={cn("absolute", position, rotate, hideBelow)}>
            <span
              className="relative block size-10 animate-construction-float opacity-60 sm:size-14"
              style={{ animationDelay: delay }}
            >
              <Image src={sdgIconSrc(goal)} alt="" fill sizes="56px" className="object-contain" />
            </span>
          </span>
        ))}
        <ConstructionCrane tileGoal={17} tileDelay="0.9s" className="top-3 right-3 hidden opacity-80 sm:block" />
        <AlertTriangle
          className="absolute bottom-24 left-[6%] hidden size-10 -rotate-6 text-gold opacity-80 md:block"
          strokeWidth={1.75}
        />
        <GateMarker
          label={t("gateConstruction")}
          className="absolute bottom-8 left-[12%] hidden opacity-70 md:flex"
        />
        <GateMarker label={t("gateInnolab")} className="absolute bottom-8 right-[12%] hidden opacity-70 md:flex" />
        {/* Hazard-stripe tape (globals.css's .hazard-stripes) — a literal
            construction barrier, gold/ink diagonal stripes, along the
            section's bottom edge. */}
        <div className="hazard-stripes absolute inset-x-0 bottom-0 h-3 opacity-90" />
      </div>

      <Container className="relative flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p aria-hidden="true" className="text-display-1 font-display leading-none text-gold">
          404
        </p>
        <h1 className="text-heading-2 font-sans">{t("title")}</h1>
        <p className="max-w-md text-body-l opacity-60">{t("note")}</p>
        <div className="flex flex-col items-center gap-3">
          <Link href={routes.home} className="link-underline text-body-m">
            {t("backHome")}
          </Link>
          <nav aria-label={t("moreLinks")}>
            <p className="mb-2 font-mono text-mono-xs uppercase opacity-60">{t("moreLinks")}</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {mainNav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="link-underline text-body-s">
                    {tRoutes(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </Section>
  );
}
