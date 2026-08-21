import { org, socialLinks } from "@/content/org";
import { siteUrl } from "@/lib/siteUrl";

/**
 * Organization structured data (schema.org JSON-LD), homepage only — the
 * canonical page for "who is this site about." Every field comes from
 * content/org.ts / content/navigation.ts, the same facts already shown in
 * the footer and /impressum, never invented for this component alone.
 * "Organization", not the more specific "NGO": Enactus Mannheim e.V. is a
 * registered association (Verein), and schema.org's NGO type implies a
 * humanitarian/aid-org character this site never claims.
 */
export function OrganizationJsonLd({ description }: { description: string }) {
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.legalName,
    url: base,
    logo: `${base}/icon.png`,
    description,
    foundingDate: String(org.foundingYear.year),
    email: org.contactEmails.board,
    ...(org.registeredOffice
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: org.registeredOffice,
            addressLocality: "Mannheim",
            addressCountry: "DE",
          },
        }
      : {}),
    sameAs: socialLinks.map((link) => link.href),
  };

  return (
    // Static, server-controlled data only — no user input ever reaches
    // this — but the `<` escape is cheap insurance against a future edit
    // introducing a value that could otherwise break out of the script tag.
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
