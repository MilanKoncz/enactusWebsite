"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { RawLink } from "@/lib/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/cn";
import { AdminNav } from "./AdminNav";
import { AdminLogoutButton } from "./AdminLogoutButton";

export type AdminSidebarProps = {
  authenticated: boolean;
};

// The board's own complaint: nine sections crammed into one header row read
// as clutter, and there was no way back to the public site short of editing
// the URL. This replaces that row with a sidebar from md up and a
// collapsible panel below it — and puts the logo/home link outside the
// `authenticated` gate entirely, so even the bare login screen (AdminLogin,
// rendered by every /admin/* page with no session) has a way out.
export function AdminSidebar({ authenticated }: AdminSidebarProps) {
  const t = useTranslations("Admin");
  const [open, setOpen] = useState(false);

  return (
    <aside className="flex flex-col border-b border-ink/10 md:h-screen md:w-64 md:shrink-0 md:sticky md:top-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <RawLink
          href="/"
          aria-label={t("backToSite")}
          className="shrink-0 transition-opacity duration-[var(--duration-fast)] ease-signature hover:opacity-80 focus-visible:opacity-80"
        >
          <Logo variant="compact" surface="paper" />
        </RawLink>
        {authenticated && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-nav-panel"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-body-s transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            {t("nav.label")}
          </button>
        )}
      </div>

      {authenticated && (
        <div
          id="admin-nav-panel"
          className={cn(
            "flex-col gap-8 px-4 pb-6 md:flex md:min-h-0 md:flex-1 md:overflow-y-auto md:px-6 md:py-6",
            open ? "flex" : "hidden md:flex",
          )}
        >
          <AdminNav />
          <div className="md:mt-auto">
            <AdminLogoutButton />
          </div>
        </div>
      )}
    </aside>
  );
}
