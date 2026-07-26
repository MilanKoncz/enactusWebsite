"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/layout/Nav";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { Logo } from "@/components/layout/Logo";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export type MobileMenuProps = {
  className?: string;
};

// Radix Dialog gives focus trap, Escape-to-close, scroll lock, and focus
// return to the trigger for free (Content forces trapFocus, can't be
// disabled) — nothing here is hand-rolled. No Overlay: the panel is opaque
// and fullscreen, an overlay would be a decoration with nothing to do.
export function MobileMenu({ className }: MobileMenuProps) {
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
            "inline-flex items-center justify-center rounded-md p-2 lg:hidden",
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
          className="fixed inset-0 z-50 flex flex-col gap-10 overflow-y-auto bg-ink px-4 py-6 text-paper"
        >
          <Dialog.Title className="sr-only">{t("mobileMenuLabel")}</Dialog.Title>
          <div className="flex items-center justify-between">
            <Link href="/" aria-label={t("home")} onClick={close}>
              <Logo variant="compact" className="border-paper text-paper" />
            </Link>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="inline-flex items-center justify-center rounded-md p-2"
              >
                <X aria-hidden="true" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <Nav variant="mobile" onNavigate={close} />
          <LocaleSwitch />
          <Button href="/mitmachen" onClick={close}>
            {t("cta")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
