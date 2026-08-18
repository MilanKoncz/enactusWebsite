"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RawLink } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import { ADMIN_GROUPS, ADMIN_SECTIONS, type AdminGroup } from "./adminSections";

// The overview link isn't part of ADMIN_SECTIONS (it has no messageKey under
// Admin.overview.sections, since the overview page doesn't link to itself)
// but it's still one of the board's four named groups — "System: Übersicht,
// Löschanfragen, Systemstatus" — so it renders as the first item of
// `system` here rather than sitting outside the grouping.
const OVERVIEW_HREF = "/admin";

// next/navigation's usePathname, not next-intl's: this needs the real
// browser path to decide which link is current, and the admin area is
// unprefixed by definition (proxy.ts 404s /en/admin). RawLink for the same
// reason — these are literal paths, not localised routes.
export function AdminNav() {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-col gap-6">
        {ADMIN_GROUPS.map((group) => (
          <li key={group}>
            <GroupLabel group={group} />
            <ul className="flex flex-col gap-1">
              {group === "system" && (
                <li>
                  <AdminNavLink href={OVERVIEW_HREF} current={pathname === OVERVIEW_HREF} icon={LayoutDashboard}>
                    {t("overview")}
                  </AdminNavLink>
                </li>
              )}
              {ADMIN_SECTIONS.filter((section) => section.group === group).map((section) => (
                <li key={section.href}>
                  <AdminNavLink href={section.href} current={pathname.startsWith(section.href)} icon={section.icon}>
                    {t(section.messageKey)}
                  </AdminNavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function GroupLabel({ group }: { group: AdminGroup }) {
  const t = useTranslations("Admin.nav");
  return <p className="mb-2 px-3 font-mono text-mono-xs uppercase opacity-50">{t(`groups.${group}`)}</p>;
}

function AdminNavLink({
  href,
  current,
  icon: Icon,
  children,
}: {
  href: string;
  current: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <RawLink
      href={href}
      // aria-current is what actually communicates "you are here" — the
      // gold rule below is the visual echo of it, not the mechanism. The
      // left rule reuses the same idiom as a project status Badge's left
      // edge (docs/design-system.md's gate-marker motif), just applied to
      // "current nav item" instead of "project status".
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-body-s transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2",
        current
          ? "border-gold bg-ink/5 font-medium text-ink"
          : "border-transparent opacity-60 hover:bg-ink/5 hover:opacity-100",
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </RawLink>
  );
}
