import type { ComponentType } from "react";
import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { headerSocialKeys, socialLinks, type HeaderSocialKey } from "@/content/navigation";
import { cn } from "@/lib/cn";

// currentColor by default (see Footer.tsx's identical choice) — never the
// brand green as a filled shape, just an outline-weight mark that follows
// whichever text color the header/mobile menu surface is already using.
const ICONS: Record<HeaderSocialKey, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  whatsapp: SiWhatsapp,
  instagram: SiInstagram,
};

// 44px touch target (p-3.5 = 14px around a 16px icon), the same box size
// MobileMenu.tsx's own MENU_BUTTON_CLASSES lands on with its larger icon —
// kept deliberately understated (opacity-70, no fill) so it doesn't compete
// with the "Mitmachen" CTA it sits next to.
const LINK_CLASSES =
  "inline-flex items-center justify-center rounded-md p-3.5 opacity-70 transition-[opacity,background-color,transform] duration-(--duration-fast) ease-signature hover:-translate-y-px hover:scale-[1.02] hover:bg-current/10 hover:opacity-100 focus-visible:-translate-y-px focus-visible:scale-[1.02] focus-visible:bg-current/10 focus-visible:opacity-100 active:translate-y-0 active:scale-[0.99] active:bg-current/15";

export type HeaderSocialLinksProps = {
  className?: string;
};

// Shared between Header.tsx (desktop row, hidden below lg) and
// MobileMenu.tsx (bottom of the open panel) — one data-driven source so the
// two never drift out of sync on which channels or labels they show.
export function HeaderSocialLinks({ className }: HeaderSocialLinksProps) {
  const t = useTranslations("Header.social");
  const links = headerSocialKeys
    .map((key) => {
      const href = socialLinks.find((link) => link.key === key)?.href;
      return href ? { key, href } : null;
    })
    .filter((link): link is { key: HeaderSocialKey; href: string } => link !== null);

  if (links.length === 0) return null;

  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const Icon = ICONS[link.key];
        return (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`${link.key}Label`)}
            className={LINK_CLASSES}
          >
            <Icon aria-hidden className="size-4" />
          </a>
        );
      })}
    </div>
  );
}
