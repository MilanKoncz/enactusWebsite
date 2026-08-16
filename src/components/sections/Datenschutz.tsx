import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
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

// The one piece of state that changes what this page says: privacy.ts's
// `privacyReviewStatus`. Draft state shows `draftNotice`; flipping
// `reviewed` to true (with a `reviewedAt` date, enforced by the schema)
// swaps it for `reviewedNotice` — see privacy.ts's own comment. Every other
// section below is static copy from messages/{locale}.json's "Datenschutz"
// namespace, with the two dynamic facts (the responsible party's legal
// name/address/email) pulled from content/org.ts the same way Impressum.tsx
// does, so the two pages can never state the operator's identity
// differently.
export function Datenschutz() {
  const t = useTranslations("Datenschutz");
  const tPlaceholder = useTranslations("Placeholder");
  const locale = useLocale();

  const contactEmail = org.contactEmails.board ?? org.contactEmails.general;

  return (
    <Section>
      <Container className="flex flex-col gap-10 py-12">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />

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
          <LegalSection title={t("intro.title")}>
            {(t.raw("intro.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("responsible.title")}>
            <p>{t("responsible.intro")}</p>
            <p>
              <span className="block font-medium">{org.legalName}</span>
              <span className="block">
                {org.registeredOffice ?? (
                  <PlaceholderMark hint={tPlaceholder("missingHint")}>
                    {tPlaceholder("missingLabel")}
                  </PlaceholderMark>
                )}
              </span>
            </p>
            <p>
              {t("responsible.contactLabel")}:{" "}
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`} className="link-underline">
                  {contactEmail}
                </a>
              ) : (
                <PlaceholderMark hint={tPlaceholder("missingHint")}>
                  {tPlaceholder("missingLabel")}
                </PlaceholderMark>
              )}
            </p>
            <p>{t("responsible.noDpo")}</p>
            <p>{t("responsible.externalDpo")}</p>
          </LegalSection>

          <LegalSection title={t("hosting.title")}>
            {(t.raw("hosting.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("database.title")}>
            {(t.raw("database.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="flex flex-col gap-2">
              <p className="text-mono-s font-mono uppercase opacity-60">{t("database.retentionHeading")}</p>
              <Fact label={t("database.retentionApplicationsLabel")}>
                <PlaceholderMark variant="unverified" hint={t("database.retentionUnconfirmedHint")}>
                  {t("database.retentionApplications", { months: retention.applications.months })}
                </PlaceholderMark>
              </Fact>
              <Fact label={t("database.retentionContactLabel")}>
                <PlaceholderMark variant="unverified" hint={t("database.retentionUnconfirmedHint")}>
                  {t("database.retentionContact", { months: retention.contactMessages.months })}
                </PlaceholderMark>
              </Fact>
              <Fact label={t("database.retentionReminderLabel")}>
                <PlaceholderMark variant="unverified" hint={t("database.retentionUnconfirmedHint")}>
                  {t("database.retentionReminder", { days: retention.reminderSignupsUnconfirmed.days })}
                </PlaceholderMark>
              </Fact>
            </div>
          </LegalSection>

          <LegalSection title={t("email.title")}>
            {(t.raw("email.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("analytics.title")}>
            {(t.raw("analytics.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("fonts.title")}>
            {(t.raw("fonts.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("youtube.title")}>
            {(t.raw("youtube.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
            <p>{t("application.antiSpam")}</p>
          </LegalSection>

          <LegalSection title={t("reminder.title")}>
            {(t.raw("reminder.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("contact.title")}>
            {(t.raw("contact.body") as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LegalSection>

          <LegalSection title={t("rights.title")}>
            <p>{t("rights.intro")}</p>
            <BulletList items={t.raw("rights.list") as string[]} />
            <p>{t("rights.complaint")}</p>
            {contactEmail && (
              <p>
                {t("rights.contactPrompt")}{" "}
                <a href={`mailto:${contactEmail}`} className="link-underline">
                  {contactEmail}
                </a>
              </p>
            )}
          </LegalSection>
        </div>
      </Container>
    </Section>
  );
}
