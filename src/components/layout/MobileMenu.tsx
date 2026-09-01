"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/layout/Nav";
import { HeaderSocialLinks } from "@/components/layout/HeaderSocialLinks";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { Logo } from "@/components/layout/Logo";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export type MobileMenuProps = {
  className?: string;
  /** See Header.tsx's identical prop — threaded straight through to Nav. */
  hasJobs?: boolean;
};

// bg-current, not bg-ink: this button renders in the header (ink or paper
// text, depending on HeaderOverlay's state) and inside the fullscreen dialog
// (always paper-on-ink) — a hover tint has to work against whichever surface
// currentColor resolves to, not just one of them.
// p-2.5 around a 24px icon lands the box at 44px square — the touch-target
// floor this pass checked for, not an arbitrary padding choice.
const MENU_BUTTON_CLASSES =
  "inline-flex items-center justify-center rounded-md p-2.5 transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:scale-[1.02] hover:bg-current/10 focus-visible:-translate-y-px focus-visible:scale-[1.02] focus-visible:bg-current/10 active:translate-y-0 active:scale-[0.99] active:bg-current/15";

// Radix Dialog gives focus trap, Escape-to-close, scroll lock, and focus
// return to the trigger for free (Content forces trapFocus, can't be
// disabled) — nothing here is hand-rolled. No Overlay: the panel is opaque
// and fullscreen, an overlay would be a decoration with nothing to do.
export function MobileMenu({ className, hasJobs = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Header");
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("openMenu")}
          className={cn(
            // No hardcoded text color: inherits currentColor, so the icon
            // stays legible whether the header is solid (ink on paper) or
            // transparent over a dark hero (paper, once that surface sets it).
            // bg-current/* for the same reason: a hover tint that's always
            // legible against whichever surface currentColor resolves to.
            MENU_BUTTON_CLASSES,
            "lg:hidden",
            className,
          )}
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          data-surface="ink"
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col gap-10 overflow-y-auto bg-ink px-4 py-6 text-paper data-[state=closed]:animate-[mobile-menu-out_var(--duration-fast)_var(--ease-signature)] data-[state=open]:animate-[mobile-menu-in_var(--duration-fast)_var(--ease-signature)]"
        >
          <Dialog.Title className="sr-only">{t("mobileMenuLabel")}</Dialog.Title>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label={t("home")}
              onClick={close}
              className="transition-opacity duration-[var(--duration-fast)] ease-signature hover:opacity-80 focus-visible:opacity-80"
            >
              <Logo variant="compact" surface="ink" />
            </Link>
            <Dialog.Close asChild>
              <button type="button" aria-label={t("closeMenu")} className={MENU_BUTTON_CLASSES}>
                <X aria-hidden="true" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <Nav variant="mobile" onNavigate={close} showJobs={hasJobs} />
          <LocaleSwitch />
          <Button href="/mitmachen" onClick={close}>
            {t("cta")}
          </Button>
          <HeaderSocialLinks className="justify-center gap-6 border-t border-paper/10 pt-6" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
