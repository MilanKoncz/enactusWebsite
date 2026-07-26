"use client";

import { useTranslations } from "next-intl";
import { mainNav } from "@/content/navigation";
import { Link, usePathname } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export type NavProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
};

export function Nav({ variant = "desktop", onNavigate, className }: NavProps) {
  const t = useTranslations("Routes");
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  return (
    <nav
      aria-label={tHeader("navLabel")}
      className={cn(
        variant === "desktop" ? "flex items-center gap-6" : "flex flex-col gap-6",
        className,
      )}
    >
      {mainNav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 pb-1 text-body-m font-medium",
              isActive ? "border-gold" : "border-transparent",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
