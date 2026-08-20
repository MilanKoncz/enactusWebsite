import Image from "next/image";
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
// building site — scattered, real SDG icons and a couple of GateMarkers
// standing in as barriers — built entirely from existing tokens and shapes,
// no new imagery. The decorative layer is a single aria-hidden,
// pointer-events-none div positioned at the section's edges, well clear of
// the centered text column, so it can never sit between a visitor and the
// links back into the site. Its gentle float (animate-construction-float,
// globals.css) is transform-only and, like every other looping animation on
// this site, collapses to a single near-instant frame under
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
  { goal: 17, position: "top-14 right-6 sm:right-10", rotate: "rotate-6", delay: "0.9s" },
  { goal: 4, position: "bottom-12 left-8", rotate: "rotate-3", delay: "1.6s", hideBelow: "hidden sm:block" },
  { goal: 13, position: "bottom-16 right-10", rotate: "-rotate-3", delay: "0.5s", hideBelow: "hidden sm:block" },
];

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
        <GateMarker
          label={t("gateConstruction")}
          className="absolute bottom-8 left-[12%] hidden opacity-70 md:flex"
        />
        <GateMarker label={t("gateInnolab")} className="absolute bottom-8 right-[12%] hidden opacity-70 md:flex" />
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
