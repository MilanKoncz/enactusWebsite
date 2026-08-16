"use client";

import { useState } from "react";
import Image from "next/image";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { eventFormats, type EventFormat, type EventFormatKey } from "@/content/eventFormats";
import { cn } from "@/lib/cn";

// format.key is a validated string, not a literal union — same cast pattern
// as ProjectDetailContent.tsx's ProjectCopyKey.
type FormatCopyKey = Parameters<ReturnType<typeof useTranslations<"EventFormats">>>[0];

// One real photo (socials, workshops, gala) and one still-missing slot
// (teamweekend) render through the exact same tile shape — a real image
// swaps in for the dashed Placeholder without changing the surrounding
// layout, so a photo landing later never reflows the grid around it.
function FormatMedia({ format, title, ratio, className }: { format: EventFormat; title: string; ratio: string; className?: string }) {
  if (!format.image) {
    return <Placeholder kind="Bild" label={title} ratio={ratio} className={className} />;
  }
  return (
    <div className={cn("relative overflow-hidden rounded-md", className)} style={{ aspectRatio: ratio }}>
      <Image src={format.image} alt="" fill className="object-cover" />
    </div>
  );
}

// Two different components for the same four formats, not one clever
// responsive layout: the brief draws a real distinction between desktop
// (one shared detail panel below the row of tiles) and mobile (each tile's
// own detail opens directly beneath it). Radix Tabs is exactly the desktop
// shape — a tablist plus one panel that swaps with the active trigger — and
// Radix Accordion is exactly the mobile one; both already ship in this
// project's dependencies, unused until now. A single `selected` key drives
// both, so switching breakpoints mid-session (a resized window, not just a
// different device) never leaves them out of sync.
export function EventFormats() {
  const t = useTranslations("EventFormats");
  const [selected, setSelected] = useState<EventFormatKey>(eventFormats[0].key);

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <Tabs.Root
          value={selected}
          onValueChange={(value) => setSelected(value as EventFormatKey)}
          className="hidden flex-col gap-8 md:flex"
        >
          <Tabs.List aria-label={t("tablistLabel")} className="grid grid-cols-4 gap-8">
            {eventFormats.map((format) => {
              const title = t(`${format.key}.title` as FormatCopyKey);
              return (
                <Tabs.Trigger
                  key={format.key}
                  value={format.key}
                  aria-label={title}
                  className="flex flex-col gap-3 rounded-md border border-ink/10 p-2 text-left transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/30 focus-visible:-translate-y-px focus-visible:border-ink/30 data-[state=active]:border-gold"
                >
                  <span aria-hidden="true" className="contents">
                    <FormatMedia format={format} title={title} ratio="4 / 3" />
                    <span className="font-mono text-mono-s uppercase">{title}</span>
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
          {eventFormats.map((format) => (
            <Tabs.Content
              key={format.key}
              value={format.key}
              className="rounded-md border-l-2 border-gold py-1 pl-6 text-body-m"
            >
              <PlaceholderMark variant="missing" hint={t("detailMissingHint")}>
                {t(`${format.key}.detail` as FormatCopyKey)}
              </PlaceholderMark>
            </Tabs.Content>
          ))}
        </Tabs.Root>

        <Accordion.Root
          type="single"
          collapsible
          value={selected}
          onValueChange={(value) => value && setSelected(value as EventFormatKey)}
          className="flex flex-col gap-4 md:hidden"
        >
          {eventFormats.map((format) => {
            const title = t(`${format.key}.title` as FormatCopyKey);
            return (
              <Accordion.Item
                key={format.key}
                value={format.key}
                className="overflow-hidden rounded-md border border-ink/10"
              >
                <Accordion.Header>
                  <Accordion.Trigger
                    aria-label={title}
                    className="flex w-full items-center gap-4 p-4 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5 data-[state=open]:border-l-2 data-[state=open]:border-gold"
                  >
                    <span aria-hidden="true" className="contents">
                      <FormatMedia
                        format={format}
                        title={title}
                        ratio="1 / 1"
                        className={format.image ? "size-14 shrink-0" : "size-14 shrink-0 p-2"}
                      />
                      <span className="font-mono text-mono-s uppercase">{title}</span>
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-4 pb-4 text-body-m">
                  <PlaceholderMark variant="missing" hint={t("detailMissingHint")}>
                    {t(`${format.key}.detail` as FormatCopyKey)}
                  </PlaceholderMark>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      </Container>
    </Section>
  );
}
