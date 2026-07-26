import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { requireLocale } from "@/i18n/requireLocale";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: "Enactus Mannheim",
    template: "%s — Enactus Mannheim",
  },
  description: "Enactus Mannheim e.V.",
};

// This is the app's one and only root layout — deliberately no src/app/layout.tsx.
// Next.js's root-layout check is positional (whichever layout is outermost in the
// rendered tree), not tied to that file path, and [locale] is the sole top-level
// entry under src/app/ (styleguide lives at [locale]/styleguide too). If anyone
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
