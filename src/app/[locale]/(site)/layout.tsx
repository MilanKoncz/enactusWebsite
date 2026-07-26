import { requireLocale } from "@/i18n/requireLocale";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { HeaderSurfaceProvider } from "@/components/layout/HeaderSurface";
import { Footer } from "@/components/layout/Footer";

// Route group (site) keeps this chrome away from [locale]/styleguide, which
// needs its own single <main>.
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Every layout/page segment needs its own call, not just the root layout's
  // — this is what let next-intl's server-side useTranslations (in SkipLink)
  // opt this route back into static rendering instead of forcing it dynamic.
  await requireLocale(params);

  return (
    <HeaderSurfaceProvider>
      <SkipLink />
      <Header />
      <main id="inhalt" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </HeaderSurfaceProvider>
  );
}
