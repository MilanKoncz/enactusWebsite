import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { colorTokens } from "./design-tokens";
import { formatSiteDateTime } from "./formatSiteDateTime";
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
 * The logo is read from the local filesystem, not fetched over the network
 * at render time — same reasoning as the no-custom-font decision below: a
 * runtime fetch would be exactly the tracking-request problem CLAUDE.md
 * rules out for the site itself, and this is server code, not a browser
 * request Next can route through its own image optimizer. The mark
 * (public/brand/enactus-mannheim-logo-mark.png, 600×600, transparent,
 * ~13KB) is the square, surface-agnostic variant — right choice for a
 * plain-white PDF page, and small enough that embedding the file as-is
 * doesn't need a resized copy the way a multi-megabyte source would.
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

const LOGO_MARK_PATH = join(process.cwd(), "public/brand/enactus-mannheim-logo-mark.png");

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: colorTokens.ink,
  },
  logo: {
    width: 28,
    height: 28,
    marginBottom: 12,
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
  return formatSiteDateTime(date, "de-DE", { dateStyle: "long", timeStyle: "short" });
}

// Renders the prioritized area choices (migrations/0017) a new application
// carries, each with its own reason. A pre-migration row has none of these
// — migrations/0017 added no backfill, since a priority or a reason
// invented from the old checkbox order would be a fact the applicant never
// actually stated — so it falls back to the legacy desiredAreas array,
// marked as unprioritized rather than silently presented as if it had been
// ranked.
function AreaChoicesFacts({ application }: { application: Application }) {
  if (application.areaChoices.length > 0) {
    return (
      <>
        {application.areaChoices.map((choice) => (
          <Fact
            key={choice.priority}
            label={`${choice.priority}. Wahl`}
            value={`${choice.areaLabel}: ${choice.reason}`}
          />
        ))}
      </>
    );
  }
  if (application.desiredAreas && application.desiredAreas.length > 0) {
    return <Fact label="Wunschbereich" value={`${application.desiredAreas.join(", ")} (ohne Priorisierung)`} />;
  }
  return null;
}

export function ApplicationPdfDocument({ application }: { application: Application }) {
  return (
    <Document title={`Bewerbung ${application.firstName} ${application.lastName}`}>
      <Page size="A4" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's
            Image is a PDF-drawing primitive, not an HTML <img>; it has no
            alt prop and no accessibility tree to attach one to. */}
        <Image style={styles.logo} src={readFileSync(LOGO_MARK_PATH)} />
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
          {/* Dropped from the form (field-audit decision) but still shown
              for a pre-migration row that has one. */}
          {application.university && <Fact label="Hochschule" value={application.university} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Einsatz</Text>
          <AreaChoicesFacts application={application} />
          <Fact label="Verfügbarkeit" value={`${application.availabilityHours} Std. / Woche`} />
          {/* No blob URL, ever — see cvBlob.ts's own comment on why the
              store stays private end to end. The board downloads the file
              from the admin area, authenticated, never from this PDF. */}
          <Fact
            label="Lebenslauf"
            value={application.cvPathname ? "liegt vor (Download im Admin-Bereich)" : "nicht beigefügt"}
          />
        </View>

        {/* Its own section, not another Fact inside "Einsatz" above — a
            Ressort has no priority and no reason, so folding it into the
            same block would blur it with the ranked Wunschbereich choices
            it's deliberately kept separate from (see
            applicationFormSchema.ts's own comment). Nothing renders for
            NULL (pre-migration) or an empty array (asked, nothing chosen);
            no fact is invented either way. */}
        {application.departments && application.departments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Ressorts</Text>
            <Fact label="Ressorts" value={application.departments.join(", ")} />
          </View>
        )}

        {(application.priorInvolvement || application.languagesSkills) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Erfahrung</Text>
            {application.priorInvolvement && (
              <Fact label="Bisheriges Engagement" value={application.priorInvolvement} />
            )}
            {application.languagesSkills && <Fact label="Relevante Skills" value={application.languagesSkills} />}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Motivation</Text>
          <Text style={styles.paragraph}>{application.motivation}</Text>
        </View>

        {application.wantToGain && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Ausblick</Text>
            <Fact label="Möchte mitnehmen" value={application.wantToGain} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Sonstiges</Text>
          {application.heardAboutUs && <Fact label="Aufmerksam geworden durch" value={application.heardAboutUs} />}
          <Fact label="Einwilligung erteilt am" value={formatDateTime(application.consentAt)} />
        </View>
      </Page>
    </Document>
  );
}
