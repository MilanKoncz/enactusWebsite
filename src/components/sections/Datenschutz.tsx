import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { org } from "@/content/org";
import { privacyReviewStatus } from "@/content/privacy";
import { retention } from "@/content/retention";

// No blanket opacity on the body wrapper: legal text should stay at full
// contrast, and — more importantly — CSS opacity compounds multiplicatively
// with a nested child's own opacity. Fact's label below is already ink/60;
// stacked inside a further opacity-90 wrapper it measured as an effective
// ~54% (axe-core color-contrast in a real browser caught this at 3.96:1,
// under the 4.5:1 minimum — jsdom-based unit a11y checks don't reliably
// compute real color-contrast, so this only ever surfaced in Playwright).
function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading-2 font-display">{title}</h2>
      <div className="flex flex-col gap-3 text-body-m">{children}</div>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-ink/10 py-1 pl-4">
      <p className="text-mono-s font-mono uppercase opacity-60">{label}</p>
      <p className="text-body-m">{children}</p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-body-s opacity-80">
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Two renderings of the same data, toggled with Tailwind breakpoints rather
// than JS — a table with several columns stops being legible at 360px, so
// below `sm` this renders as a definition list instead. Both are present in
// the DOM; only one is visible at a time, so there's no layout shift and no
// hydration mismatch to worry about.
function LegalTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: string[][] }) {
  return (
    <div>
      <table className="hidden w-full border-collapse text-body-s sm:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="border-b border-ink/10 py-2 pr-4 text-left font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, cellIndex) => (
                <td key={columns[cellIndex]} className="border-b border-ink/10 py-2 pr-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="flex flex-col gap-4 sm:hidden">
        {rows.map((row) => (
          <div key={row[0]} className="flex flex-col gap-2 border-l-2 border-ink/10 py-1 pl-4">
            <dt className="text-body-m font-medium">{row[0]}</dt>
            {row.slice(1).map((cell, cellIndex) => (
              <dd key={columns[cellIndex + 1]} className="flex flex-col gap-0.5 text-body-s">
                <span className="text-mono-s font-mono uppercase opacity-60">{columns[cellIndex + 1]}</span>
                <span className="opacity-80">{cell}</span>
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
}

// The one piece of state that changes what this page says: privacy.ts's
// `privacyReviewStatus`. Draft state shows `draftNotice`; flipping
// `reviewed` to true (with a `reviewedAt` date, enforced by the schema)
// swaps it for `reviewedNotice` — see privacy.ts's own comment. Every other
// section below is static copy from messages/{locale}.json's "Datenschutz"
// namespace, with the responsible party's facts pulled from content/org.ts
// the same way Impressum.tsx does, so the two pages can never state the
// operator's identity differently. No PlaceholderMark anywhere on this
// page: every fact it states is confirmed (org.ts's own
// `legalRepresentatives.verified`), unlike Impressum, which still carries
// optional fields this association hasn't filled in for every scenario.
export function Datenschutz() {
  const t = useTranslations("Datenschutz");
  const locale = useLocale();

  const contactEmail = org.contactEmails.board ?? org.contactEmails.general;

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />

        <p className="text-mono-s font-mono uppercase opacity-60">{t("effectiveDate")}</p>

        <div className="flex flex-col gap-1 border-l-2 border-dashed border-gold py-1 pl-4">
          <p className="text-body-m">
            {privacyReviewStatus.reviewed
              ? t("reviewedNotice", {
                  date: new Intl.DateTimeFormat(locale).format(new Date(privacyReviewStatus.reviewedAt!)),
                })
              : t("draftNotice")}
          </p>
        </div>

        <div className="flex max-w-prose flex-col gap-14">
          <LegalSection title={t("responsible.title")}>
            <p>{t("responsible.intro")}</p>
            <p>
              <span className="block font-medium">{org.legalName}</span>
              <span className="block">{org.registeredOffice}</span>
            </p>
            <p>
              {t("responsible.contactLabel")}:{" "}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="link-underline">
                  {contactEmail}
                </a>
              )}
            </p>
            <Fact label={t("responsible.representativesLabel")}>
              {org.legalRepresentatives.names.join(", ")}
            </Fact>
            <Fact label={t("responsible.registerLabel")}>{org.registerEntry}</Fact>
            <p>{t("responsible.noDpo")}</p>
          </LegalSection>

          <LegalSection title={t("scope.title")}>
            {(t.raw("scope.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("hosting.title")}>
            <p>{t("hosting.intro")}</p>
            <p>{t("hosting.fieldsIntro")}</p>
            <BulletList items={t.raw("hosting.fields") as string[]} />
            <p>{t("hosting.purpose")}</p>
            <Fact label={t("hosting.legalBasisLabel")}>{t("hosting.legalBasis")}</Fact>
            <Fact label={t("hosting.retentionLabel")}>{t("hosting.retention")}</Fact>
          </LegalSection>

          <LegalSection title={t("database.title")}>
            {(t.raw("database.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("email.title")}>
            {(t.raw("email.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Fact label={t("email.legalBasisLabel")}>{t("email.legalBasis")}</Fact>
          </LegalSection>

          <LegalSection title={t("analytics.title")}>
            {(t.raw("analytics.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Fact label={t("analytics.legalBasisLabel")}>{t("analytics.legalBasis")}</Fact>
          </LegalSection>

          <LegalSection title={t("externalContent.title")}>
            <p>{t("externalContent.fontsBody")}</p>
            <p className="text-mono-s font-mono uppercase opacity-60">{t("externalContent.videoLabel")}</p>
            {(t.raw("externalContent.videoBody") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Fact label={t("externalContent.legalBasisLabel")}>{t("externalContent.legalBasis")}</Fact>
          </LegalSection>

          <LegalSection title={t("application.title")}>
            <p>{t("application.intro")}</p>
            <div className="flex flex-col gap-2">
              <p className="text-mono-s font-mono uppercase opacity-60">{t("application.fieldsHeading")}</p>
              <BulletList items={t.raw("application.fields") as string[]} />
            </div>
            <p>{t("application.noUpload")}</p>
            <Fact label={t("application.purposeLabel")}>{t("application.purpose")}</Fact>
            <Fact label={t("application.legalBasisLabel")}>{t("application.legalBasis")}</Fact>
            <Fact label={t("application.accessLabel")}>{t("application.access")}</Fact>
            <Fact label={t("application.necessityLabel")}>{t("application.necessity")}</Fact>
          </LegalSection>

          <LegalSection title={t("reminder.title")}>
            {(t.raw("reminder.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Fact label={t("reminder.legalBasisLabel")}>{t("reminder.legalBasis")}</Fact>
            <Fact label={t("reminder.withdrawalLabel")}>{t("reminder.withdrawal")}</Fact>
          </LegalSection>

          <LegalSection title={t("contact.title")}>
            {(t.raw("contact.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Fact label={t("contact.purposeLabel")}>{t("contact.purpose")}</Fact>
            <Fact label={t("contact.legalBasisLabel")}>{t("contact.legalBasis")}</Fact>
            <p>{t("contact.alternative")}</p>
          </LegalSection>

          <LegalSection title={t("antiSpam.title")}>
            <p>{t("antiSpam.intro")}</p>
            <BulletList items={t.raw("antiSpam.measures") as string[]} />
            <p>{t("antiSpam.ipHandling")}</p>
            <p>{t("antiSpam.noCaptcha")}</p>
            <Fact label={t("antiSpam.legalBasisLabel")}>{t("antiSpam.legalBasis")}</Fact>
          </LegalSection>

          <LegalSection title={t("retention.title")}>
            <LegalTable
              caption={t("retention.tableCaption")}
              columns={t.raw("retention.columns") as string[]}
              rows={[
                [t("retention.applicationsLabel"), t("retention.applicationsValue", { months: retention.applications.months })],
                [t("retention.contactLabel"), t("retention.contactValue", { months: retention.contactMessages.months })],
                [t("retention.reminderConfirmedLabel"), t("retention.reminderConfirmedValue")],
                [
                  t("retention.reminderUnconfirmedLabel"),
                  t("retention.reminderUnconfirmedValue", { days: retention.reminderSignupsUnconfirmed.days }),
                ],
                [t("retention.rateLimitLabel"), t("retention.rateLimitValue")],
                [t("retention.serverLogsLabel"), t("retention.serverLogsValue")],
              ]}
            />
            <p>{t("retention.note")}</p>
          </LegalSection>

          <LegalSection title={t("processors.title")}>
            <p>{t("processors.intro")}</p>
            <LegalTable
              caption={t("processors.tableCaption")}
              columns={t.raw("processors.columns") as string[]}
              rows={t.raw("processors.rows") as string[][]}
            />
            <p>{t("processors.dpaNote")}</p>
            <Fact label={t("processors.transferLabel")}>{t("processors.transfer")}</Fact>
          </LegalSection>

          <LegalSection title={t("automatedDecisions.title")}>
            <p>{t("automatedDecisions.body")}</p>
          </LegalSection>

          <LegalSection title={t("encryption.title")}>
            <p>{t("encryption.body")}</p>
          </LegalSection>

          <LegalSection title={t("rights.title")}>
            <p>{t("rights.intro")}</p>
            <BulletList items={t.raw("rights.list") as string[]} />
            {contactEmail && (
              <p>
                {t("rights.contactPrompt")}{" "}
                <a href={`mailto:${contactEmail}`} className="link-underline">
                  {contactEmail}
                </a>
              </p>
            )}
          </LegalSection>

          <LegalSection title={t("complaints.title")}>
            <p>{t("complaints.body")}</p>
            <p>
              <span className="block font-medium">{t("complaints.authorityName")}</span>
              {(t.raw("complaints.authorityAddress") as string[]).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p>{t("complaints.note")}</p>
          </LegalSection>

          <LegalSection title={t("changes.title")}>
            <p>{t("changes.body")}</p>
          </LegalSection>
        </div>
      </Container>
    </Section>
  );
}
