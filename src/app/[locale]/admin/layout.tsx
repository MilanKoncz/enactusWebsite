import { requireLocale } from "@/i18n/requireLocale";

// A deliberately separate route group from (site): the admin tool has no
// Header, no Footer, no marketing chrome — it's a utility for the board,
// not a page a visitor should ever land on (see page.tsx's noindex
// metadata and robots.ts's disallow entry).
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);

  return <main className="min-h-screen bg-paper text-ink">{children}</main>;
}
