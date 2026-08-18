import { getTranslations } from "next-intl/server";
import { requireLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { isAdminAuthenticated } from "@/lib/adminSession";

// A deliberately separate route group from (site): the admin tool has no
// Header, no Footer, no marketing chrome — it's a utility for the board,
// not a page a visitor should ever land on (see each page's noindex
// metadata and robots.ts's disallow entry).
//
// The session check here only decides whether to render the nav and the
// logout button; it is *not* the gate. Every page under this layout checks
// again before it queries anything, because a layout returning early
// wouldn't stop its children from executing (lib/adminSession.ts). The
// sidebar itself renders regardless of `authenticated` — see its own
// comment on why the logo/home link has to survive the gate.
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
    <div className="flex min-h-screen flex-col bg-paper text-ink md:flex-row">
      <AdminSidebar authenticated={authenticated} />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>

        <footer className="border-t border-ink/10 py-6">
          <Container className="max-w-4xl">
            <p className="text-body-s opacity-60">{t("credit")}</p>
          </Container>
        </footer>
      </div>
    </div>
  );
}
