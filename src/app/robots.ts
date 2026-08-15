import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

// /styleguide is a design reference for the team, not public content — kept
// out of the crawl in both locales, same reasoning as sitemap.ts excluding
// it entirely. /api/ has no crawlable pages, just endpoints.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/styleguide", "/en/styleguide"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
