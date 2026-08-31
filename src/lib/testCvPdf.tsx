import { Document, Page, StyleSheet, Text } from "@react-pdf/renderer";

/**
 * A small, genuinely valid PDF — not a placeholder buffer of arbitrary
 * bytes — for /api/admin/mails/testversand's "with CV" case. Rendered with
 * the same @react-pdf/renderer applicationPdf.tsx uses for the real thing,
 * so a mail client shows it as an actual attached document rather than a
 * broken file. Split into its own .tsx file for the same reason
 * applicationPdf.tsx is: JSX needs that extension, and the route calling
 * this is a plain .ts API route.
 */

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 12 },
  text: { marginBottom: 8 },
});

export function TestCvDocument() {
  return (
    <Document title="Testversand-Lebenslauf">
      <Page size="A4" style={styles.page}>
        <Text style={styles.text}>Testversand-Lebenslauf</Text>
        <Text style={styles.text}>
          Platzhalterdatei für den Testversand über /admin/mails — kein echter Lebenslauf.
        </Text>
      </Page>
    </Document>
  );
}
