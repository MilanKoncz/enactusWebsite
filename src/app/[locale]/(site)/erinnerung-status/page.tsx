import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { routes } from "@/content/navigation";
import { Link } from "@/lib/navigation";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

// The four states the two reminder API routes (bestaetigen/route.ts,
// abmelden/route.ts) redirect here with, as ?status=<key>. Anything else —
// no query at all, a stale/forged value — reads as "invalid", the same
// generic "this link doesn't work" wording a bad or already-spent token
// gets. "already-confirmed" and "confirmed" both render as success
// (FormStatusMessage's success variant, moss): the visitor's actual goal,
// being on the list, is true either way, even though only one of them
// just happened.
const STATUS_KEYS = ["confirmed", "already-confirmed", "unsubscribed", "invalid"] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

function resolveStatus(raw: string | undefined): StatusKey {
  return (STATUS_KEYS as readonly string[]).includes(raw ?? "") ? (raw as StatusKey) : "invalid";
}

const VARIANT_BY_STATUS: Record<StatusKey, "success" | "error"> = {
  confirmed: "success",
  "already-confirmed": "success",
  unsubscribed: "success",
  invalid: "error",
};

// Only the two "you're on the list" states get the "you can unsubscribe
// any time" reminder — showing it right after a just-completed unsubscribe
// would read as a non sequitur, and it has no relevance on an invalid link.
const SHOWS_UNSUBSCRIBE_HINT: Record<StatusKey, boolean> = {
  confirmed: true,
  "already-confirmed": true,
  unsubscribed: false,
  invalid: false,
};

// A dedicated landing page for both double-opt-in email links (confirm and
// unsubscribe) — before this existed, a click redirected straight to
// /mitmachen with a query flag nothing ever read, so the person had no way
// to tell whether it worked. noindex/nofollow (also disallowed in
// robots.ts) and left out of content/navigation.ts's `routes`, which keeps
// it out of sitemap.ts automatically (same pattern as /secret) — this page
// only exists as an email-link landing spot, never a navigation target.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "ErinnerungStatus" });
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

export default async function ErinnerungStatusPage({ params, searchParams }: PageProps) {
  await requireLocale(params);
  const { status: rawStatus } = await searchParams;
  const status = resolveStatus(rawStatus);

  const t = await getTranslations("ErinnerungStatus");

  return (
    <Section>
      <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-heading-2 font-display">{t(`${status}.title`)}</h1>
        <FormStatusMessage variant={VARIANT_BY_STATUS[status]} className="max-w-md text-left">
          {t(`${status}.lead`)}
        </FormStatusMessage>
        {SHOWS_UNSUBSCRIBE_HINT[status] && (
          <p className="max-w-md text-body-s opacity-60">{t("unsubscribeHint")}</p>
        )}
        <Link href={routes.home} className="link-underline text-body-m">
          {t("backHome")}
        </Link>
      </Container>
    </Section>
  );
}
