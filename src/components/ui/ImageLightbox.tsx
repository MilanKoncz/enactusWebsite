"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type ImageLightboxProps = {
  src: string;
  alt: string;
  children: ReactNode;
  triggerClassName?: string;
};

// Wraps an already-rendered image (board portrait, project photo, event
// photo, alumni photo — anywhere content/*.ts confirms a real file, never a
// Placeholder) in a click-to-enlarge dialog. Radix gives focus trap,
// Escape-to-close, and focus return to the trigger for free (same
// reasoning as MobileMenu's identical comment) — nothing here hand-rolls
// any of that. The trigger is a real <button> around the existing
// thumbnail markup, so it's reachable and activatable by keyboard exactly
// like any other control, not a click handler on a non-interactive <img>.
export function ImageLightbox({ src, alt, children, triggerClassName }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("ImageLightbox");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("openLabel", { alt })}
          className={cn(
            "block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2",
            triggerClassName,
          )}
        >
          {children}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/90" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12"
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label={t("close")}
              className="absolute right-4 top-4 inline-flex items-center justify-center rounded-md bg-ink/40 p-2 text-paper backdrop-blur-sm transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/60 focus-visible:-translate-y-px focus-visible:bg-ink/60"
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </Dialog.Close>
          <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
            <Image src={src} alt={alt} fill sizes="90vw" className="object-contain" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
