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
  "ideathon",
  "termine",
  "partner",
  "kontakt",
  "mitmachen",
  "jobs",
  "impressum",
  "datenschutz",
]);
export type RouteKey = z.infer<typeof routeKeySchema>;

const hrefSchema = z.string().startsWith("/");

// Written as a literal object (not the zod-inferred, string-widened result of
// .parse()) so each key keeps its own literal path type — that's what lets
// `<Link href={routes.termine}>` type-check against next-intl's pathnames
// union in routing.ts without a cast. routesSchema.parse() below still runs,
// purely as a build-time assertion that every value actually starts with
// "/"; its return value is discarded on purpose.
const ROUTE_HREFS = {
  home: "/",
  prozess: "/prozess",
  projekte: "/projekte",
  events: "/events",
  ideathon: "/ideathon",
  termine: "/termine",
  partner: "/partner",
  kontakt: "/kontakt",
  mitmachen: "/mitmachen",
  jobs: "/jobs",
  impressum: "/impressum",
  datenschutz: "/datenschutz",
} as const satisfies Record<RouteKey, string>;

const routesSchema = z.record(routeKeySchema, hrefSchema);
routesSchema.parse(ROUTE_HREFS);
export const routes = ROUTE_HREFS;

export type NavItem = {
  key: RouteKey;
  href: (typeof ROUTE_HREFS)[RouteKey];
};

function navItem<K extends RouteKey>(key: K): { key: K; href: (typeof ROUTE_HREFS)[K] } {
  return { key, href: routes[key] };
}

// The six header items. Deliberately no "home" entry — the logo is the home
// link, per the brief ("bewusst KEIN separater Home-Menüpunkt"). "Termine"
// sits right after "Events" (docs/content-guide.md).
export const mainNav: NavItem[] = [
  navItem("prozess"),
  navItem("projekte"),
  navItem("events"),
  navItem("ideathon"),
  navItem("termine"),
  navItem("partner"),
  navItem("kontakt"),
];

// Not part of mainNav above: "Jobs" only appears in the header/footer once
// at least one non-expired posting exists (Nav.tsx/Footer.tsx read this
// conditionally, gated on a server-fetched job count) — the /jobs route
// itself stays reachable and in the sitemap regardless (routes.jobs above).
// Sits right after "Termine": both are board-maintained, date-driven lists,
// and Jobs is the more actionable of the two for the visitor this nav item
// exists for.
export const jobsNavItem: NavItem = navItem("jobs");

// No dedicated /team route: the Vorstand only appears on the homepage board
// grid (see docs/engineering.md's old-URL redirect map — the old site's
// /team now redirects to / instead of a same-named page here).
export const footerColumns = {
  association: [navItem("partner"), navItem("prozess"), navItem("termine")],
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
