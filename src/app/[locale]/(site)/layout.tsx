import { requireLocale } from "@/i18n/requireLocale";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeaderSurfaceProviderClient } from "@/components/HeaderSurfaceProviderClient";
import { getJobPostings } from "@/lib/jobPostings";
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
  // — this is what opts this route back into static rendering instead of
  // forcing it dynamic, which every server-rendered page under this layout
  // (Impressum, NotFound, ...) relies on via their own getTranslations calls.
  await requireLocale(params);

  // getJobPostings() is already the non-expired list (lib/db.ts's
  // listActiveJobPostings) behind an hour-long cache — reading it here,
  // once per request, is what lets Header and Footer (client components, or
  // components that call next-intl's useTranslations, which can't run in an
  // async component) decide whether to show "Jobs" without fetching the
  // database themselves.
  const jobs = await getJobPostings();
  const hasJobs = jobs.length > 0;

  return (
    <HeaderSurfaceProviderClient>
      {/* SkipLink itself renders inside Header, as its first child — see
          that component's own comment for why. */}
      <Header hasJobs={hasJobs} />
      <main id="inhalt" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer hasJobs={hasJobs} />
    </HeaderSurfaceProviderClient>
  );
}
