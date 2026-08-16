import { z } from "zod";

/**
 * The single source of truth for every route the Header/Footer link to.
 * Validated so a typo here fails the build instead of quietly 404ing a nav
 * link. Labels are NOT stored here — they come from messages/{locale}.json's
 * "Routes" namespace via useTranslations, keeping this file locale-agnostic.
 */
const routeKeySchema = z.enum([
  "home",
  "prozess",
  "projekte",
  "events",
  "partner",
  "kontakt",
  "mitmachen",
  "impressum",
  "datenschutz",
]);
export type RouteKey = z.infer<typeof routeKeySchema>;

const hrefSchema = z.string().startsWith("/");

const routesSchema = z.record(routeKeySchema, hrefSchema);
export const routes = routesSchema.parse({
  home: "/",
  prozess: "/prozess",
  projekte: "/projekte",
  events: "/events",
  partner: "/partner",
  kontakt: "/kontakt",
  mitmachen: "/mitmachen",
  impressum: "/impressum",
  datenschutz: "/datenschutz",
} satisfies Record<RouteKey, string>);

const navItemSchema = z.object({
  key: routeKeySchema,
  href: hrefSchema,
});
export type NavItem = z.infer<typeof navItemSchema>;

function navItem(key: RouteKey): NavItem {
  return navItemSchema.parse({ key, href: routes[key] });
}

// The five header items. Deliberately no "home" entry — the logo is the home
// link, per the brief ("bewusst KEIN separater Home-Menüpunkt").
export const mainNav: NavItem[] = [
  navItem("prozess"),
  navItem("projekte"),
  navItem("events"),
  navItem("partner"),
  navItem("kontakt"),
];

// No dedicated /team route: the Vorstand only appears on the homepage board
// grid (see docs/engineering.md's old-URL redirect map — the old site's
// /team now redirects to / instead of a same-named page here).
export const footerColumns = {
  association: [navItem("partner"), navItem("prozess")],
  legal: [navItem("impressum"), navItem("datenschutz")],
} as const;

// Keys are enums, not bare strings, so `t(`network.${key}`)` in Footer.tsx
// stays statically checked against messages/de.json's Footer.network/social
// namespaces — the same "typo fails the build" guarantee as routeKeySchema.
const networkKeySchema = z.enum(["enactusGermany", "enactusGlobal"]);
export type NetworkKey = z.infer<typeof networkKeySchema>;

const networkLinkSchema = z.object({
  key: networkKeySchema,
  href: z.url().nullable(),
});
export type NetworkLink = z.infer<typeof networkLinkSchema>;

export const networkLinks: NetworkLink[] = [
  networkLinkSchema.parse({ key: "enactusGermany", href: "https://enactus.de" }),
  networkLinkSchema.parse({ key: "enactusGlobal", href: "https://enactus.org" }),
];

// No Spotify or YouTube account exists for the club — not omitted for lack
// of a link, there is simply nothing to link to. Don't re-add either without
// confirming a real account first.
const socialKeySchema = z.enum(["instagram", "linkedin", "facebook"]);
export type SocialKey = z.infer<typeof socialKeySchema>;

const socialLinkSchema = z.object({
  key: socialKeySchema,
  href: z.url().nullable(),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

export const socialLinks: SocialLink[] = [
  socialLinkSchema.parse({ key: "instagram", href: "https://www.instagram.com/enactus_mannheim/" }),
  socialLinkSchema.parse({ key: "linkedin", href: "https://www.linkedin.com/company/enactusmannheim/" }),
  socialLinkSchema.parse({ key: "facebook", href: "https://www.facebook.com/unimannheim.enactus/" }),
];
