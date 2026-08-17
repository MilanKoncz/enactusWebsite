import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLoginForm } from "./AdminLoginForm";

/**
 * What every admin page renders instead of its content when there's no
 * valid session. A shared component rather than a redirect: there is no
 * separate /admin/login route, so the password prompt has to be able to
 * appear in place, on whichever URL was requested — which also means a
 * bookmarked deep link still lands where it was aimed once the password
 * is entered (AdminLoginForm calls router.refresh(), it doesn't navigate).
 */
export async function AdminLogin() {
  const t = await getTranslations("Admin.login");

  return (
    <Container className="flex max-w-md flex-col items-center gap-10 py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} className="text-center" />
      <AdminLoginForm />
    </Container>
  );
}
