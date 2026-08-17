import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { RawLink } from "@/lib/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminTable } from "@/components/admin/AdminTable";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listReminderSignups } from "@/lib/db";
import { countReminderStates, reminderState } from "@/lib/adminReminders";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.reminders" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const DOWNLOAD_LINK_CLASSES =
  "inline-flex items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-body-s font-medium transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function AdminRemindersPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const signups = await listReminderSignups();
  const totals = countReminderStates(signups);
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          as="h1"
          eyebrow={t("eyebrow")}
          title={t("reminders.title")}
          lead={t("reminders.lead")}
        />
        <RawLink href="/api/admin/erinnerungen/csv" className={DOWNLOAD_LINK_CLASSES}>
          {t("reminders.downloadCsv")}
        </RawLink>
      </div>

      {/* Confirmed is the only figure that answers "how many people can we
          actually mail" — the other two are shown next to it so the number
          can't be mistaken for the row count. */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["confirmed", "unconfirmed", "unsubscribed"] as const).map((state) => (
          <li key={state}>
            <Card>
              <p className="font-mono text-display-3 tabular-nums">{totals[state]}</p>
              <p className="mt-1 text-body-s opacity-60">{t(`reminders.states.${state}`)}</p>
            </Card>
          </li>
        ))}
      </ul>

      <AdminTable
        columns={[
          t("reminders.columns.email"),
          t("reminders.columns.state"),
          t("reminders.columns.createdAt"),
          t("reminders.columns.confirmedAt"),
        ]}
        empty={t("reminders.empty")}
        rows={signups.map((signup) => ({
          key: signup.id,
          cells: [
            signup.email,
            t(`reminders.states.${reminderState(signup)}`),
            dateFormatter.format(signup.createdAt),
            signup.confirmedAt ? dateFormatter.format(signup.confirmedAt) : "—",
          ],
        }))}
      />
    </Container>
  );
}
