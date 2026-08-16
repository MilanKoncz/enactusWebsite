import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/siteUrl";
import { isProductionDeployment } from "@/lib/productionDeployment";

// /styleguide is a design reference for the team, not public content — kept
// out of the crawl in both locales, same reasoning as sitemap.ts excluding
// it entirely. /api/ has no crawlable pages, just endpoints.
//
// Only the confirmed production domain, on a real production deployment,
// may be indexed — see productionDeployment.ts. Everything else (a preview
// build, the *.vercel.app alias, local dev, or a production build reached
// through some other host) disallows every path here; proxy.ts backs this
// up with an X-Robots-Tag: noindex header on the actual responses, since a
// disallowed URL that's still linked to elsewhere can otherwise turn up in
// search results without one.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const host = (await headers()).get("host");

  if (!isProductionDeployment(host)) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${base}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/styleguide", "/en/styleguide"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
