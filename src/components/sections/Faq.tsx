"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { faqEntries } from "@/content/faq";

// entry.key is a validated string, not a literal union — same cast pattern
// as ProjectDetailContent.tsx's ProjectCopyKey.
type FaqCopyKey = Parameters<ReturnType<typeof useTranslations<"Faq">>>[0];

// Canonical order the brief asked for: Allgemein, Bewerbung, Projekte —
// not whatever order content/faq.ts's entries happen to list in.
const CATEGORY_ORDER = ["Allgemein", "Bewerbung", "Projekte"] as const;
type CategoryKey = (typeof CATEGORY_ORDER)[number];
const CATEGORY_MESSAGE_KEY: Record<CategoryKey, "general" | "application" | "projects"> = {
  Allgemein: "general",
  Bewerbung: "application",
  Projekte: "projects",
};

// Every answer is a draft awaiting board sign-off (see content/faq.ts's file
// comment and ASSETS-TODO.md) — PlaceholderMark's "unverified" variant marks
// that quietly, the same treatment HomeKpis.tsx gives an unconfirmed figure,
// rather than the loud dashed-box "missing" treatment: the text itself is
// real, just not yet approved.
export function Faq() {
  const t = useTranslations("Faq");
  const tPage = useTranslations("KontaktPage.faq");

  return (
    <div className="flex flex-col gap-10">
      {CATEGORY_ORDER.map((category) => {
        const entries = faqEntries.filter((entry) => entry.category === category);
        if (entries.length === 0) return null;

        return (
          <div key={category} className="flex flex-col gap-2">
            <p className="font-mono text-mono-xs uppercase opacity-60">
              {tPage(`categories.${CATEGORY_MESSAGE_KEY[category]}`)}
            </p>
            <Accordion.Root type="single" collapsible className="flex flex-col">
              {entries.map((entry) => (
                <Accordion.Item key={entry.key} value={entry.key} className="border-b border-ink/10">
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-body-m font-medium transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px">
                      {t(`${entry.key}.question` as FaqCopyKey)}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] ease-signature group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pb-4 text-body-s opacity-80">
                    <PlaceholderMark variant="unverified" hint={t("unverifiedHint")}>
                      {t(`${entry.key}.answer` as FaqCopyKey)}
                    </PlaceholderMark>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        );
      })}
    </div>
  );
}
