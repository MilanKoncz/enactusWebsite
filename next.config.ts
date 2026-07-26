import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// Auto-detects ./src/i18n/request.ts — no path argument needed.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
