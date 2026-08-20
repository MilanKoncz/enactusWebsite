"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";
import { Nav } from "@/components/layout/Nav";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NightModeZzz } from "@/components/motion/NightModeZzz";
import { SkipLink } from "@/components/layout/SkipLink";
import { useHeaderSurface } from "@/components/layout/HeaderSurface";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/cn";

// Fixed (not sticky), so the scroll-compact resize genuinely cannot shift
// page content — a sticky header still occupies flow space, and shrinking it
// would pull content up. The sentinel div right below doubles as the spacer
// that reserves the header's own height AND the IntersectionObserver target:
// "reserve space" and "detect scroll position" are the same element instead
// of two independently-maintained numbers. h-24 (6rem) matches globals.css's
// scroll-margin-top, so anchor jumps and the skip link land correctly.
//
// `overlaid` (from HeaderSurfaceContext, set by a hero section via
// HeaderOverlay) is a second, independent axis from `compact`: compact
// tracks scroll position on every route, overlaid tracks whether a dark
// hero is currently behind the fixed header. Only the homepage ever sets
// it; everywhere else it stays at its default `false` and the header
// behaves exactly as before. data-surface="ink" while overlaid reuses the
// existing focus-ring mechanism (globals.css), so the ring goes gold over
// the dark hero without a separate code path.
export type HeaderProps = {
  /** Whether "Jobs" should appear in the nav — see Nav.tsx's own prop
      comment. Fetched once, server-side, by the site layout that renders
      this component, and threaded down rather than fetched here: Header is
      a client component and can't await the database itself. */
  hasJobs?: boolean;
};

export function Header({ hasJobs = false }: HeaderProps) {
  const t = useTranslations("Header");
  const [compact, setCompact] = useState(false);
  const { overlaid } = useHeaderSurface();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        data-compact={compact ? "true" : undefined}
        data-surface={overlaid ? "ink" : undefined}
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b py-6 transition-[padding,background-color,border-color,color] duration-(--duration-calm) ease-signature",
          overlaid
            ? "border-transparent bg-transparent text-paper"
            : "border-ink/0 bg-paper text-ink data-[compact=true]:border-ink/10",
          compact && "py-3",
        )}>
        {/* Rendered here rather than as a preceding sibling in the site
            layout, so it's always contained within the <header> element's
            own "banner" landmark — `focus:fixed` in SkipLink.tsx means its
            focused position and visual appearance don't depend on where in
            the DOM it lives, so this doesn't change how it looks or
            behaves, only that it's guaranteed to sit inside a landmark on
            every route (axe's "region" rule, tests/e2e/not-found.spec.ts). */}
        <SkipLink />
        <Container className="flex items-center justify-between gap-6">
          <Link
            href="/"
            aria-label={t("home")}
            className="relative transition-opacity duration-(--duration-fast) ease-signature hover:opacity-80 focus-visible:opacity-80">
            <Logo variant="full" surface={overlaid ? "ink" : "paper"} />
            {/* Easter egg 6/7 (docs/eastereggs.md) — on every page, not just
                the homepage hero, since the header logo is the one Enactus
                mark a visitor sees regardless of route. */}
            <NightModeZzz surface={overlaid ? "ink" : "paper"} className="-top-1 -right-2" />
          </Link>
          <Nav variant="desktop" showJobs={hasJobs} className="hidden lg:flex" />
          <div className="flex items-center gap-4">
            <LocaleSwitch className="hidden lg:flex" />
            <Button href="/mitmachen" size="sm" className="hidden lg:inline-flex">
              {t("cta")}
            </Button>
            <MobileMenu hasJobs={hasJobs} />
          </div>
        </Container>
      </header>
      <div ref={sentinelRef} aria-hidden="true" className="h-24 shrink-0" />
    </>
  );
}
