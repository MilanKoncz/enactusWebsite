import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { partnerStatements } from "@/content/partnerStatements";

// statement.slug is a validated string, not a literal union — same cast
// pattern as ProjectDetailContent.tsx's ProjectCopyKey.
type StatementCopyKey = Parameters<ReturnType<typeof useTranslations<"PartnerStatements">>>[0];

// Four short quotes, not four paragraphs (the brief's explicit ask) — a
// large serif pull-quote is what makes that read as testimony rather than
// body copy. Carried over from the old site and shortened to ≤200
// characters each, meaning preserved, nothing added — see
// content/partnerStatements.ts.
//
// Framed in its own gold-edged band (border-y, centered heading) rather
// than sitting in the page's plain flow like every other section here —
// board feedback: testimonials read as "just another text block" without
// something to set them apart as their own moment. A hairline top/bottom
// rule, not a filled panel: it borrows the gate marker's own line-not-fill
// vocabulary instead of introducing a new background treatment.
export function PartnerStatementsSection() {
  const t = useTranslations("PartnerPage.statements");
  const tStatements = useTranslations("PartnerStatements");

  return (
    <Section className="relative isolate">
      <Container className="relative">
        <div className="flex flex-col gap-12 border-y border-gold/30 py-12 md:py-16">
          <SectionHeading eyebrow={t("eyebrow")} title={t("heading")} className="text-center" />
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {partnerStatements.map((statement) => (
              <figure key={statement.slug} className="flex flex-col gap-4">
                <blockquote className="text-heading-2 font-display">
                  “{tStatements(`${statement.slug}.quote` as StatementCopyKey)}”
                </blockquote>
                <figcaption className="flex flex-col text-body-s opacity-70">
                  <span className="font-medium opacity-100">{statement.name}</span>
                  <span>{tStatements(`${statement.slug}.role` as StatementCopyKey)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
