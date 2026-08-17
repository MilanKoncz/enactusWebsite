import { getTranslations } from "next-intl/server";
import { requireLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/adminSession";

// A deliberately separate route group from (site): the admin tool has no
// Header, no Footer, no marketing chrome — it's a utility for the board,
// not a page a visitor should ever land on (see each page's noindex
// metadata and robots.ts's disallow entry).
//
// The session check here only decides whether to render the nav and the
// logout button; it is *not* the gate. Every page under this layout checks
// again before it queries anything, because a layout returning early
// wouldn't stop its children from executing (lib/adminSession.ts).
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);
  const t = await getTranslations("Admin");
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {authenticated && (
        <header className="border-b border-ink/10">
          <Container className="flex max-w-4xl flex-wrap items-center justify-between gap-4">
            <AdminNav />
            <AdminLogoutButton />
          </Container>
        </header>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-ink/10 py-6">
        <Container className="max-w-4xl">
          <p className="text-body-s opacity-60">{t("credit")}</p>
        </Container>
      </footer>
    </div>
  );
}
