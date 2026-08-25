"use client";

import Image from "next/image";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { faqEntries } from "@/content/ideathon";
import { board } from "@/content/board";

type FaqCopyKey = Parameters<ReturnType<typeof useTranslations<"IdeathonPage.faq">>>[0];

// The board's own draft names Philip Strobl (Inno-Lead) as the direct
// contact for Ideathon questions — pulled from content/board.ts rather than
// re-typed here, the same "content holds facts" boundary every other page
// on this site respects. His email/photo already appear publicly on the
// homepage board grid, so nothing new is exposed by reusing them here.
const IDEATHON_CONTACT_SLUG = "philip-strobl";

export function IdeathonFaq() {
  const t = useTranslations("IdeathonPage.faq");
  const tContact = useTranslations("IdeathonPage.contact");
  const contact = board.find((member) => member.slug === IDEATHON_CONTACT_SLUG) ?? null;

  return (
    <Section id="faq">
      <Container className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="text-display-3 font-display break-words">{t("title")}</h2>
          </div>
          <Accordion.Root type="single" collapsible className="flex flex-col">
            {faqEntries.map((entry) => (
              <Accordion.Item key={entry.key} value={entry.key} className="border-b border-ink/10">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-body-m font-medium transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px">
                    {t(`${entry.key}.question` as FaqCopyKey)}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 transition-transform duration-[var(--duration-calm)] ease-signature group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden text-body-s opacity-80 data-[state=closed]:animate-[accordion-up_var(--duration-calm)_var(--ease-grow)] data-[state=open]:animate-[accordion-down_var(--duration-calm)_var(--ease-grow)]">
                  <p className="pb-4">{t(`${entry.key}.answer` as FaqCopyKey)}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {contact && (
          <aside className="h-fit rounded-md border border-ink/10 bg-paper p-6 shadow-[0_8px_40px_rgba(19,28,50,0.04)] lg:sticky lg:top-24">
            <div className="flex flex-col gap-4">
              <Eyebrow>{tContact("eyebrow")}</Eyebrow>
              <h3 className="text-heading-3 font-medium">{tContact("title")}</h3>
              <p className="text-body-s opacity-80">{tContact("lead")}</p>
              <div className="flex items-center gap-3 border-y border-ink/10 py-4">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-ink/5">
                  {contact.photo && (
                    <Image src={contact.photo} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-body-s font-medium">{contact.name}</span>
                  <span className="text-body-s opacity-70">{contact.role}</span>
                </div>
              </div>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className={buttonClasses("secondary", "md")}>
                  {tContact("cta")}
                </a>
              )}
            </div>
          </aside>
        )}
      </Container>
    </Section>
  );
}
