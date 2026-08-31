import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { requireLocale } from "@/i18n/requireLocale";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/siteUrl";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Self-hosted, not next/font/google: Lilita One isn't a font this project
// hotlinks from Google's CDN (CLAUDE.md — that's a ruled GDPR violation in
// Germany), so the file lives in the repo under src/fonts/lilita-one/,
// fetched from Google's own official fonts repository, OFL license
// included alongside it. One weight, no italic — that's the whole font;
// every display-font usage in this codebase was audited to make sure none
// asks for a cut that doesn't exist (see the font-normal! overrides next to
// text-heading-2/3 elsewhere — those sizes carry a 600 weight of their own,
// which a single-weight font can't honor without the browser faking it).
// adjustFontFallback (default, left on) computes size-adjusted metrics for
// the fallback stack automatically from the font file itself, so a
// layout-shift-free load doesn't need a hand-tuned override here.
const lilitaOne = localFont({
  src: "../../fonts/lilita-one/LilitaOne-Regular.woff2",
  variable: "--font-lilita-one",
  weight: "400",
  style: "normal",
  display: "swap",
});

// The 8-bit easter egg's typeface (docs/eastereggs.md), self-hosted for the
// same reason as Lilita One above — fetched from Google's official fonts
// repository, OFL license included alongside it (src/fonts/press-start-2p/).
// Loaded unconditionally rather than only while the mode is active: a
// dynamic per-session font load would need its own loading/flash-of-
// fallback handling for a 60-second novelty, which next/font's
// build-time-generated stylesheet already avoids by just always being
// available — the mode's CSS layer (globals.css) is what actually decides
// whether anything ever uses it.
const pressStart2P = localFont({
  src: "../../fonts/press-start-2p/PressStart2P-Regular.ttf",
  variable: "--font-press-start-2p",
  weight: "400",
  style: "normal",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  // Gives every *other* absolute URL Metadata resolves (canonical, og:url,
  // alternates) a real origin instead of Next's own localhost fallback.
  //
  // Doesn't reach opengraph-image.png specifically: Next resolves a static
  // metadata-route-file image's own absolute URL through a separate path
  // (node_modules/next/dist/.../resolve-opengraph.js) that ignores this
  // metadataBase on purpose and instead prefers Vercel's own system env
  // vars (VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL) when present, so a
  // preview deployment's share card points at that preview's own URL, not
  // whatever NEXT_PUBLIC_SITE_URL happens to be. On Vercel that resolves
  // correctly with zero config. A local `next build` has neither Vercel var
  // nor a confirmed production domain (see ASSETS-TODO.md's siteUrl.ts row)
  // and prints a harmless "metadataBase ... not set" warning + a
  // localhost-based image URL — expected there, not a sign this is broken.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Enactus Mannheim",
    template: "%s, Enactus Mannheim",
  },
  description: "Enactus Mannheim e.V.",
  // opengraph-image.png (this directory) covers Open Graph automatically;
  // Twitter falls back to the same file but only renders it large with the
  // card type declared explicitly.
  twitter: {
    card: "summary_large_image",
  },
};

// This is the app's one and only root layout — deliberately no src/app/layout.tsx.
// Next.js's root-layout check is positional (whichever layout is outermost in the
// rendered tree), not tied to that file path, and [locale] is the sole top-level
// entry under src/app/ (admin lives at [locale]/admin too). If anyone
// adds a page directly under src/app/ outside [locale], Next will silently
// regenerate a bare app/layout.tsx in dev to satisfy that check — delete it and
// move the new page under [locale] instead.
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = await requireLocale(params);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${lilitaOne.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
