"use client";

import { useTranslations } from "next-intl";
import { mainNav, jobsNavItem } from "@/content/navigation";
import { Link, usePathname } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export type NavProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
  /** Whether at least one non-expired job posting exists — see
      content/navigation.ts's jobsNavItem comment. Threaded down from the
      site layout's server-fetched count, not read here. */
  showJobs?: boolean;
};

export function Nav({ variant = "desktop", onNavigate, className, showJobs = false }: NavProps) {
  const t = useTranslations("Routes");
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  // Spliced in after "termine" — see jobsNavItem's own comment for why that
  // slot.
  const termineIndex = mainNav.findIndex((item) => item.key === "termine");
  const items = showJobs
    ? [...mainNav.slice(0, termineIndex + 1), jobsNavItem, ...mainNav.slice(termineIndex + 1)]
    : mainNav;

  return (
    <nav
      aria-label={tHeader("navLabel")}
      className={cn(
        variant === "desktop" ? "flex items-center gap-6" : "flex flex-col gap-6",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              // border-current, not border-ink: the header renders this same
              // Nav in its transparent, text-paper state over the hero
              // (HeaderOverlay), where an ink-colored hover rule would be
              // nearly invisible against the dark backdrop.
              "border-b-2 pb-1 text-body-m font-medium transition-colors duration-[var(--duration-fast)] ease-signature",
              isActive
                ? "border-gold"
                : "border-transparent hover:border-current/30 focus-visible:border-current/30",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
