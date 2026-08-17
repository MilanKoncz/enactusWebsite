import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { RecruitingWindowsManager } from "@/components/admin/RecruitingWindowsManager";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { countFutureRecruitingWindows, listRecruitingWindows } from "@/lib/db";
import { instantToWallClock } from "@/lib/recruitingTime";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.recruitingWindows" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminRecruitingWindowsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const windows = await listRecruitingWindows();
  // "No future window" is the condition that used to freeze retention and
  // still leaves /mitmachen permanently closed — it's the one thing this
  // page has to say loudly rather than leave to be inferred from a list of
  // past dates. Asked of the database, not computed from the list, so the
  // comparison uses the same clock everything else does.
  const hasFutureWindow = (await countFutureRecruitingWindows()) > 0;

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("recruitingWindows.title")}
        lead={t("recruitingWindows.lead")}
      />

      {!hasFutureWindow && (
        <p
          role="status"
          className="flex items-start gap-3 rounded-md border border-amber bg-amber/10 p-4 text-body-s"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{t("recruitingWindows.noFutureWindow")}</span>
        </p>
      )}

      <RecruitingWindowsManager
        windows={windows.map((window) => ({
          id: window.id,
          semester: window.semester,
          start: window.start,
          end: window.end,
          startWallClock: instantToWallClock(new Date(window.start)),
          endWallClock: instantToWallClock(new Date(window.end)),
        }))}
      />
    </Container>
  );
}
