import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // Stars section YouTube facade (YouTubeFacade.tsx): the poster is
    // YouTube's own static thumbnail, fetched only for stars that have a
    // confirmed pitch video — see docs/design-system.md's click-to-load
    // facade requirement.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

// Auto-detects ./src/i18n/request.ts — no path argument needed.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
