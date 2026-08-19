import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colorTokens } from "./design-tokens";
import type { Application } from "./db";

/**
 * Renders one application to a one-page PDF for the board's inbox. Grouped
 * so the whole thing scans in under a minute: identity first, then the
 * three facts that decide fit (study, availability, desired area), then
 * the free-text fields in ascending length, motivation last because it's
 * the longest.
 *
 * Always in German, regardless of the applicant's `locale` — this document
 * goes to the board's own inbox (RESEND_REPLY_TO_EMAIL), not to the
 * applicant, and the board reads German. The applicant's own language
 * governs their confirmation email instead (see lib/mail.ts), which does
 * go through messages/{locale}.json like every other user-facing string.
 *
 * No custom font registered: the site self-hosts Geist via next/font/google
 * at build time and ships no Geist file in the repo (unlike the display
 * font, Lilita One, which does live under src/fonts/ since it's loaded via
 * next/font/local instead — see the root layout), and @react-pdf/renderer
 * can't read next/font/google's output either way. Fetching a font from
 * Google at render time would be exactly the tracking-request problem
 * CLAUDE.md rules out for the site itself. Helvetica (react-pdf's built-in)
 * stands in until a real Geist font file is added — see ASSETS-TODO.md.
 */

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: colorTokens.ink,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colorTokens.sand,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: colorTokens.ink,
    opacity: 0.6,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 700,
    borderLeftWidth: 2,
    borderLeftColor: colorTokens.gold,
    paddingLeft: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 140,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colorTokens.ink,
    opacity: 0.6,
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
  },
});

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export function ApplicationPdfDocument({ application }: { application: Application }) {
  return (
    <Document title={`Bewerbung ${application.firstName} ${application.lastName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Enactus Mannheim e.V. — Bewerbung</Text>
        <Text style={styles.title}>
          {application.firstName} {application.lastName}
        </Text>
        <Text style={styles.meta}>Eingegangen am {formatDateTime(application.createdAt)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Kontakt</Text>
          <Fact label="E-Mail" value={application.email} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Studium</Text>
          <Fact label="Studiengang" value={application.studyProgram} />
          <Fact label="Fachsemester" value={String(application.semester)} />
          <Fact label="Hochschule" value={application.university} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Einsatz</Text>
          <Fact label="Wunschbereich" value={application.desiredAreas.join(", ")} />
          <Fact label="Verfügbarkeit" value={`${application.availabilityHours} Std. / Woche`} />
        </View>

        {(application.priorInvolvement || application.languagesSkills) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Erfahrung</Text>
            {application.priorInvolvement && (
              <Fact label="Bisheriges Engagement" value={application.priorInvolvement} />
            )}
            {application.languagesSkills && <Fact label="Sprachen / Kenntnisse" value={application.languagesSkills} />}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Motivation</Text>
          <Text style={styles.paragraph}>{application.motivation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Sonstiges</Text>
          {application.heardAboutUs && <Fact label="Aufmerksam geworden durch" value={application.heardAboutUs} />}
          <Fact label="Einwilligung erteilt am" value={formatDateTime(application.consentAt)} />
        </View>
      </Page>
    </Document>
  );
}
