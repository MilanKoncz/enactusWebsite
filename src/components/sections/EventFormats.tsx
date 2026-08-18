import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { eventFormats, type EventFormat } from "@/content/eventFormats";

// format.key is a validated string, not a literal union — same cast pattern
// as ProjectDetailContent.tsx's ProjectCopyKey.
type FormatCopyKey = Parameters<ReturnType<typeof useTranslations<"EventFormats">>>[0];

// Tall, pillar-shaped cards (2026-08-18): the photo carries the card at a
// much larger size than the old 4:3 tab-trigger thumbnail, with the title
// and detail text sitting in the card body below it. This replaced a
// Tabs/Accordion pair that hid the description behind a click — all four
// formats now have real detail copy (see messages/{locale}.json), so there
// is nothing left to reveal on demand; every card is readable at a glance,
// same as "hover enhances, hover never hides" already asks for elsewhere.
function FormatMedia({ format, title }: { format: EventFormat; title: string }) {
  if (!format.image) {
    return (
      <Placeholder kind="Bild" label={title} ratio="3 / 4" className="rounded-b-none" />
    );
  }
  return (
    <div className="relative aspect-3/4 overflow-hidden">
      <Image src={format.image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
    </div>
  );
}

export function EventFormats() {
  const t = useTranslations("EventFormats");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {eventFormats.map((format) => {
            const title = t(`${format.key}.title` as FormatCopyKey);
            return (
              <li
                key={format.key}
                className="flex flex-col overflow-hidden rounded-md border border-ink/10 bg-paper"
              >
                <FormatMedia format={format} title={title} />
                <div className="flex flex-col gap-2 p-5">
                  <h3 className="font-mono text-mono-s uppercase">{title}</h3>
                  <p className="text-body-m opacity-80">{t(`${format.key}.detail` as FormatCopyKey)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
