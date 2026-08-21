import type { MetadataRoute } from "next";
import { org } from "@/content/org";

// App Router file convention — Next auto-injects the <link rel="manifest">
// tag, no hand-written markup. Icon files here are separate from
// src/app/icon.png (that convention file's served URL is content-hashed by
// Next, not a stable path a manifest can reference) — same source artwork,
// generated to the same public/icons/ paths a manifest needs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: org.legalName,
    short_name: org.shortName,
    start_url: "/",
    display: "standalone",
    background_color: "#061031",
    theme_color: "#061031",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
