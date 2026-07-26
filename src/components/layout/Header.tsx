"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";
import { Nav } from "@/components/layout/Nav";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Link } from "@/lib/navigation";

// Fixed (not sticky), so the scroll-compact resize genuinely cannot shift
// page content — a sticky header still occupies flow space, and shrinking it
// would pull content up. The sentinel div right below doubles as the spacer
// that reserves the header's own height AND the IntersectionObserver target:
// "reserve space" and "detect scroll position" are the same element instead
// of two independently-maintained numbers. h-24 (6rem) matches globals.css's
// scroll-margin-top, so anchor jumps and the skip link land correctly.
export function Header() {
  const t = useTranslations("Header");
  const [compact, setCompact] = useState(false);
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
        className="fixed inset-x-0 top-0 z-40 border-b border-ink/0 bg-paper py-6 transition-[padding,border-color] duration-200 data-[compact=true]:border-ink/10 data-[compact=true]:py-3"
      >
        <Container className="flex items-center justify-between gap-6">
          <Link href="/" aria-label={t("home")}>
            <Logo variant="full" />
          </Link>
          <Nav variant="desktop" className="hidden lg:flex" />
          <div className="flex items-center gap-4">
            <LocaleSwitch className="hidden lg:flex" />
            <Button href="/mitmachen" size="sm" className="hidden lg:inline-flex">
              {t("cta")}
            </Button>
            <MobileMenu />
          </div>
        </Container>
      </header>
      <div ref={sentinelRef} aria-hidden="true" className="h-24 shrink-0" />
    </>
  );
}
