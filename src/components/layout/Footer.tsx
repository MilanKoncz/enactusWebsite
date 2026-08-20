import type { ComponentType } from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { SiFacebook, SiInstagram } from "@icons-pack/react-simple-icons";
import { FaLinkedin } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { Logo } from "@/components/layout/Logo";
import { EightBitEasterEgg } from "@/components/motion/EightBitEasterEgg";
import {
  footerColumns,
  jobsNavItem,
  networkLinks,
  socialLinks,
  routes,
  type NetworkLink,
  type RouteKey,
  type SocialKey,
  type SocialLink,
} from "@/content/navigation";
import { org } from "@/content/org";
import { Link } from "@/lib/navigation";

// Simple Icons dropped LinkedIn's mark after a takedown request, in both
// @icons-pack/react-simple-icons and the upstream simple-icons package it
// wraps — there is no LinkedIn export to use from that set. react-icons'
// bundled Font Awesome brand icon fills the gap for this one entry only;
// Instagram/Facebook keep their Simple Icons mark, unchanged.
const SOCIAL_ICONS: Partial<Record<SocialKey, ComponentType<{ className?: string; "aria-hidden"?: boolean }>>> = {
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  facebook: SiFacebook,
};

function ExternalLinkItem({
  link,
  label,
  missingHint,
}: {
  link: NetworkLink | SocialLink;
  label: string;
  missingHint: string;
}) {
  if (link.href === null) {
    return (
      <PlaceholderMark variant="missing" hint={missingHint} className="opacity-80">
        {label}
      </PlaceholderMark>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className="link-underline">
      {label}
    </a>
  );
}

export type FooterProps = {
  /** See Header.tsx's identical prop — fetched once by the site layout and
      threaded down, since useTranslations below can't be called from an
      async component (react-hooks/rules-of-hooks). */
  hasJobs?: boolean;
};

export function Footer({ hasJobs = false }: FooterProps) {
  const t = useTranslations("Footer");
  const tRoutes = useTranslations("Routes");
  const tSite = useTranslations("Site");
  const tPlaceholder = useTranslations("Placeholder");

  const associationLinks = hasJobs ? [...footerColumns.association, jobsNavItem] : footerColumns.association;

  return (
    <footer className="relative mt-auto">
      {/* Easter egg 3/7 (docs/eastereggs.md) — a sibling of Section, not a
          child, so its absolute bottom-anchored button positions against
          the whole footer's box rather than Container's narrower, padded
          one. */}
      <EightBitEasterEgg />
      <Section surface="ink">
        <Container className="flex flex-col gap-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-3 lg:col-span-1">
              <Link
                href={routes.home}
                aria-label={tRoutes("home")}
                className="transition-opacity duration-[var(--duration-fast)] ease-signature hover:opacity-80 focus-visible:opacity-80"
              >
                <Logo variant="full" surface="ink" />
              </Link>
              <p className="text-body-s opacity-60">{tSite("claim")}</p>
              <p className="text-body-s opacity-60">
                {org.foundingYear.verified ? (
                  t("since", { year: org.foundingYear.year })
                ) : (
                  <PlaceholderMark variant="unverified" hint={tPlaceholder("unverifiedHint")}>
                    {t("since", { year: org.foundingYear.year })}
                  </PlaceholderMark>
                )}
              </p>
            </div>

            <nav aria-label={t("navLabel")} className="contents">
              <div className="flex flex-col gap-3">
                <h2 className="text-mono-s font-mono uppercase opacity-60">
                  {t("columns.association")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {associationLinks.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className="link-underline">
                        {tRoutes(item.key as RouteKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-mono-s font-mono uppercase opacity-60">
                  {t("columns.network")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {networkLinks.map((link) => (
                    <li key={link.key} className="flex items-center gap-2">
                      <ExternalLinkItem
                        link={link}
                        label={t(`network.${link.key}`)}
                        missingHint={tPlaceholder("missingHint")}
                      />
                      {link.href !== null && (
                        <ExternalLinkIcon aria-hidden="true" className="size-3 shrink-0 opacity-60" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-mono-s font-mono uppercase opacity-60">
                  {t("columns.legal")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {footerColumns.legal.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className="link-underline">
                        {tRoutes(item.key as RouteKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div
            role="group"
            aria-label={t("social.label")}
            className="flex flex-wrap gap-6 border-t border-paper/10 pt-8"
          >
            {socialLinks.map((link) => {
              const Icon = SOCIAL_ICONS[link.key];
              const label = t(`social.${link.key}`);
              return (
                <span key={link.key} className="inline-flex items-center gap-2 text-mono-s font-mono uppercase">
                  {Icon && <Icon aria-hidden className="size-4" />}
                  <ExternalLinkItem
                    link={link}
                    label={label}
                    missingHint={tPlaceholder("missingHint")}
                  />
                </span>
              );
            })}
          </div>

          <p className="text-body-s opacity-60">{t("copyright")}</p>
        </Container>
      </Section>
    </footer>
  );
}
