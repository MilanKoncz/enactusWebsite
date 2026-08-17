"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RawLink } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import { ADMIN_SECTIONS } from "./adminSections";

// next/navigation's usePathname, not next-intl's: this needs the real
// browser path to decide which link is current, and the admin area is
// unprefixed by definition (proxy.ts 404s /en/admin). RawLink for the same
// reason — these are literal paths, not localised routes.
export function AdminNav() {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-wrap gap-x-1 gap-y-2 py-3">
        <li>
          <AdminNavLink href="/admin" current={pathname === "/admin"}>
            {t("overview")}
          </AdminNavLink>
        </li>
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.href}>
            <AdminNavLink href={section.href} current={pathname.startsWith(section.href)}>
              {t(section.messageKey)}
            </AdminNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AdminNavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <RawLink
      href={href}
      // aria-current is what actually communicates "you are here" — the
      // gold underline below is the visual echo of it, not the mechanism.
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex rounded-md px-3 py-1.5 text-body-s transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2",
        current
          ? "border-b-2 border-gold font-medium text-ink"
          : "border-b-2 border-transparent opacity-60 hover:opacity-100",
      )}
    >
      {children}
    </RawLink>
  );
}
